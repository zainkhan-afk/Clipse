"use client"

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {Computer, ClipboardListIcon, Clipboard, Home, User, Plus, Minus, Settings, LogOut, ChevronDown, ChevronRight} from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import CreateNewClipboardModal from "./modals/CreateNewClipboard";
import TooltipWrapper from "./primitives/TooltipWrapper";
import { logout } from "@/api/auth";
import { useUser } from "@/context/UserContext";
import { useClipboards, create } from "@/context/ClipboardContext";
import { createClipboard } from "@/api/clipboard";

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
        }
        // ,
        // { 
        //     name: "Devices", 
        //     href: "/devices", 
        //     icon: Computer, 
        //     isOpen: false,
        //     children: [
        //         {id: 1, name: "PC"},
        //         {id: 2, name: "Phone"}
        //     ]
        // },
    ];


export default function Sidebar() {
    const router = useRouter();
    const { UserData, loading: userLoading } = useUser();
    const { ClipboardsData, loading: clipboardsLoading, refresh: refreshClipboards } = useClipboards();
    
    const [userInfo, setUserInfo] = useState({});
    const [navigationItems, setNavigationItems] = useState(navItems);
    const [createNewClipboardModalOpen, setCreateNewClipboardModalOpen] = useState(false);
    const [clipboardCreationFailure, setClipboardCreationFailure] = useState(false);
    const [userSettingsOpen, setUserSettingsOpen] = useState(false);
    
    const [clipboards, setClipboards] = useState([
                                                    { name: "Common"},
                                                    { name: "Devices"},
                                                ]);
    
    
    useEffect(() => {
        if (!clipboardsLoading) {
            setNavigationItems(prev => prev.map(item => 
            item.name === "Clipboards"
                ? { ...item, children: ClipboardsData.map(c => ({ id: c.id, name: c.name })) }
                : item
            ));
        }
        }, [ClipboardsData, clipboardsLoading]
    );


    useEffect(() => {
        if (!userLoading) {
            setUserInfo(UserData);
        }
        }, [UserData, userLoading]
    );



    const toggle = (name) => {
        setNavigationItems(prev =>
            prev.map(item =>
            item.name === name
                ? { ...item, isOpen: !item.isOpen }
                : item
            )
        );
    };

    const handleCreateNewClipboard = async (clipboardData) => {
        console.log("Creating new clipboard named", clipboardData);

        // API call here to create the new clipboard
        try{
            const res = await createClipboard(clipboardData);
            await refreshClipboards();
            setCreateNewClipboardModalOpen(false);
            setClipboardCreationFailure(false);
        }
        catch(error){
            setClipboardCreationFailure(true);
        }
    }

    const handleLogout = async () => {
        try{
            console.log("Logging out now");
            await logout();
            router.push("/login");
        }
        catch(err){
            console.error("Could not logout", err);
        }
    }

    return (
        <div
            className="bg-gray-900 h-full text-white pt-1 pb-[40px] w-64 flex flex-col justify-between" /* Keep min width enough for icons */
        >
            <div className="felx flex-col h-full">
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
                                <div className="flex items-center gap-1 px-4 py-0 hover:bg-gray-800 transition-colors">
                                    {/* Fixed-size icon so it never shrinks */}
                                    {isOpen ? (
                                        <ChevronDown className="w-5 h-5 flex-shrink-0 cursor-pointer" onClick={() => toggle(name)}/>
                                    ) : (
                                        <ChevronRight className="w-5 h-5 flex-shrink-0 cursor-pointer" onClick={() => toggle(name)} />
                                    )}
                                    
                                    <Icon className="w-5 h-5 ml-3 flex-shrink-0" />

                                    {/* Smooth text appearance */}
                                    <span
                                        className="flex-grow overflow-hidden whitespace-nowrap"
                                        >
                                        {name}
                                    </span>
                                    <TooltipWrapper 
                                        label = "Add new Clipboard"
                                    >
                                        <Plus className="w-5 h-5 flex-shrink-0 cursor-pointer" onClick={() => setCreateNewClipboardModalOpen(true)}/>
                                    </TooltipWrapper>
                                    
                                </div>
                                <div className="flex flex-col">
                                    {/* Extra content only shown when open */}
                                    {isOpen && children && (
                                    <div className="ml-10 mb-2 flex flex-col text-sm text-gray-300">
                                        {children.map((child) => (
                                            <Link
                                                key={child.name}
                                                href={`${href}/${child.id}`}
                                                className="block w-full px-2 py-1 hover:bg-gray-700 rounded transition-colors text-sm"
                                            >
                                                {child.name}
                                            </Link>
                                        ))}

                                        <span 
                                            className="block cursor-pointer w-full px-2 hover:bg-gray-700 rounded transition-colors text-sm text-gray-600"
                                            onClick={() => setCreateNewClipboardModalOpen(true)}
                                        >
                                            Create New Clipboard
                                        </span>
                                    </div>
                                    )}
                                </div>
                            </div>

                            
                        );
                    })}

                </nav>
            </div>
            
            <div className="relative flex flex-col">
    {/* Profile button */}
    <div
        className="flex px-4 py-3 hover:bg-gray-800 cursor-pointer items-center gap-3"
        onClick={() => setUserSettingsOpen(!userSettingsOpen)}
    >
        <User className="w-8 h-8 rounded-full bg-gray-700 p-1 flex-shrink-0" />
        <span className="overflow-hidden whitespace-nowrap">
            {userInfo?.first_name}
        </span>
    </div>

    {/* Dropdown menu */}
    {userSettingsOpen && (
        <div className="absolute left-0 bottom-full mb-2 w-48 bg-gray-600 text-white rounded-lg shadow-lg p-4 text-sm">
            <span className="font-extrabold">User Settings</span>
            <hr className="my-2 border-gray-400" />
            <div className="mt-2">
                <div className="flex gap-2 items-center px-2 py-1 hover:bg-gray-700 rounded">
                    <Settings className="w-4 h-4"/>
                    <span>Settings</span>
                </div>
                <hr className="my-1 border-gray-400" />
                <div
                    className="flex gap-2 items-center px-2 py-1 hover:bg-gray-700 rounded"
                    onClick={handleLogout}
                >
                    <LogOut className="w-4 h-4"/>
                    <span>Logout</span>
                </div>
            </div>
        </div>
    )}
</div>



        <CreateNewClipboardModal 
            isOpen={createNewClipboardModalOpen}
            onClose={() => setCreateNewClipboardModalOpen(false)}
            onConfirm={handleCreateNewClipboard}
            clipboardCreationFailure={clipboardCreationFailure}
        />

        </div>
    );
}