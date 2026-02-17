"use client";

import { useState, useEffect } from "react";

export default function DashboardClock() {
    const [time, setTime] = useState<Date | null>(null);

    useEffect(() => {
        setTime(new Date());
        const timer = setInterval(() => {
            setTime(new Date());
        }, 1000);

        return () => clearInterval(timer);
    }, []);

    if (!time) return <div className="animate-pulse h-6 w-32 bg-indigo-400/30 rounded"></div>;

    return (
        <div className="text-right">
            <p className="text-2xl font-bold font-mono tracking-widest">
                {time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
            </p>
            <p className="text-indigo-200 text-sm font-medium">
                {time.toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
        </div>
    );
}
