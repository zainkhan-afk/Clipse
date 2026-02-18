"use client"

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";

import TooltipWrapper from "./primitives/TooltipWrapper";


export default function PropertiesBar() {
    return (
        <div
            className="bg-gray-900 h-full text-white pt-1 pb-[40px] w-64 flex flex-col justify-between"
        >
        </div>
    );
}