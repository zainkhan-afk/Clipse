// auth.js
import { apiFetch } from "./api";

// Login function
export const login = async (userData) => {
  const data = await apiFetch("/auth/login", {
    method: "POST",
    body: userData,
  });

  // Save token to localStorage
  localStorage.setItem("token", data.access_token);

  return data;
};


// Register
export const register = async (userData) => {
  const data = await apiFetch("/auth/register", {
    method: "POST",
    body: userData,
  });

  // Optional: automatically log in after registration
  if (data.access_token) {
    localStorage.setItem("token", data.access_token);
  }

  return data;
};

// Logout function
export const logout = () => {
  localStorage.removeItem("token");
};

// Example: get user profile
export const getProfile = async () => {
  return await apiFetch("/auth/me");
};
