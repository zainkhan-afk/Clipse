// api.js
import Cookies from "js-cookie";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL; // your backend URL

// Helper to get token from localStorage
const getToken = () => Cookies.get("token", {path: "/"});



const refreshAccessToken = async () => {
  const res = await fetch(`${API_BASE_URL}/auth/refresh`, {
    method: "POST",
    credentials: "include",
  });

  if (!res.ok) return false;

  const data = await res.json();
  setToken(data.access_token);
  return true;
};


// // Generic fetch function
// export const apiFetch = async (
//   endpoint,
//   { method = "GET", body, headers = {} , ...fetchOptions} = {}
// ) => {
//   const token = getToken();
//   console.log("token", token);

//   const isFormData = body instanceof FormData;

//   const res = await fetch(`${API_BASE_URL}${endpoint}`, {
//     method,
//     credentials: "include",
//     headers: {
//       ...(isFormData ? {} : { "Content-Type": "application/json" }),
//       // ...(token ? { Authorization: `Bearer ${token}` } : {}),
//       ...headers,
//     },
//     body: isFormData ? body : body ? JSON.stringify(body) : undefined,
//     ...fetchOptions
//   });

  
//   const data = await res.json().catch(() => null);
//   console.log("\nfetchOptions", fetchOptions);
//   console.log("data", data);

//   if (!res.ok) {
//     throw new Error(data?.detail || data?.message || `HTTP error ${res.status}`);
//   }

//   return data;
// };



export const apiFetch = async (
  endpoint,
  { method = "GET", body, headers = {} , ...fetchOptions} = {}
) => {

  const isFormData = body instanceof FormData;

  const doFetch = () =>
    fetch(`${API_BASE_URL}${endpoint}`, {
      method,
      credentials: "include",  // always include
      headers: {
        ...(isFormData ? {} : { "Content-Type": "application/json" }),
        ...headers,
      },
      body: isFormData ? body : body ? JSON.stringify(body) : undefined,
      ...fetchOptions
    });

  let res = await doFetch();


  if (res.status === 401) {
    // Try refresh
    const refreshRes = await fetch(`${API_BASE_URL}/auth/refresh`, {
      method: "POST",
      credentials: "include",
    });

    if (!refreshRes.ok) {
      window.location.href = "/login";
      throw new Error("Session expired");
    }

    // Retry original request
    res = await doFetch();
  }

  const data = await res.json().catch(() => null);

  if (!res.ok) {
    const error = new Error(data?.detail || "Request failed");
    error.status = res.status;
    throw error;
  }

  return data;
};
