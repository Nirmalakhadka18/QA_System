"use client";

import { SessionProvider } from "next-auth/react";
import { useEffect } from "react";

export function Providers({ children }: { children: React.ReactNode }) {
    useEffect(() => {
        const handleError = (event: ErrorEvent) => {
            if (event.message?.includes("Failed to connect to MetaMask") ||
                event.error?.message?.includes("Failed to connect to MetaMask")) {
                event.stopImmediatePropagation();
                event.preventDefault();
            }
        };

        const handleRejection = (event: PromiseRejectionEvent) => {
            if (event.reason?.message?.includes("Failed to connect to MetaMask")) {
                event.stopImmediatePropagation();
                event.preventDefault();
            }
        };

        window.addEventListener("error", handleError);
        window.addEventListener("unhandledrejection", handleRejection);

        return () => {
            window.removeEventListener("error", handleError);
            window.removeEventListener("unhandledrejection", handleRejection);
        };
    }, []);

    return <SessionProvider>{children}</SessionProvider>;
}
