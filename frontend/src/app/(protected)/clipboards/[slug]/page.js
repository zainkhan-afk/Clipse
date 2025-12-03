"use client"
import { useState } from "react";
import { useParams } from "next/navigation";
import { Copy, Trash, Paperclip } from "lucide-react";

import TooltipWrapper from "@/components/primitives/tooltipwrapper";
import InteractiveIcon from "@/components/primitives/interactiveicon";

export default function ClipboardPage() {
    const params = useParams();
    const { slug } = params;
    const [clipboardData, setClipboardData] = useState({
        id: slug,
        name: "Clipboard Name",
        messages: [
            {id: 1, type: "text", date: Date(), data: "this is a text"},
            {id: 2, type: "text", date: Date(), data: "this is another text"},
        ],
    });

    const handleCopy = (text) => {
        navigator.clipboard.writeText(text).then(() => {
            console.log("Copied:", text);
        });
    };


  return (
        <div className="min-h-screen flex flex-col p-8 text-gray-800">
            <h1>Clipboard</h1>
            <h2>{clipboardData.name}</h2>

            <div className="flex-1 flex-col bg-gray-800 bg-opacity-10 rounded-lg p-8 shadow-lg overflow-y-auto">
                <div className="flex flex-col bg-gray-300 bg-opacity-10 rounded-lg shadow-lg p-4">
                    <textarea className="h-30 border border-black rounded-lg"></textarea>
                    <div className="flex justify-end items-center mt-2 gap-2">
                        <TooltipWrapper label="Attach">
                            <InteractiveIcon icon={Paperclip} onClick={() => console.log("Attach Clicked")}/>
                        </TooltipWrapper>
                        <button className="rounded-lg bg-blue-300 px-4 py-1">Send</button>
                    </div>
                </div>
                {clipboardData.messages.map((message) => (
                    <div
                        key = {message.id}
                        className="flex flex-col bg-gray-400 rounded-lg p-2 mt-2"
                    >
                        <p>
                            {message.data.toString()}
                        </p>
                        
                        <div className="flex items-center justify-between px-2">
                            <span> {message.date.toString()} </span>

                            <div className="flex gap-2">
                                <TooltipWrapper label="Copy">
                                    <InteractiveIcon icon={Copy} onClick={() => handleCopy(message.data)}/>
                                </TooltipWrapper>

                                <TooltipWrapper label="Delete">
                                    <InteractiveIcon icon={Trash} onClick={() => console.log("Delete Clicked")}/>
                                </TooltipWrapper>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>

    );
}
