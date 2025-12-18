// api.js
import Cookies from "js-cookie";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL; // your backend URL

// Helper to get token from localStorage
const getToken = () => Cookies.get("token", {path: "/"});

// Generic fetch function
export const apiFetch = async (
  endpoint,
  { method = "GET", body, headers = {} } = {}
) => {
  const token = getToken();

  const isFormData = body instanceof FormData;

  const res = await fetch(`${API_BASE_URL}${endpoint}`, {
    method,
    headers: {
      ...(isFormData ? {} : { "Content-Type": "application/json" }),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...headers,
    },
    body: isFormData ? body : body ? JSON.stringify(body) : undefined,
  });

  const data = await res.json().catch(() => null);

  if (!res.ok) {
    throw new Error(data?.detail || data?.message || `HTTP error ${res.status}`);
  }

  return data;
};
