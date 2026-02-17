"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import ReactMarkdown from "react-markdown";
import Link from "next/link";

export default function AIStudyTool() {
    const [url, setUrl] = useState("");
    const [summary, setSummary] = useState("");
    const [transcript, setTranscript] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const handleGenerate = async () => {
        setLoading(true);
        setError("");
        setSummary("");
        setTranscript("");

        try {
            const response = await fetch("/api/ai/summarize", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ url }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || "Failed to generate summary");
            }

            setSummary(data.summary);
            setTranscript(data.transcript);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 p-8">
            <div className="max-w-4xl mx-auto">
                <div className="mb-8 flex items-center justify-between">
                    <h1 className="text-3xl font-bold text-gray-900">AI Video Summarizer 🧠</h1>
                    <Link href="/dashboard" className="text-indigo-600 hover:text-indigo-800 font-medium">
                        ← Back to Dashboard
                    </Link>
                </div>

                <div className="bg-white rounded-2xl shadow-xl p-8 mb-8">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Paste YouTube Video URL
                    </label>
                    <div className="flex gap-4">
                        <input
                            type="text"
                            value={url}
                            onChange={(e) => setUrl(e.target.value)}
                            placeholder="https://www.youtube.com/watch?v=..."
                            className="flex-1 rounded-lg border border-gray-300 px-4 py-3 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all text-gray-900 bg-white"
                        />
                        <button
                            onClick={handleGenerate}
                            disabled={loading || !url}
                            className={`px-6 py-3 rounded-lg font-semibold text-white transition-all ${loading || !url
                                ? "bg-gray-400 cursor-not-allowed"
                                : "bg-indigo-600 hover:bg-indigo-700 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                                }`}
                        >
                            {loading ? "Analyzing..." : "Generate Notes"}
                        </button>
                    </div>
                    {error && (
                        <div className="mt-4 p-4 bg-red-50 text-red-700 rounded-lg border border-red-200">
                            {error}
                        </div>
                    )}
                </div>

                {/* Video Embed */}
                {url.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/) && (
                    <div className="bg-white rounded-2xl shadow-xl overflow-hidden mb-8">
                        <div className="aspect-video">
                            <iframe
                                width="100%"
                                height="100%"
                                src={`https://www.youtube.com/embed/${url.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/)?.[1]}`}
                                title="YouTube video player"
                                frameBorder="0"
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                allowFullScreen
                            ></iframe>
                        </div>
                    </div>
                )}

                {summary && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-white rounded-2xl shadow-xl p-8 prose prose-indigo max-w-none"
                    >
                        <h2 className="text-2xl font-bold mb-6 text-gray-800 border-b pb-4">Study Notes & Summary</h2>
                        <div className="whitespace-pre-wrap text-gray-700 leading-relaxed font-sans">
                            {summary}
                        </div>
                    </motion.div>
                )}

                {transcript && (
                    <div className="mt-8 bg-white rounded-2xl shadow-xl p-8">
                        <details className="group">
                            <summary className="flex justify-between items-center font-medium cursor-pointer list-none">
                                <span className="text-xl font-bold text-gray-800">Video Transcript</span>
                                <span className="transition group-open:rotate-180">
                                    <svg fill="none" height="24" shapeRendering="geometricPrecision" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" viewBox="0 0 24 24" width="24"><path d="M6 9l6 6 6-6"></path></svg>
                                </span>
                            </summary>
                            <div className="text-gray-600 mt-4 h-64 overflow-y-auto whitespace-pre-wrap text-sm border-t pt-4 leading-relaxed">
                                {transcript}
                            </div>
                        </details>
                    </div>
                )}
            </div>
        </div>
    );
}
