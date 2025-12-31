"use client"

import { useState, useEffect } from "react"
import { Sidebar } from "@/components/layout/sidebar"
import { MobileNav } from "@/components/layout/mobile-nav"
import { Eye, Calendar, Search, Trash2 } from "lucide-react"
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

export default function OrdersPage() {
  const [activeTab, setActiveTab] = useState<"all" | "delivered" | "pending" | "cancelled">("all")
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [filterDate, setFilterDate] = useState("") // changed from date range to single date

  useEffect(() => {
    fetchOrders()
  }, [])

  const fetchOrders = async () => {
    try {
      const response = await fetch("/api/owner/orders")
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

  const handleDelete = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this order?")) return

    try {
      const response = await fetch(`/api/owner/orders/${id}`, { method: "DELETE" })
      if (response.ok) {
        fetchOrders()
      } else {
        alert("Failed to delete order")
      }
    } catch (error) {
      console.error("[v0] Failed to delete order:", error)
      alert("Failed to delete order")
    }
  }

  const filteredOrders = orders.filter((order) => {
    const matchesStatus = activeTab === "all" || order.order_status.toLowerCase() === activeTab
    const matchesSearch =
      order.customers?.shop_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.customers?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.id.toLowerCase().includes(searchQuery.toLowerCase())

    const orderDate = new Date(order.order_date).toLocaleDateString()
    const filterDateStr = filterDate ? new Date(filterDate).toLocaleDateString() : null
    const matchesDate = !filterDate || orderDate === filterDateStr

    return matchesStatus && matchesSearch && matchesDate
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
        <Sidebar role="owner" />
        <main className="flex-1 md:ml-64 pb-20 md:pb-0">
          <div className="p-4 md:p-6">
            <p className="text-muted-foreground">Loading orders...</p>
          </div>
        </main>
        <MobileNav role="owner" />
      </div>
    )
  }

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar role="owner" />
      <main className="flex-1 md:ml-64 pt-16 md:pt-0 pb-20 md:pb-0">
        <div className="bg-card border-b border-border p-4 md:px-6 md:h-20 md:sticky md:top-0 md:z-40 flex flex-col md:flex-row justify-center md:justify-between items-start md:items-center">
          <h1 className="text-xl md:text-2xl font-semibold text-foreground">Order History</h1>
          <p className="text-sm text-muted-foreground mt-1">View and manage all orders</p>
        </div>

        <div className="p-4 md:p-6 space-y-4">
          {/* Tabs */}
          <div className="flex gap-2 mb-6 overflow-x-auto">
            {(["all", "delivered", "pending", "cancelled"] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-2 text-sm font-medium rounded-md whitespace-nowrap transition-colors ${activeTab === tab
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:bg-secondary"
                  }`}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </div>

          <div className="bg-card border border-border rounded-lg p-4 space-y-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
              <input
                type="text"
                placeholder="Search by shop name, customer name, or order ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-3 py-2 bg-input border border-border rounded-md text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
                <input
                  type="date"
                  value={filterDate}
                  onChange={(e) => setFilterDate(e.target.value)}
                  placeholder="Filter by date"
                  className="w-full pl-10 pr-3 py-2 bg-input border border-border rounded-md text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
            </div>
          </div>

          {/* Orders List */}
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
                        By: {order.created_by_user?.full_name || "Owner"} •{" "}
                        {new Date(order.order_date).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex flex-col sm:flex-row items-end sm:items-center gap-3 w-full sm:w-auto">
                      <div className="text-right">
                        <p className="text-xl font-bold text-primary">₹{order.total_amount.toFixed(2)}</p>
                      </div>
                      <div className="flex gap-2 w-full sm:w-auto">
                        <Link href={`/owner/order-details/${order.id}`} className="flex-1 sm:flex-none">
                          <Button variant="outline" size="sm" className="gap-2 bg-transparent w-full">
                            <Eye size={16} />
                            View
                          </Button>
                        </Link>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDelete(order.id)}
                          className="gap-2 text-destructive hover:text-destructive hover:bg-destructive/10 flex-1 sm:flex-none"
                        >
                          <Trash2 size={16} />
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </main>
      <MobileNav role="owner" />
    </div>
  )
}
