"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { ChevronLeft, Plus, Trash2, AlertTriangle, Loader2 } from "lucide-react"
import Link from "next/link"
import { Sidebar } from "@/components/layout/sidebar"
import { MobileNav } from "@/components/layout/mobile-nav"

interface TeamMember {
  id: string
  full_name: string
  email: string
  phone: string
  role: "owner" | "labour"
  is_active: boolean
  created_at: string
}

interface OrphanedUser {
  id: string
  email: string
  created_at: string
}

export default function ManageTeamPage() {
  const router = useRouter()
  const [members, setMembers] = useState<TeamMember[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showAddForm, setShowAddForm] = useState(false)
  const [orphanedUsers, setOrphanedUsers] = useState<OrphanedUser[]>([])
  const [loadingOrphaned, setLoadingOrphaned] = useState(false)
  const [showOrphaned, setShowOrphaned] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    role: "labour" as "owner" | "labour",
    password: "",
  })
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    fetchMembers()
  }, [])

  const fetchMembers = async () => {
    try {
      setLoading(true)
      const res = await fetch(`/api/team/members?t=${Date.now()}`, {
        cache: "no-store",
        headers: {
          "Cache-Control": "no-cache",
        },
      })
      if (!res.ok) throw new Error("Failed to fetch team members")
      const data = await res.json()
      setMembers(data)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const fetchOrphanedUsers = async () => {
    try {
      setLoadingOrphaned(true)
      const res = await fetch("/api/team/cleanup-orphaned-users")
      if (!res.ok) throw new Error("Failed to fetch orphaned users")
      const data = await res.json()
      setOrphanedUsers(data.orphanedUsers)
      setShowOrphaned(true)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoadingOrphaned(false)
    }
  }

  const deleteOrphanedUser = async (userId: string) => {
    if (!confirm("Delete this orphaned auth user? This action cannot be undone.")) return

    try {
      const res = await fetch("/api/team/cleanup-orphaned-users", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      })

      if (!res.ok) throw new Error("Failed to delete orphaned user")

      await fetchOrphanedUsers()
    } catch (err: any) {
      setError(err.message)
    }
  }

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setError(null)

    try {
      const res = await fetch("/api/team/members", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      })

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || "Failed to create team member")
      }

      alert("✅ Team member created successfully! They can now login with their credentials.")
      setFormData({ name: "", email: "", phone: "", role: "labour", password: "" })
      setShowAddForm(false)
      await fetchMembers()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  const deleteMember = async (id: string) => {
    if (!confirm("Are you sure? This action cannot be undone.")) return

    setDeletingId(id)

    try {
      const res = await fetch(`/api/team/members/${id}`, { method: "DELETE" })

      if (!res.ok) {
        const data = await res.json()
        if (res.status === 404) {
          router.refresh()
          await fetchMembers()
          return
        }
        throw new Error(data.error || "Failed to delete member")
      }

      router.refresh()
      await fetchMembers()
      setError(null)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setDeletingId(null)
    }
  }

  <div className="flex min-h-screen bg-background">
    <Sidebar role="owner" />
    <main className="flex-1 md:ml-64 pb-20 md:pb-0">
      <div className="bg-card/50 backdrop-blur-sm border-b border-border/50 h-20 px-4 md:px-8 sticky top-0 z-40 transition-all duration-200 flex items-center justify-between gap-4">
        <div className="flex flex-col justify-center h-full">
          <h1 className="text-xl md:text-2xl font-semibold text-foreground tracking-tight">Manage Team</h1>
          <p className="text-xs font-medium text-muted-foreground hidden md:block">Create and manage owners and labour workers</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={fetchOrphanedUsers}
            disabled={loadingOrphaned}
            className="hidden md:flex gap-2 border-dashed border-yellow-500/50 text-yellow-600 hover:text-yellow-700 hover:bg-yellow-500/10"
          >
            <AlertTriangle className="w-4 h-4" />
            {loadingOrphaned ? "Checking..." : "Cleanup"}
          </Button>
          <Button
            onClick={() => setShowAddForm(true)}
            className="shadow-md shadow-primary/20 hover:shadow-primary/30 transition-all duration-300 gap-2 bg-primary text-primary-foreground hover:bg-primary/90"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden md:inline">Add Member</span>
            <span className="md:hidden">Add</span>
          </Button>
        </div>
      </div>

      <div className="p-4 md:p-8 space-y-6 max-w-5xl mx-auto">
        {/* Error Message */}
        {error && (
          <Alert variant="destructive" className="border-destructive/20 bg-destructive/5 text-destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>
              {error}
            </AlertDescription>
          </Alert>
        )}

        {showOrphaned && (
          <div className="bg-yellow-500/5 border border-yellow-500/20 rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-yellow-500/10 rounded-lg">
                  <AlertTriangle className="w-5 h-5 text-yellow-600" />
                </div>
                <h2 className="text-lg font-semibold text-yellow-700">Orphaned Auth Users</h2>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setShowOrphaned(false)} className="text-yellow-600 hover:text-yellow-800 hover:bg-yellow-500/10">
                Dismiss
              </Button>
            </div>
            <p className="text-sm text-muted-foreground mb-4">
              These users exist in authentication but not in the database.
            </p>
            {orphanedUsers.length === 0 ? (
              <p className="text-sm font-medium text-green-600 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-green-500" />
                No orphaned users found.
              </p>
            ) : (
              <div className="space-y-3">
                {orphanedUsers.map((user) => (
                  <div
                    key={user.id}
                    className="flex items-center justify-between p-4 bg-background border border-border/50 rounded-lg shadow-sm"
                  >
                    <div>
                      <p className="font-semibold text-sm">{user.email}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Created: {new Date(user.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <Button variant="outline" size="sm" onClick={() => deleteOrphanedUser(user.id)} className="text-destructive border-destructive/20 hover:bg-destructive/10">
                      <Trash2 className="w-4 h-4 mr-2" />
                      Delete
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Members List */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {loading ? (
            <div className="col-span-1 md:col-span-2 py-12 text-center text-muted-foreground">
              <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2 opacity-50" />
              <p>Loading team members...</p>
            </div>
          ) : members.length === 0 ? (
            <div className="col-span-1 md:col-span-2 py-16 text-center bg-muted/10 border-2 border-dashed border-border/50 rounded-xl">
              <p className="text-muted-foreground font-medium">No team members yet.</p>
              <p className="text-sm text-muted-foreground/70 mt-1">Add a member to get started.</p>
            </div>
          ) : (
            members.map((member) => (
              <div key={member.id} className="group bg-card hover:bg-muted/20 border border-border/50 rounded-xl p-5 shadow-sm transition-all duration-300 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-lg">
                    {member.full_name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground">{member.full_name}</h3>
                    <p className="text-xs text-muted-foreground">{member.email}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full border ${member.role === 'owner' ? 'bg-purple-500/10 text-purple-600 border-purple-500/20' : 'bg-blue-500/10 text-blue-600 border-blue-500/20'}`}>
                        {member.role}
                      </span>
                      <span className="text-[10px] text-muted-foreground/70">
                        {member.phone || "No phone"}
                      </span>
                    </div>
                  </div>
                </div>

                <Button
                  variant="ghost"
                  size="icon"
                  className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 -mr-2"
                  onClick={(e) => {
                    e.preventDefault();
                    deleteMember(member.id);
                  }}
                  disabled={deletingId === member.id}
                >
                  {deletingId === member.id ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <Trash2 className="w-5 h-5" />
                  )}
                </Button>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Add Member Dialog */}
      <div className={`fixed inset-0 z-50 flex items-end md:items-center justify-center bg-black/50 backdrop-blur-sm transition-all duration-300 ${showAddForm ? 'opacity-100 visible' : 'opacity-0 invisible pointer-events-none'}`}>
        <div className={`bg-card w-full md:w-[450px] md:rounded-xl rounded-t-2xl shadow-xl transition-all duration-300 ${showAddForm ? 'translate-y-0 scale-100' : 'translate-y-full md:translate-y-4 md:scale-95'}`}>
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold tracking-tight">Add Team Member</h2>
              <Button variant="ghost" size="sm" onClick={() => setShowAddForm(false)}>
                ✕
              </Button>
            </div>

            <form onSubmit={handleAddMember} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5 block">Full Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2.5 bg-muted/30 border border-border/60 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40 transition-all"
                  required
                  placeholder="John Doe"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5 block">Email</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-3 py-2.5 bg-muted/30 border border-border/60 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40 transition-all"
                  required
                  placeholder="john@example.com"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5 block">Phone</label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-3 py-2.5 bg-muted/30 border border-border/60 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40 transition-all"
                  placeholder="+91 98765 43210"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5 block">Role</label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value as "owner" | "labour" })}
                  className="w-full px-3 py-2.5 bg-muted/30 border border-border/60 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40 transition-all"
                >
                  <option value="labour">Labour</option>
                  <option value="owner">Owner</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5 block">Password</label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full px-3 py-2.5 bg-muted/30 border border-border/60 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40 transition-all"
                  required
                  minLength={6}
                  placeholder="Minimum 6 characters"
                />
              </div>

              <div className="pt-2 flex gap-3">
                <Button type="button" variant="outline" onClick={() => setShowAddForm(false)} className="flex-1">
                  Cancel
                </Button>
                <Button type="submit" disabled={submitting} className="flex-1 bg-primary text-primary-foreground shadow-lg shadow-primary/20">
                  {submitting ? "Creating..." : "Create Member"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      </div>

    </main>
    <div className="md:hidden">
      <Button
        variant="outline"
        size="sm"
        onClick={fetchOrphanedUsers}
        disabled={loadingOrphaned}
        className="w-full rounded-none border-t border-dashed border-yellow-500/50 text-yellow-600 bg-yellow-500/5 py-1 text-xs"
      >
        {loadingOrphaned ? "Checking Cleanup..." : "Check Cleanup"}
      </Button>
    </div>
    <MobileNav role="owner" />
  </div>
  
}
