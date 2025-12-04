import React, { useCallback, useEffect } from "react";
import useVideoCallStore from "../../store/videoCallStore";
import useUserStore from "../../store/useUserStore";
import VideoCallModel from "./VideoCallModel";
import { getSocket } from "../../services/chat.service";

const VideoCallManager = () => {
  const {
    setCurrentCall,
    setIncomingCall,
    setCallType,
    setCallModelOpen,
    setCallStatus,
    endCall,
  } = useVideoCallStore();
  const { user } = useUserStore();
  const { socket } = getSocket();

  useEffect(() => {
    if (!socket) return;

    const handleIncomingCall = ({
      callerId,
      callerName,
      callerAvatar,
      callType,
      CallId,
    }) => {
      setIncomingCall({ callerId, CallId, callerAvatar, callerName });
      setCallType(callType);
      setCallModelOpen(true);
      setCallStatus("ringing");
    };

    const handleCallEnded = ({ reason }) => {
      setCallStatus("failed");
      setTimeout(() => {
        endCall();
      }, 2000);
    };

    socket.on("incomming_call", handleIncomingCall);
    socket.on("failed", handleCallEnded);

    return () => {
      socket.off("incomming_call", handleIncomingCall);
      socket.off("failed", handleCallEnded);
    };
  }, [
    socket,
    setIncomingCall,
    endCall,
    setCallStatus,
    setCallModelOpen,
    setCallType,
  ]);

  // Memoized function to initial call
  const initiateCall = useCallback(
    (receiverId, receiverName, receiverAvatar, callType = "video") => {
      const callId = `${user?._id}-${receiverId}-${Date.now()}`;

      const callData = {
        callId,
        participantId: receiverId,
        participantName: receiverName,
        participantAvatar: receiverAvatar,
      };

      setCurrentCall(callData);
      setCallType(callType);
      setCallModelOpen(true);
      setCallStatus("calling");

      //   Emit the call initiate
      socket.emit("initiate_call", {
        callerId: user?._id,
        receiverId,
        callType,
        callerInfo: {
          userName: user.userName,
          profilePicture: user.profilePicture,
        },
      });
    },
    [user, socket, setCurrentCall, setCallType, setCallModelOpen, setCallStatus]
  );

  //   Expose the initial call functiontostore
  useEffect(() => {
    useVideoCallStore.getState().initiateCall = initiateCall;
  }, [initiateCall]);
  return <VideoCallModel socket={socket} />;
};

export default VideoCallManager;
