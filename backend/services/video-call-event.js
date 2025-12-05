// videu-call-event.js

const handleVideoCallEvent = (socket, io, onlineUsers) => {
  // 1) Initiate video call (caller -> server)
  socket.on(
    "initiate_call",
    ({ callerId, receiverId, callType, callerInfo }) => {
      const receiverSocketId = onlineUsers.get(receiverId);

      if (receiverSocketId) {
        const callId = `${callerId}-${receiverId}-${Date.now()}`;

        io.to(receiverSocketId).emit("incoming_call", {
          callerId,
          callId,
          callerName: callerInfo.userName,
          callerAvatar: callerInfo.profilePicture,
          callType,
        });
      } else {
        console.log(`server: Receiver ${receiverId} is Offline`);
        socket.emit("call_failed", { reason: "user is offline" });
      }
    }
  );

  // 2) Accept Call (receiver -> server)
  socket.on("accept_call", ({ callerId, callId, receiverInfo }) => {
    const callerSocketId = onlineUsers.get(callerId);

    if (callerSocketId) {
      io.to(callerSocketId).emit("call_accepted", {
        callId,
        receiverName: receiverInfo.userName,
        receiverAvatar: receiverInfo.profilePicture,
      });
    } else {
      console.log(`server: Caller ${callerId} not found`);
      socket.emit("call_failed", { reason: "user is offline" });
    }
  });

  // 3) Reject Call (receiver -> server)
  socket.on("reject_call", ({ callerId, callId }) => {
    const callerSocketId = onlineUsers.get(callerId);
    if (callerSocketId) {
      io.to(callerSocketId).emit("call_rejected", { callId });
    }
  });

  // 4) End Call (either side -> server)
  socket.on("end_call", ({ callId, participantId }) => {
    const participantSocketId = onlineUsers.get(participantId);
    if (participantSocketId) {
      io.to(participantSocketId).emit("call_ended", { callId });
    }
  });

  // 5) WebRTC Offer
  socket.on("webrtc_offer", ({ offer, receiverId, callId }) => {
    const receiverSocketId = onlineUsers.get(receiverId);

    if (receiverSocketId) {
      io.to(receiverSocketId).emit("webrtc_offer", {
        offer,
        callId,
        senderId: socket.userId,
      });
      console.log(`server: offer forwarded to ${receiverId}`);
    } else {
      console.log(`server: receiver ${receiverId} not found for offer`);
    }
  });

  // 6) WebRTC Answer
  socket.on("webrtc_answer", ({ answer, receiverId, callId }) => {
    const receiverSocketId = onlineUsers.get(receiverId);

    if (receiverSocketId) {
      io.to(receiverSocketId).emit("webrtc_answer", {
        answer,
        callId,
        senderId: socket.userId,
      });
      console.log(`server: answer forwarded to ${receiverId}`);
    } else {
      console.log(`server: receiver ${receiverId} not found for answer`);
    }
  });

  // 7) ICE Candidate
  socket.on("webrtc_ice_candidate", ({ candidate, receiverId, callId }) => {
    const receiverSocketId = onlineUsers.get(receiverId);

    if (receiverSocketId) {
      io.to(receiverSocketId).emit("webrtc_ice_candidate", {
        candidate,
        callId,
        senderId: socket.userId,
      });
      console.log(`server: ICE candidate forwarded to ${receiverId}`);
    } else {
      console.log(`server: receiver ${receiverId} not found for ICE candidate`);
    }
  });
};

module.exports = handleVideoCallEvent;
