"use client"

import { useState, useEffect } from "react"
import { Sidebar } from "@/components/layout/sidebar"
import { MobileNav } from "@/components/layout/mobile-nav"
import { Eye } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"

interface Order {
  id: string
  customer_id: string
  total_amount: number
  order_status: string
  order_date: string
  customers?: {
    name: string
    shop_name: string
    phone: string
  }
  created_by_user?: {
    full_name: string
    role: string
  }
}

export default function LabourOrdersPage() {
  const [activeTab, setActiveTab] = useState<"all" | "delivered" | "pending" | "cancelled">("all")
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchOrders()
  }, [])

  const fetchOrders = async () => {
    try {
      const response = await fetch("/api/labour/orders")
      if (response.ok) {
        const data = await response.json()
        setOrders(data)
      }
    } catch (error) {
      console.error("[v0] Failed to fetch orders:", error)
    } finally {
      setLoading(false)
    }
  }

  const filteredOrders = orders.filter((order) => {
    if (activeTab === "all") return true
    return order.order_status.toLowerCase() === activeTab
  })

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "delivered":
        return "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300"
      case "confirmed":
      case "pending":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300"
      case "cancelled":
        return "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300"
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-300"
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen bg-background">
        <Sidebar role="labour" />
        <main className="flex-1 md:ml-64 pt-16 md:pt-0 pb-20 md:pb-0">
          <div className="p-4 md:p-6">
            <p className="text-muted-foreground">Loading orders...</p>
          </div>
        </main>
        <MobileNav role="labour" />
      </div>
    )
  }

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar role="labour" />
      <main className="flex-1 md:ml-64 pt-16 md:pt-0 pb-20 md:pb-0">
        <div className="bg-card border-b border-border p-4 md:p-6 md:sticky md:top-0 md:z-40">
          <h1 className="text-2xl md:text-3xl font-bold text-foreground">My Orders</h1>
          <p className="text-sm text-muted-foreground mt-1">View your created orders</p>
        </div>

        <div className="p-4 md:p-6">
          {/* Tabs */}
          <div className="flex gap-2 mb-6 overflow-x-auto">
            {(["all", "delivered", "pending", "cancelled"] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-2 text-sm font-medium rounded-md whitespace-nowrap transition-colors ${
                  activeTab === tab
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground hover:bg-secondary"
                }`}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </div>

          <div className="space-y-3">
            {filteredOrders.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">No orders found</p>
            ) : (
              filteredOrders.map((order) => (
                <div
                  key={order.id}
                  className="bg-card border border-border rounded-lg p-4 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between gap-4 flex-col sm:flex-row">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <p className="font-bold text-foreground">#{order.id.slice(0, 8)}</p>
                        <span
                          className={`inline-block px-2 py-1 text-xs font-medium rounded ${getStatusColor(order.order_status)}`}
                        >
                          {order.order_status}
                        </span>
                      </div>
                      <p className="font-medium text-foreground">{order.customers?.name || "Unknown"}</p>
                      <p className="text-sm text-muted-foreground">{order.customers?.shop_name || "Unknown"}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {new Date(order.order_date).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                      <div className="text-right">
                        <p className="text-xl font-bold text-primary">₹{order.total_amount.toFixed(2)}</p>
                      </div>
                      <Link href={`/labour/order-details/${order.id}`}>
                        <Button variant="outline" size="sm" className="gap-2 bg-transparent">
                          <Eye size={16} />
                          View
                        </Button>
                      </Link>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </main>
      <MobileNav role="labour" />
    </div>
  )
}
