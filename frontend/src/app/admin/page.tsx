"use client";

import React, { useState, useEffect } from "react";
import axios from "axios";
import { useRouter } from "next/navigation";
import io from "socket.io-client";

const AdminDashboard = () => {
  const [onlineUsers, setOnlineUsers] = useState(0);
  const [totalUsers, setTotalUsers] = useState(0);
  const [userList, setUserList] = useState([]);
  const router = useRouter();

  useEffect(() => {
    const socket = io(process.env.NEXT_PUBLIC_API_URL, {
      transports: ["websocket"],
    });

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
      } catch (error) {
        console.error("Error fetching admin data:", error);
      }
    };

    fetchAdminData();

    socket.on("connect", () => {
      console.log("Connected to server");
    });

    socket.on("onlineUsersUpdate", (count) => {
      console.log("Received online users update:", count);
      setOnlineUsers(count);
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    router.push("/login");
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Admin Dashboard</h1>
      <div className="mb-4">
        <p className="text-lg">Online Users: {onlineUsers}</p>
        <p className="text-lg">Total Users: {totalUsers}</p>
      </div>
      <h2 className="text-xl font-semibold mb-2">User List</h2>
      <ul className="space-y-2">
        {userList?.map((user, index) => (
          <li key={index} className="bg-gray-100 p-2 rounded">
            {user?.username} - Portfolio Value: ${user?.portfolioValue}
          </li>
        ))}
      </ul>
      <button
        onClick={handleLogout}
        className="mt-4 bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
      >
        Logout
      </button>
    </div>
  );
};

export default AdminDashboard;
