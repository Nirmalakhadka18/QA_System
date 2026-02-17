"use client";

import LoginForm from "@/components/LoginForm";
import { Suspense } from 'react';
import { useRouter } from "next/navigation";

export default function LoginPage() {
    const router = useRouter();

    return (
        <div className="flex min-h-screen items-center justify-center p-4">
            <Suspense fallback={<div>Loading...</div>}>
                <LoginForm onToggle={() => router.push("/signup")} />
            </Suspense>
        </div>
    );
}
