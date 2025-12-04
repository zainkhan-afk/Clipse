"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { register } from "@/api/auth";

export default function Register() {
    const [registrationData, setRegistrationData] = useState({
        first_name: "",
        last_name: "",
        email: "",
        password: ""
    });
    const router = useRouter();
    
    async function handleRegistration() {
        try {
            const data  = await register(registrationData);
            console.log("Registered successfully:", data);
            if (data.access_token) {
                router.push("/dashboard");
            }
        }
        catch (err) {
            console.error("Registration failed:", err.message);
        }
    }
    
    return (
        <div className="w-full max-w-md mx-auto bg-gray-500 bg-opacity-80 rounded-lg p-8 shadow-lg">
            <h2 className="mb-6">
                Register
            </h2>

            <input
                type="email"
                placeholder="Email"
                className="w-full mb-4 p-3 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400"
                value={registrationData.email}
                onChange={(e) => setRegistrationData({ ...registrationData, email: e.target.value })}
            />

            <input
                type="text"
                placeholder="First Name"
                className="w-full mb-4 p-3 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400"
                value={registrationData.first_name}
                onChange={(e) => setRegistrationData({ ...registrationData, first_name: e.target.value })}
            />

            <input
                type="text"
                placeholder="Last Name"
                className="w-full mb-4 p-3 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400"
                value={registrationData.last_name}
                onChange={(e) => setRegistrationData({ ...registrationData, last_name: e.target.value })}
            />

            <input
                type="password"
                placeholder="Password"
                className="w-full mb-6 p-3 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400"
                value={registrationData.password}
                onChange={(e) => setRegistrationData({ ...registrationData, password: e.target.value })}
            />
            
            <button 
                className="w-full bg-blue-600 text-white p-3 rounded-md hover:bg-blue-700 transition"
                onClick={handleRegistration}
            >
                Register
            </button>

            <p className="pt-5">Already have an account?</p>

            <button 
                className="w-full bg-blue-600 text-white p-3 rounded-md hover:bg-blue-700 transition"
                onClick={() => router.push("/login")}
            >
                Login
            </button>
        </div>

  );
}
