const handleVideoCallEvent = (socket, io, onlineUsers) => {
  //  Initiate video call
  socket.on(
    "initiate_call",
    ({ callerId, receiverId, callType, callerInfo }) => {
      const receiverSocketId = onlineUsers.get(receiverId);
      if (receiverSocketId) {
        const callId = `${callerId}- ${receiverId} - ${Date.now()}`;

        io.to(receiverSocketId).emit("incoming_call", {
          callerId,
          callId,
          callerName: callerInfo.userName,
          callerAvatar: callerInfo.profilePicture,
          callType,
        });
      } else {
        console.log(`server: Receiver ${receiverId} is Offline`);
        socket.emit("call-failed", { reason: "user is offline" });
      }
    }
  );

  //  Accept Call
  socket.on("initiate_call", ({ callerId, callId, receiverInfo }) => {
    const callerSocketId = onlineUsers.get(callerId);
    if (callerSocketId) {
      io.to(callerSocketId).emit("call_accepted", {
        callerName: receiverInfo.userName,
        callerAvatar: receiverInfo.profilePicture,
        callId,
      });
    } else {
      console.log(`server: Caller ${callerId} not found`);
      socket.emit("call-failed", { reason: "user is offline" });
    }
  });

  //  Reject Call
  socket.on("reject_call", ({ callerId, callId }) => {
    const callerSocketId = onlineUsers.get(callerId);
    if (callerSocketId) {
      io.to(callerSocketId).emit("call_rejected", {
        callId,
      });
    }
  });

  //  End Call
  socket.on("end_call", ({ callId, participantId }) => {
    const participantSocketId = onlineUsers.get(participantId);
    if (participantSocketId) {
      io.to(participantSocketId).emit("call_ended", {
        callId,
      });
    }
  });

  //  WebRTC Signaling Event with proper userId
  socket.on("webrtc_offer", ({ offer, receiverId, callId }) => {
    const receiverSocketId = onlineUsers.get(receiverId);

    if (receiverSocketId) {
      io.to(receiverSocketId).emit("webrtc_offer", {
        offer,
        callId,
        senderId: socket.userId,
      });
      console.log(`server offer forwerded to ${receiverId}`);
    } else {
      console.log(`server: receiver ${receiverId} not found the offer`);
    }
  });

  //  WebRTC Signaling Event with proper userId
  socket.on("webrtc_answer", ({ answer, receiverId, callId }) => {
    const receiverSocketId = onlineUsers.get(receiverId);

    if (receiverSocketId) {
      io.to(receiverSocketId).emit("webrtc_answer", {
        answer,
        callId,
        senderId: socket.userId,
      });
      console.log(`server answer forwerded to ${receiverId}`);
    } else {
      console.log(`server: receiver ${receiverId} not found the answer`);
    }
  });

  //  WebRTC Signaling Event with proper userId
  socket.on("webrtc_ice_candidate", ({ candidate, receiverId, callId }) => {
    const receiverSocketId = onlineUsers.get(receiverId);

    if (receiverSocketId) {
      io.to(receiverSocketId).emit("webrtc_answer", {
        candidate,
        callId,
        senderId: socket.userId,
      });
    } else {
      console.log(`server: receiver ${receiverId} not found the ICE candidate`);
    }
  });
};

module.exports = handleVideoCallEvent;
