import React, { useEffect } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import "./App.css";
import Login from "./pages/user-login/Login";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { ProtectedRoute, PublicRoute } from "./protected";
import HomePage from "./components/HomePage";
import UserDetail from "./components/UserDetail";
import Setting from "./pages/settingSection/Setting";
import Status from "./pages/statusSection/Status";
import useUserStore from "./store/useUserStore";
import { disconnectSocket, initializeSocket } from "./services/chat.service";
import { useChatStore } from "./store/chatStore";

function App() {
  const { user } = useUserStore();
  const { setCurrentUser, initsocketListners, cleanup } = useChatStore();

  useEffect(() => {
    if (user?._id) {
      const socket = initializeSocket;

      if (socket) {
        setCurrentUser(user);
        initsocketListners();
      }
    }

    return () => {
      disconnectSocket();
    };
  }, [user, setCurrentUser, initsocketListners, cleanup]);
  return (
    <>
      <ToastContainer position="top-right" autoClose={3000} />
      <Router>
        <Routes>
          <Route element={<PublicRoute />}>
            <Route path="/user-login" element={<Login />} />
          </Route>

          <Route element={<ProtectedRoute />}>
            <Route path="/" element={<HomePage />} />
            <Route path="/user-profile" element={<UserDetail />} />
            <Route path="/setting" element={<Setting />} />
            <Route path="/status" element={<Status />} />
          </Route>
        </Routes>
      </Router>
    </>
  );
}

export default App;
