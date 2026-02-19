"use client";

import { useState, useEffect, useRef } from "react";
import ReactMarkdown from "react-markdown";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";

interface Document {
    id: string;
    name: string;
    type: string;
    workspaceId: string | null;
    createdAt: string;
}

interface Workspace {
    id: string;
    name: string;
    createdAt: string;
}

export default function DocumentQAPage() {
    const [documents, setDocuments] = useState<Document[]>([]);
    const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
    const [selectedDocId, setSelectedDocId] = useState<string>("");
    const [selectedWorkspaceId, setSelectedWorkspaceId] = useState<string>("");
    const [question, setQuestion] = useState("");
    const [messages, setMessages] = useState<{ role: 'user' | 'ai', content: string }[]>([]);
    const [loading, setLoading] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [deepSearch, setDeepSearch] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        fetchDocuments();
        fetchWorkspaces();
    }, []);

    useEffect(() => {
        setMessages([]); // Clear chat when changing context
    }, [selectedDocId, selectedWorkspaceId]);

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

    const fetchWorkspaces = async () => {
        try {
            const res = await fetch("/api/workspace");
            const data = await res.json();
            if (res.ok) setWorkspaces(data);
        } catch (err) {
            console.error("Failed to fetch workspaces");
        }
    };

    const handleCreateWorkspace = async () => {
        const name = prompt("Enter workspace name:");
        if (!name) return;

        try {
            const res = await fetch("/api/workspace", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name }),
            });
            if (res.ok) fetchWorkspaces();
        } catch (err) {
            console.error("Failed to create workspace");
        }
    };

    const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files || files.length === 0) return;

        setUploading(true);
        setError("");
        setSuccess("");

        for (let i = 0; i < files.length; i++) {
            const formData = new FormData();
            formData.append("file", files[i]);
            if (selectedWorkspaceId) {
                formData.append("workspaceId", selectedWorkspaceId);
            }

            try {
                const res = await fetch("/api/documents/upload", {
                    method: "POST",
                    body: formData,
                });

                if (!res.ok) {
                    const data = await res.json();
                    throw new Error(data.error || "Upload failed");
                }
            } catch (err: any) {
                setError(`Failed to upload ${files[i].name}: ${err.message}`);
                setUploading(false);
                return;
            }
        }

        setSuccess("Files uploaded successfully!");
        fetchDocuments();
        setUploading(false);
    };

    const handleAsk = async () => {
        if ((!selectedDocId && !selectedWorkspaceId) || !question.trim()) return;

        const currentQuestion = question;
        setQuestion("");
        setMessages(prev => [...prev, { role: 'user', content: currentQuestion }]);
        setLoading(true);
        setError("");

        try {
            const res = await fetch("/api/documents/qa", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    documentId: selectedDocId || undefined,
                    workspaceId: selectedWorkspaceId || undefined,
                    question: currentQuestion,
                    deepSearch
                }),
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

    const handleDelete = async (id: string, isWorkspace = false) => {
        if (!confirm(`Are you sure you want to delete this ${isWorkspace ? 'workspace' : 'document'}?`)) return;

        try {
            const endpoint = isWorkspace ? `/api/workspace?id=${id}` : `/api/documents?id=${id}`;
            const res = await fetch(endpoint, { method: "DELETE" });
            if (res.ok) {
                if (isWorkspace) {
                    fetchWorkspaces();
                    if (selectedWorkspaceId === id) handleNewChat();
                } else {
                    fetchDocuments();
                    if (selectedDocId === id) handleNewChat();
                }
            }
        } catch (err) {
            console.error("Delete failed");
        }
    };

    const handleNewChat = () => {
        setSelectedDocId("");
        setSelectedWorkspaceId("");
        setMessages([]);
        setQuestion("");
        setDeepSearch(false);
    };

    const activeWorkspaceDocs = documents.filter(doc => doc.workspaceId === selectedWorkspaceId);
    const soloDocs = documents.filter(doc => !doc.workspaceId);

    return (
        <div className="flex h-screen font-sans text-gray-800 overflow-hidden bg-[#0A0A0A]">
            {/* Sidebar (Sleek Dark Mode) */}
            <div className="w-[280px] bg-[#111] border-r border-white/5 flex flex-col flex-shrink-0 hidden md:flex shadow-2xl relative z-30">
                <div className="p-4">
                    <div onClick={handleNewChat} className="flex items-center gap-3 px-4 py-3 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 cursor-pointer transition-all duration-300 shadow-sm mb-6 group text-white">
                        <div className="w-8 h-8 rounded-lg bg-indigo-500 text-white flex items-center justify-center group-hover:scale-110 transition-transform">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" /></svg>
                        </div>
                        <span className="text-sm font-semibold tracking-wide">New AI Chat</span>
                    </div>

                    <button
                        onClick={handleCreateWorkspace}
                        className="w-full flex items-center justify-between px-4 py-2 text-xs font-bold text-gray-400 uppercase tracking-widest hover:text-white transition-colors mb-2"
                    >
                        <span>Workspaces</span>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto px-3 pb-4 custom-scrollbar space-y-6">
                    {/* Workspaces List */}
                    <div className="space-y-1">
                        {workspaces.map((ws) => (
                            <div key={ws.id} className="relative group">
                                <div
                                    onClick={() => { setSelectedWorkspaceId(ws.id); setSelectedDocId(""); }}
                                    className={`flex items-center gap-3 px-4 py-2.5 rounded-lg cursor-pointer text-sm transition-all duration-200 ${selectedWorkspaceId === ws.id ? 'bg-indigo-500/20 text-indigo-400 font-medium border border-indigo-500/30' : 'text-gray-400 hover:bg-white/5 hover:text-white'}`}
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" /></svg>
                                    <span className="truncate">{ws.name}</span>
                                </div>
                                <button
                                    onClick={(e) => { e.stopPropagation(); handleDelete(ws.id, true); }}
                                    className="absolute right-2 top-2.5 p-1 text-gray-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                </button>
                            </div>
                        ))}
                    </div>

                    <div className="h-px bg-white/5 mx-2" />

                    {/* Individual Files List */}
                    <div>
                        <div className="px-4 py-2 text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Documents</div>
                        <div className="space-y-1">
                            {(selectedWorkspaceId ? activeWorkspaceDocs : soloDocs).map((doc) => (
                                <div key={doc.id} className="relative group">
                                    <div
                                        onClick={() => { setSelectedDocId(doc.id); setSelectedWorkspaceId(""); }}
                                        className={`flex items-center gap-3 px-4 py-2.5 rounded-lg cursor-pointer text-sm transition-all duration-200 ${selectedDocId === doc.id ? 'bg-indigo-500/20 text-indigo-400 font-medium border border-indigo-500/30' : 'text-gray-400 hover:bg-white/5 hover:text-white'}`}
                                    >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                                        <span className="truncate">{doc.name}</span>
                                    </div>
                                    <button
                                        onClick={(e) => { e.stopPropagation(); handleDelete(doc.id); }}
                                        className="absolute right-2 top-2.5 p-1 text-gray-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                                    >
                                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Footer Account Section */}
                <div className="p-4 border-t border-white/5">
                    <Link href="/dashboard" className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-white/5 transition-all text-gray-400 hover:text-white group">
                        <div className="w-9 h-9 rounded-full bg-indigo-500/10 text-indigo-400 flex items-center justify-center text-sm font-bold border border-indigo-500/20 group-hover:scale-110 transition-transform">U</div>
                        <div className="flex-1 text-sm font-semibold tracking-tight">Main Dashboard</div>
                        <svg className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" /></svg>
                    </Link>
                </div>
            </div>

            {/* Main Content (Futuristic AI Backdrop) */}
            <div className="flex-1 flex flex-col relative h-full overflow-hidden">
                {/* Background Glow */}
                <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
                    <div className="absolute -top-1/4 -right-1/4 w-1/2 h-1/2 bg-indigo-500/10 blur-[120px] rounded-full animate-pulse" />
                    <div className="absolute -bottom-1/4 -left-1/4 w-1/2 h-1/2 bg-indigo-600/5 blur-[120px] rounded-full animate-pulse delay-700" />
                </div>

                {!selectedDocId && !selectedWorkspaceId ? (
                    <div className="flex-1 flex flex-col items-center justify-center p-6 relative z-10">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="text-center"
                        >
                            <div className="mb-8 inline-block">
                                <div className="bg-indigo-500/10 p-5 rounded-3xl border border-indigo-500/20 backdrop-blur-xl shadow-2xl">
                                    <svg className="w-12 h-12 text-indigo-400" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z" /></svg>
                                </div>
                            </div>
                            <h2 className="text-4xl md:text-5xl font-bold text-white mb-4 tracking-tight">How can I assist you?</h2>
                            <p className="text-gray-400 max-w-md mx-auto mb-12 text-lg">Pick a workspace or drag documents to begin an intelligent cross-file session.</p>

                            {/* Upload Area */}
                            <div className="w-full max-w-2xl group flex flex-col gap-4">
                                {error && <p className="text-red-400 text-sm bg-red-500/10 py-2 rounded-lg border border-red-500/20">{error}</p>}
                                <label className="relative flex flex-col items-center justify-center w-full h-40 border-2 border-dashed border-white/10 rounded-2xl bg-white/5 hover:bg-white/[0.07] hover:border-indigo-500/30 transition-all cursor-pointer">
                                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                        <svg className="w-10 h-10 mb-3 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" /></svg>
                                        <p className="mb-2 text-sm text-gray-300 font-medium">Click to upload files or drag and drop</p>
                                        <p className="text-xs text-gray-500">PDF, TXT (Max 10MB per file)</p>
                                    </div>
                                    <input type="file" className="hidden" multiple accept=".pdf,.txt" onChange={handleUpload} disabled={uploading} />
                                    {uploading && (
                                        <div className="absolute inset-0 bg-black/60 rounded-2xl flex flex-col items-center justify-center">
                                            <div className="w-10 h-10 border-4 border-indigo-400 border-t-white rounded-full animate-spin mb-4" />
                                            <span className="text-white text-sm font-medium">Processing documents...</span>
                                        </div>
                                    )}
                                </label>
                            </div>
                        </motion.div>
                    </div>
                ) : (
                    <>
                        {/* Chat Top Bar */}
                        <div className="sticky top-0 w-full p-4 bg-[#111]/80 backdrop-blur-xl border-b border-white/5 z-20 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-lg bg-indigo-500/20 text-indigo-400 flex items-center justify-center">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
                                </div>
                                <div>
                                    <h3 className="text-white font-semibold text-sm leading-none mb-1">
                                        {selectedWorkspaceId ? workspaces.find((w: Workspace) => w.id === selectedWorkspaceId)?.name : documents.find((d: Document) => d.id === selectedDocId)?.name}
                                    </h3>
                                    <span className="text-gray-500 text-[10px] uppercase font-bold tracking-widest">
                                        {selectedWorkspaceId ? `${activeWorkspaceDocs.length} Documents Active` : 'Individual File'}
                                    </span>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <button className="p-2 text-gray-400 hover:text-white transition-colors"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" /></svg></button>
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto px-4 py-8 custom-scrollbar">
                            <div className="max-w-4xl mx-auto space-y-10">
                                <AnimatePresence>
                                    {messages.map((msg, idx) => (
                                        <motion.div
                                            key={idx}
                                            initial={{ opacity: 0, x: msg.role === 'ai' ? -10 : 10 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            className={`flex gap-4 md:gap-6 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
                                        >
                                            <div className={`w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-lg ${msg.role === 'ai' ? 'bg-[#1A1A1A] text-indigo-400 border border-white/5' : 'bg-indigo-500 text-white'}`}>
                                                {msg.role === 'ai' ? <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg> : <span className="font-bold">U</span>}
                                            </div>
                                            <div className={`max-w-[85%] md:max-w-[75%] rounded-3xl p-5 shadow-2xl ${msg.role === 'ai' ? 'bg-[#1A1A1A] text-gray-200 border border-white/5' : 'bg-indigo-500 text-white'}`}>
                                                <div className="prose prose-sm prose-invert max-w-none prose-headings:text-white prose-p:leading-relaxed">
                                                    <ReactMarkdown>{msg.content}</ReactMarkdown>
                                                </div>
                                            </div>
                                        </motion.div>
                                    ))}
                                </AnimatePresence>
                                {loading && (
                                    <div className="flex gap-4 md:gap-6">
                                        <div className="w-10 h-10 rounded-2xl bg-[#1A1A1A] flex items-center justify-center text-indigo-400 border border-white/5 shadow-lg">
                                            <div className="w-5 h-5 border-2 border-indigo-400 border-t-white rounded-full animate-spin" />
                                        </div>
                                        <div className="flex gap-2 items-center text-gray-500 text-sm italic py-4">
                                            AI is scanning context...
                                        </div>
                                    </div>
                                )}
                                <div ref={messagesEndRef} />
                            </div>
                        </div>

                        {/* Smart Input Dock */}
                        <div className="p-4 md:p-8 relative z-20">
                            <div className="max-w-4xl mx-auto backdrop-blur-2xl bg-white/[0.03] rounded-3xl p-2 border border-white/5 shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
                                <div className="flex flex-col gap-2">
                                    <textarea
                                        rows={1}
                                        className="w-full bg-transparent border-none focus:ring-0 text-white placeholder-gray-500 text-base py-3 px-4 resize-none max-h-48 custom-scrollbar"
                                        placeholder="Ask a question across all documents..."
                                        value={question}
                                        onChange={(e) => setQuestion(e.target.value)}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter' && !e.shiftKey) {
                                                e.preventDefault();
                                                handleAsk();
                                            }
                                        }}
                                    />
                                    <div className="flex items-center justify-between px-2 pb-2">
                                        <div className="flex items-center gap-2">
                                            <button
                                                onClick={() => setDeepSearch(!deepSearch)}
                                                className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold transition-all ${deepSearch ? 'bg-indigo-500 text-white shadow-[0_0_15px_rgba(99,102,241,0.5)]' : 'bg-white/5 text-gray-400 hover:text-white'}`}
                                            >
                                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                                                Deep Web Search
                                            </button>
                                            <label className="p-2 text-gray-500 hover:text-indigo-400 cursor-pointer transition-colors" title="Add more files">
                                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" /></svg>
                                                <input type="file" className="hidden" multiple accept=".pdf,.txt" onChange={handleUpload} />
                                            </label>
                                        </div>
                                        <button
                                            onClick={handleAsk}
                                            disabled={!question.trim() || loading}
                                            className={`p-2.5 rounded-2xl transition-all ${!question.trim() || loading ? 'bg-white/5 text-gray-700' : 'bg-indigo-500 text-white hover:scale-110 shadow-lg'}`}
                                        >
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 12h14M12 5l7 7-7 7" /></svg>
                                        </button>
                                    </div>
                                </div>
                            </div>
                            <p className="text-center mt-4 text-[10px] text-gray-600 font-bold uppercase tracking-[0.2em]">Powered by Gemini 1.5 Flash • Context: 1M Tokens</p>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}
