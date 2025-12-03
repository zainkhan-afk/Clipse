"use client";

import { useState } from "react";

export default function DeleteMessageConfirmationModal({ isOpen, onClose, onConfirm }) {
  if (!isOpen) return null; // If the modal is not open, don't render anything

  return (
    // Modal background overlay
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      {/* Modal box */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 w-96">
        {/* Title */}
        <h2 className="text-lg font-semibold text-gray-800 dark:text-white">
          Are you sure?
        </h2>

        {/* Message */}
        <p className="mt-2 text-gray-600 dark:text-gray-300">
          Do you really want to delete this message? This action cannot be undone.
        </p>

        {/* Buttons */}
        <div className="mt-4 flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded hover:bg-gray-300 dark:hover:bg-gray-600 transition"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}
