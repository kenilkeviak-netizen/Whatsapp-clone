import React, { useState } from "react";
import useThemeStore from "../../store/themeStore";
import { logoutUser } from "../../services/user.service";
import useUserStore from "../../store/useUserStore";
import { toast } from "react-toastify";
import Layout from "../../components/Layout";
import { useNavigate } from "react-router-dom";

import {
  FaComment,
  FaMoon,
  FaQuestionCircle,
  FaSearch,
  FaSignInAlt,
  FaSun,
  FaUser,
} from "react-icons/fa";
import { Link } from "react-router-dom";

const Setting = () => {
  const [isThemeDialogOpen, setIsThemeDialogOpen] = useState(false);

  const { theme } = useThemeStore();
  const { user, clearUser } = useUserStore();

  const toggleThemeDialog = () => {
    setIsThemeDialogOpen(!isThemeDialogOpen);
  };
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await logoutUser();
      clearUser();
      toast.success("User Logged out successfully");
    } catch (error) {
      console.error("Fail to logout", error);
    }
  };

  return (
    <Layout
      isThemeDialogOpen={isThemeDialogOpen}
      toggleThemeDialog={toggleThemeDialog}
    >
      <div
        className={`flex h-screen ${
          theme === "dark"
            ? "bg-[rgb(17,27,33)] text-white"
            : "bg-white text-black"
        }`}
      >
        <div
          className={`w-full border-r ${
            theme === "dark" ? "border-gray-600" : "border-gray-200"
          }`}
        >
          <div className="p-4">
            <h1 className="text-xl font-semibold mb-3">Settings</h1>

            <div className="relative mb-4">
              <FaSearch className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search setting"
                className={`w-full ${
                  theme === "dark"
                    ? "bg-[#202c33] text-white"
                    : "bg-gray-100 text-black"
                } border-none pl-10 placeholder-gray-400 rounded p-2`}
              />
            </div>

            <div
              className={`flex items-center gap-4 p-3 ${
                theme === "dark" ? "hover:bg-[#202c33]" : "hover:bg-gray-100"
              } rounded-lg cursor-pointer mb-4`}
            >
              <img
                src={user.profilePicture}
                alt="profile"
                className="w-14 h-14 rounded-full"
              />
              <div>
                <h2 className="font-semibold">{user?.userName}</h2>
                <p className="text-sm text-gray-400">{user?.about}</p>
              </div>
            </div>

            {/* Menu Items */}
            <div className="h-[calc(100vh-280px)] overflow-y-auto">
              <div className="space-y-1">
                {[
                  {
                    icon: FaUser,
                    lable: "account",
                    href: "/user-profile",
                  },
                  {
                    icon: FaComment,
                    lable: "Chats",
                    href: "/",
                  },
                  {
                    icon: FaQuestionCircle,
                    lable: "help",
                    href: "/help",
                  },
                ].map((item) => (
                  <Link
                    to={item.href}
                    key={item.lable}
                    className={`w-full flex items-center gap-3 p-2 rounded ${
                      theme === "dark"
                        ? " text-white hover:bg-[#202c33]"
                        : "hover:bg-gray-100 text-black"
                    }`}
                  >
                    <item.icon className="h-5 w-5" />
                    <div
                      className={`border-b ${
                        theme === "dark" ? "border-gray-700" : "border-gray-200"
                      } w-full p-4`}
                    >
                      {item.lable}
                    </div>
                  </Link>
                ))}

                {/* Theme Button */}
                <button
                  onClick={toggleThemeDialog}
                  className={`w-full flex items-center gap-3 p-2 rounded ${
                    theme === "dark"
                      ? " text-white hover:bg-[#202c33]"
                      : "hover:bg-gray-100 text-black"
                  }`}
                >
                  {theme === "dark" ? (
                    <FaMoon className="h-5 w-5 " />
                  ) : (
                    <FaSun className="h-5 w-5" />
                  )}

                  <div
                    className={`flex flex-col border-b text-start ${
                      theme === "dark" ? "border-gray-700" : "border-gray-200"
                    } w-full p-2`}
                  >
                    Theme{" "}
                    <span className="ml-auto text-sm text-gray-400">
                      {theme.charAt(0).toUpperCase() + theme.slice(1)}
                    </span>
                  </div>
                </button>
              </div>

              <button
                className={`w-full flex items-center gap-3 p-2 rounded text-red-500 ${
                  theme === "dark"
                    ? " text-white hover:bg-[#202c33]"
                    : "hover:bg-gray-100 text-black"
                } mt-10 md:mt-36`}
                onClick={handleLogout}
              >
                <FaSignInAlt className="h-5 w-5" /> Logout
              </button>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Setting;
