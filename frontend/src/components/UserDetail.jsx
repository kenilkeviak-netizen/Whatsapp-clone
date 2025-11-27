import React, { useEffect, useState } from "react";
import useUserStore from "../store/useUserStore";
import useThemeStore from "../store/themeStore";
import { updateUserProfile } from "../services/user.service";
import { toast } from "react-toastify";
import Layout from "./Layout";
import { motion } from "framer-motion";

const UserDetail = () => {
  const [name, setName] = useState("");
  const [about, setAbout] = useState("");

  const [profilePicture, setProfilePicture] = useState(null);
  const [preview, setPreview] = useState(null);

  const [isEditingName, setIsEditingName] = useState(false);
  const [isEditingAbout, setIsEditingAbout] = useState(false);
  const [showNameEmoji, setShowNameEmoji] = useState(false);
  const [showAboutEmoji, setShowAboutEmoji] = useState(false);
  const { user, setUser } = useUserStore();
  const { theme } = useThemeStore();

  useEffect(() => {
    if (user) {
      setName(user.userName || "");
      setAbout(user.about || "");
    }
  }, [user]);

  const handleImageChange = (e) => {
    const file = e.target.file[0];
    if (file) {
      setProfilePicture(file);
      setPreview(URL.createObjectURL(file));
    }
  };

  const handleSave = async (field) => {
    try {
      const formData = new FormData();
      if (field === "name") {
        formData.append("username", name);
        setIsEditingName(false);
        setShowNameEmoji(flase);
      } else if (field === "about") {
        formData.append("about", name);
        setIsEditingAbout(flase);
        setShowAboutEmoji;
      }

      if (profilePicture && field === "profile") {
        formData.append("media", profilePicture);
      }

      const updated = await updateUserProfile(formData);
      setUser(updated?.data);
      setProfilePicture(null);
      setPreview(null);
      toast.success("Profile Updated.");
    } catch (error) {
      toast.error("Failed to update profile");
    }
  };

  const handleEmojiSelect = (emoji, field) => {
    if (field === "name") {
      setName((prev) => prev + emoji.emoji);
      setShowNameEmoji(false);
    } else {
      setAbout((prev) => prev + emoji.emoji);
      setShowAboutEmoji(false);
    }
  };

  return (
    <Layout>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
        className={`w-full min-h-screen flex border-r ${
          theme === "dark"
            ? "bg-[rgb(17,23,33)] border-gray-600 text-white"
            : "bg-gray-100 border-gray-200 text-black"
        }`}
      ></motion.div>
    </Layout>
  );
};

export default UserDetail;
