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
            <div className = "p-10">
                <h3 className="">Properties</h3>
                <div className = "ml-10">
                    <p>Name</p>
                    <input className="w-full"></input>
                </div>
            </div>
        </div>
    );
}