// api.js
import Cookies from "js-cookie";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL; // your backend URL

// Helper to get token from localStorage
const getToken = () => localStorage.getItem("token");

// Generic fetch function
export const apiFetch = async (endpoint, { method = "GET", body, headers = {} } = {}) => {
  const token = getToken();

  const res = await fetch(`${API_BASE_URL}${endpoint}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...headers,
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  const data = await res.json().catch(() => null); // parse JSON if possible

  if (!res.ok) {
    // Optional: handle global errors here
    throw new Error(data?.message || `HTTP error ${res.status}`);
  }

  return data;
};
