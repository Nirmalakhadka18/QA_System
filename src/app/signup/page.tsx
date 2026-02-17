"use client";

import SignUpForm from "@/components/SignUpForm";
import { useRouter } from "next/navigation";

export default function SignUpPage() {
    const router = useRouter();

    return (
        <div className="flex min-h-screen items-center justify-center p-4">
            <SignUpForm
                onToggle={() => router.push("/login")}
                onSuccess={(msg) => router.push(`/login?message=${encodeURIComponent(msg)}`)}
            />
        </div>
    );
}
