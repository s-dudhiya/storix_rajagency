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
      <main className="flex-1 md:ml-64 pb-20 md:pb-0">
        <div className="bg-card/50 backdrop-blur-sm border-b border-border/50 h-20 px-4 md:px-8 sticky top-0 z-40 transition-all duration-200 flex items-center justify-between gap-4">
          <div className="flex flex-col justify-center h-full">
            <h1 className="text-xl md:text-2xl font-semibold text-foreground tracking-tight">Order History</h1>
            <p className="text-xs font-medium text-muted-foreground hidden md:block">View and track all customer orders</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="hidden md:flex bg-muted/50 rounded-lg p-1 border border-border/50">
              {(["all", "delivered", "pending", "cancelled"] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all duration-200 ${activeTab === tab
                    ? "bg-background text-foreground shadow-sm shadow-primary/10 border border-border/50"
                    : "text-muted-foreground hover:bg-background/50 hover:text-foreground"
                    }`}
                >
                  {tab.charAt(0).toUpperCase() + tab.slice(1)}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="p-4 md:p-8 space-y-6 max-w-7xl mx-auto">
          {/* Mobile Tabs (scrollable) */}
          <div className="md:hidden flex gap-2 overflow-x-auto pb-2 -mx-4 px-4 scrollbar-hide">
            {(["all", "delivered", "pending", "cancelled"] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-2 text-sm font-medium rounded-full whitespace-nowrap transition-all border ${activeTab === tab
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-card border-border text-muted-foreground hover:bg-muted"
                  }`}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </div>

          {/* Filters */}
          <div className="bg-card border border-border/50 rounded-xl p-4 shadow-sm">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative group">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                <input
                  type="text"
                  placeholder="Search by shop, customer, or ID..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-muted/30 border border-border/60 rounded-lg text-foreground placeholder:text-muted-foreground/70 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40 transition-all"
                />
              </div>
              <div className="w-full md:w-auto relative group">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                <input
                  type="date"
                  value={filterDate}
                  onChange={(e) => setFilterDate(e.target.value)}
                  className="w-full md:w-48 pl-10 pr-4 py-2.5 bg-muted/30 border border-border/60 rounded-lg text-foreground placeholder:text-muted-foreground/70 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40 transition-all"
                />
              </div>
            </div>
          </div>

          <div className="space-y-4">
            {filteredOrders.length === 0 ? (
              <div className="text-center py-16 bg-muted/10 border-2 border-dashed border-border/50 rounded-xl">
                <div className="h-14 w-14 bg-muted/30 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Search className="h-6 w-6 text-muted-foreground/40" />
                </div>
                <h3 className="font-semibold text-foreground">No orders found</h3>
                <p className="text-sm text-muted-foreground mt-1">Try adjusting your filters</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4">
                {filteredOrders.map((order) => (
                  <div
                    key={order.id}
                    className="group bg-card hover:bg-muted/20 border border-border/50 rounded-xl p-5 hover:shadow-md transition-all duration-300 active:scale-[0.995]"
                  >
                    <div className="flex items-start justify-between gap-4 flex-col sm:flex-row">
                      <div className="flex-1 space-y-1.5">
                        <div className="flex items-center gap-3 mb-1">
                          <p className="font-mono font-bold text-foreground text-base tracking-tight">#{order.id.slice(0, 8)}</p>
                          <span
                            className={`inline-flex items-center px-2 py-0.5 text-[10px] uppercase tracking-wider font-bold rounded-full ${getStatusColor(order.order_status)} border border-current/20`}
                          >
                            {order.order_status}
                          </span>
                        </div>

                        <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3 text-sm">
                          <p className="font-semibold text-foreground flex items-center gap-2">
                            {order.customers?.name || "Unknown Customer"}
                          </p>
                          {order.customers?.shop_name && (
                            <>
                              <span className="hidden sm:inline text-muted-foreground/40">•</span>
                              <p className="text-muted-foreground font-medium">{order.customers.shop_name}</p>
                            </>
                          )}
                        </div>

                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground font-medium mt-2">
                          <span className="flex items-center gap-1 bg-muted/50 px-2 py-0.5 rounded text-muted-foreground">
                            <Calendar size={10} />
                            {new Date(order.order_date).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
                          </span>
                          <span>Created by: {order.created_by_user?.full_name || "Owner"}</span>
                        </div>
                      </div>

                      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 w-full sm:w-auto mt-4 sm:mt-0 pt-4 sm:pt-0 border-t sm:border-t-0 border-border/50">
                        <div className="text-left sm:text-right flex-1 sm:flex-none">
                          <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Total Amount</p>
                          <p className="text-2xl font-bold text-primary tracking-tight">₹{order.total_amount.toFixed(2)}</p>
                        </div>

                        <div className="flex gap-2 w-full sm:w-auto justify-end">
                          <Link href={`/owner/order-details/${order.id}`} className="flex-1 sm:flex-none">
                            <Button variant="outline" size="sm" className="w-full gap-2 h-9 border-border/60 hover:bg-background hover:border-primary/30 hover:text-primary transition-all shadow-sm">
                              <Eye size={15} />
                              View
                            </Button>
                          </Link>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDelete(order.id)}
                            className="h-9 w-9 p-0 text-destructive border-destructive/20 hover:bg-destructive/10 hover:border-destructive/30 transition-all shadow-sm"
                            title="Delete"
                          >
                            <Trash2 size={15} />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
      <MobileNav role="owner" />
    </div>
  )
}
