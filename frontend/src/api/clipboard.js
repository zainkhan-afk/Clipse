// clipboard.js
import { apiFetch } from "./api";

// Fetch all clipboards
export const getClipboards = async () => {
  return await apiFetch("/clipboards");
};

// Create new clipboard
export const createClipboard = async (name) => {
  return await apiFetch("/clipboards", {
    method: "POST",
    body: { name },
  });
};

// Delete clipboard
export const deleteClipboard = async (id) => {
  return await apiFetch(`/clipboards/${id}`, {
    method: "DELETE",
  });
};



// Fetch all clipboard data
export const getClipboardData = async (clipboard_id) => {
  return await apiFetch(`/clipboards/${clipboard_id}`);
};



// Send message to clipboard
export const sendToClipboard = async (message_data, clipboard_id) => {
  return await apiFetch(`/clipboards/${clipboard_id}`, {method: "POST", body: message_data})
}