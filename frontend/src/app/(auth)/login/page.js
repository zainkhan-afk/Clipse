"use client"
import { useState } from "react";
import { useRouter } from "next/navigation";
import { login } from "@/api/auth";

export default function Login() {
    const [loginData, setLoginData] = useState({
            email: "",
            password: ""
        });
    const router = useRouter();

    async function handleLogin() {
        try{
            const data = await login(loginData)
        } catch (err) {
            console.error("Registration failed:", err.message);
        }
    }
    return (
        <div className="w-full max-w-md mx-auto bg-gray-500 bg-opacity-80 rounded-lg p-8 shadow-lg">
            <h2 className="mb-6">
                Login
            </h2>

            <input
                type="email"
                placeholder="Email"
                className="w-full mb-4 p-3 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400"
                value={loginData.email}
                onChange={(e) => setLoginData({ ...loginData, email: e.target.value })}
            />
            <input
                type="password"
                placeholder="Password"
                className="w-full mb-6 p-3 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400"
                value={loginData.password}
                onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
            />
            
            <button 
                className="w-full bg-blue-600 text-white p-3 rounded-md hover:bg-blue-700 transition"
                onClick={handleLogin}
            >
                Login
            </button>

            <p className="pt-5">Don't have an account?</p>

            <button 
                className="w-full bg-blue-600 text-white p-3 rounded-md hover:bg-blue-700 transition"
                onClick={() => router.push("/register")}
            >
                Register
            </button>
        </div>

    );
}
