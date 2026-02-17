"use client";

import { useState, useEffect, useRef } from "react";
import ReactMarkdown from "react-markdown";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";

interface Document {
    id: string;
    name: string;
    type: string;
    createdAt: string;
}

export default function DocumentQAPage() {
    const [documents, setDocuments] = useState<Document[]>([]);
    const [selectedDocId, setSelectedDocId] = useState<string>("");
    const [question, setQuestion] = useState("");
    const [messages, setMessages] = useState<{ role: 'user' | 'ai', content: string }[]>([]);
    const [loading, setLoading] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        fetchDocuments();
    }, []);

    useEffect(() => {
        setMessages([]); // Clear chat when changing document
    }, [selectedDocId]);

    useEffect(() => {
        scrollToBottom();
    }, [messages, loading]);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    const fetchDocuments = async () => {
        try {
            const res = await fetch("/api/documents");
            const data = await res.json();
            if (res.ok) setDocuments(data);
        } catch (err) {
            console.error("Failed to fetch documents");
        }
    };

    const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploading(true);
        setError("");
        setSuccess("");

        const formData = new FormData();
        formData.append("file", file);

        try {
            const res = await fetch("/api/documents/upload", {
                method: "POST",
                body: formData,
            });

            const contentType = res.headers.get("content-type");
            if (contentType && contentType.includes("application/json")) {
                const data = await res.json();
                if (!res.ok) throw new Error(data.error || "Upload failed");

                setSuccess("File uploaded successfully!");
                fetchDocuments();
                setSelectedDocId(data.document.id);
            } else {
                const text = await res.text();
                throw new Error(`Server error (${res.status}): ${text.slice(0, 100)}...`);
            }
        } catch (err: any) {
            setError(err.message);
        } finally {
            setUploading(false);
        }
    };

    const handleAsk = async () => {
        if (!selectedDocId || !question.trim()) return;

        const currentQuestion = question;
        setQuestion("");
        setMessages(prev => [...prev, { role: 'user', content: currentQuestion }]);
        setLoading(true);
        setError("");

        try {
            const res = await fetch("/api/documents/qa", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ documentId: selectedDocId, question: currentQuestion }),
            });
            const data = await res.json();

            if (!res.ok) throw new Error(data.error || "Failed to get answer");

            setMessages(prev => [...prev, { role: 'ai', content: data.answer }]);
        } catch (err: any) {
            setError(err.message);
            setMessages(prev => [...prev, { role: 'ai', content: "Sorry, I encountered an error. Please try again." }]);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Are you sure you want to delete this document?")) return;

        try {
            const res = await fetch(`/api/documents?id=${id}`, { method: "DELETE" });
            if (res.ok) {
                fetchDocuments();
                if (selectedDocId === id) {
                    handleNewChat();
                }
            }
        } catch (err) {
            console.error("Delete failed");
        }
    };

    const handleNewChat = () => {
        setSelectedDocId("");
        setMessages([]);
        setQuestion("");
    };

    return (
        <div className="flex h-screen bg-white font-sans text-gray-800">
            {/* Sidebar (Light Mode) */}
            <div className="w-[260px] bg-[#f9f9f9] border-r border-gray-200 flex flex-col flex-shrink-0 hidden md:flex">
                <div className="p-3">
                    <div onClick={handleNewChat} className="flex items-center gap-3 px-3 py-3 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 cursor-pointer transition-colors shadow-sm mb-4 group">
                        <div className="w-6 h-6 rounded-full bg-black text-white flex items-center justify-center group-hover:bg-gray-700 transition-colors">
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" /></svg>
                        </div>
                        <span className="text-sm font-medium text-gray-700">New chat</span>
                        {/* <span className="ml-auto text-xs text-gray-400">Ctrl N</span> */}
                    </div>

                    <div className="relative mb-2">
                        <svg className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                        <input type="text" placeholder="Search chats..." className="w-full pl-9 pr-3 py-2 bg-transparent border-none rounded-md text-sm text-gray-600 placeholder:text-gray-400 focus:outline-none focus:ring-0" />
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto px-2 pb-3 custom-scrollbar">
                    <div className="text-xs font-semibold text-gray-400 px-3 py-1 mb-1">History</div>
                    {documents.length === 0 ? (
                        <div className="text-xs text-gray-400 px-3 italic">No chat history</div>
                    ) : (
                        <div className="space-y-0.5">
                            {documents.map((doc) => (
                                <div
                                    key={doc.id}
                                    onClick={() => setSelectedDocId(doc.id)}
                                    className={`group flex items-center justify-between gap-2 px-3 py-2 rounded-lg cursor-pointer text-sm transition-colors ${selectedDocId === doc.id ? 'bg-gray-200 text-gray-900' : 'text-gray-600 hover:bg-gray-100'}`}
                                >
                                    <span className="truncate flex-1">{doc.name}</span>
                                    {selectedDocId === doc.id && (
                                        <button
                                            onClick={(e) => { e.stopPropagation(); handleDelete(doc.id); }}
                                            className="text-gray-400 hover:text-red-500"
                                            title="Delete"
                                        >
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                        </button>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* User User Profile */}
                <div className="p-3 border-t border-gray-200">
                    <Link href="/dashboard" className="flex items-center gap-3 px-2 py-3 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer text-gray-700">
                        <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center text-sm font-bold border border-indigo-200">U</div>
                        <div className="text-sm font-medium">User Account</div>
                    </Link>
                </div>
            </div>

            {/* Main Chat Area */}
            <div className="flex-1 flex flex-col relative h-full overflow-hidden">
                {/* Mobile Header */}
                <div className="md:hidden p-4 border-b border-gray-100 flex items-center justify-between bg-white z-20">
                    <div onClick={handleNewChat} className="flex items-center gap-2 cursor-pointer">
                        <span className="text-gray-500">ChatGPT</span>
                        <svg className="w-3 h-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
                    </div>
                    <Link href="/dashboard" className="p-2 rounded-md hover:bg-gray-100"><svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" /></svg></Link>
                </div>

                {!selectedDocId ? (
                    <div className="flex-1 flex flex-col items-center justify-center p-4">
                        {/* Logo / Badge */}
                        <div className="mb-6">
                            <div className="bg-white p-3 rounded-full shadow-sm border border-gray-100">
                                <svg className="w-10 h-10 text-gray-800" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z" /></svg>
                            </div>
                        </div>

                        <h2 className="text-2xl md:text-3xl font-semibold text-gray-800 mb-8 tracking-tight">What can I help with?</h2>

                        {/* Centered Input Pill */}
                        <div className="w-full max-w-2xl relative z-10">
                            {error && <div className="mb-4 p-3 bg-red-50 text-red-600 text-sm rounded-lg border border-red-100 text-center">{error}</div>}

                            <div className="relative flex items-center w-full p-2 pl-4 bg-white border border-gray-200 shadow-[0_0_15px_rgba(0,0,0,0.10)] rounded-3xl hover:shadow-[0_0_20px_rgba(0,0,0,0.15)] transition-shadow focus-within:ring-1 focus-within:ring-gray-200 focus-within:border-gray-300">
                                <label className="p-2 text-gray-400 hover:text-gray-600 cursor-pointer rounded-full hover:bg-gray-100 transition-colors" title="Attach file">
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" /></svg>
                                    <input type="file" className="hidden" accept=".pdf,.txt" onChange={handleUpload} disabled={uploading} />
                                </label>

                                <input
                                    className="flex-1 py-3 px-3 bg-transparent border-none outline-none text-base text-gray-700 placeholder:text-gray-400/80"
                                    placeholder="Ask anything"
                                    value={question}
                                    onChange={(e) => setQuestion(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') {
                                            if (!selectedDocId) {
                                                alert("Please upload a document first using the attachment icon!");
                                            } else {
                                                handleAsk();
                                            }
                                        }
                                    }}
                                    disabled={loading}
                                />

                                <div className="flex items-center gap-1 pr-1">
                                    {uploading && <div className="w-5 h-5 border-2 border-gray-300 border-t-black rounded-full animate-spin mr-2"></div>}
                                    <button
                                        onClick={handleAsk}
                                        disabled={!selectedDocId || !question.trim() || loading}
                                        className={`p-2 rounded-full transition-colors ${!selectedDocId || !question.trim() || loading ? 'text-gray-300 bg-gray-100' : 'bg-black text-white hover:bg-gray-800'}`}
                                    >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 12h14M12 5l7 7-7 7" /></svg>
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Suggestions */}
                        <div className="flex flex-wrap justify-center gap-2 mt-8 opacity-60">
                            <button className="px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-xs text-gray-500 hover:bg-gray-50 transition-colors">Summarize text</button>
                            <button className="px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-xs text-gray-500 hover:bg-gray-50 transition-colors">Analyze PDF</button>
                            <button className="px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-xs text-gray-500 hover:bg-gray-50 transition-colors">Extract info</button>
                        </div>
                    </div>
                ) : (
                    <>
                        {/* Chat Top Bar */}
                        <div className="sticky top-0 w-full p-2 bg-white/80 backdrop-blur-md border-b border-gray-100 z-10 flex items-center justify-between md:hidden">
                            <button onClick={handleNewChat} className="text-gray-500">Back</button>
                            <span className="text-sm font-semibold truncate max-w-[200px]">{documents.find(d => d.id === selectedDocId)?.name}</span>
                            <div className="w-8"></div>
                        </div>

                        <div className="flex-1 overflow-y-auto custom-scrollbar scroll-smooth">
                            <div className="flex flex-col pb-32 pt-4">
                                {messages.map((msg, idx) => (
                                    <div key={idx} className="w-full text-base group">
                                        <div className="max-w-3xl mx-auto p-4 md:py-6 flex gap-4 md:gap-6 m-auto">
                                            <div className="flex-shrink-0 flex flex-col relative items-end">
                                                <div className={`w-6 h-6 rounded-sm flex items-center justify-center ${msg.role === 'ai' ? 'bg-[#19c37d] text-white' : 'bg-gray-200 text-gray-600'}`}>
                                                    {msg.role === 'ai' ? (
                                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                                                    ) : (
                                                        <span className="text-xs font-bold">U</span>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="relative flex-1 overflow-hidden">
                                                <div className="prose prose-slate prose-p:leading-relaxed prose-pre:bg-gray-50 prose-pre:text-gray-800 prose-pre:border prose-pre:border-gray-200 max-w-none text-gray-800">
                                                    <ReactMarkdown>{msg.content}</ReactMarkdown>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}

                                {loading && (
                                    <div className="w-full text-base">
                                        <div className="max-w-3xl mx-auto p-4 md:py-6 flex gap-4 md:gap-6 m-auto">
                                            <div className="flex-shrink-0 flex flex-col relative items-end">
                                                <div className="w-6 h-6 rounded-sm bg-[#19c37d] flex items-center justify-center text-white">
                                                    <svg className="w-4 h-4 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                                                </div>
                                            </div>
                                            <div className="flex-1 flex items-center gap-2">
                                                <span className="w-2 h-2 bg-gray-300 rounded-full animate-bounce"></span>
                                                <span className="w-2 h-2 bg-gray-300 rounded-full animate-bounce delay-75"></span>
                                                <span className="w-2 h-2 bg-gray-300 rounded-full animate-bounce delay-150"></span>
                                            </div>
                                        </div>
                                    </div>
                                )}
                                <div ref={messagesEndRef} />
                            </div>
                        </div>

                        {/* Bottom Input Area (Chat Mode) */}
                        <div className="absolute bottom-0 left-0 w-full bg-gradient-to-t from-white via-white to-transparent pt-10 pb-6 px-4">
                            <div className="max-w-3xl mx-auto">
                                {error && <div className="mb-2 p-2 bg-red-50 text-red-600 text-xs rounded border border-red-100 text-center">{error}</div>}

                                <div className="relative flex items-end w-full p-3 bg-white border border-gray-300 rounded-3xl shadow-sm focus-within:ring-1 focus-within:ring-gray-300 focus-within:border-gray-400 overflow-hidden ring-offset-2 ring-offset-transparent">
                                    <label className="p-2 mr-2 text-gray-400 hover:text-gray-600 cursor-pointer rounded-full hover:bg-gray-100 transition-colors flex-shrink-0" title="Upload new file">
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" /></svg>
                                        <input type="file" className="hidden" accept=".pdf,.txt" onChange={handleUpload} disabled={uploading} />
                                    </label>

                                    <input
                                        className="w-full max-h-[200px] py-[6px] pr-10 md:py-[6px] md:pr-10 bg-transparent border-none outline-none text-base text-gray-800 placeholder:text-gray-400 resize-none"
                                        placeholder="Message ChatGPT..."
                                        value={question}
                                        onChange={(e) => setQuestion(e.target.value)}
                                        onKeyDown={(e) => e.key === 'Enter' && handleAsk()}
                                        disabled={loading}
                                    />
                                    <button
                                        onClick={handleAsk}
                                        disabled={!question.trim() || loading}
                                        className={`absolute right-3 bottom-2 p-1.5 rounded-full transition-colors ${!question.trim() || loading ? 'text-gray-300 bg-transparent' : 'bg-black text-white hover:bg-gray-800'}`}
                                    >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 10l7-7m0 0l7 7m-7-7v18" /></svg>
                                    </button>
                                </div>
                                <div className="text-center mt-2">
                                    <span className="text-[10px] text-gray-400">ChatGPT can make mistakes. Consider checking important information.</span>
                                </div>
                            </div>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}
