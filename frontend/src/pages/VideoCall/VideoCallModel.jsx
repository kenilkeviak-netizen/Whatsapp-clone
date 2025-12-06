import React, { useEffect, useMemo, useRef } from "react";
import useVideoCallStore from "../../store/videoCallStore";
import useUserStore from "../../store/useUserStore";
import useThemeStore from "../../store/themeStore";
import {
  FaMicrophone,
  FaMicrophoneSlash,
  FaPhoneSlash,
  FaTimes,
  FaVideo,
  FaVideoSlash,
} from "react-icons/fa";

const VideoCallModel = ({ socket }) => {
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);

  const {
    currentCall,
    incomingCall,
    isCallActive,
    localStream,
    remoteStream,
    setRemoteStream,
    isVideoEnabled,
    isAudioEnabled,
    peerConnection,
    callType,
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
    clearIncomingCall,
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

  // Setup local stream when local stream change
  useEffect(() => {
    if (localStream && localVideoRef.current) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream]);

  // Set up remote video stream when remote stream change
  useEffect(() => {
    if (remoteStream && remoteVideoRef.current) {
      remoteVideoRef.current.srcObject = remoteStream;
    }
  }, [remoteStream]);

  // Initialize media stream
  const InitializeMedia = async (video = true) => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: video ? { width: 640, height: 480 } : false,
        audio: true,
      });
      console.log("Local Media stream", stream.getTracks());
      setLocalStream(stream);
      return stream;
    } catch (error) {
      console.error("Media Error", error);
      throw error;
    }
  };

  // Create peer connection
  const createPeerConnection = (stream, role) => {
    const pc = new RTCPeerConnection(rtcConfiguration);

    // add local tracks immedialty
    if (stream) {
      stream.getTracks().forEach((track) => {
        console.log(`${role} adding ${track.kind} track`, track.id.slice(0, 8));
        pc.addTrack(track, stream);
      });
    }

    // handle ice candidates
    pc.onicecandidate = (event) => {
      if (event.candidate && socket) {
        const participantId =
          currentCall?.participantId || incomingCall?.callerId;
        const callId = currentCall?.callId || incomingCall?.callId;

        if (participantId && callId) {
          socket.emit("webrtc_ice_candidate", {
            candidate: event.candidate,
            receiverId: participantId,
            callId: callId,
          });
        }
      }
    };

    // handle remote stream
    pc.ontrack = (event) => {
      if (event.streams && event.streams[0]) {
        setRemoteStream(event.streams[0]);
      } else {
        const stream = new MediaStream([event.track]);
        setRemoteStream(stream);
      }
    };

    pc.onconnectionstatechange = () => {
      console.log(`role: ${role} : connection state`, pc.connectionState);
      if (pc.connectionState === "failed") {
        setCallStatus("failed");
        setTimeout(handleEndCall, 2000);
      }
    };

    pc.oniceconnectionstatechange = () => {
      console.log(`${role} : ICE state`, pc.iceConnectionState);
    };

    pc.onsignalingstatechange = () => {
      console.log(`${role} : Signaling state`, pc.signalingState);
    };

    setPeerConnection(pc);
    return pc;
  };

  // Caller : Initialize call after acceptance
  const initializeCallerCall = async () => {
    try {
      setCallStatus("connecting");
      // get media
      const stream = await InitializeMedia(callType === "video");

      // create peer connection with offer
      const pc = createPeerConnection(stream, "CALLER");

      const offer = await pc.createOffer({
        offerToReceiveAudio: true,
        offerToReceiveVideo: callType === "video",
      });

      await pc.setLocalDescription(offer);

      socket.emit("webrtc_offer", {
        offer,
        receiverId: currentCall?.participantId,
        callId: currentCall?.callId,
      });
    } catch (error) {
      console.error("Caller error", error);
      setCallStatus("failed");
      setTimeout(handleEndCall, 2000);
    }
  };

  // Receiver :  Answer call

  const handleAnswerCall = async () => {
    try {
      setCallStatus("connecting");
      // get media
      const stream = await InitializeMedia(callType === "video");

      // create peer connection with offer
      createPeerConnection(stream, "RECEIVER");

      socket.emit("accept_call", {
        callerId: incomingCall?.callerId,
        callId: incomingCall?.callId,
        receiverInfo: {
          userName: user?.userName,
          profilePicture: user?.profilePicture,
        },
      });

      setCurrentCall({
        callId: incomingCall?.callId,
        participantId: incomingCall?.callerId,
        participantName: incomingCall?.callerName,
        participantAvatar: incomingCall?.callerAvatar,
      });

      clearIncomingCall();
    } catch (error) {
      console.error("Receiver Error", error);
      handleEndCall();
    }
  };

  const handleRejectCall = () => {
    if (incomingCall) {
      socket.emit("reject_call", {
        callerId: incomingCall?.callerId,
        callId: incomingCall?.callId,
      });
    }
    endCall();
  };

  const handleEndCall = () => {
    const participantId = currentCall?.participantId || incomingCall?.callerId;
    const callId = currentCall?.callId || incomingCall?.callId;

    if (participantId && callId) {
      socket.emit("end_call", {
        callId: callId,
        participantId: participantId,
      });
    }

    endCall();
  };

  // Socket event listeners

  useEffect(() => {
    if (!socket) return;

    const handleCallAccepted = ({ receiverName }) => {
      if (currentCall) {
        setTimeout(() => {
          initializeCallerCall();
        }, 500);
      }
    };

    const handleCallRejected = () => {
      setCallStatus("rejected");
      setTimeout(endCall, 2000);
    };

    const handleCallEnded = () => {
      endCall();
    };

    const handleWebRTCOffer = async ({ offer, senderId, callId }) => {
      if (!peerConnection) return;

      try {
        await peerConnection.setRemoteDescription(
          new RTCSessionDescription(offer)
        );
        await processQueuedIceCandidates();

        const answer = await peerConnection.createAnswer();
        await peerConnection.setLocalDescription(answer);

        socket.emit("webrtc_answer", {
          answer,
          receiverId: senderId,
          callId,
        });

        console.log("Receiver: Answer send waiting for ice candidate");
      } catch (error) {
        console.error("Receiver Error", error);
      }
    };

    // Receiver answer
    const handleWebRTCAnswer = async ({ answer, senderID, callId }) => {
      if (!peerConnection) return;
      if (peerConnection.signalingState === "closed") {
        console.log("Caller : Peer connection is close");
        return;
      }

      try {
        await peerConnection.setRemoteDescription(
          new RTCSessionDescription(answer)
        );
        await processQueuedIceCandidates();

        const receivers = peerConnection.getReceivers();
        console.log("Receiver", receivers);
      } catch (error) {
        console.error("Caller Answer error", error);
      }
    };

    const handleWebRTCIceCandidates = async ({ candidate, senderID }) => {
      if (peerConnection && peerConnection.signalingState !== "closed") {
        if (peerConnection.remoteDescription) {
          try {
            await peerConnection.addIceCandidate(
              new RTCIceCandidate(candidate)
            );
            console.log("ICE Candidate Added");
          } catch (error) {
            console.log("ICE candidate Error", error);
          }
        } else {
          console.log("Queueing ice Candidates");

          addIceCandidate(candidate);
        }
      }
    };

    // Register all event listner
    socket.on("call_accepted", handleCallAccepted);
    socket.on("call_rejected", handleCallRejected);
    socket.on("call_ended", handleCallEnded);
    socket.on("webrtc_offer", handleWebRTCOffer);
    socket.on("webrtc_answer", handleWebRTCAnswer);
    socket.on("webrtc_ice_candidate", handleWebRTCIceCandidates);

    console.log("socket listner register");
    return () => {
      socket.off("call_accepted", handleCallAccepted);
      socket.off("call_rejected", handleCallRejected);
      socket.off("call_ended", handleCallEnded);
      socket.off("webrtc_offer", handleWebRTCOffer);
      socket.off("webrtc_answer", handleWebRTCAnswer);
      socket.off("webrtc_ice_candidate", handleWebRTCIceCandidates);
    };
  }, [socket, peerConnection, currentCall, incomingCall, user]);

  if (!isCallModelOpen && !incomingCall) return null;

  const shouldShowActiveCall =
    isCallActive || callStatus === "calling" || callStatus === "connecting";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-80 backdrop-blur-sm transition-all duration-300">
      <div
        className={`relative w-full h-full max-w-[900px] max-h-[600px] rounded-xl overflow-hidden shadow-xl border ${
          theme === "dark"
            ? "bg-gray-900 border-gray-700"
            : "bg-white border-gray-200"
        }`}
      >
        {/* Incoming Call View */}
        {incomingCall && !isCallActive && (
          <div className="flex flex-col items-center justify-center h-full p-8 space-y-6 animate-fade-in">
            <div className="flex flex-col items-center text-center space-y-3">
              <div className="w-36 h-36 rounded-full overflow-hidden shadow-lg ring-4 ring-green-400 animate-pulse">
                <img
                  src={displayInfo?.avatar}
                  alt={displayInfo?.name}
                  className="w-full h-full object-cover"
                />
              </div>

              <h2 className="text-3xl font-semibold text-gray-600 tracking-wide">
                {displayInfo?.name}
              </h2>

              <p className="text-lg text-gray-600 animate-bounce">
                Incoming {callType} call...
              </p>
            </div>

            {/* Buttons */}
            <div className="flex space-x-10 mt-4">
              <button
                onClick={handleRejectCall}
                className="w-16 h-16 bg-red-500 hover:bg-red-600 rounded-full flex items-center justify-center shadow-lg ring-4 ring-red-700/50 hover:scale-110 transition transform"
              >
                <FaPhoneSlash className="text-white w-7 h-7" />
              </button>

              <button
                onClick={handleAnswerCall}
                className="w-16 h-16 bg-green-500 hover:bg-green-600 rounded-full flex items-center justify-center shadow-lg ring-4 ring-green-700/50 hover:scale-110 transition transform"
              >
                <FaVideo className="text-white w-7 h-7" />
              </button>
            </div>
          </div>
        )}

        {/* Active Call UI */}
        {shouldShowActiveCall && (
          <div className="relative w-full h-full animate-fade-in">
            {/* Remote Video */}
            {callType === "video" && remoteStream ? (
              <video
                ref={remoteVideoRef}
                autoPlay
                playsInline
                className="w-full h-full object-cover bg-black"
              />
            ) : (
              <div className="w-full h-full bg-gray-800 flex items-center justify-center">
                <div className="text-center space-y-3">
                  <div className="w-32 h-32 rounded-full overflow-hidden bg-gray-600 mx-auto shadow-xl">
                    <img
                      src={displayInfo?.avatar}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <p className="text-white text-xl font-medium">
                    {callStatus === "calling"
                      ? `Calling ${displayInfo?.name}...`
                      : callStatus === "connecting"
                      ? "Connecting..."
                      : callStatus === "connected"
                      ? displayInfo?.name
                      : callStatus === "failed"
                      ? "Call Failed"
                      : displayInfo?.name}
                  </p>
                </div>
              </div>
            )}

            {/* Local floating preview */}
            {callType === "video" && localStream && (
              <div className="absolute bottom-4 right-4 w-44 h-32 rounded-lg overflow-hidden shadow-md border border-white/70 backdrop-blur">
                <video
                  ref={localVideoRef}
                  autoPlay
                  muted
                  playsInline
                  className="w-full h-full object-cover"
                />
              </div>
            )}

            {/* Status label */}
            <div className="absolute top-4 left-4">
              <div className="px-3 py-1 rounded-full bg-black/50 backdrop-blur text-white text-sm shadow">
                {callStatus === "connected" ? "Connected" : callStatus}
              </div>
            </div>

            {/* Bottom Control Bar */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 px-6 py-3 bg-black/50 shadow-xl flex items-center space-x-5 rounded-full backdrop-blur">
              {/* Video Toggle */}
              {callType === "video" && (
                <button
                  onClick={toggleVideo}
                  className={`w-12 h-12 rounded-full flex items-center justify-center shadow-lg hover:scale-110 transition ${
                    isVideoEnabled ? "bg-gray-300" : "bg-red-500"
                  }`}
                >
                  {isVideoEnabled ? (
                    <FaVideo className="text-black w-6 h-6" />
                  ) : (
                    <FaVideoSlash className="text-white w-6 h-6" />
                  )}
                </button>
              )}

              {/* Audio Toggle */}
              <button
                onClick={toggleAudio}
                className={`w-12 h-12 rounded-full flex items-center justify-center shadow-lg hover:scale-110 transition ${
                  isAudioEnabled ? "bg-gray-300" : "bg-red-500"
                }`}
              >
                {isAudioEnabled ? (
                  <FaMicrophone className="text-black w-6 h-6" />
                ) : (
                  <FaMicrophoneSlash className="text-white w-6 h-6" />
                )}
              </button>

              {/* End Call */}
              <button
                onClick={handleEndCall}
                className="w-14 h-14 bg-red-600 rounded-full flex items-center justify-center shadow-xl ring-4 ring-red-800 hover:bg-red-700 hover:scale-110 transition"
              >
                <FaPhoneSlash className="text-white w-7 h-7" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default VideoCallModel;
