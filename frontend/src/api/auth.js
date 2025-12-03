// auth.js
import { apiFetch } from "./api";

// Login function
export const login = async (email, password) => {
  const data = await apiFetch("/auth/login", {
    method: "POST",
    body: { email, password },
  });

  // Save token to localStorage
  localStorage.setItem("token", data.accessToken);

  return data;
};


// Register
export const register = async (userData) => {
  const data = await apiFetch("/auth/register", {
    method: "POST",
    body: userData,
  });

  // Optional: automatically log in after registration
  if (data.accessToken) {
    localStorage.setItem("token", data.accessToken);
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
