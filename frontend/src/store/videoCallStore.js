import { create } from "zustand";
import { subscribeWithSelector } from "zustand/middleware";

const useVideoCallStore = create(
  subscribeWithSelector((set, get) => ({
    // Call state
    currentCall: null,
    incomingCall: null,
    isCallActive: false,
    callType: null,

    // Media State
    localStream: null,
    remoteStream: null,
    isVideoEnabled: true,
    isAudioEnabled: true,

    // WebRTC
    peerConnection: null,
    iceCandidatesQueue: [],

    isCallModelOpen: false,
    callStatus: "idle",

    // Actions
    setCurrentCall: (call) => {
      set({ currentCall: call });
    },

    setIncomingCall: (call) => {
      set({ incomingCall: call });
    },

    setRemoteStream: (stream) => {
      set({ remoteStream: stream });
    },

    setCallActive: (active) => {
      set({ isCallActive: active });
    },

    setCallType: (type) => {
      set({ callType: type });
    },

    setLocalStream: (stream) => {
      set({ localStream: stream });
    },

    setPeerConnection: (pc) => {
      set({ peerConnection: pc });
    },

    setCallModelOpen: (open) => {
      set({ isCallModelOpen: open });
    },

    setCallStatus: (status) => {
      set({ callStatus: status });
    },

    addIceCandidate: (candidate) => {
      const { iceCandidatesQueue } = get();
      set({ iceCandidatesQueue: [...iceCandidatesQueue, candidate] });
    },

    processQueuedIceCandidates: async () => {
      const { peerConnection, iceCandidatesQueue } = get();

      if (
        peerConnection &&
        peerConnection.remoteDescription &&
        iceCandidatesQueue.length > 0
      ) {
        for (const candidate of iceCandidatesQueue) {
          try {
            await peerConnection.addIceCandidate(
              new RTCIceCandidate(candidate)
            );
          } catch (error) {
            console.error("ICE canditate Error", error);
          }
        }
        set({ iceCandidatesQueue: [] });
      }
    },

    toggleVideo: () => {
      const { localStream, isVideoEnabled } = get();
      if (localStream) {
        const videoTrack = localStream.getVideoTracks()[0];
        if (videoTrack) {
          videoTrack.enabled = !isVideoEnabled;
          set({ isVideoEnabled: !isVideoEnabled });
        }
      }
    },

    toggleAudio: () => {
      const { localStream, isAudioEnabled } = get();
      if (localStream) {
        const audioTrack = localStream.getAudioTracks()[0];
        if (audioTrack) {
          audioTrack.enabled = !isAudioEnabled;
          set({ isAudioEnabled: !isAudioEnabled });
        }
      }
    },

    /*     endCall: () => {
      const { localStream, peerConnection } = get();
      if (localStream) {
        localStream.getTracks().forEach((track) => track.stop());
      }

      if (peerConnection) {
        peerConnection.close();
      }

      set({
        currentCall: null,
        incomingCall: null,
        isCallActive: false,
        callType: null,
        localStream: null,
        remoteStream: null,
        isVideoEnabled: true,
        isAudioEnabled: true,
        peerConnection: null,
        iceCandidatesQueue: [],
        isCallModelOpen: false,
        callStatus: "idle",
      });
    }, */

    endCall: () => {
      const { localStream, remoteStream, peerConnection } = get();

      // Stop local media
      if (localStream) {
        localStream.getTracks().forEach((track) => track.stop());
      }

      // Stop remote media
      if (remoteStream) {
        remoteStream.getTracks().forEach((track) => track.stop());
      }

      // Close peer connection properly
      if (peerConnection) {
        peerConnection.onicecandidate = null;
        peerConnection.ontrack = null;
        peerConnection.onconnectionstatechange = null;
        peerConnection.oniceconnectionstatechange = null;
        peerConnection.onsignalingstatechange = null;
        peerConnection.close();
      }

      set({
        currentCall: null,
        incomingCall: null,
        isCallActive: false,
        callType: null,
        localStream: null,
        remoteStream: null,
        isVideoEnabled: true,
        isAudioEnabled: true,
        peerConnection: null,
        iceCandidatesQueue: [],
        isCallModelOpen: false,
        callStatus: "idle",
      });
    },

    clearIncomingCall: () => {
      set({ incomingCall: null });
    },
  }))
);

export default useVideoCallStore;
