import axiosInstance from "./url.service";

// ------------------ SEND OTP ------------------
export const sendOtp = async (phoneNumber, phoneSuffix, email) => {
  try {
    const response = await axiosInstance.post("/auth/send-otp", {
      phoneNumber,
      phoneSuffix,
      email,
    });

    return response.data;
  } catch (error) {
    throw error.response ? error.response.data : error.message;
  }
};

// ------------------ VERIFY OTP ------------------
export const verifyOtp = async (phoneNumber, phoneSuffix, email, otp) => {
  try {
    const response = await axiosInstance.post("/auth/verify-otp", {
      phoneNumber,
      phoneSuffix,
      email,
      otp,
    });

    return response.data;
  } catch (error) {
    throw error.response ? error.response.data : error.message;
  }
};

// ------------------ UPDATE USER PROFILE ------------------
export const updateUserProfile = async (formData) => {
  try {
    const response = await axiosInstance.put("/auth/update-profile", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });

    return response.data; // backend returns { message, data }
  } catch (error) {
    console.error("❌ updateUserProfile error:", error);
    throw error.response ? error.response.data : error.message;
  }
};

// ------------------ CHECK AUTH ------------------
export const checkUserAuth = async () => {
  try {
    const response = await axiosInstance.get("/auth/check-auth");

    if (response.data.status === "success") {
      return {
        isAuthenticated: true,
        user: response.data?.data,
      };
    } else if (response.error === "error") {
      return { isAuthenticated: true };
    }

    return response.data;
  } catch (error) {
    throw error.response ? error.response.data : error.message;
  }
};

// ------------------ LOGOUT ------------------
export const logoutUser = async () => {
  try {
    const response = await axiosInstance.get("/auth/logout");
    return response.data;
  } catch (error) {
    throw error.response ? error.response.data : error.message;
  }
};

// ------------------ GET ALL USERS ------------------
export const getAllUser = async () => {
  try {
    const response = await axiosInstance.get("/auth/users");
    return response.data;
  } catch (error) {
    throw error.response ? error.response.data : error.message;
  }
};

// ------------------ GET CONVERSATIONS ------------------
export const getConversations = async () => {
  try {
    const response = await axiosInstance.get("/conversation");
    return response.data;
  } catch (error) {
    throw error.response ? error.response.data : error.message;
  }
};
