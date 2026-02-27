"use client"

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";

import TooltipWrapper from "./primitives/TooltipWrapper";


export default function PropertiesBar() {
    return (
        <div
            className="bg-gray-900 h-full w-full text-white pt-1 pb-[40px] flex rounded-lg flex-col justify-between"
        >
            <div className = "flex flex-col p-10 gap-2">
                <h3 className="">Properties</h3>
                <div className = "ml-5 flex flex-row gap-2">
                    <p className="mt-2">Name</p>
                    <input className="w-full border border-black rounded-lg p-2" type="text" placeholder="Clipboard Name"></input>
                </div>
                <div className = "ml-5 flex flex-row gap-2">
                    <p className="mt-2">Name</p>
                    <input className="w-full border border-black rounded-lg p-2" type="text" placeholder="Clipboard Name"></input>
                </div>
            </div>
        </div>
    );
}