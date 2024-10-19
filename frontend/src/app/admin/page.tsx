"use client";

import React, { useState, useEffect } from "react";
import axios from "axios";
import { useRouter } from "next/navigation";
import { Users, UserPlus, LogOut } from "lucide-react";

type User = {
  username: string;
  portfolioValue: number;
};

export default function AdminDashboard() {
  const [onlineUsers, setOnlineUsers] = useState(0);
  const [totalUsers, setTotalUsers] = useState(0);
  const [userList, setUserList] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
   

    const fetchAdminData = async () => {
      try {
        const [onlineUsersRes, totalUsersRes, userListRes] = await Promise.all([
          axios.get(
            `${process.env.NEXT_PUBLIC_API_URL}/api/admin/online-users`
          ),
          axios.get(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/total-users`),
          axios.get(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/user-list`),
        ]);

        setOnlineUsers(onlineUsersRes.data.onlineUsers);
        setTotalUsers(totalUsersRes.data.totalUsers);
        setUserList(userListRes.data);
        setIsLoading(false);
      } catch (error) {
        console.error("Error fetching admin data:", error);
        setError("Failed to fetch admin data. Please try again.");
        setIsLoading(false);
      }
    };

    fetchAdminData();

  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    router.push("/login");
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        Loading...
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center h-screen text-red-500">
        {error}
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 bg-gray-50 min-h-screen">
      <header className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-800">Admin Dashboard</h1>
        <button
          onClick={handleLogout}
          className="flex items-center px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
        >
          <LogOut className="w-4 h-4 mr-2" />
          Logout
        </button>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <StatCard icon={Users} label="Online Users" value={onlineUsers} />
        <StatCard icon={UserPlus} label="Total Users" value={totalUsers} />
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4 text-gray-800">User List</h2>
        <ul className="space-y-2">
          {userList.map((user, index) => (
            <li
              key={index}
              className="bg-gray-100 p-3 rounded flex justify-between items-center"
            >
              <span className="text-gray-800">{user.username}</span>
              <span className="font-semibold text-gray-900">
                Portfolio Value: ${user.portfolioValue.toLocaleString()}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ElementType;
  label: string;
  value: number;
}) {
  return (
    <div className="bg-white rounded-lg shadow p-6 flex items-center">
      <Icon className="w-12 h-12 text-blue-500 mr-4" />
      <div>
        <h2 className="text-lg font-semibold text-gray-800">{label}</h2>
        <p className="text-2xl font-bold text-gray-900">{value}</p>
      </div>
    </div>
  );
}
