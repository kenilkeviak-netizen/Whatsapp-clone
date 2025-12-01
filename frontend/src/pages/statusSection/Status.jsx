import React, { useEffect, useState } from "react";
import useThemeStore from "../../store/themeStore";
import useUserStore from "../../store/useUserStore";
import useStatusStore from "../../store/useStatusStore";
import Layout from "../../components/Layout";
import StatusPreview from "./StatusPreview";
import { motion } from "framer-motion";
import { RxCross2 } from "react-icons/rx";

const Status = () => {
  const [previewContact, setPreviewContact] = useState(null);
  const [currentStatusIndex, setcurrentStatusIndex] = useState(0);
  const [showOption, setShowOPtion] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [showCreateModel, setShowCreateModel] = useState(null);
  const [newStatus, setNewStatus] = useState("");
  const [filePreview, setFilePreview] = useState(null);

  const { theme } = useThemeStore();
  const { user } = useUserStore();
  const {
    statuses,
    loading,
    error,
    fetchStatuses,
    createStatus,
    viewStatus,
    deleteStatus,
    getStatusViewers,
    getUserStatuses,
    getOtherStatuses,
    clearError,
    reset,
    initializeSocket,
    cleanUpSocket,
  } = useStatusStore();

  const userStatuses = getUserStatuses(user?._id);
  const otherStatuses = getOtherStatuses(user?._id);

  useEffect(() => {
    fetchStatuses();
    initializeSocket();

    return () => {
      cleanUpSocket();
    };
  }, [user?._id]);

  useEffect(() => {
    return () => clearError();
  }, []);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
      if (file.type.startsWith("image/") || file.type.startsWith("video/")) {
        setFilePreview(URL.createObjectURL(file));
      }
    }
  };

  const handleCreateStatus = async () => {
    if (!newStatus.trim() && !selectedFile) return;

    try {
      await createStatus({
        content: newStatus,
        file: selectedFile,
      });

      setSelectedFile(null);
      setNewStatus("");
      setFilePreview(null);
      setShowCreateModel(false);
    } catch (error) {
      console.error("Error to creating status", error);
    }
  };

  const handleViewStatus = async (statusId) => {
    try {
      await viewStatus(statusId);
    } catch (error) {
      console.error("Error to View status", error);
    }
  };

  const handleDeleteStatus = async (statusId) => {
    try {
      await deleteStatus(statusId);
      setShowOPtion(false);
      handlePreviewClose();
    } catch (error) {
      console.error("Error to Delete status", error);
    }
  };

  const handlePreviewClose = () => {
    setPreviewContact(null);
    setcurrentStatusIndex(0);
  };

  const handlePreviewNext = () => {
    if (currentStatusIndex < previewContact.statuses.length - 1) {
      setcurrentStatusIndex((prev) => prev + 1);
    } else {
      handlePreviewClose();
    }
  };

  const handlePreviewPrev = () => {
    setcurrentStatusIndex((prev) => Math.max(prev - 1), 0);
  };

  const handleStatusPreview = (contact, statusIndex = 0) => {
    setPreviewContact(contact);
    setcurrentStatusIndex(statusIndex);

    if (contact.statuses[statusIndex]) {
      handleViewStatus(contact.statuses[statusIndex].id);
    }
  };

  return (
    <Layout
      isStatusPreviewOpen={!!previewContact}
      isStatusPreviewContent={
        previewContact && (
          <StatusPreview
            contact={previewContact}
            currentIndex={currentStatusIndex}
            onClose={handlePreviewClose}
            onNext={handlePreviewNext}
            onPrev={handlePreviewPrev}
            onDelete={handleDeleteStatus}
            theme={theme}
            currentUser={user}
          />
        )
      }
    >
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
        className={`flex-1 h-screen border-r ${
          theme === "dark"
            ? "bg-[rgb(12,19,24)] text-white border-gray-600"
            : "bg-gray-100 text-black"
        }`}
      >
        <div
          className={`flex justify-between items-center shadow-md ${
            theme === "dark" ? "bg-[rgb(17,23,33)]" : "bg-white "
          } p-4`}
        >
          <h2 className="text-2xl font-bold">Status</h2>
        </div>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mx-4 mt-2">
            <span className="block sm:inline">asasasas</span>
            <button
              onClick={clearError}
              className="float-right text-red-500 hover:text-red-700"
            >
              <RxCross2 className="w-5 h-5" />
            </button>
          </div>
        )}

        <div className="overflow-y-auto h-[calc(100vh-64px)]">
          <div
            className={`flex p-3 space-x-4 shadow-md ${
              theme === "dark" ? "bg-[rgb(17,23,33)]" : "bg-white "
            } `}
          >
            <div
              className="relative cursor-pointer"
              onClick={() =>
                userStatuses
                  ? handleStatusPreview(userStatuses)
                  : setShowCreateModel(true)
              }
            >
              <img
                src={user?.profilePicture}
                alt={user?.userName}
                className="w-12 h-12 rounded-full object-cover"
              />

              {userStatuses ? (
                <>
                  <svg
                    className="absolute top-0 left-0 w-12 h-12"
                    viewBox="0 0 100 100"
                  >
                    {userStatuses.statuses.map((_, index) => {
                      const circumference = 2 * Math.PI * 48;
                      const segmentLength =
                        circumference / userStatuses.statuses.length;
                    })}
                  </svg>
                </>
              ) : (
                <></>
              )}
            </div>
          </div>
        </div>
      </motion.div>
    </Layout>
  );
};

export default Status;
