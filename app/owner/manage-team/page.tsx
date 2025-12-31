"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { ChevronLeft, Plus, Trash2, AlertTriangle, Loader2 } from "lucide-react"
import Link from "next/link"

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

  return (
    <main className="min-h-screen bg-background p-4 md:p-6 pt-16 md:pt-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="md:sticky md:top-0 md:z-40 bg-background pb-4 md:pb-0 md:h-20 flex flex-col md:flex-row items-start md:items-center justify-between mb-6 gap-4">
          <div className="flex items-center gap-3">
            <Link href="/owner/dashboard">
              <button className="p-2 hover:bg-muted rounded-lg transition-colors">
                <ChevronLeft className="w-5 h-5" />
              </button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold">Manage Team</h1>
              <p className="text-sm text-muted-foreground">Create and manage owners and labour workers</p>
            </div>
          </div>
          <div className="flex gap-2 w-full md:w-auto">
            <Button variant="outline" onClick={fetchOrphanedUsers} disabled={loadingOrphaned} className="flex-1 md:flex-none">
              <AlertTriangle className="w-4 h-4 mr-2" />
              {loadingOrphaned ? "Checking..." : "Cleanup"}
            </Button>
            <Button onClick={() => setShowAddForm(true)} className="flex items-center gap-2 flex-1 md:flex-none">
              <Plus className="w-4 h-4" />
              Add Member
            </Button>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-destructive/10 border border-destructive/20 text-destructive px-4 py-2 rounded-lg mb-4">
            {error}
          </div>
        )}

        {showOrphaned && (
          <Card className="p-6 mb-6 border-amber-500/50 bg-amber-500/5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-amber-600" />
                <h2 className="text-lg font-semibold">Orphaned Auth Users</h2>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setShowOrphaned(false)}>
                Hide
              </Button>
            </div>
            <p className="text-sm text-muted-foreground mb-4">
              These users exist in authentication but not in the database. They were likely deleted directly from the
              database.
            </p>
            {orphanedUsers.length === 0 ? (
              <p className="text-sm text-green-600">No orphaned users found. All auth users have valid profiles.</p>
            ) : (
              <div className="space-y-2">
                {orphanedUsers.map((user) => (
                  <div
                    key={user.id}
                    className="flex items-center justify-between p-3 bg-background border border-border rounded-lg"
                  >
                    <div>
                      <p className="font-medium">{user.email}</p>
                      <p className="text-xs text-muted-foreground">
                        Created: {new Date(user.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <Button variant="destructive" size="sm" onClick={() => deleteOrphanedUser(user.id)}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </Card>
        )}

        {/* Add Form */}
        {showAddForm && (
          <Card className="p-6 mb-6">
            <h2 className="text-lg font-semibold mb-4">Add Team Member</h2>
            <form onSubmit={handleAddMember} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Full Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Email</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Phone</label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Role</label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value as "owner" | "labour" })}
                  className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  <option value="labour">Labour</option>
                  <option value="owner">Owner</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Password</label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
                  required
                  minLength={6}
                  placeholder="Minimum 6 characters"
                />
                <p className="text-xs text-muted-foreground mt-1">This will be used to login to the system</p>
              </div>

              <div className="flex gap-2">
                <Button type="submit" disabled={submitting} className="flex-1">
                  {submitting ? "Creating..." : "Create Member"}
                </Button>
                <Button type="button" variant="outline" onClick={() => setShowAddForm(false)} className="flex-1">
                  Cancel
                </Button>
              </div>
            </form>
          </Card>
        )}

        {/* Members List */}
        <Card className="overflow-hidden">
          {loading ? (
            <div className="p-8 text-center text-muted-foreground">Loading...</div>
          ) : members.length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-muted-foreground">No team members yet. Create one to get started.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-muted/50 border-b border-border">
                  <tr>
                    <th className="text-left px-6 py-3 text-sm font-semibold">Name</th>
                    <th className="text-left px-6 py-3 text-sm font-semibold">Email</th>
                    <th className="text-left px-6 py-3 text-sm font-semibold">Type</th>
                    <th className="text-center px-6 py-3 text-sm font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {members.map((member) => (
                    <tr key={member.id} className="hover:bg-muted/30 transition-colors">
                      <td className="px-6 py-4">
                        <div className="font-medium">{member.full_name}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-muted-foreground">{member.email}</div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-muted capitalize">
                          {member.role}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-center">
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={(e) => {
                              e.preventDefault()
                              e.stopPropagation()
                              deleteMember(member.id)
                            }}
                            type="button"
                            disabled={deletingId === member.id}
                          >
                            {deletingId === member.id ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <Trash2 className="w-4 h-4" />
                            )}
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>
    </main>
  )
}
