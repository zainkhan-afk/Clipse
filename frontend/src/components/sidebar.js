"use client"

import { useState } from "react";
import {Computer, ClipboardListIcon, Clipboard, Home, User, Plus, Minus} from "lucide-react";
import Link from "next/link";
import Image from "next/image";

const navItems = [
        { 
            name: "Clipboards", 
            href: "/clipboards", 
            icon: ClipboardListIcon, 
            isOpen: false, 
            children: [
                {id: 1, name: "Common"},
                {id: 2, name: "Clipboard1"}
            ]
        },
        { 
            name: "Devices", 
            href: "/devices", 
            icon: Computer, 
            isOpen: false,
            children: [
                {id: 1, name: "PC"},
                {id: 2, name: "Phone"}
            ]
        },
    ];


const clipboards = [
        { name: "Common"},
        { name: "Devices"},
    ];


export default function Sidebar() {
    const [navigationItems, setNavigationItems] = useState(navItems);
    const [clipboards, setClipboards] = useState([
                                                    { name: "Common"},
                                                    { name: "Devices"},
                                                ]);

    const toggle = (name) => {
        setNavigationItems(prev =>
            prev.map(item =>
            item.name === name
                ? { ...item, isOpen: !item.isOpen }
                : item
            )
        );
    };
    return (
        <div
            className="bg-gray-900 text-white h-full pt-1 pb-[40px] fixed left-0 top-0 z-40 w-64 flex flex-col justify-between" /* Keep min width enough for icons */
        >
            <div>
                {/* Navigation */}
                <nav className="mt-4">
                    <Link
                        key="dashkboard"
                        href="/dashboard"
                        className="flex items-center gap-3 mb-4 px-4 py-2 hover:bg-gray-800 transition-colors"
                    >
                        {/* Fixed-size icon so it never shrinks */}
                        <Home className="w-5 h-5 flex-shrink-0" />

                        {/* Smooth text appearance */}
                        <span
                            className="flex-grow overflow-hidden whitespace-nowrap"
                        >
                            Dashboard
                        </span>
                    </Link>

                    {navigationItems.map(({ name, href, icon: Icon, isOpen, children}) => {
                        
                        return (
                            <div
                                key={name}
                                // href={href}
                                // className=""
                            >
                                <div className="flex items-center gap-3 px-4 py-2 hover:bg-gray-800 transition-colors">
                                    {/* Fixed-size icon so it never shrinks */}
                                    <Icon className="w-5 h-5 flex-shrink-0" />

                                    {/* Smooth text appearance */}
                                    <span
                                        className="flex-grow overflow-hidden whitespace-nowrap"
                                        >
                                        {name}
                                    </span>

                                    {isOpen ? (
                                        <Minus className="w-5 h-5 flex-shrink-0 cursor-pointer" onClick={() => toggle(name)}/>
                                    ) : (
                                        <Plus className="w-5 h-5 flex-shrink-0 cursor-pointer" onClick={() => toggle(name)} />
                                    )}
                                </div>
                                <div className="flex">
                                    {/* Extra content only shown when open */}
                                    {isOpen && children && (
                                    <div className="ml-12 mt-2 flex flex-col text-sm text-gray-300">
                                        {children.map((child) => (
                                            <Link
                                                key={child.name}
                                                href={`${href}/${child.id}`}
                                                className="px-4 py-2 hover:bg-gray-700 rounded transition-colors text-sm"
                                            >
                                                {child.name}
                                            </Link>
                                        ))}
                                    </div>
                                    )}
                                </div>
                            </div>

                            
                        );
                    })}

                </nav>
            </div>

            
            {/* Bottom section - Avatar */}
            <div className="px-4 py-3 hover:bg-gray-800 cursor-pointer flex items-center gap-3">
                <User className="w-8 h-8 rounded-full bg-gray-700 p-1 flex-shrink-0" />
                <span
                    className="overflow-hidden whitespace-nowrap"
                >
                Profile
                </span>
            </div>


        </div>
    );
}