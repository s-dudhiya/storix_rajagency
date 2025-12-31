"use client"

import { useState, useEffect } from "react"
import { Sidebar } from "@/components/layout/sidebar"
import { MobileNav } from "@/components/layout/mobile-nav"
import { Button } from "@/components/ui/button"
import { Search, Edit2, Phone, CheckCircle, XCircle } from "lucide-react"
import { createClient } from "@/lib/supabase/client"

interface LabourUser {
  id: string
  full_name: string
  phone: string
  email: string
  is_active: boolean
  created_at: string
  role: string
}

export default function LabourManagementPage() {
  const supabase = createClient()
  const [labourUsers, setLabourUsers] = useState<LabourUser[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [formData, setFormData] = useState({
    full_name: "",
    phone: "",
    email: "",
  })

  useEffect(() => {
    fetchLabourUsers()
  }, [supabase])

  const fetchLabourUsers = async () => {
    try {
      const { data, error } = await supabase
        .from("users")
        .select("*")
        .eq("role", "labour")
        .order("created_at", { ascending: false })

      if (error) throw error
      setLabourUsers(data || [])
    } catch (err) {
      console.log("[v0] Error fetching labour users:", err)
    } finally {
      setLoading(false)
    }
  }

  const filteredLabour = labourUsers.filter(
    (labour) =>
      labour.full_name.toLowerCase().includes(searchQuery.toLowerCase()) || labour.phone.includes(searchQuery),
  )

  const handleAddLabour = async () => {
    if (formData.full_name && formData.phone) {
      try {
        if (editingId) {
          const { error } = await supabase
            .from("users")
            .update({
              full_name: formData.full_name,
              phone: formData.phone,
              email: formData.email,
            })
            .eq("id", editingId)

          if (error) throw error

          setLabourUsers(labourUsers.map((l) => (l.id === editingId ? { ...l, ...formData } : l)))
          setEditingId(null)
        } else {
          alert("To create a new labour user, please use the admin panel or contact support")
        }
        setFormData({ full_name: "", phone: "", email: "" })
        setShowForm(false)
      } catch (err) {
        console.log("[v0] Error saving labour user:", err)
      }
    }
  }

  const handleEdit = (labour: LabourUser) => {
    setFormData({
      full_name: labour.full_name,
      phone: labour.phone,
      email: labour.email,
    })
    setEditingId(labour.id)
    setShowForm(true)
  }

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase.from("users").delete().eq("id", id)

      if (error) throw error

      setLabourUsers(labourUsers.filter((l) => l.id !== id))
    } catch (err) {
      console.log("[v0] Error deleting labour user:", err)
    }
  }

  const handleToggleStatus = async (id: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase.from("users").update({ is_active: !currentStatus }).eq("id", id)

      if (error) throw error

      setLabourUsers(labourUsers.map((l) => (l.id === id ? { ...l, is_active: !currentStatus } : l)))
    } catch (err) {
      console.log("[v0] Error toggling labour status:", err)
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen bg-background">
        <Sidebar role="owner" />
        <main className="flex-1 md:ml-64 pb-20 md:pb-0">
          <div className="p-4 md:p-6">
            <p className="text-muted-foreground">Loading labour users...</p>
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
        {/* Header */}
        <div className="bg-card border-b border-border p-4 md:px-6 md:h-20 md:sticky md:top-0 md:z-40 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-foreground">Labour Management</h1>
            <p className="text-sm text-muted-foreground mt-1">View and manage labour user accounts</p>
          </div>
        </div>

        {/* Content */}
        <div className="p-4 md:p-6 space-y-6">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={20} />
            <input
              type="text"
              placeholder="Search by name or phone..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-3 py-2 bg-input border border-border rounded-md text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>

          {/* Labour List */}
          <div className="space-y-3">
            {filteredLabour.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">No labour users found</p>
            ) : (
              filteredLabour.map((labour) => (
                <div
                  key={labour.id}
                  className="bg-card border border-border rounded-lg p-4 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between gap-4 flex-col sm:flex-row">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-bold text-foreground">{labour.full_name}</h3>
                        {labour.is_active ? (
                          <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300 rounded text-xs font-medium">
                            <CheckCircle size={14} />
                            Active
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-300 rounded text-xs font-medium">
                            <XCircle size={14} />
                            Inactive
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                        <Phone size={14} />
                        <span>{labour.phone}</span>
                      </div>
                      {labour.email && <p className="text-sm text-muted-foreground">Email: {labour.email}</p>}
                      <p className="text-xs text-muted-foreground mt-1">
                        Joined: {new Date(labour.created_at).toLocaleDateString()}
                      </p>
                    </div>

                    <div className="flex flex-col items-end gap-3">
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleToggleStatus(labour.id, labour.is_active)}
                          className="px-2 py-1 rounded text-xs font-medium border border-border hover:bg-muted transition-colors"
                        >
                          {labour.is_active ? "Deactivate" : "Activate"}
                        </button>
                        <button
                          onClick={() => handleEdit(labour)}
                          className="p-1.5 rounded hover:bg-muted transition-colors"
                        >
                          <Edit2 size={16} className="text-muted-foreground" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Edit Modal */}
          {showForm && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
              <div className="bg-card rounded-lg p-6 max-w-md w-full">
                <h2 className="text-lg font-bold text-foreground mb-4">
                  {editingId ? "Edit Labour User" : "Create Labour User"}
                </h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">Full Name</label>
                    <input
                      type="text"
                      placeholder="Rajesh Kumar"
                      value={formData.full_name}
                      onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
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
                    <label className="block text-sm font-medium text-foreground mb-2">Email (Optional)</label>
                    <input
                      type="email"
                      placeholder="rajesh@storix.com"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full px-3 py-2 bg-input border border-border rounded-md text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                    />
                  </div>
                  <div className="flex gap-3 pt-4">
                    <Button
                      onClick={handleAddLabour}
                      className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90"
                    >
                      {editingId ? "Update" : "Create"} User
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
