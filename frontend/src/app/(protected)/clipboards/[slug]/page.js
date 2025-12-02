"use client"
import { useState } from "react";
import { useParams } from "next/navigation";
import { Copy, Trash } from "lucide-react";


export default function ClipboardPage() {
    const params = useParams(); // hook works only in client components
    const { slug } = params;
    const [clipboardData, setClipboardData] = useState({
        id: slug,
        name: "Clipboard Name",
        messages: [
            {id: 1, type: "text", date: Date(),data: "this is a text"},
            {id: 2, type: "text", date: Date(),data: "this is another text"},
        ],
    });


  return (
        <div className="min-h-screen flex flex-col p-8">
            <h1>Clipboard</h1>
            <h2>{clipboardData.name}</h2>

            <div className="flex-1 flex-col bg-gray-800 bg-opacity-10 rounded-lg p-8 shadow-lg overflow-y-auto">
                <div className="flex flex-col bg-gray-300 bg-opacity-10 rounded-lg shadow-lg p-1">
                    <input></input>
                    <button>Send</button>
                </div>
                {clipboardData.messages.map((message) => (
                    <div
                        key = {message.id}
                        className="flex flex-col bg-gray-400 rounded-lg p-2 mt-2"
                    >
                        <p>
                            {message.data}
                        </p>
                        
                        <div className="flex items-center justify-between px-2">
                            <span> {message.date} </span>

                            <div className="flex gap-2">
                                <Copy className="w-4.5 h-4.5" />
                                <Trash className="w-4.5 h-4.5" />
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>

    );
}
