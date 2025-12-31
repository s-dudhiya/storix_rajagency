"use client"

import type React from "react"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { signOut } from "@/lib/supabase/auth"
import {
  Home,
  Package,
  ShoppingCart,
  Users,
  BarChart3,
  FileText,
  Receipt,
  Menu,
  X,
  Settings,
  LogOut,
  Store,
} from "lucide-react"
import { useState } from "react"

interface NavItem {
  icon: React.ReactNode
  label: string
  href: string
}

interface MobileNavProps {
  role: "owner" | "labour"
}

export function MobileNav({ role }: MobileNavProps) {
  const pathname = usePathname()
  const router = useRouter()
  const [isOpen, setIsOpen] = useState(false)

  const ownerNav: NavItem[] = [
    { icon: <Home size={20} />, label: "Dashboard", href: "/owner/dashboard" },
    { icon: <ShoppingCart size={20} />, label: "Take Order", href: "/owner/take-order" },
    { icon: <Package size={20} />, label: "Catalogue", href: "/owner/catalogue" },
    { icon: <Store size={20} />, label: "Shop Items", href: "/owner/shop-items" },
    { icon: <BarChart3 size={20} />, label: "Inventory", href: "/owner/inventory" },
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
    <>
      <header className="md:hidden fixed top-0 left-0 right-0 bg-card border-b border-border h-16 flex items-center justify-between px-4 z-[100]">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
            <span className="text-sm font-bold text-primary-foreground">S</span>
          </div>
          <div>
            <h1 className="font-bold text-sm text-foreground">STORIX</h1>
            <p className="text-[10px] text-muted-foreground">RAJ AGENCY</p>
          </div>
        </div>

        <button
          onClick={() => setIsOpen(true)}
          className="p-2 hover:bg-accent rounded-md transition-colors"
          aria-label="Open menu"
        >
          <Menu size={24} />
        </button>
      </header>

      {isOpen && <div className="md:hidden fixed inset-0 bg-black/50 z-[90]" onClick={() => setIsOpen(false)} />}

      <aside
        className={`md:hidden fixed top-0 right-0 bottom-0 w-72 bg-sidebar border-l border-sidebar-border flex flex-col z-[95] transform transition-transform duration-300 ${isOpen ? "translate-x-0" : "translate-x-full"
          }`}
      >
        {/* Header */}
        <div className="h-20 p-4 border-b border-sidebar-border flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <span className="text-sm font-bold text-primary-foreground">S</span>
            </div>
            <div>
              <h1 className="font-bold text-sm text-foreground">STORIX</h1>
              <p className="text-[10px] text-muted-foreground">RAJ AGENCY</p>
            </div>
          </div>
          <button
            onClick={() => setIsOpen(false)}
            className="p-2 hover:bg-sidebar-accent rounded-md transition-colors"
            aria-label="Close menu"
          >
            <X size={20} />
          </button>
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
                    onClick={() => setIsOpen(false)}
                    className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors ${isActive
                        ? "bg-sidebar-primary text-sidebar-primary-foreground"
                        : "text-sidebar-foreground hover:bg-sidebar-accent"
                      }`}
                  >
                    {item.icon}
                    <span>{item.label}</span>
                  </Link>
                </li>
              )
            })}
          </ul>
        </nav>

        {/* Settings & Logout */}
        <div className="p-3 border-t border-sidebar-border space-y-1">
          <Link
            href="/settings"
            onClick={() => setIsOpen(false)}
            className="flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium text-sidebar-foreground hover:bg-sidebar-accent transition-colors"
          >
            <Settings size={20} />
            <span>Settings</span>
          </Link>
          <button
            onClick={() => {
              setIsOpen(false)
              handleLogout()
            }}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium text-sidebar-foreground hover:bg-sidebar-accent transition-colors"
          >
            <LogOut size={20} />
            <span>Logout</span>
          </button>
        </div>
      </aside>
    </>
  )
}
