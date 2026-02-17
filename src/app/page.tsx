"use client";

import { useState, Suspense } from "react";
import LoginForm from "@/components/LoginForm";
import SignUpForm from "@/components/SignUpForm";

export default function Home() {
  const [isLogin, setIsLogin] = useState(true);

  const toggleAuthMode = () => {
    setIsLogin(!isLogin);
  };

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">Welcome</h1>
          <p className="text-gray-300">Please sign in or create an account to continue.</p>
        </div>

        {isLogin ? (
          <Suspense fallback={<div>Loading...</div>}>
            <LoginForm onToggle={toggleAuthMode} />
          </Suspense>
        ) : (
          <SignUpForm onToggle={toggleAuthMode} />
        )}
      </div>
    </div>
  );
}
