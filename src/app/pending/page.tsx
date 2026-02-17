"use client";

import { signOut } from "next-auth/react";

export default function PendingPage() {
    return (
        <div className="flex min-h-screen items-center justify-center bg-gray-100">
            <div className="w-full max-w-md bg-white p-8 rounded-lg shadow-md text-center">
                <h1 className="text-2xl font-bold mb-4 text-yellow-600">Account Pending</h1>
                <p className="mb-6 text-gray-600">
                    Your account is currently pending approval from an administrator.
                    You will not be able to access the dashboard until your account is approved.
                </p>
                <button
                    onClick={() => signOut({ callbackUrl: "/login" })}
                    className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 transition"
                >
                    Back to Login
                </button>
            </div>
        </div>
    );
}
