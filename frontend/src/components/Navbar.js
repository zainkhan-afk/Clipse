"use client"

import { useState } from "react";
import { Menu, X } from "lucide-react";
import Link from "next/link";
import Image from "next/image";

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <nav className="fixed top-0 left-0 w-full bg-gray-700 bg-opacity-80 text-white shadow-md z-50">
      <div className="max-w-7xl mx-auto px-4 py-3 flex justify-between items-center">
        
        {/* Logo / Name */}
        <h1 className="text-2xl font-bold">
          <Link href="/"><strong>Home</strong></Link>
        </h1>
        {/* <Link href="/" className="flex items-center">
          <Image
            src="/portfolio-favicon.png" // path from public/
            alt="Home"
            width={32} // adjust size
            height={32}
            className="rounded"
          />
        </Link> */}

        {/* Desktop Menu */}
        <ul className="hidden md:flex space-x-6">
          <li><Link href="/about" className="hover:text-pink-400">About</Link></li>
          <li><Link href="/projects" className="hover:text-pink-400">Projects</Link></li>
          <li><Link href="/contact" className="hover:text-pink-400">Contact</Link></li>
        </ul>

        {/* Mobile Menu Button */}
        <button
          className="md:hidden focus:outline-none"
          onClick={() => setIsOpen(!isOpen)}
        >
          {isOpen ? <X size={28} /> : <Menu size={28} />}
        </button>
      </div>

      {/* Mobile Dropdown */}
      {isOpen && (
        <div className="md:hidden bg-gray-900 bg-opacity-95 px-4 pb-4">
          <ul className="flex flex-col space-y-4">
            <li><Link href="/about" className="hover:text-pink-400" onClick={() => setIsOpen(false)}>About</Link></li>
            <li><Link href="/projects" className="hover:text-pink-400" onClick={() => setIsOpen(false)}>Projects</Link></li>
            <li><Link href="/contact" className="hover:text-pink-400" onClick={() => setIsOpen(false)}>Contact</Link></li>
          </ul>
        </div>
      )}
    </nav>
  );
}
