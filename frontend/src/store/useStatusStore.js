import { create } from "zustand";
import { getSocket } from "../services/chat.service";
import axiosInstance from "../services/url.service";

const useStatusStore = create((set, get) => ({
  statuses: [],
  loading: false,
  error: null,

  setStatuses: (statuses) => set({ statuses }),
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),

  // ------------------------------------
  // Initialize Socket
  // ------------------------------------
  initializeSocket: () => {
    const socket = getSocket();
    if (!socket) return;

    // NEW STATUS CREATED
    socket.on("new_status", (newStatus) => {
      set((state) => ({
        statuses: state.statuses.some((s) => s._id === newStatus._id)
          ? state.statuses
          : [newStatus, ...state.statuses],
      }));
    });

    // STATUS DELETED
    socket.on("status_deleted", (statusId) => {
      set((state) => ({
        statuses: state.statuses.filter((s) => s._id !== statusId),
      }));
    });

    // STATUS VIEWED
    socket.on("status_viewed", (statusId, viewers) => {
      set((state) => ({
        statuses: state.statuses.map((status) =>
          status._id === statusId ? { ...status, viewers } : status
        ),
      }));
    });
  },

  // ------------------------------------
  // Remove Socket Events
  // ------------------------------------
  cleanupSocket: () => {
    const socket = getSocket();
    if (socket) {
      socket.off("new_status");
      socket.off("status_deleted");
      socket.off("status_viewed");
    }
  },

  // ------------------------------------
  // Fetch User Statuses
  // ------------------------------------
  fetchStatuses: async () => {
    set({ loading: true, error: null });
    try {
      const { data } = await axiosInstance.get("/status");
      set({ statuses: data.data || [], loading: false });
    } catch (error) {
      console.error("Error fetching status", error);
      set({ error: error.message, loading: false });
    }
  },

  // ------------------------------------
  // Create Status
  // ------------------------------------
  createStatus: async (statusData) => {
    set({ loading: true, error: null });
    try {
      const formData = new FormData();

      if (statusData.file) {
        formData.append("media", statusData.file);
      }

      if (statusData.content?.trim()) {
        formData.append("content", statusData.content);
      }

      const { data } = await axiosInstance.post("/status", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      // Add to local state
      if (data.data) {
        set((state) => ({
          statuses: state.statuses.some((s) => s._id === data.data._id)
            ? state.statuses
            : [data.data, ...state.statuses],
        }));
      }
      return data.data;
    } catch (error) {
      console.error("Error creating status", error);
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  // ------------------------------------
  // View Status
  // ------------------------------------
  viewStatus: async (statusId) => {
    try {
      await axiosInstance.put(`/status/${statusId}/view`);
      set((state) => ({
        statuses: state.statuses.map((status) =>
          status._id === statusId ? { ...status } : status
        ),
      }));
    } catch (error) {
      set({ error: error.message });
    }
  },

  // ------------------------------------
  // Delete Status
  // ------------------------------------
  deleteStatus: async (statusId) => {
    try {
      await axiosInstance.delete(`/status/${statusId}`);
      set((state) => ({
        statuses: state.statuses.filter((s) => s._id !== statusId),
      }));
    } catch (error) {
      console.error("Error deleting status", error);
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  // ------------------------------------
  // Get Status Viewers
  // ------------------------------------
  getStatusViewers: async (statusId) => {
    try {
      const { data } = await axiosInstance.get(`/status/${statusId}/viewers`);
      return data.data;
    } catch (error) {
      console.error("Error getting status viewers", error);
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  // ------------------------------------
  // Group statuses by user
  // ------------------------------------
  getGroupedStatus: () => {
    const { statuses } = get();
    return statuses.reduce((acc, status) => {
      const userId = status.user?._id;

      if (!acc[userId]) {
        acc[userId] = {
          id: userId,
          name: status.user?.userName,
          avatar: status.user?.profilePicture,
          statuses: [],
        };
      }

      acc[userId].statuses.push({
        id: status._id,
        media: status.media,
        content: status.content,
        contentType: status.contentType,
        timestamp: status.createdAt,
        viewers: status.viewers,
      });

      return acc;
    }, {});
  },

  // Get specific user statuses
  getUserStatuses: (userId) => {
    const grouped = get().getGroupedStatus();
    return userId ? grouped[userId] : null;
  },

  // Get other users' statuses
  getOtherStatuses: (userId) => {
    const grouped = get().getGroupedStatus();
    return Object.values(grouped).filter((contact) => contact.id !== userId);
  },

  clearError: () => set({ error: null }),

  reset: () =>
    set({
      statuses: [],
      loading: false,
      error: null,
    }),
}));

export default useStatusStore;
