const response = require("../utils/responseHandler");
// const Message = require("../models/Messages");
const { uplaodFileToCloudinary } = require("../config/cloudinaryConfig");
const Status = require("../models/Status");

// Message API

exports.createStatus = async (req, res) => {
  try {
    const { contentType, content } = req.body;
    const userId = req.user.userId;
    const file = req.file;

    let mediaUrl = null;
    let finalContentType = contentType || "text";

    // file upload
    if (file) {
      const uploadFile = await uplaodFileToCloudinary(file);

      if (!uploadFile.secure_url) {
        return response(res, 404, "Failed to upload media.");
      }

      mediaUrl = uploadFile.secure_url;

      if (file.mimetype.startsWith("image")) {
        finalContentType = "image";
      } else if (file.mimetype.startsWith("video")) {
        finalContentType = "video";
      } else {
        return response(res, 400, "Unsupported file type!!");
      }
    } else if (content?.trim()) {
      finalContentType = "text";
    } else {
      return response(res, 400, "Message content required");
    }

    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

    const status = await Status.create({
      user: userId,
      content: mediaUrl || content,
      contentType: finalContentType,
      expiresAt,
    });

    const populatedStatus = await Status.findById(status._id)
      .populate("user", "userName profilePicture")
      .populate("viewers", "userName profilePicture");

    // Emit to all users except owner
    if (req.io && req.socketUserMap) {
      for (const [connectingUserId, socketId] of req.socketUserMap) {
        if (connectingUserId !== userId) {
          req.io.to(socketId).emit("new_status", populatedStatus);
        }
      }
    }

    return response(res, 201, "Status created successfully", populatedStatus);
  } catch (error) {
    console.log(error);
    return response(res, 500, "Internal server error");
  }
};

exports.getStatuses = async (req, res) => {
  try {
    const statuses = await Status.find({
      expiresAt: { $gt: new Date() },
    })
      .populate("user", "userName profilePicture")
      .populate("viewers", "userName profilePicture")
      .sort({ createdAt: -1 });
    return response(res, 201, "Status retrived successfully", statuses);
  } catch (error) {
    console.log(error);
    return response(res, 500, "Internal server error");
  }
};

exports.viewStatus = async (req, res) => {
  const { statusId } = req.params;
  const userId = req.user.userId;

  try {
    const status = await Status.findById(statusId);
    if (!status) {
      return response(res, 404, "Status not found");
    }

    if (!status.viewers.includes(userId)) {
      status.viewers.push(userId);
      await status.save();
    }

    // Always return populated status
    const updatedStatus = await Status.findById(statusId)
      .populate("user", "userName profilePicture")
      .populate("viewers", "userName profilePicture");

    // Emit socket event to owner
    if (req.io && req.socketUserMap) {
      const statusOwnerSocketId = req.socketUserMap.get(
        status.user._id.toString()
      );

      if (statusOwnerSocketId) {
        req.io.to(statusOwnerSocketId).emit("status_viewed", {
          statusId,
          viewerId: userId,
          totalViewers: updatedStatus.viewers.length,
          viewers: updatedStatus.viewers,
        });
      }
    }

    return response(res, 200, updatedStatus);
  } catch (error) {
    console.log(error);
    return response(res, 500, "Internal server error");
  }
};

exports.deleteStatus = async (req, res) => {
  const { statusId } = req.params;
  const userId = req.user.userId;
  try {
    const status = await Status.findById(statusId);
    if (!status) {
      return response(res, 404), "Status not found";
    }

    if (status.user.toString() !== userId) {
      return response(res, 403, "Not authorized to delete this status");
    }

    await status.deleteOne();

    // Emit socket event

    if (req.io && req.socketUserMap) {
      for (const [connectingUserId, socketId] of req.socketUserMap) {
        if (connectingUserId !== userId) {
          req.io.to(socketId).emit("status_deleted", statusId);
        }
      }
    }

    return response(res, 200, "Status delete successfully");
  } catch (error) {
    console.log(error);
    return response(res, 500, "Internal server error");
  }
};
