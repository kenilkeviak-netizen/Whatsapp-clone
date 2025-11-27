import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import Layout from "./Layout";
import ChatList from "../pages/chatSection/ChatList";
import { getAllUser } from "../services/user.service";
import useLayoutStore from "../store/layoutStore";

const HomePage = () => {
  const [allUsers, setAllUsers] = useState([]);

  const getUser = async () => {
    try {
      const result = await getAllUser();

      if (result.status === "success") {
        setAllUsers(result.data);
      }
    } catch (error) {
      console.error("Failed to fetch conversations:", error);
    }
  };

  useEffect(() => {
    getUser();
  }, []);

  // console.log("All users:", allUsers);

  return (
    <Layout>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="h-full"
      >
        <ChatList contacts={allUsers} />
      </motion.div>
    </Layout>
  );
};

export default HomePage;
