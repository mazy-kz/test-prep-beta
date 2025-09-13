"use client";
import { useState } from "react";
import Link from "next/link";

export default function LoginPage() {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleLogin = () => {
    if (password === "sHOTcANt32") {
      window.location.href = "/admin"; // go to admin dashboard
    } else {
      setError("Invalid password");
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-50 relative">
      {/* 🔙 Home Button */}
      <Link href="/" className="absolute top-4 right-4">
        <button className="bg-gray-200 hover:bg-gray-300 text-black px-4 py-2 rounded-lg">
          Home
        </button>
      </Link>

      <div className="bg-white p-8 rounded-lg shadow-md w-80">
        <h1 className="text-xl font-bold mb-4 text-center">Admin Login</h1>
        <input
          type="password"
          placeholder="Enter password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full p-2 border rounded mb-4"
        />
        {error && <p className="text-red-500 text-sm mb-2">{error}</p>}
        <button
          onClick={handleLogin}
          className="w-full bg-blue-500 text-white p-2 rounded hover:bg-blue-600"
        >
          Login
        </button>
      </div>
    </main>
  );
}