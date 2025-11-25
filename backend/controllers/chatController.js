const response = require("../utils/responseHandler");
const Message = require("../models/Messages");
const { uplaodFileToCloudinary } = require("../config/cloudinaryConfig");
const Conversation = require("../models/Conversation");
const { ExportContextImpl } = require("twilio/lib/rest/bulkexports/v1/export");
const User = require("../models/User");

// Message API

exports.sendMessage = async (req, res) => {
  try {
    const { senderId, receiverId, content, messageStatus } = req.body;
    const file = req.file;

    // 1️⃣ Validate receiver exists
    const receiverExists = await User.findById(receiverId);
    if (!receiverExists) {
      return response(res, 400, "Receiver does not exist");
    }

    // 2️⃣ Ensure participants array sorted correctly
    const participants = [senderId.toString(), receiverId.toString()].sort();

    // 3️⃣ Check for existing conversation
    let conversation = await Conversation.findOne({
      participants: participants,
    });

    if (!conversation) {
      conversation = new Conversation({ participants });
      await conversation.save();
    }

    // 4️⃣ Detect message type
    let imageOrVideoUrl = null;
    let contentType = null;

    if (file) {
      const uploadFile = await uplaodFileToCloudinary(file);

      if (!uploadFile?.secure_url) {
        return response(res, 404, "Failed to upload media");
      }

      imageOrVideoUrl = uploadFile.secure_url;

      if (file.mimetype.startsWith("image")) {
        contentType = "image";
      } else if (file.mimetype.startsWith("video")) {
        contentType = "video";
      } else {
        return response(res, 400, "Unsupported media file type");
      }
    } else if (content?.trim()) {
      contentType = "text";
    } else {
      return response(res, 400, "Message content required");
    }

    // 5️⃣ Create message
    const message = await Message.create({
      conversation: conversation?._id,
      sender: senderId,
      receiver: receiverId,
      content,
      contentType,
      imageOrVideoUrl,
      messageStatus,
    });

    await message.save();

    // 6️⃣ Update conversation lastMessage correctly
    if (message?.content) {
      conversation.lastMessage = message?._id;
    }

    conversation.unreadCount += 1;
    await conversation.save();

    // 7️⃣ Proper populate
    const populatedMessage = await Message.findById(message._id)
      .populate("sender", "userName profilePicture")
      .populate("receiver", "userName profilePicture");

    // 8️⃣ Send to socket (real-time)
    if (req.io && req.socketUserMap) {
      const receiverSocketId = req.socketUserMap.get(receiverId.toString());
      if (receiverSocketId) {
        req.io.to(receiverSocketId).emit("receive_message", populatedMessage);

        message.messageStatus = "delivered";
        await message.save();
      }
    }

    return response(res, 200, "Message sent successfully", populatedMessage);
  } catch (error) {
    console.log("Send message error:", error);
    return response(res, 500, "Internal server error");
  }
};

// Conversation API

exports.getConversation = async (req, res) => {
  const userId = req.user.userId;
  try {
    let conversation = await Conversation.find({
      participants: { $in: [userId] },
    })
      .populate("participants", "userName profilePicture isOnline lastSeen")
      .populate({
        path: "lastMessage",
        populate: {
          path: "sender receiver",
          select: "userName profilePicture",
        },
      })
      .sort({ updatedAt: -1 })
      .lean();

    return response(
      res,
      201,
      "Conversation fetched successfully",
      conversation
    );
  } catch (error) {
    console.log(error);
    return response(res, 500, "Internal server error");
  }
};

// get message of specific conversation

exports.getMessages = async (req, res) => {
  const { conversationId } = req.params;
  const userId = req.user.userId;
  try {
    const conversation = await Conversation.findById(conversationId);
    if (!conversation) {
      return response(res, 404, "Conversation not found");
    }

    if (!conversation.participants.includes(userId)) {
      return response(res, 403, "Not autherized to view this conversation");
    }

    const messages = await Message.find({ conversation: conversationId })
      .populate("sender", "userName profilePicture")
      .populate("receiver", "userName profilePicture")
      .sort("createdAt");

    await Message.updateMany(
      {
        conversation: conversationId,
        receiver: userId,
        messageStatus: { $in: ["send", "delivered"] },
      },
      { $set: { messageStatus: "read" } }
    );

    conversation.unreadCount = 0;
    await conversation.save();
    return response(res, 202, "Message retrived", messages);
  } catch (error) {
    console.log(error);
    return response(res, 500, "Internal server error");
  }
};

// Marked as a read message

exports.markAsRead = async (req, res) => {
  const { messageIds } = req.body;
  const userId = req.user.userId;

  try {
    //  get relavant message
    let messages = await Message.find({
      _id: { $in: messageIds },
      receiver: userId,
    });

    await Message.updateMany(
      {
        _id: { $in: messageIds },
        receiver: userId,
      },
      {
        $set: { messageStatus: "read" },
      }
    );

    //  Notify to original sender
    if (req.io && req.socketUserMap) {
      for (const message of messages) {
        const sendSocketId = req.socketUserMap.get(message.sender.toString());
        if (sendSocketId) {
          const updatedMessage = {
            _id: message._id,
            messageStatus: "read",
          };

          req.io.to(senderSocketId).emit("message_read", updatedMessage);
          await message.save();
        }
      }
    }

    return response(res, 200, "Message marked as read", messages);
  } catch (error) {
    console.log(error);
    return response(res, 500, "Internal server error");
  }
};

exports.deleteMessages = async (req, res) => {
  const { messageId } = req.body;
  const userId = req.user.userId;

  try {
    const message = await Message.findById(messageId);

    if (!message) {
      return response(res, 404, "Message not found");
    }

    if (message.sender.toString() !== userId) {
      return response(res, 403, "Not authorized to delete this messagees");
    }

    await message.deleteOne();

    // Emit socket event
    if (req.io && req.socketUserMap) {
      const reviewerSocketId = req.socketUserMap.get(
        message.receiver.toString()
      );
      if (reviewerSocketId) {
        req.io.to(reviewerSocketId).emit("message_deleted", messageId);
      }
    }

    return response(res, 200, "Message deleted successfully");
  } catch (error) {
    console.log(error);
    return response(res, 500, "Internal server error");
  }
};

exports.readData = async (req, res) => {
  const { messageIds } = req.body;
  const userId = req.user.userIds;

  try {
  } catch (error) {
    console.log(error);
    return response(res, 500, "internal server error");
  }
};
