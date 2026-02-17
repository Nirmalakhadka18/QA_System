"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type User = {
    id: string;
    name: string | null;
    email: string;
    status: string;
    role: string;
    createdAt: Date | null;
};

export default function AdminDashboard({
    initialPendingUsers,
    approvedUsers
}: {
    initialPendingUsers: User[],
    approvedUsers: User[]
}) {
    // Combine users directly for the table, or keep them separate. 
    // The screenshot showed a unified list. 
    // We will merge them for display but can filter if needed.
    const [users, setUsers] = useState<User[]>([...initialPendingUsers, ...approvedUsers]);
    const router = useRouter();

    const handleApprove = async (userId: string) => {
        try {
            const res = await fetch("/api/admin/approve", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ userId }),
            });

            if (res.ok) {
                setUsers(prev => prev.map(user =>
                    user.id === userId ? { ...user, status: 'approved' } : user
                ));
                router.refresh();
            } else {
                alert("Failed to approve user");
            }
        } catch (error) {
            console.error("Error approving user:", error);
        }
    };

    const handleRevoke = async (userId: string) => {
        if (!confirm("Are you sure you want to revoke access for this user?")) return;

        try {
            const res = await fetch("/api/admin/revoke", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ userId }),
            });

            if (res.ok) {
                setUsers(prev => prev.map(user =>
                    user.id === userId ? { ...user, status: 'pending' } : user
                ));
                router.refresh();
            } else {
                alert("Failed to revoke user");
            }
        } catch (error) {
            console.error("Error revoking user:", error);
        }
    };

    return (
        <div className="bg-[#0f172a] min-h-[500px] text-gray-300 p-6 rounded-lg shadow-xl border border-gray-800">
            <div className="mb-6">
                <h2 className="text-xl font-semibold text-gray-100">User Management</h2>
                <p className="text-sm text-gray-500">Approve or revoke user access.</p>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="border-b border-gray-700 text-gray-400 text-sm uppercase tracking-wider">
                            <th className="p-4 font-semibold">Name</th>
                            <th className="p-4 font-semibold">Email</th>
                            <th className="p-4 font-semibold">Role</th>
                            <th className="p-4 font-semibold">Status</th>
                            <th className="p-4 font-semibold text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-800">
                        {users.map((user) => (
                            <tr key={user.id} className="hover:bg-gray-800/50 transition-colors">
                                <td className="p-4 font-medium text-white">{user.name || "No Name"}</td>
                                <td className="p-4">{user.email}</td>
                                <td className="p-4">
                                    <span className={`px-2 py-1 rounded text-xs font-semibold ${user.role === 'admin' ? 'bg-purple-900/50 text-purple-300' : 'bg-blue-900/50 text-blue-300'}`}>
                                        {user.role}
                                    </span>
                                </td>
                                <td className="p-4">
                                    <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${user.status === 'approved'
                                            ? 'bg-green-900/20 text-green-400 border-green-800'
                                            : 'bg-yellow-900/20 text-yellow-400 border-yellow-800'
                                        }`}>
                                        {user.status === 'approved' ? 'Approved' : 'Pending'}
                                    </span>
                                </td>
                                <td className="p-4 text-right space-x-2">
                                    {user.status === 'pending' && (
                                        <button
                                            onClick={() => handleApprove(user.id)}
                                            className="px-3 py-1 bg-green-600 hover:bg-green-500 text-white text-xs font-medium rounded transition"
                                        >
                                            Approve
                                        </button>
                                    )}
                                    {user.status === 'approved' && user.role !== 'admin' && (
                                        <button
                                            onClick={() => handleRevoke(user.id)}
                                            className="text-red-500 hover:text-red-400 font-medium text-sm transition"
                                        >
                                            Revoke
                                        </button>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {users.length === 0 && (
                    <div className="p-8 text-center text-gray-500">
                        No users found.
                    </div>
                )}
            </div>
        </div>
    );
}
