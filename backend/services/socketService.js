const { Server } = require("socket.io");
const User = require("../models/User");
const Message = require("../models/Messages");

// Map to store online user -> userId, socketId
const onlineUsers = new Map();

// Map to track typing status -> userId -> [conversatio]: boolea
const typingUsers = new Map();

const initializeSocket = (server) => {
  const io = new Server(server, {
    cors: {
      origin: process.env.FRONTEND_URL,
      credentials: true,
      method: ["GET", "PUT", "POST", "DELETE", "OPTIONS"],
    },
    pingTimeOut: 60000, // Disconnect inactive user/socket after 60s
  });

  //  When new socket connection is established
  io.on("connection", (socket) => {
    // console.log(`user connected: ${socket.id}`);
    let userId = null;

    // handle user connection and mark them online in databse
    socket.on("user_connected", async (connectingUserId) => {
      try {
        userId = connectingUserId;
        onlineUsers.set(userId, socket.id);
        socket.join(userId);

        // Update user status in database
        await User.findByIdAndUpdate(userId, {
          isOnline: true,
          lastSeen: new Date(),
        });

        // notify all users that this user is not online
        io.emit("user_status", { userId, isOnline: true });
      } catch (error) {
        console.error("Error handling user connection", error);
      }
    });

    // Return online status requested user
    socket.on("get_user_status", (requestedUserId, callback) => {
      const isOnline = onlineUsers.has(requestedUserId);
      callback({
        userId: requestedUserId,
        isOnline,
        lastSeen: isOnline ? new Date() : null,
      });
    });

    // Forword message to receiver if online
    socket.on("send_message", async (message) => {
      try {
        const receiverSocketId = onlineUsers.get(message.receiver._id);
        if (receiverSocketId) {
          io.to(receiverSocketId).emit("receive_message", message);
        }
      } catch (error) {
        console.error("Error sending message", error);
        socket.emit("message_error", { error: "Faild to send message" });
      }
    });

    // Update message as read and notify sender
    socket.on("message_read", async ({ messageIds, senderId }) => {
      try {
        await Message.updateMany(
          { _id: { $in: messageIds } },
          {
            $set: { messageStatus: "read" },
          }
        );

        const senderSocketId = onlineUsers.get(senderId);
        if (senderSocketId) {
          messageIds.forEach((messageIds) => {
            io.to(senderSocketId).emit("message_status_update", {
              messageIds,
              messageStatus: "read",
            });
          });
        }
      } catch (error) {
        console.error("Error updating message read status", error);
      }
    });

    // Handle typing start event and auto stop after 3s
    socket.on("typing_start", ({ conversationId, receiverId }) => {
      if (!userId || !conversationId || !receiverId) return;
      if (!typingUsers.has(userId)) typingUsers.set(userId, {});

      const userTyping = typingUsers.get(userId);
      userTyping[conversationId] = true;

      //   clear any exiting timeout
      if (userTyping[`${conversationId}_timeout`]) {
        clearTimeout(userTyping[`${conversationId}_timeout`]);
      }

      //   auto atop after 3s
      userTyping[`${conversationId}_timeout`] = setTimeout(() => {
        userTyping[conversationId] = false;
        socket.to(receiverId).emit("user_typing", {
          userId,
          conversationId,
          isTyping: false,
        });
      }, 3000);

      //   Notify user
      socket.to(receiverId).emit("user_typing", {
        userId,
        conversationId,
        isTyping: true,
      });
    });

    socket.on("typing_start", ({ conversationId, receiverId }) => {
      if (!userId || !conversationId || receiverId) return;

      if (typingUsers.has(userId)) {
        const userTyping = typingUsers.get(userId);
        userTyping[conversationId] = false;

        if (userTyping[`${conversationId}_timeout`]) {
          clearTimeout(userTyping[`${conversationId}_timeout`]);
          delete userTypinguserTyping[`${conversationId}_timeout`];
        }
      }

      socket.to(receiverId).emit("user_typing", {
        userId,
        conversationId,
        isTyping: false,
      });
    });

    // Add or update reaction on message
    socket.on(
      "add_reaction",
      async ({ messageId, emoji, userId: reactionUserId }) => {
        try {
          const message = await Message.findById(messageId);
          if (!message) return;

          const existingIndex = message.reactions.findIndex(
            (r) => r.user.toString() === reactionUserId
          );

          if (existingIndex > -1) {
            const exiting = message.reactions[existingIndex];
            if (exiting.emoji === emoji) {
              // remove same reaction
              message.reactions.splice(existingIndex, 1);
            } else {
              // Change emoji
              message.reactions[existingIndex].emoji = emoji;
            }
          } else {
            // add new reaction
            message.reactions.push({ user: reactionUserId, emoji });
          }

          await message.save();

          const populateMessage = await Message.findOne(message?._id)
            .populate("sender", "userName profilePicture")
            .populate("receiver", "userName profilePicture")
            .populate("reactions.user", "userName");

          const reactionUpdated = {
            messageId,
            reactions: populateMessage.reactions,
          };

          const senderSocket = onlineUsers.get(
            populateMessage.sender._id.toString()
          );
          const receiverSocket = onlineUsers.get(
            populateMessage.receiver?._id.toString()
          );

          if (senderSocket)
            io.to(senderSocket).emit("reaction_update", reactionUpdated);
          if (receiverSocket)
            io.to(receiverSocket).emit("reaction_update", reactionUpdated);
        } catch (error) {
          console.log("Error handling reaction", error);
        }
      }
    );

    //   handle disconnected and mark user online

    const handleDisconnected = async (req, res) => {
      if (!userId) return;

      try {
        onlineUsers.delete(userId);

        //   clear all typing timesouts
        if (typingUsers.has(userId)) {
          const userTyping = typingUsers.get(userId);
          Object.keys(userTyping).forEach((key) => {
            if (key.endsWith("_timeout")) clearTimeout(userTyping[key]);
          });

          typingUsers.delete(userId);
        }

        await User.findByIdAndUpdate(userId, {
          isOnline: false,
          lastSeen: new Date(),
        });

        io.emit("user_status", {
          userId,
          isOnline: new Date(),
        });

        socket.leave(userId);
        console.log(`user ${userId} disconnected`);
      } catch (error) {
        console.error("Error handling disconnecting", error);
      }
    };

    socket.on("disconnect", handleDisconnected);
  });

  io.socketUserMap = onlineUsers;
  return io;
};

module.exports = initializeSocket;
