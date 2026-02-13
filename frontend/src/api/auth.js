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
