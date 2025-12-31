"use client"

import { useEffect, useState } from "react"
import { Sidebar } from "@/components/layout/sidebar"
import { MobileNav } from "@/components/layout/mobile-nav"
import { StatCard } from "@/components/dashboard/stat-card"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { ShoppingCart, FileText, TrendingUp } from "lucide-react"

interface DashboardStats {
  todayOrders: number
  totalOrders: number
  monthOrders: number
}

interface RecentOrder {
  id: string
  order_date: string
  total_amount: number
  order_status: string
  customers?: {
    name: string
    shop_name: string
  }
}

export default function LabourDashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    todayOrders: 0,
    totalOrders: 0,
    monthOrders: 0,
  })
  const [recentOrders, setRecentOrders] = useState<RecentOrder[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      const [statsRes, ordersRes] = await Promise.all([
        fetch("/api/labour/dashboard/stats"),
        fetch("/api/labour/dashboard/recent-orders"),
      ])

      if (statsRes.ok) {
        const statsData = await statsRes.json()
        setStats(statsData)
      }

      if (ordersRes.ok) {
        const ordersData = await ordersRes.json()
        setRecentOrders(ordersData)
      }
    } catch (error) {
      console.error("[v0] Failed to fetch dashboard data:", error)
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "completed":
      case "delivered":
        return "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300"
      case "pending":
      case "confirmed":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300"
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-300"
    }
  }

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar role="labour" />

      <main className="flex-1 md:ml-64 pt-16 md:pt-0 pb-20 md:pb-0">
        <div className="bg-card border-b border-border p-4 md:px-6 md:h-20 md:sticky md:top-0 md:z-40 flex flex-col md:flex-row justify-center md:justify-between items-start md:items-center">
          <div>
            <h1 className="text-xl md:text-2xl font-semibold text-foreground">Dashboard</h1>
            <p className="text-sm text-muted-foreground mt-1">Welcome back, Labour User</p>
          </div>
        </div>

        <div className="p-4 md:p-6 space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <StatCard
              label="My Orders Today"
              value={loading ? "..." : stats.todayOrders}
              icon={<ShoppingCart size={24} />}
            />
            <StatCard label="Total Orders" value={loading ? "..." : stats.totalOrders} icon={<FileText size={24} />} />
            <StatCard label="This Month" value={loading ? "..." : stats.monthOrders} icon={<TrendingUp size={24} />} />
          </div>

          {/* Quick Actions */}
          <div className="bg-card rounded-lg border border-border p-6 shadow-sm">
            <h2 className="text-lg font-bold text-foreground mb-4">Actions</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Link href="/labour/take-order">
                <Button className="w-full bg-primary text-primary-foreground hover:bg-primary/90">Create Order</Button>
              </Link>
              <Link href="/labour/catalogue">
                <Button variant="outline" className="w-full bg-transparent">
                  View Catalogue
                </Button>
              </Link>
              <Link href="/labour/orders">
                <Button variant="outline" className="w-full bg-transparent">
                  My Orders
                </Button>
              </Link>
              <Link href="/settings">
                <Button variant="outline" className="w-full bg-transparent">
                  Settings
                </Button>
              </Link>
            </div>
          </div>

          <div className="bg-card rounded-lg border border-border p-6 shadow-sm">
            <h2 className="text-lg font-bold text-foreground mb-4">My Recent Orders</h2>
            {loading ? (
              <p className="text-sm text-muted-foreground">Loading orders...</p>
            ) : recentOrders.length === 0 ? (
              <p className="text-sm text-muted-foreground">No recent orders</p>
            ) : (
              <div className="space-y-3">
                {recentOrders.map((order) => (
                  <div key={order.id} className="flex items-center justify-between p-3 bg-muted rounded-md">
                    <div>
                      <p className="font-medium text-foreground">Order #{order.id.slice(0, 8)}</p>
                      <p className="text-xs text-muted-foreground">{order.customers?.shop_name || "Unknown"}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-foreground">₹{order.total_amount.toFixed(2)}</p>
                      <span
                        className={`inline-block px-2 py-1 text-xs font-medium rounded ${getStatusColor(order.order_status)}`}
                      >
                        {order.order_status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>

      <MobileNav role="labour" />
    </div>
  )
}
