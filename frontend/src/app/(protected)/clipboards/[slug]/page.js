"use client"
import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { Copy, Trash, Paperclip, Delete } from "lucide-react";

import TooltipWrapper from "@/components/primitives/TooltipWrapper";
import InteractiveIcon from "@/components/primitives/InteractiveIcon";
import DeleteMessageConfirmationModal from "@/components/modals/DeleteMessage";

import { getClipboardData, sendToClipboard } from "@/api/clipboard";

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

    const handleSendToClipboard = async (text) => {
        if (text){
            console.log("Sending `", text,"` to clipboard")
            // Add API call here
            try{
                const message = {
                    content_type: "text",
                    content: text,
                    created_at: new Date()
                }
                
                const data = await sendToClipboard(message, slug)
                setTextToSend("");
                setRefreshMessages(true);
            }catch(err) {
                console.error("Failed to send message to clipboard", err);
            }
        }
    }

    const handleCopy = (text) => {
        navigator.clipboard.writeText(text).then(() => {
            console.log("Copied:", text);
        });
    };

    const handleOpenMessageDeleteModal = (message) => {
        setMessageToDelete(message);
        setMessageDeleteModalOpen(true);
    }

    const handleDeleteMessage = () => {
        if (messageToDelete) {
            // API call to delete the message
            console.log("Message deleted", messageToDelete);
            setMessageToDelete(null);
        }
        setMessageDeleteModalOpen(false);
    };


  return (
  <div 
    tabIndex={0}
    className="h-full flex flex-col p-8 text-gray-800"
    onPaste={(e) => {
    e.preventDefault();

    const pastedText = e.clipboardData.getData("text");

    if (!pastedText.trim()) return;

    handleSendToClipboard(pastedText);
  }}
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
                    handleSendToClipboard(textToSend);
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
                onClick={() => handleSendToClipboard(textToSend)}
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
                <p>{message.content}</p>

                <div className="flex items-center justify-between px-2">
                <span>{message.created_at.toString()}</span>

                <div className="flex gap-2">
                    <TooltipWrapper label="Copy">
                    <InteractiveIcon icon={Copy} onClick={() => handleCopy(message.data)} />
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

    <DeleteMessageConfirmationModal
      isOpen={messageDeleteModalOpen}
      onClose={() => setMessageDeleteModalOpen(false)}
      onConfirm={handleDeleteMessage}
    />

  </div>
);

}
