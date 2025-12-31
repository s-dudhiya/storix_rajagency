"use client"

import { useEffect, useState } from "react"
import { Sidebar } from "@/components/layout/sidebar"
import { MobileNav } from "@/components/layout/mobile-nav"
import { StatCard } from "@/components/dashboard/stat-card"
import { ActionCard } from "@/components/dashboard/action-card" // New component
import { Button } from "@/components/ui/button"
import Link from "next/link"
import {
  Package,
  ShoppingCart,
  AlertCircle,
  TrendingUp,
  PlusCircle,
  BookOpen,
  RefreshCw,
  Users,
  Factory,
  ShieldCheck,
  FileText,
  ArrowRight
} from "lucide-react"

interface DashboardStats {
  totalBrands: number
  totalProducts: number
  todayOrders: number
  lowStockAlerts: number
}

interface RecentOrder {
  id: string
  customer_name: string
  shop_name: string
  total_amount: number
  order_status: string
  order_date: string
}

export default function OwnerDashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    totalBrands: 0,
    totalProducts: 0,
    todayOrders: 0,
    lowStockAlerts: 0,
  })
  const [recentOrders, setRecentOrders] = useState<RecentOrder[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      const [statsRes, ordersRes] = await Promise.all([
        fetch("/api/owner/dashboard/stats"),
        fetch("/api/owner/dashboard/recent-orders"),
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
        return "bg-green-100/50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-300 dark:border-green-900/50"
      case "pending":
      case "confirmed":
        return "bg-blue-100/50 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-300 dark:border-blue-900/50"
      default:
        return "bg-gray-100/50 text-gray-700 border-gray-200 dark:bg-gray-900/20 dark:text-gray-300 dark:border-gray-800"
    }
  }

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar role="owner" />

      <main className="flex-1 md:ml-64 pt-16 md:pt-0 pb-24 md:pb-8 transition-all duration-300">

        {/* Header Section */}
        <div className="bg-card/50 backdrop-blur-sm border-b border-border/50 h-20 px-8 sticky top-0 z-40 transition-all duration-200 flex items-center">
          <div className="flex flex-1 items-center justify-between">
            <div className="animate-in fade-in slide-in-from-left-4 duration-500">
              <h1 className="text-xl md:text-2xl font-semibold text-foreground tracking-tight">Dashboard</h1>
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mt-0.5">Welcome back, Owner</p>
            </div>
            <div className="flex items-center gap-3 animate-in fade-in slide-in-from-right-4 duration-500">
              <div className="hidden md:flex items-center gap-2 mr-2">
                <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                <span className="text-xs font-semibold text-green-600">System Active</span>
              </div>
            </div>
          </div>
        </div>

        <div className="p-4 md:p-8 space-y-8 max-w-7xl mx-auto">

          {/* Stats Grid */}
          <section className="animate-in fade-in slide-in-from-bottom-4 duration-500 delay-100">
            <h2 className="text-sm font-bold text-muted-foreground uppercase tracking-widest mb-4 ml-1">Key Metrics</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
              <StatCard
                label="Total Brands"
                value={loading ? "..." : stats.totalBrands}
                icon={<Package size={20} />}
                trend="+2 this week"
                trendUp={true}
              />
              <StatCard
                label="Total Products"
                value={loading ? "..." : stats.totalProducts}
                icon={<ShoppingCart size={20} />}
              />
              <StatCard
                label="Today's Orders"
                value={loading ? "..." : stats.todayOrders}
                icon={<TrendingUp size={20} />}
                trend="Live Updates"
                trendUp={true}
              />
              <StatCard
                label="Low Stock"
                value={loading ? "..." : stats.lowStockAlerts}
                icon={<AlertCircle size={20} />}
                trend={stats.lowStockAlerts > 0 ? "Action Needed" : "Healthy"}
                trendUp={stats.lowStockAlerts === 0}
              />
            </div>
          </section>

          {/* Quick Actions Grid */}
          <section className="animate-in fade-in slide-in-from-bottom-8 duration-700 delay-200">
            <div className="flex items-center justify-between mb-4 ml-1">
              <h2 className="text-sm font-bold text-muted-foreground uppercase tracking-widest">Quick Actions</h2>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
              <ActionCard
                icon={ShoppingCart}
                label="Take Order"
                description="Create a new order for a shop"
                href="/owner/take-order"
                variant="default"
              />
              <ActionCard
                icon={BookOpen}
                label="Catalogue"
                description="View and manage products"
                href="/owner/catalogue"
                variant="outline"
              />
              <ActionCard
                icon={RefreshCw}
                label="Inventory"
                description="Update stock levels"
                href="/owner/inventory"
                variant="outline"
              />
              <ActionCard
                icon={FileText}
                label="View Orders"
                description="Track recent orders"
                href="/owner/orders"
                variant="outline"
              />
              <ActionCard
                icon={Users}
                label="Customers"
                description="Manage shop profiles"
                href="/owner/customers"
                variant="outline"
              />
              <ActionCard
                icon={Factory}
                label="Labour"
                description="Manage warehouse staff"
                href="/owner/labour"
                variant="outline"
              />
              <ActionCard
                icon={ShieldCheck}
                label="Admins"
                description="Manage owner access"
                href="/owner/manage-team"
                variant="outline"
              />
            </div>
          </section>

          {/* Recent Orders Preview */}
          <section className="animate-in fade-in slide-in-from-bottom-12 duration-1000 delay-300">
            <div className="flex items-center justify-between mb-4 ml-1">
              <h2 className="text-sm font-bold text-muted-foreground uppercase tracking-widest">Recent Activity</h2>
              <Link href="/owner/orders">
                <Button variant="ghost" size="sm" className="text-xs font-semibold text-primary hover:text-primary/80">
                  View All <ArrowRight className="ml-1 w-3 h-3" />
                </Button>
              </Link>
            </div>

            <div className="bg-card rounded-xl border border-border/50 shadow-sm overflow-hidden">
              {loading ? (
                <div className="p-8 text-center text-muted-foreground">Loading recent activity...</div>
              ) : recentOrders.length === 0 ? (
                <div className="p-12 text-center text-muted-foreground flex flex-col items-center">
                  <div className="w-12 h-12 bg-muted rounded-full flex items-center justify-center mb-3">
                    <FileText className="w-6 h-6 opacity-50" />
                  </div>
                  <p>No recent orders found</p>
                </div>
              ) : (
                <div className="divide-y divide-border/50">
                  {recentOrders.map((order) => (
                    <div key={order.id} className="p-4 hover:bg-muted/30 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3 decoration-none">
                      <div className="flex items-start gap-4">
                        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary font-bold text-xs shrink-0">
                          #{order.id.slice(0, 4)}
                        </div>
                        <div>
                          <h4 className="font-semibold text-foreground text-sm">{order.shop_name}</h4>
                          <p className="text-xs text-muted-foreground flex items-center gap-2 mt-0.5">
                            <span>{new Date(order.order_date).toLocaleDateString()}</span>
                            <span className="w-1 h-1 rounded-full bg-border" />
                            <span>{new Date(order.order_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center justify-between sm:justify-end gap-6 pl-14 sm:pl-0">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase border ${getStatusColor(order.order_status)}`}>
                          {order.order_status}
                        </span>
                        <p className="font-bold text-sm min-w-[80px] text-right">
                          ₹{order.total_amount.toFixed(2)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>
        </div>
      </main>

      <MobileNav role="owner" />
    </div>
  )
}
