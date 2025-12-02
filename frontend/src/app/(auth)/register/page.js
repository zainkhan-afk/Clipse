"use client";
import { useRouter } from "next/navigation";

export default function Login() {
    const router = useRouter();
    
    function handleRegistration() {
        console.log("Register button clicked");
    }
    
    return (
    <div className="w-full max-w-md mx-auto bg-gray-500 bg-opacity-80 rounded-lg p-8 shadow-lg">
        <h2 className="text-white text-2xl font-semibold mb-6">
            Register
        </h2>

        <input
            type="email"
            placeholder="Email"
            className="w-full mb-4 p-3 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400"
        />

        <input
            type="text"
            placeholder="First Name"
            className="w-full mb-4 p-3 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400"
        />

        <input
            type="text"
            placeholder="Last Name"
            className="w-full mb-4 p-3 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400"
        />

        <input
            type="password"
            placeholder="Password"
            className="w-full mb-6 p-3 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400"
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
