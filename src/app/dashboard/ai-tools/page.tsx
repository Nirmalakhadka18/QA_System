"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import ReactMarkdown from "react-markdown";
import Link from "next/link";

export default function AIStudyTool() {
    const [url, setUrl] = useState("");
    const [manualTranscript, setManualTranscript] = useState("");
    const [showManualInput, setShowManualInput] = useState(false);
    const [summary, setSummary] = useState("");
    const [transcript, setTranscript] = useState("");
    const [loading, setLoading] = useState(false);
    const [statusMessage, setStatusMessage] = useState("");
    const [error, setError] = useState("");

    const handleGenerate = async (useManual = false, useMetadataOnly = false) => {
        if (!useManual) {
            setLoading(true);
            setError("");
            setSummary("");
            setTranscript("");
            setStatusMessage("Analyzing video...");
        } else {
            setStatusMessage(useMetadataOnly ? "Generating from metadata..." : "Analyzing transcript...");
        }

        try {
            const endpoint = useManual ? "/api/ai/summarize/manual" : "/api/ai/summarize";
            let body;
            if (useManual) {
                body = {
                    url,
                    transcript: manualTranscript,
                    useMetadataOnly
                };
            } else {
                body = { url };
            }

            const response = await fetch(endpoint, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(body),
            });

            // Auto-Failover Logic
            if (!useManual && response.status === 404) {
                const data = await response.json();
                if (data.error === "COULD_NOT_FETCH_TRANSCRIPT") {
                    // Automatically switch to Metadata Mode
                    setStatusMessage("Transcript blocked. Switching to Smart Metadata analysis... 🧠");
                    await handleGenerate(true, true); // Recursive call for metadata
                    return;
                }
            }

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || "Failed to generate summary");
            }

            setSummary(data.summary);
            setTranscript(data.transcript || manualTranscript);
            // Don't auto-hide manual input if it was user-toggled, but usually we want to clear distractions
            // setShowManualInput(false); 
        } catch (err: any) {
            setError(err.message);
        } finally {
            if (!useManual) setLoading(false); // Only unset loading if we are the parent call or final call
            // Actually, we should check if we are recursing.
            // Simplified: If we are recursing, the child call will handle loading state? 
            // No, async recursion is tricky. Let's strictly control loading.
            // If we recursively called, we returned early, so this finally block WONT run for the first call?
            // Wait, await handleGenerate() will finish, then this runs.
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen p-8">
            <div className="max-w-4xl mx-auto">
                <div className="mb-8 flex items-center justify-between">
                    <h1 className="text-3xl font-bold text-white drop-shadow-sm flex items-center gap-2">
                        AI Video Summarizer <span className="text-2xl">🧠</span>
                    </h1>
                    <Link href="/dashboard" className="text-indigo-200 hover:text-white font-medium transition-colors flex items-center gap-1">
                        ← Back to Dashboard
                    </Link>
                </div>

                <div className="bg-white/10 backdrop-blur-md rounded-2xl shadow-xl border border-white/20 p-8 mb-8">
                    <label className="block text-sm font-medium text-indigo-100 mb-2">
                        Paste YouTube Video URL
                    </label>
                    <div className="flex gap-4">
                        <input
                            type="text"
                            value={url}
                            onChange={(e) => setUrl(e.target.value)}
                            placeholder="https://www.youtube.com/watch?v=..."
                            className="flex-1 rounded-xl border-white/30 bg-white/20 text-white placeholder:text-indigo-200/70 focus:ring-2 focus:ring-indigo-400 focus:border-transparent px-4 py-3 outline-none transition-all"
                        />
                        <button
                            onClick={() => handleGenerate(false)}
                            disabled={loading || !url}
                            className={`px-6 py-3 rounded-xl font-semibold text-white transition-all ${loading || !url
                                ? "bg-white/10 text-white/50 cursor-not-allowed border border-white/10"
                                : "bg-indigo-600 hover:bg-indigo-500 shadow-lg hover:shadow-indigo-500/30 transform hover:-translate-y-0.5"
                                }`}
                        >
                            {loading ? statusMessage || "Analyzing..." : "Generate Notes"}
                        </button>
                    </div>

                    {/* Hidden/Advanced Manual Input Toggle */}
                    <div className="mt-4 flex justify-end">
                        <button
                            onClick={() => setShowManualInput(!showManualInput)}
                            className="text-xs text-indigo-300/50 hover:text-indigo-200 transition-colors"
                        >
                            {showManualInput ? "Hide Advanced Options" : "Trouble? Try Manual Input"}
                        </button>
                    </div>

                    {showManualInput && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            className="mt-6 pt-6 border-t border-white/10"
                        >
                            <label className="block text-sm font-medium text-indigo-100 mb-2">
                                Paste Transcript Manually
                            </label>
                            <textarea
                                value={manualTranscript}
                                onChange={(e) => setManualTranscript(e.target.value)}
                                rows={6}
                                placeholder="Paste the full transcript text here..."
                                className="w-full rounded-xl border-white/30 bg-white/20 text-white placeholder:text-indigo-200/70 focus:ring-2 focus:ring-indigo-400 focus:border-transparent px-4 py-3 outline-none transition-all resize-none mb-4 font-mono text-sm"
                            />
                            <button
                                onClick={() => handleGenerate(true)}
                                disabled={loading || !manualTranscript}
                                className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold transition-all shadow-lg hover:shadow-emerald-500/30 flex items-center justify-center gap-2"
                            >
                                {loading ? "Analyzing..." : "Summarize Manual Transcript"}
                            </button>
                        </motion.div>
                    )}

                    {error && (
                        <div className="mt-4 p-4 bg-red-500/20 text-red-200 rounded-xl border border-red-500/30">
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
                        className="bg-white/10 backdrop-blur-md rounded-2xl shadow-xl border border-white/20 p-8 prose prose-invert max-w-none"
                    >
                        <h2 className="text-2xl font-bold mb-6 text-white border-b border-white/20 pb-4">Study Notes & Summary</h2>
                        <div className="text-indigo-100 leading-relaxed">
                            <ReactMarkdown>{summary}</ReactMarkdown>
                        </div>
                    </motion.div>
                )}

            </div>
        </div>
    );
}
