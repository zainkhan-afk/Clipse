"use client";

import { useState, useEffect } from "react";

export default function CreateNewClipboardModal({ isOpen, onClose, onConfirm, clipboardCreationFailure }) {
    const [clipboardData, setClipboardData] = useState({
        name: "",
    })

    useEffect(() => {
        if (!isOpen) {
            setClipboardData({name : ""});
        }
    }, [isOpen]);
    
    if (!isOpen) return null; // If the modal is not open, don't render anything

    return (
        // Modal background overlay
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 w-96">
                <h2 className="text-lg font-semibold text-gray-800 dark:text-white">
                    Create New Clipboard
                </h2>

                <p className="mt-2 text-gray-600 dark:text-gray-300">
                    Do you really want to delete this message? This action cannot be undone.
                </p>
                
                <p className="py-2 font-semibold text-gray-300 dark:text-white">Clipboard Name</p>
                <input 
                    type="text"
                    placeholder="Clipboard Name"
                    className="w-full border border-black rounded-lg p-2"
                    value={clipboardData.name}
                    onChange={(e) => setClipboardData({ ...clipboardData, name: e.target.value })}
                />

                {clipboardCreationFailure && (<p className="py-2 font-semibold text-red-800 dark:text-red">Clipboard with that name already exists.</p>)}

                {/* Buttons */}
                <div className="mt-4 flex justify-end gap-2">
                <button
                    onClick={onClose}
                    className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded hover:bg-gray-300 dark:hover:bg-gray-600 transition"
                >
                    Cancel
                </button>
                <button
                    onClick={() => onConfirm(clipboardData)}
                    className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition"
                >
                    Create
                </button>
                </div>

            </div>
        </div>
    )
}