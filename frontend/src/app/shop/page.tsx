"use client";

import React, { useState, useEffect } from "react";
import { Copy } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import useStore from "@/store";
import { useRouter } from "next/navigation";

interface Product {
  _id: string;
  name: string;
  price: number;
  requiredCoin: string;
  description: string;
}

interface User {
  balance: number;
  holdings: Record<string, number>;
  username: string;
}

interface PurchaseCode {
  code: string;
  product: string;
}

interface Notification {
  type: "success" | "error";
  message: string;
}

const Shop = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [purchaseCode, setPurchaseCode] = useState<PurchaseCode | null>(null);
  const [notification, setNotification] = useState<Notification | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const { isAdmin } = useStore();
  const router = useRouter();

  useEffect(() => {
    fetchUserAndProducts();
  }, []);


  const handleLogout = () => {
    localStorage.removeItem("token");
    router.push("/login");
  };

  const fetchUserAndProducts = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        router.push("/login");
        return;
      }

      const [userResponse, productsResponse] = await Promise.all([
        fetch("/api/user", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }),
        fetch("/api/shop/products", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }),
      ]);

      const [userData, productsData] = await Promise.all([
        userResponse.json(),
        productsResponse.json(),
      ]);

      setUser(userData);
      setProducts(productsData);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching data:", error);
      setNotification({
        type: "error",
        message: "Failed to load data",
      });
    }
  };

  const handlePurchase = async (productId: string) => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        router.push("/login");
        return;
      }

      const response = await fetch("/api/shop/purchase", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ productId }),
      });

      const data = await response.json();

      if (response.ok) {
        setPurchaseCode({
          code: data.code,
          product: data.product,
        });
        setNotification({
          type: "success",
          message: "Purchase successful!",
        });
        fetchUserAndProducts();
      } else {
        throw new Error(data.message);
      }
    } catch (error) {
      setNotification({
        type: "error",
        message: error instanceof Error ? error.message : "An error occurred",
      });
    }
  };

  const copyToClipboard = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code);
      setNotification({
        type: "success",
        message: "Code copied to clipboard!",
      });
    } catch (err) {
      console.error("Error copying code:", err);
      setNotification({
        type: "error",
        message: "Failed to copy code",
      });
    }
  };

  setInterval(() => {
    if (notification) {
      setNotification(null);
      setPurchaseCode(null);
    }
  }, 10000);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 text-gray-100 p-6 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 text-gray-100 p-6">
      <nav className="bg-gray-800 bg-opacity-50 backdrop-filter backdrop-blur-lg sticky top-0 z-10 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col sm:flex-row items-center justify-between h-auto sm:h-16 py-2 sm:py-0">
            <div className="flex items-center justify-center w-full sm:w-auto mb-2 sm:mb-0">
              <Image
                src="/icons/Pepe_nervous_sweat.png"
                alt="PepeExchange Logo"
                width={32}
                height={32}
                className="w-8 h-8"
                priority
              />
              <span className="text-xl font-bold text-green-400 ml-2">
                PepeExchange
              </span>
            </div>
            <div className="flex items-center space-x-4">
              {isAdmin && (
                <Link
                  href="/admin"
                  className="px-3 py-2 rounded-md text-sm font-medium text-gray-300 hover:bg-gray-700 hover:text-white transition duration-150 ease-in-out"
                >
                  Admin
                </Link>
              )}
              <Link
                href="/marketplace"
                className="px-3 py-2 rounded-md text-sm font-medium text-gray-300 hover:bg-gray-700 hover:text-white transition duration-150 ease-in-out"
              >
                Market
              </Link>
              <Link
                href="/shop"
                className="px-3 py-2 rounded-md text-sm font-medium text-gray-300 hover:bg-gray-700 hover:text-white transition duration-150 ease-in-out"
              >
                Shop
              </Link>
              <button
                onClick={handleLogout}
                className="px-3 py-2 rounded-md text-sm font-medium text-gray-300 hover:bg-gray-700 hover:text-white transition duration-150 ease-in-out"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto py-10">
        <div className="mb-8">
          {user && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="bg-gray-800 bg-opacity-50 backdrop-blur-lg rounded-lg p-6">
                <h2 className="text-xl font-bold text-white mb-2">Balance</h2>
                <p className="text-2xl font-bold text-green-400">
                  ${user.balance.toLocaleString()}
                </p>
              </div>
              <div className="bg-gray-800 bg-opacity-50 backdrop-blur-lg rounded-lg p-6">
                <h2 className="text-xl font-bold text-white mb-2">Holdings</h2>
                <div className="space-y-2">
                  {Object.entries(user.holdings).map(([coin, amount]) => (
                    <div key={coin} className="flex justify-between">
                      <span className="text-gray-300">{coin}:</span>
                      <span className="font-medium">{amount}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="bg-gray-800 bg-opacity-50 backdrop-blur-lg rounded-lg p-6">
                <h2 className="text-xl font-bold text-white mb-2">Username</h2>
                <p className="text-lg text-gray-300">{user.username}</p>
              </div>
            </div>
          )}

          {purchaseCode && (
            <div className="mb-6 bg-green-900 border border-green-500 rounded-lg p-4">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-lg font-bold mb-1">
                    Purchase Successful!
                  </h3>
                  <p className="text-gray-300">
                    Your code for {purchaseCode.product}:{" "}
                    <span className="font-mono bg-green-800 px-2 py-1 rounded">
                      {purchaseCode.code}
                    </span>
                  </p>
                </div>
                <button
                  onClick={() => copyToClipboard(purchaseCode.code)}
                  className="p-2 hover:bg-green-800 rounded-full transition-colors"
                >
                  <Copy className="w-5 h-5" />
                </button>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {products.map((product) => (
              <div
                key={product._id}
                className="bg-gray-800 bg-opacity-50 backdrop-blur-lg rounded-lg overflow-hidden"
              >
                <div className="p-6">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xl font-bold">{product.name}</h3>
                    <span className="text-sm text-gray-400">
                      {product.price} {product.requiredCoin}
                    </span>
                  </div>
                  <p className="text-gray-300 mb-4">{product.description}</p>
                  <button
                    onClick={() => handlePurchase(product._id)}
                    className="w-full px-4 py-2 bg-green-600 hover:bg-green-700 rounded-lg transition-colors font-medium"
                  >
                    Purchase
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {notification && (
        <div
          className={`fixed bottom-4 right-4 px-4 py-2 rounded-lg ${
            notification.type === "success" ? "bg-green-500" : "bg-red-500"
          } text-white flex items-center justify-between`}
        >
          {notification.message}
          <button
            onClick={() => setNotification(null)}
            className="ml-4 text-white font-bold hover:opacity-75"
          >
            ×
          </button>
        </div>
      )}
    </div>
  );
};

export default Shop;
