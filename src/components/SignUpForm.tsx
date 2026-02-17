"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface SignUpFormProps {
    onToggle: () => void;
    onSuccess?: (msg: string) => void;
}

export default function SignUpForm({ onToggle, onSuccess }: SignUpFormProps) {
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const router = useRouter();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setIsLoading(true);

        try {
            const res = await fetch("/api/auth/register", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ name, email, password }),
            });

            if (res.ok) {
                if (onSuccess) {
                    onSuccess("Registration successful. Please login.");
                } else {
                    onToggle();
                }
            } else {
                const data = await res.json();
                // Show detailed error if available, otherwise fallback to message or default
                const errorMessage = data.details
                    ? `${data.message} (${data.details})`
                    : (data.message || "Registration failed");
                setError(errorMessage);
                setIsLoading(false);
            }
        } catch (err) {
            setError("An error occurred");
            setIsLoading(false);
        }
    };

    return (
        <div className="w-full max-w-md bg-white/95 backdrop-blur-sm p-8 rounded-2xl shadow-2xl border border-gray-100">
            <h2 className="text-3xl font-bold mb-6 text-center text-gray-800 tracking-tight">Create Account</h2>
            {error && (
                <div className="bg-red-50 text-red-600 px-4 py-3 rounded-lg mb-6 text-center text-sm font-medium border border-red-100">
                    {error}
                </div>
            )}
            <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                    <label className="block mb-2 font-medium text-gray-700 text-sm">Full Name</label>
                    <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="w-full border border-gray-300 px-4 py-3 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all disabled:opacity-50"
                        placeholder="John Doe"
                        required
                        disabled={isLoading}
                    />
                </div>
                <div>
                    <label className="block mb-2 font-medium text-gray-700 text-sm">Email Address</label>
                    <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full border border-gray-300 px-4 py-3 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all disabled:opacity-50"
                        placeholder="you@example.com"
                        required
                        disabled={isLoading}
                    />
                </div>
                <div>
                    <label className="block mb-2 font-medium text-gray-700 text-sm">Password</label>
                    <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full border border-gray-300 px-4 py-3 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all disabled:opacity-50"
                        placeholder="••••••••"
                        required
                        disabled={isLoading}
                    />
                </div>
                <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-bold py-3 rounded-lg hover:from-purple-700 hover:to-indigo-700 transition-all transform hover:scale-[1.02] active:scale-100 shadow-lg disabled:opacity-70 disabled:cursor-not-allowed flex justify-center items-center"
                >
                    {isLoading ? (
                        <>
                            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Creating Account...
                        </>
                    ) : (
                        "Get Started"
                    )}
                </button>
            </form>
            <p className="mt-6 text-center text-gray-600 text-sm">
                Already have an account?{" "}
                <button onClick={onToggle} className="text-purple-600 hover:text-purple-800 font-semibold hover:underline transition-colors">
                    Login here
                </button>
            </p>
        </div>
    );
}
