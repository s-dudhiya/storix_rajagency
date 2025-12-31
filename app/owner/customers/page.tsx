"use client"

import { useState, useEffect } from "react"
import { Sidebar } from "@/components/layout/sidebar"
import { MobileNav } from "@/components/layout/mobile-nav"
import { Button } from "@/components/ui/button"
import { Search, Plus, Edit2, Trash2, Phone, MapPin } from "lucide-react"
import { createClient } from "@/lib/supabase/client"

interface Customer {
  id: string
  name: string
  shop_name: string
  phone: string
  area: string
  total_orders: number
  total_spent: number
}

export default function CustomersPage() {
  const supabase = createClient()
  const [customers, setCustomers] = useState<Customer[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [formData, setFormData] = useState({
    name: "",
    shop_name: "",
    phone: "",
    area: "",
  })

  useEffect(() => {
    const fetchCustomers = async () => {
      try {
        const response = await fetch("/api/owner/customers")
        if (!response.ok) throw new Error("Failed to fetch customers")

        const data = await response.json()
        setCustomers(data || [])
      } catch (err) {
        console.log("[v0] Error fetching customers:", err)
      } finally {
        setLoading(false)
      }
    }

    fetchCustomers()
  }, [supabase])

  const filteredCustomers = customers.filter(
    (customer) =>
      customer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      customer.shop_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      customer.phone.includes(searchQuery),
  )

  const handleAddCustomer = async () => {
    if (!formData.name || !formData.shop_name || !formData.phone) {
      return
    }

    try {
      if (editingId) {
        const { error } = await supabase.from("customers").update(formData).eq("id", editingId)

        if (error) throw error

        setCustomers(customers.map((c) => (c.id === editingId ? { ...c, ...formData } : c)))
        setEditingId(null)
      } else {
        const response = await fetch("/api/owner/customers", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formData),
        })

        if (!response.ok) throw new Error("Failed to create customer")

        const newCustomer = await response.json()
        setCustomers([{ ...newCustomer, total_orders: 0, total_spent: 0 }, ...customers])
      }

      setFormData({ name: "", shop_name: "", phone: "", area: "" })
      setShowForm(false)
    } catch (err) {
      console.log("[v0] Error saving customer:", err)
    }
  }

  const handleEdit = (customer: Customer) => {
    setFormData({
      name: customer.name,
      shop_name: customer.shop_name,
      phone: customer.phone,
      area: customer.area,
    })
    setEditingId(customer.id)
    setShowForm(true)
  }

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase.from("customers").delete().eq("id", id)

      if (error) throw error

      setCustomers(customers.filter((c) => c.id !== id))
    } catch (err) {
      console.log("[v0] Error deleting customer:", err)
    }
  }

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar role="owner" />
      <main className="flex-1 md:ml-64 pt-16 md:pt-0 pb-20 md:pb-0">
        {/* Header */}
        <div className="bg-card border-b border-border p-4 md:px-6 md:h-20 md:sticky md:top-0 md:z-40 flex flex-col md:flex-row justify-center md:justify-between items-start md:items-center">
          <div>
            <h1 className="text-xl md:text-2xl font-semibold text-foreground">Customers</h1>
            <p className="text-sm text-muted-foreground mt-1">Manage your customer database</p>
          </div>
          <Button
            onClick={() => {
              setFormData({ name: "", shop_name: "", phone: "", area: "" })
              setEditingId(null)
              setShowForm(true)
            }}
            className="gap-2 bg-primary text-primary-foreground hover:bg-primary/90"
          >
            <Plus size={18} />
            Add Customer
          </Button>
        </div>

        {/* Content */}
        <div className="p-4 md:p-6 space-y-6">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={20} />
            <input
              type="text"
              placeholder="Search by name, shop, or phone..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-3 py-2 bg-input border border-border rounded-md text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>

          {/* Customers Grid */}
          {loading ? (
            <div className="text-center py-12 text-muted-foreground">Loading customers...</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredCustomers.length > 0 ? (
                filteredCustomers.map((customer) => (
                  <div
                    key={customer.id}
                    className="bg-card border border-border rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="font-bold text-foreground">{customer.name}</h3>
                        <p className="text-sm text-muted-foreground">{customer.shop_name}</p>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleEdit(customer)}
                          className="p-1.5 rounded hover:bg-muted transition-colors"
                        >
                          <Edit2 size={16} className="text-muted-foreground" />
                        </button>
                        <button
                          onClick={() => handleDelete(customer.id)}
                          className="p-1.5 rounded hover:bg-muted transition-colors"
                        >
                          <Trash2 size={16} className="text-destructive" />
                        </button>
                      </div>
                    </div>

                    <div className="space-y-2 text-sm mb-4">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Phone size={14} />
                        <span>{customer.phone}</span>
                      </div>
                      {customer.area && (
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <MapPin size={14} />
                          <span>{customer.area}</span>
                        </div>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-2 pt-3 border-t border-border">
                      <div>
                        <p className="text-xs text-muted-foreground uppercase font-bold">Orders</p>
                        <p className="text-lg font-bold text-foreground">{customer.total_orders}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground uppercase font-bold">Spent</p>
                        <p className="text-lg font-bold text-primary">₹{customer.total_spent}</p>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="col-span-full text-center py-12 text-muted-foreground">No customers found</div>
              )}
            </div>
          )}

          {/* Add/Edit Modal */}
          {showForm && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
              <div className="bg-card rounded-lg p-6 max-w-md w-full">
                <h2 className="text-lg font-bold text-foreground mb-4">
                  {editingId ? "Edit Customer" : "Add New Customer"}
                </h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">Full Name</label>
                    <input
                      type="text"
                      placeholder="John Smith"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full px-3 py-2 bg-input border border-border rounded-md text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">Shop Name</label>
                    <input
                      type="text"
                      placeholder="John's Shop"
                      value={formData.shop_name}
                      onChange={(e) => setFormData({ ...formData, shop_name: e.target.value })}
                      className="w-full px-3 py-2 bg-input border border-border rounded-md text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">Phone</label>
                    <input
                      type="tel"
                      placeholder="9876543210"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="w-full px-3 py-2 bg-input border border-border rounded-md text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">Area</label>
                    <input
                      type="text"
                      placeholder="Andheri"
                      value={formData.area}
                      onChange={(e) => setFormData({ ...formData, area: e.target.value })}
                      className="w-full px-3 py-2 bg-input border border-border rounded-md text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                    />
                  </div>
                  <div className="flex gap-3 pt-4">
                    <Button
                      onClick={handleAddCustomer}
                      className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90"
                    >
                      {editingId ? "Update" : "Add"} Customer
                    </Button>
                    <Button
                      onClick={() => {
                        setShowForm(false)
                        setEditingId(null)
                      }}
                      variant="outline"
                      className="flex-1"
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
      <MobileNav role="owner" />
    </div>
  )
}
