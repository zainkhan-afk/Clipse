// clipboard.js
import { apiFetch } from "./api";

// Fetch all clipboards
export const getClipboards = async () => {
  return await apiFetch("/clipboards", {credentials:"include"});
};

// Create new clipboard
export const createClipboard = async (name) => {
  return await apiFetch("/clipboards/create", {
    method: "POST",
    body: name ,
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
  return await apiFetch(`/clipboards/${clipboard_id}`, {credentials:"include"});
};



// Send message to clipboard
export const sendToClipboard = async (messageData, clipboardId) => {
  return apiFetch(`/clipboards/${clipboardId}`, {
    method: "POST",
    body: messageData
  });
};



// Delete Message
export const deleteMessage = async (clipboardId, messageId) => {
  return apiFetch(`/clipboards/${clipboardId}/messages/${messageId}`, {
    method: "Delete"
  });
};