"use client";

import { useState, useEffect } from "react";
// import { getUsers, updateUserStatus } from "@/app/actions/admin"; // Import actions - we'll need to fix this path if it's wrong
import { getUsers, updateUserStatus } from "../../actions/admin";
import { motion } from "framer-motion";

interface User {
    id: string;
    name: string | null;
    email: string;
    role: string;
    status: string;
    createdAt: Date | null;
}

export default function AdminDashboard() {
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        try {
            const result = await getUsers();
            if (result.success && result.data) {
                // Cast the date properly
                const mappedUsers = result.data.map((u: any) => ({
                    ...u,
                    createdAt: u.createdAt ? new Date(u.createdAt) : null
                }));
                setUsers(mappedUsers);
            }
        } catch (error) {
            console.error("Error fetching users:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleStatusUpdate = async (userId: string, status: "approved" | "rejected") => {
        const result = await updateUserStatus(userId, status);
        if (result.success) {
            // Optimistic update
            setUsers(users.map(u => u.id === userId ? { ...u, status } : u));
        } else {
            alert("Failed to update status");
        }
    };

    const stats = {
        total: users.length,
        approved: users.filter(u => u.status === "approved").length,
        pending: users.filter(u => u.status === "pending").length,
        rejected: users.filter(u => u.status === "rejected").length,
    };

    return (
        <div className="min-h-screen p-8 text-white">
            <div className="max-w-6xl mx-auto">
                <header className="mb-8">
                    <h1 className="text-3xl font-bold text-white drop-shadow-sm flex items-center gap-2">
                        Admin Dashboard <span className="text-2xl">🛡️</span>
                    </h1>
                    <p className="text-indigo-200">Manage users and approvals</p>
                </header>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                    <StatCard title="Total Users" value={stats.total} icon="👥" color="indigo" />
                    <StatCard title="Approved" value={stats.approved} icon="✅" color="green" />
                    <StatCard title="Pending" value={stats.pending} icon="🕒" color="yellow" />
                    <StatCard title="Rejected" value={stats.rejected} icon="🚫" color="red" />
                </div>

                {/* Pending Approvals Table */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white/10 backdrop-blur-md rounded-2xl shadow-xl border border-white/20 p-8 overflow-hidden"
                >
                    <h2 className="text-2xl font-bold mb-6 text-white border-b border-white/20 pb-4 flex items-center gap-2">
                        <span className="bg-yellow-500/20 p-1.5 rounded-lg">🕒</span> Pending Approvals
                    </h2>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="text-indigo-200 border-b border-white/10">
                                    <th className="p-4 font-medium">Name</th>
                                    <th className="p-4 font-medium">Email</th>
                                    <th className="p-4 font-medium">Status</th>
                                    <th className="p-4 font-medium">Date</th>
                                    <th className="p-4 font-medium text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/10">
                                {users.filter(u => u.status === "pending").length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="p-8 text-center text-indigo-200 italic">
                                            No pending users found.
                                        </td>
                                    </tr>
                                ) : (
                                    users.filter(u => u.status === "pending").map((user) => (
                                        <tr key={user.id} className="hover:bg-white/5 transition-colors">
                                            <td className="p-4 font-semibold text-white">{user.name || "N/A"}</td>
                                            <td className="p-4 text-indigo-100">{user.email}</td>
                                            <td className="p-4">
                                                <span className="px-3 py-1 rounded-full text-xs font-medium bg-yellow-500/20 text-yellow-200 border border-yellow-500/30">
                                                    {user.status}
                                                </span>
                                            </td>
                                            <td className="p-4 text-indigo-200 text-sm">
                                                {user.createdAt?.toLocaleDateString()}
                                            </td>
                                            <td className="p-4 text-right space-x-2">
                                                <button
                                                    onClick={() => handleStatusUpdate(user.id, "approved")}
                                                    className="px-4 py-2 bg-green-600 hover:bg-green-500 text-white rounded-lg text-sm font-medium transition-all shadow hover:shadow-green-500/30"
                                                >
                                                    Approve
                                                </button>
                                                <button
                                                    onClick={() => handleStatusUpdate(user.id, "rejected")}
                                                    className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded-lg text-sm font-medium transition-all shadow hover:shadow-red-500/30"
                                                >
                                                    Reject
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </motion.div>

                {/* All Users Table (Optional, keeping getting started simple) */}
                <div className="mt-8 text-center">
                    <p className="text-indigo-300 text-sm">Showing {users.length} total users in system.</p>
                </div>
            </div>
        </div>
    );
}

function StatCard({ title, value, icon, color }: { title: string, value: number, icon: string, color: string }) {
    return (
        <div className={`bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20 shadow-lg`}>
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-indigo-100 font-medium">{title}</h3>
                <span className="text-2xl">{icon}</span>
            </div>
            <p className="text-3xl font-bold text-white">{value}</p>
        </div>
    );
}
