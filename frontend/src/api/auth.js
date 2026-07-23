// auth.js
import { apiFetch } from "./api";
import Cookies from "js-cookie";

// Login function
export const login = async (userData) => {
  const data = await apiFetch("/auth/login", {
      method: "POST",
      credentials: "include",
      body: userData,
    });
  // data = await data.json();
  return data;
//   const data = await apiFetch("/auth/login", {
//     method: "POST",
//     body: userData,
//   });

//   if (data?.access_token){
//     // Save token for middleware to read
//       Cookies.set("token", data.access_token, {
//         expires: 7,
//         path: "/", // required to make cookie available everywhere
//       });
//   }
  
//   return data;
};


// Register
export const register = async (userData) => {
  const data = await apiFetch("/auth/register", {
    method: "POST",
    body: userData,
    credentials: "include", //TODO: Add cookie creation on BE 
  });

  // // Optional: automatically log in after registration
  // if (data?.access_token) {
  //     Cookies.set("token", data.access_token, {
  //         expires: 7,
  //         path: "/", // required to make cookie available everywhere
  //       });
  // }

  return data;
};

// Resend the email verification link
export const resendVerification = async (email) => {
  return await apiFetch("/auth/resend-verification", {
    method: "POST",
    body: { email },
  });
};

// Request a password-reset link
export const forgotPassword = async (email) => {
  return await apiFetch("/auth/forgot-password", {
    method: "POST",
    body: { email },
  });
};

// Set a new password using the token from the reset email
export const resetPassword = async (token, password) => {
  return await apiFetch("/auth/reset-password", {
    method: "POST",
    body: { token, password },
  });
};

// Logout function
export const logout = async () => {
  await apiFetch("/auth/logout", {
    method: "POST",
  });
};

// Example: get user profile
export const getProfile = async () => {
  return await apiFetch("/auth/me", {credentials: "include"});
};
