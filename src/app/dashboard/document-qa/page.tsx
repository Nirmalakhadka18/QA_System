"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import ReactMarkdown from "react-markdown";
import Link from "next/link";

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

    useEffect(() => {
        fetchDocuments();
    }, []);

    useEffect(() => {
        console.log("State Debug:", { selectedDocId, documentsCount: documents.length });
        setMessages([]); // Clear chat when changing document
    }, [selectedDocId]);

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
                console.error("Non-JSON response received:", text);
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
                    setSelectedDocId("");
                    setMessages([]);
                }
            }
        } catch (err) {
            console.error("Delete failed");
        }
    };

    return (
        <div className="min-h-screen bg-[#e5e5e5] p-4 md:p-8 font-sans">
            <div className="max-w-7xl mx-auto h-[calc(100vh-4rem)] flex gap-4">
                {/* Left Sidebar: Document List */}
                <div className="w-1/3 bg-white rounded-2xl shadow-xl flex flex-col overflow-hidden border border-gray-200">
                    {/* Header */}
                    <div className="p-4 bg-gray-50 border-b border-gray-200 flex justify-between items-center">
                        <div>
                            <h1 className="text-xl font-bold text-gray-800">Chats</h1>
                            <Link href="/dashboard" className="text-xs text-indigo-600 hover:text-indigo-800 font-medium mt-1 block">
                                ← Back to Dashboard
                            </Link>
                        </div>
                        <label className="cursor-pointer p-2 bg-indigo-50 text-indigo-600 rounded-full hover:bg-indigo-100 transition-colors" title="Upload New Document">
                            <svg className={`w-5 h-5 ${uploading ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" /></svg>
                            <input type="file" className="hidden" accept=".pdf,.txt" onChange={handleUpload} disabled={uploading} />
                        </label>
                    </div>

                    {/* Search / Filter (Visual only for now) */}
                    <div className="p-3 border-b border-gray-100 bg-white">
                        <div className="relative">
                            <input type="text" placeholder="Search documents..." className="w-full pl-10 pr-4 py-2 bg-gray-100 border-none rounded-lg text-sm text-gray-700 outline-none focus:ring-1 focus:ring-indigo-300" />
                            <svg className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                        </div>
                    </div>

                    {error && <div className="p-2 bg-red-50 text-red-600 text-xs text-center border-b border-red-100">{error}</div>}
                    {success && <div className="p-2 bg-emerald-50 text-emerald-600 text-xs text-center border-b border-emerald-100">{success}</div>}

                    {/* Document List */}
                    <div className="flex-1 overflow-y-auto">
                        {documents.length === 0 ? (
                            <div className="p-8 text-center text-gray-400 text-sm">No documents yet.</div>
                        ) : (
                            <div className="divide-y divide-gray-50">
                                {documents.map((doc) => (
                                    <div
                                        key={doc.id}
                                        onClick={() => setSelectedDocId(doc.id)}
                                        className={`p-4 cursor-pointer hover:bg-gray-50 transition-colors flex items-center gap-3 group relative ${selectedDocId === doc.id ? 'bg-indigo-50 hover:bg-indigo-50' : ''}`}
                                    >
                                        <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold flex-shrink-0 ${selectedDocId === doc.id ? 'bg-indigo-600' : 'bg-gray-300'}`}>
                                            {doc.name.charAt(0).toUpperCase()}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex justify-between items-baseline">
                                                <h3 className={`text-sm font-semibold truncate ${selectedDocId === doc.id ? 'text-gray-900' : 'text-gray-700'}`}>{doc.name}</h3>
                                                <span className="text-[10px] text-gray-400">{new Date(doc.createdAt).toLocaleDateString()}</span>
                                            </div>
                                            <p className="text-xs text-gray-500 truncate capitalize">{doc.type} Document</p>
                                        </div>
                                        <button
                                            onClick={(e) => { e.stopPropagation(); handleDelete(doc.id); }}
                                            className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
                                            title="Delete Document"
                                        >
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Right Chat Area */}
                <div className="flex-1 bg-[#efeae2] rounded-2xl shadow-xl flex flex-col overflow-hidden border border-gray-200 relative">
                    {/* Chat Pattern Background Overlay */}
                    <div className="absolute inset-0 opacity-40 pointer-events-none" style={{ backgroundImage: 'url("https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png")' }}></div>

                    {!selectedDocId ? (
                        <div className="flex-1 flex flex-col items-center justify-center text-center p-8 relative z-10">
                            <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center shadow-lg mb-6">
                                <svg className="w-12 h-12 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
                            </div>
                            <h2 className="text-2xl font-light text-gray-700 mb-2">WhatsApp Web for Docs</h2>
                            <p className="text-gray-500 text-sm max-w-md">Select a document from the left to start a conversation. Send and receive messages instantly.</p>
                            <div className="mt-8 flex gap-2 items-center text-xs text-gray-400">
                                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 15h-2v-2h2v2zm0-4h-2V7h2v6z" /></svg>
                                End-to-end encrypted (not really, but it's secure!)
                            </div>
                        </div>
                    ) : (
                        <>
                            {/* Chat Header */}
                            <div className="p-3 bg-gray-100 border-b border-gray-200 flex items-center gap-3 relative z-10">
                                <div className="w-10 h-10 rounded-full bg-indigo-600 flex items-center justify-center text-white font-bold">AI</div>
                                <div className="flex-1">
                                    <h3 className="text-sm font-semibold text-gray-900">AI Assistant</h3>
                                    <p className="text-xs text-gray-500 truncate w-64">Replying to: {documents.find(d => d.id === selectedDocId)?.name}</p>
                                </div>
                                <div className="flex gap-4 pr-2 text-gray-500">
                                    <svg className="w-5 h-5 cursor-pointer hover:text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                                    <svg className="w-5 h-5 cursor-pointer hover:text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" /></svg>
                                </div>
                            </div>

                            {/* Messages Area */}
                            <div className="flex-1 overflow-y-auto p-4 space-y-2 relative z-10 custom-scrollbar">
                                <div className="flex justify-center mb-4">
                                    <span className="bg-white/90 shadow-sm text-gray-500 text-[10px] py-1 px-3 rounded-lg uppercase tracking-wider font-semibold">Today</span>
                                </div>

                                {messages.length === 0 && (
                                    <div className="flex justify-center mt-8">
                                        <div className="bg-[#dcf8c6] shadow-sm p-3 rounded-lg max-w-xs text-center">
                                            <p className="text-sm text-gray-800">👋 Hello! I've read this document. Ask me anything about it.</p>
                                            <span className="text-[10px] text-gray-500 block text-right mt-1">{new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                        </div>
                                    </div>
                                )}

                                {messages.map((msg, idx) => (
                                    <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                        <div className={`max-w-[80%] rounded-lg p-3 shadow-sm relative ${msg.role === 'user' ? 'bg-[#dcf8c6] rounded-tr-none' : 'bg-white rounded-tl-none'}`}>
                                            {/* Triangle for bubble */}
                                            <div className={`absolute top-0 w-0 h-0 border-[6px] border-transparent ${msg.role === 'user' ? '-right-[10px] border-t-[#dcf8c6]' : '-left-[10px] border-t-white'}`}></div>

                                            <div className="text-sm text-gray-800 leading-relaxed whitespace-pre-wrap">
                                                <ReactMarkdown>{msg.content}</ReactMarkdown>
                                            </div>
                                            <div className="flex justify-end items-center gap-1 mt-1">
                                                <span className="text-[10px] text-gray-400">{new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                                {msg.role === 'user' && (
                                                    <svg className="w-3 h-3 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7m-10 4l4 4m6-10l-4 4" /></svg> // Double check icon
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))}

                                {loading && (
                                    <div className="flex justify-start">
                                        <div className="bg-white rounded-lg rounded-tl-none p-3 shadow-sm relative">
                                            <div className="absolute top-0 -left-[10px] w-0 h-0 border-[6px] border-transparent border-t-white"></div>
                                            <div className="flex gap-1">
                                                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                                                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-75"></div>
                                                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-150"></div>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Input Area */}
                            <div className="p-3 bg-[#f0f2f5] border-t border-gray-200 relative z-10 flex items-center gap-2">
                                <svg className="w-6 h-6 text-gray-500 cursor-pointer" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                <svg className="w-6 h-6 text-gray-500 cursor-pointer" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" /></svg>

                                <div className="flex-1 bg-white rounded-lg flex items-center px-4 py-2 shadow-sm">
                                    <input
                                        type="text"
                                        placeholder="Type a message"
                                        className="flex-1 bg-transparent outline-none text-sm text-gray-700 placeholder:text-gray-400"
                                        value={question}
                                        onChange={(e) => setQuestion(e.target.value)}
                                        onKeyDown={(e) => e.key === 'Enter' && handleAsk()}
                                        disabled={loading}
                                    />
                                </div>

                                {question.trim() ? (
                                    <button onClick={handleAsk} disabled={loading} className="p-2 rounded-full bg-indigo-600 text-white shadow-sm hover:bg-indigo-700 transition-colors">
                                        <svg className="w-5 h-5 transform rotate-90" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>
                                    </button>
                                ) : (
                                    <svg className="w-6 h-6 text-gray-500 cursor-pointer" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" /></svg>
                                )}
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
