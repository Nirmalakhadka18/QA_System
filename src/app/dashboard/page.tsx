import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";

export default async function DashboardPage() {
    const session = await getServerSession(authOptions);

    if (!session) {
        redirect("/login");
    }

    return (

        <div className="p-8 max-w-7xl mx-auto">
            {/* Hero Section */}
            <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl p-8 mb-8 text-white shadow-xl">
                <h1 className="text-4xl font-bold mb-2">Welcome Back, {session.user.name || "User"}! 👋</h1>
                <p className="text-indigo-100 opacity-90">Here's what's happening with your account today.</p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                {/* Role Card */}
                <div className="bg-white p-6 rounded-xl shadow-md border border-gray-100 hover:shadow-lg transition-shadow">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-gray-500 text-sm font-medium uppercase tracking-wider">Your Role</h3>
                        <span className="p-2 bg-purple-100 text-purple-600 rounded-lg">
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path></svg>
                        </span>
                    </div>
                    <p className="text-2xl font-bold text-gray-900 capitalize">{session.user.role}</p>
                    <p className="text-sm text-gray-400 mt-1">Access Level</p>
                </div>

                {/* Status Card */}
                <div className="bg-white p-6 rounded-xl shadow-md border border-gray-100 hover:shadow-lg transition-shadow">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-gray-500 text-sm font-medium uppercase tracking-wider">Account Status</h3>
                        <span className={`p-2 rounded-lg ${session.user.status === 'approved' ? 'bg-green-100 text-green-600' : 'bg-yellow-100 text-yellow-600'}`}>
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                        </span>
                    </div>
                    <p className={`text-2xl font-bold capitalize ${session.user.status === 'approved' ? 'text-green-600' : 'text-yellow-600'}`}>
                        {session.user.status}
                    </p>
                    <p className="text-sm text-gray-400 mt-1">Current Standing</p>
                </div>

                {/* Date Card */}
                <div className="bg-white p-6 rounded-xl shadow-md border border-gray-100 hover:shadow-lg transition-shadow">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-gray-500 text-sm font-medium uppercase tracking-wider">Member Since</h3>
                        <span className="p-2 bg-blue-100 text-blue-600 rounded-lg">
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
                        </span>
                    </div>
                    <p className="text-2xl font-bold text-gray-900">
                        {new Date(session.user.createdAt || Date.now()).toLocaleDateString("en-US", {
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                        })}
                    </p>
                    <p className="text-sm text-gray-400 mt-1">Join Date</p>
                </div>
            </div>

            {/* Tools Section */}
            <h2 className="text-2xl font-bold mb-4 text-gray-800">Tools</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <Link href="/dashboard/ai-tools" className="block group">
                    <div className="bg-white p-6 rounded-xl shadow-md border border-gray-100 group-hover:shadow-lg transition-all transform group-hover:-translate-y-1">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-gray-500 text-sm font-medium uppercase tracking-wider">AI Tool</h3>
                            <span className="p-2 bg-indigo-100 text-indigo-600 rounded-lg group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
                            </span>
                        </div>
                        <p className="text-2xl font-bold text-gray-900">Video Summarizer</p>
                        <p className="text-sm text-gray-400 mt-1">Summarize YouTube videos & get notes</p>
                    </div>
                </Link>

                <Link href="/dashboard/document-qa" className="block group">
                    <div className="bg-white p-6 rounded-xl shadow-md border border-gray-100 group-hover:shadow-lg transition-all transform group-hover:-translate-y-1">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-gray-500 text-sm font-medium uppercase tracking-wider">Smart Tool</h3>
                            <span className="p-2 bg-emerald-100 text-emerald-600 rounded-lg group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                            </span>
                        </div>
                        <p className="text-2xl font-bold text-gray-900">AI Workspace</p>
                        <p className="text-sm text-gray-400 mt-1">Multi-document QA & Deep Web Search</p>
                    </div>
                </Link>

                {session.user.role === "admin" && (
                    <Link href="/dashboard/admin" className="block group">
                        <div className="bg-white p-6 rounded-xl shadow-md border border-gray-100 group-hover:shadow-lg transition-all transform group-hover:-translate-y-1">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-gray-500 text-sm font-medium uppercase tracking-wider">Admin Tool</h3>
                                <span className="p-2 bg-rose-100 text-rose-600 rounded-lg group-hover:bg-rose-600 group-hover:text-white transition-colors">
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
                                </span>
                            </div>
                            <p className="text-2xl font-bold text-gray-900">Admin Dashboard</p>
                            <p className="text-sm text-gray-400 mt-1">Manage users & approvals</p>
                        </div>
                    </Link>
                )}
            </div>
        </div>
    );
}
