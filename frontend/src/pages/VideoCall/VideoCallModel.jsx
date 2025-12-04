import React, { useEffect, useMemo, useRef } from "react";
import useVideoCallStore from "../../store/videoCallStore";
import useUserStore from "../../store/useUserStore";
import useThemeStore from "../../store/themeStore";

const VideoCallModel = ({ socket }) => {
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);

  const {
    currentCall,
    incomingCall,
    isCallActive,
    localStream,
    remoteStream,
    isVideoEnabled,
    isAudioEnabled,
    peerConnection,
    iceCandidatesQueue,
    isCallModelOpen,
    callStatus,
    setCurrentCall,
    setIncomingCall,
    setCallType,
    setCallModelOpen,
    setCallStatus,
    endCall,
    setCallActive,
    setLocalStream,
    setPeerConnection,
    addIceCandidate,
    processQueuedIceCandidates,
    toggleVideo,
    toggleAudio,
  } = useVideoCallStore();

  const { user } = useUserStore();
  const { theme } = useThemeStore();

  const rtcConfiguration = {
    iceServers: [
      {
        urls: "stun:stun.l.google.com:19302",
      },
      {
        urls: "stun:stun1.l.google.com:19302",
      },
      {
        urls: "stun:stun2.l.google.com:19302",
      },
    ],
  };

  // Memorize display the user info and it is prevent the unnesseccary re-render
  const displayInfo = useMemo(() => {
    if (incomingCall && !isCallActive) {
      return {
        name: incomingCall.callerName,
        avatar: incomingCall.callerAvatar,
      };
    } else if (currentCall) {
      return {
        name: currentCall.participantName,
        avatar: currentCall.participantAvatar,
      };
    }
    return null;
  }, [incomingCall, currentCall, isCallActive]);

  //  Connection detection
  useEffect(() => {
    if (peerConnection && remoteStream) {
      console.log("both peer conection and remote stream available");
      setCallStatus("connected");
      setCallActive(true);
    }
  }, [peerConnection, remoteStream, setCallStatus, setCallActive]);

  return <div>VideoCallModel</div>;
};

export default VideoCallModel;
