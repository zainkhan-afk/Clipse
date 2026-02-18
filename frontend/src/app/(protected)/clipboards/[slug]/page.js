"use client"
import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { Copy, Trash, Paperclip, Delete } from "lucide-react";

import TooltipWrapper from "@/components/primitives/TooltipWrapper";
import InteractiveIcon from "@/components/primitives/InteractiveIcon";
import PropertiesBar from "@/components/propertiesbar";
import DeleteMessageConfirmationModal from "@/components/modals/DeleteMessage";

import { getClipboardData, sendToClipboard, deleteMessage } from "@/api/clipboard";

export default function ClipboardPage() {
    const params = useParams();
    const { slug } = params;
    const [textToSend, setTextToSend] = useState("");
    const [messageToDelete, setMessageToDelete] = useState(null);
    const [refreshMessages, setRefreshMessages] = useState(false);
    const [messageDeleteModalOpen, setMessageDeleteModalOpen] = useState(false);
    const [clipboardData, setClipboardData] = useState({

        // id: slug,
        // name: "Clipboard Name",
        // persistence: 0,
        // messages: [
        //     {id: 1, type: "text", date: new Date(2024, 0, 15), data: "this is a text"},
        //     {id: 2, type: "text", date: new Date(2024, 0, 16), data: "this is another text"},
        // ],
    });

    const formatter = new Intl.DateTimeFormat("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
    });



    useEffect(() => {
        // setClipboardData(data);
        async function fetchData() {
            if (slug){
                const data = await getClipboardData(slug);
                setClipboardData(data);
                setRefreshMessages(false);
            }
        }
        fetchData();
    }, [slug, refreshMessages]
    );

    const handleSendTextToClipboard = async (text) => {
        if (!text) return;

        try {
            const formData = new FormData();
            formData.append("content_type", "text");
            formData.append("content", text);

            await sendToClipboard(formData, slug);

            setTextToSend("");
            setRefreshMessages(true);
        } catch (err) {
            console.error("Failed to send message to clipboard", err);
        }
    };



    const handleSendImageToClipboard = async (file) => {
        try {
            const formData = new FormData();
            formData.append("content_type", "image");
            formData.append("image", file);

            await sendToClipboard(formData, slug);
            setRefreshMessages(true);
        } catch (err) {
            console.error("Failed to send image", err);
        }
    };

    const handlePaste = (e) => {
        e.preventDefault();

        const items = e.clipboardData.items;

        for (const item of items) {
            // IMAGE
            if (item.kind === "file" && item.type.startsWith("image/")) {
            const file = item.getAsFile();
            console.log("Sending File");
            handleSendImageToClipboard(file);
            return;
            }

            // TEXT
            if (item.kind === "string" && item.type === "text/plain") {
            item.getAsString((text) => {
                if (text.trim()) {
                    handleSendTextToClipboard(text);
                }
            });
            return;
            }
        }
    }

    const handleCopyText = (text) => {
        navigator.clipboard.writeText(text).then(() => {
            console.log("Copied:", text);
        });
    };

    const handleCopyImage = async (imageUrl) => {
        try {
            // Fetch image
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/${imageUrl}`, { credentials: "include" });
            const blob = await response.blob();

            // Create clipboard item
            const clipboardItem = new ClipboardItem({
            [blob.type]: blob,
            });

            // Write to clipboard
            await navigator.clipboard.write([clipboardItem]);

            console.log("Image copied to clipboard");
        } catch (err) {
            console.error("Failed to copy image:", err);
        }
    };

    const handleOpenMessageDeleteModal = (message) => {
        setMessageToDelete(message);
        setMessageDeleteModalOpen(true);
    }

    const handleDeleteMessage = async () => {
        if (!messageToDelete || !slug) return;

        try {
            await deleteMessage(slug, messageToDelete.id);

            setClipboardData((prev) => ({
            ...prev,
            clipboard_data: prev.clipboard_data.filter(
                (message) => message.id !== messageToDelete.id
            ),
            }));

            setMessageToDelete(null);
            setMessageDeleteModalOpen(false);
        } catch (err) {
            console.error("Failed to delete message", err);
            // Optional: show toast / error message
        }
    };


  return (
  <div 
    tabIndex={0}
    className="h-full flex flex-col p-8 text-gray-800"
    onPaste={(e) => handlePaste(e)}
  >
    <div className="flex flex-col">
        <h1>Clipboard</h1>
        <h2>{clipboardData?.clipboard?.name}</h2>
    </div>

    {/* Outer box */}
    <div className="flex flex-col flex-1 min-h-0 bg-gray-800 w-full bg-opacity-10 rounded-lg p-8 shadow-lg gap-2">

        {/* Input section */}
        <div className="flex flex-col bg-gray-300 bg-opacity-10 rounded-lg shadow-lg p-4">
            <textarea 
                className="h-30 border border-black rounded-lg p-2"
                value={textToSend}
                onChange={(e) => setTextToSend(e.target.value)}
                onKeyDown={(e) => {
                    if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
                        e.preventDefault(); // prevent newline
                        handleSendTextToClipboard(textToSend);
                    }
                }}
                onPaste={(e) => {
                    e.stopPropagation();
                }}
            />

            <div className="flex justify-end items-center mt-2 gap-2">
            <TooltipWrapper label="Attach">
                <InteractiveIcon icon={Paperclip} onClick={() => console.log("Attach Clicked")}/>
            </TooltipWrapper>

            <TooltipWrapper label="Send to Clipboard">
                <button 
                className="rounded-lg bg-blue-300 px-4 py-1"
                onClick={() => handleSendTextToClipboard(textToSend)}
                >
                Send
                </button>
            </TooltipWrapper>
            </div>
        </div>

        {/* SCROLL AREA */}
        <div className="flex-1 overflow-y-auto min-h-0 p-3 bg-gray-700 bg-opacity-10 rounded-lg shadow-lg">
            {clipboardData?.clipboard_data?.map((message) => (
            <div
                key={message.id}
                className="flex flex-col bg-gray-400 rounded-lg mt-2 p-2"
            >
                {message.content_type == "text" && (
                    <p className="whitespace-pre-wrap">
                        {message.content}
                    </p>  
                )}

                {message.content_type == "image" && (
                    <img
                        src={`${process.env.NEXT_PUBLIC_API_URL}/${message.content}`}
                        alt="Clipboard image"
                        className="max-w-full rounded-lg"
                    />
                )}

                <div className="flex items-center justify-between px-2">
                    <span className="text-sm text-gray-700">{formatter.format(new Date(message.created_at))}</span>

                    <div className="flex gap-2">
                        <TooltipWrapper label="Copy">
                        <InteractiveIcon icon={Copy} onClick={() => {message.content_type == "text" ? handleCopyText(message.content) : handleCopyImage(message.content)}} />
                        </TooltipWrapper>

                        <TooltipWrapper label="Delete">
                        <InteractiveIcon icon={Trash} onClick={() => handleOpenMessageDeleteModal(message)} />
                        </TooltipWrapper>
                    </div>
                </div>
            </div>
            ))}

        </div>
    </div>

    <div className="flex flex-col">
        <PropertiesBar/>
    </div>

    <DeleteMessageConfirmationModal
      isOpen={messageDeleteModalOpen}
      onClose={() => setMessageDeleteModalOpen(false)}
      onConfirm={handleDeleteMessage}
    />

  </div>
);

}
