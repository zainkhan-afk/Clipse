import Image from "next/image";

export default function Login() {
  return (
    <div className="w-full max-w-md mx-auto bg-gray-500 bg-opacity-80 rounded-lg p-8 shadow-lg">
        <h2 className="text-white text-2xl font-semibold mb-6">
            Login
        </h2>

        {/* Example inputs */}
        <input
            type="text"
            placeholder="Username"
            className="w-full mb-4 p-3 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400"
        />
        <input
            type="password"
            placeholder="Password"
            className="w-full mb-6 p-3 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400"
        />
        
        {/* Example button */}
        <button className="w-full bg-blue-600 text-white p-3 rounded-md hover:bg-blue-700 transition">
            Login
        </button>
    </div>

  );
}
