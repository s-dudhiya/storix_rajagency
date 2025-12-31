"use client"

import type React from "react"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useRouter } from "next/navigation"
import { signOut } from "@/lib/supabase/auth"
import { Home, Package, Settings, LogOut, ShoppingCart, Users, Warehouse, FileText, Receipt, Store } from "lucide-react"

interface NavItem {
  icon: React.ReactNode
  label: string
  href: string
}

interface SidebarProps {
  role: "owner" | "labour"
}

export function Sidebar({ role }: SidebarProps) {
  const pathname = usePathname()
  const router = useRouter()

  const ownerNav: NavItem[] = [
    { icon: <Home size={20} />, label: "Dashboard", href: "/owner/dashboard" },
    { icon: <ShoppingCart size={20} />, label: "Take Order", href: "/owner/take-order" },
    { icon: <Package size={20} />, label: "Catalogue", href: "/owner/catalogue" },
    { icon: <Store size={20} />, label: "Shop Items", href: "/owner/shop-items" },
    { icon: <Warehouse size={20} />, label: "Inventory", href: "/owner/inventory" },
    { icon: <FileText size={20} />, label: "Orders", href: "/owner/orders" },
    { icon: <Receipt size={20} />, label: "Bills", href: "/owner/bills" },
    { icon: <Users size={20} />, label: "Customers", href: "/owner/customers" },
    { icon: <Users size={20} />, label: "Labour", href: "/owner/labour" },
  ]

  const labourNav: NavItem[] = [
    { icon: <Home size={20} />, label: "Dashboard", href: "/labour/dashboard" },
    { icon: <ShoppingCart size={20} />, label: "Take Order", href: "/labour/take-order" },
    { icon: <Package size={20} />, label: "Catalogue", href: "/labour/catalogue" },
    { icon: <FileText size={20} />, label: "Orders", href: "/labour/orders" },
  ]

  const navItems = role === "owner" ? ownerNav : labourNav

  const handleLogout = async () => {
    try {
      await signOut()
      router.push("/")
    } catch (error) {
      console.error("[v0] Logout error:", error)
    }
  }

  return (
    <aside className="hidden md:flex w-64 bg-sidebar border-r border-sidebar-border flex-col h-screen fixed left-0 top-0">
      {/* Logo */}
      <div className="h-20 p-4 border-b border-sidebar-border flex items-center bg-sidebar-accent/10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-primary/20 rounded-lg flex items-center justify-center border border-primary/20">
            <span className="text-lg font-bold text-primary">S</span>
          </div>
          <div>
            <h1 className="font-bold text-lg text-sidebar-foreground tracking-tight">STORIX</h1>
            <p className="text-[10px] font-medium text-sidebar-foreground/60 tracking-wider">RAJ AGENCY</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-4">
        <ul className="space-y-1">
          {navItems.map((item) => {
            const isActive = pathname === item.href
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-all duration-200 group ${isActive
                    ? "bg-sidebar-primary/10 text-sidebar-primary border-r-2 border-sidebar-primary"
                    : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground"
                    }`}
                >
                  <span className={`transition-transform duration-200 ${isActive ? "scale-110" : "group-hover:scale-110"}`}>
                    {item.icon}
                  </span>
                  <span>{item.label}</span>
                </Link>
              </li>
            )
          })}
        </ul>
      </nav>

      {/* Settings & Logout */}
      <div className="p-3 border-t border-sidebar-border space-y-1 bg-sidebar-accent/5">
        <Link
          href="/settings"
          className="flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground transition-colors group"
        >
          <Settings size={20} className="group-hover:rotate-45 transition-transform duration-300" />
          <span>Settings</span>
        </Link>
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground transition-colors group"
        >
          <LogOut size={20} className="group-hover:-translate-x-1 transition-transform duration-200" />
          <span>Logout</span>
        </button>
      </div>
    </aside>
  )
}
