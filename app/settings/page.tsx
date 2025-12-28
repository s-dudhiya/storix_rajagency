"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ChevronLeft, Save, Eye, EyeOff, Lock } from "lucide-react"
import { useRouter } from "next/navigation"
import { signOut } from "@/lib/supabase/auth"

export default function SettingsPage() {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<"profile" | "password" | "company">("profile")
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)
  const [userRole, setUserRole] = useState<"owner" | "labour">("owner")

  const [profileData, setProfileData] = useState({
    fullName: "",
    phone: "",
    companyName: "",
  })

  const [passwordData, setPasswordData] = useState({
    mobileNumber: "",
    newPassword: "",
    confirmPassword: "",
  })

  useEffect(() => {
    loadProfile()
  }, [])

  const loadProfile = async () => {
    try {
      setLoading(true)
      const response = await fetch("/api/settings/profile")
      const data = await response.json()

      if (response.ok && data.profile) {
        setProfileData({
          fullName: data.profile.full_name || "",
          phone: data.profile.phone || "",
          companyName: data.profile.company_name || "",
        })
        setUserRole(data.profile.role || "owner")
      } else {
        setMessage({ type: "error", text: "Failed to load profile" })
      }
    } catch (error) {
      console.error("[v0] Error loading profile:", error)
      setMessage({ type: "error", text: "Failed to load profile" })
    } finally {
      setLoading(false)
    }
  }

  const handleSaveProfile = async () => {
    try {
      setSaving(true)
      setMessage(null)

      const response = await fetch("/api/settings/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          full_name: profileData.fullName,
          phone: profileData.phone,
          company_name: profileData.companyName,
        }),
      })

      const data = await response.json()

      if (response.ok) {
        setMessage({ type: "success", text: "Profile updated successfully!" })
      } else {
        setMessage({ type: "error", text: data.error || "Failed to update profile" })
      }
    } catch (error) {
      console.error("[v0] Error saving profile:", error)
      setMessage({ type: "error", text: "Failed to update profile" })
    } finally {
      setSaving(false)
    }
  }

  const handleChangePassword = async () => {
    try {
      setSaving(true)
      setMessage(null)

      // Validation
      if (!passwordData.mobileNumber || !passwordData.newPassword || !passwordData.confirmPassword) {
        setMessage({ type: "error", text: "Please fill all fields" })
        setSaving(false)
        return
      }

      if (passwordData.newPassword !== passwordData.confirmPassword) {
        setMessage({ type: "error", text: "Passwords do not match" })
        setSaving(false)
        return
      }

      if (passwordData.newPassword.length < 6) {
        setMessage({ type: "error", text: "Password must be at least 6 characters" })
        setSaving(false)
        return
      }

      const response = await fetch("/api/settings/password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phone: passwordData.mobileNumber,
          newPassword: passwordData.newPassword,
        }),
      })

      const data = await response.json()

      if (response.ok) {
        setMessage({ type: "success", text: "Password updated successfully!" })
        setPasswordData({
          mobileNumber: "",
          newPassword: "",
          confirmPassword: "",
        })
      } else {
        setMessage({ type: "error", text: data.error || "Failed to update password" })
      }
    } catch (error) {
      console.error("[v0] Error changing password:", error)
      setMessage({ type: "error", text: "Failed to update password" })
    } finally {
      setSaving(false)
    }
  }

  const handleSignOut = async () => {
    try {
      await signOut()
      router.push("/")
    } catch (error) {
      console.error("[v0] Sign out error:", error)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading settings...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background pt-16 md:pt-0">
      {/* Header */}
      <div className="bg-card border-b border-border md:sticky md:top-0 md:z-40">
        <div className="max-w-6xl mx-auto px-4 py-4 md:py-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href={userRole === "owner" ? "/owner/dashboard" : "/labour/dashboard"}>
              <Button variant="outline" size="sm" className="gap-2 bg-transparent">
                <ChevronLeft size={18} />
                Back
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-foreground">Settings</h1>
              <p className="text-sm text-muted-foreground">Manage your account and preferences</p>
            </div>
          </div>
        </div>
      </div>

      {/* Message Banner */}
      {message && (
        <div
          className={`max-w-6xl mx-auto px-4 py-3 mt-4 rounded-md ${
            message.type === "success" ? "bg-green-500/10 text-green-600" : "bg-red-500/10 text-red-600"
          }`}
        >
          <p className="text-sm font-medium">{message.text}</p>
        </div>
      )}

      {/* Content */}
      <div className="max-w-6xl mx-auto px-4 py-6 md:py-8">
        <div className="grid lg:grid-cols-4 gap-6">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-card border border-border rounded-lg p-4 space-y-2">
              {[
                { id: "profile", label: "Profile Settings", icon: "👤" },
                { id: "password", label: "Change Password", icon: "🔐" },
                { id: "company", label: "Company Info", icon: "🏢" },
              ].map((item) => (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id as any)}
                  className={`w-full text-left px-4 py-3 rounded-md text-sm font-medium transition-colors ${
                    activeTab === item.id
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-muted"
                  }`}
                >
                  <span className="mr-2">{item.icon}</span>
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            {/* Profile Settings */}
            {activeTab === "profile" && (
              <div className="bg-card border border-border rounded-lg p-6 shadow-sm">
                <h2 className="text-xl font-bold text-foreground mb-6">Profile Settings</h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">Full Name</label>
                    <input
                      type="text"
                      value={profileData.fullName}
                      onChange={(e) => setProfileData({ ...profileData, fullName: e.target.value })}
                      className="w-full px-3 py-2 bg-input border border-border rounded-md text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">Phone Number</label>
                    <input
                      type="tel"
                      value={profileData.phone}
                      onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
                      className="w-full px-3 py-2 bg-input border border-border rounded-md text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">Company Name</label>
                    <input
                      type="text"
                      value={profileData.companyName}
                      onChange={(e) => setProfileData({ ...profileData, companyName: e.target.value })}
                      className="w-full px-3 py-2 bg-input border border-border rounded-md text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                    />
                  </div>
                  <div className="pt-4 border-t border-border">
                    <Button
                      onClick={handleSaveProfile}
                      disabled={saving}
                      className="bg-primary text-primary-foreground hover:bg-primary/90 gap-2"
                    >
                      <Save size={18} />
                      {saving ? "Saving..." : "Save Changes"}
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {/* Change Password */}
            {activeTab === "password" && (
              <div className="bg-card border border-border rounded-lg p-6 shadow-sm max-w-md">
                <h2 className="text-xl font-bold text-foreground mb-6">Change Password</h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Mobile Number (for verification)
                    </label>
                    <input
                      type="tel"
                      placeholder="Enter your mobile number"
                      value={passwordData.mobileNumber}
                      onChange={(e) => setPasswordData({ ...passwordData, mobileNumber: e.target.value })}
                      className="w-full px-3 py-2 bg-input border border-border rounded-md text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">New Password</label>
                    <div className="relative">
                      <input
                        type={showPassword ? "text" : "password"}
                        placeholder="••••••••"
                        value={passwordData.newPassword}
                        onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                        className="w-full px-3 py-2 bg-input border border-border rounded-md text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                      >
                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">Confirm New Password</label>
                    <input
                      type="password"
                      placeholder="••••••••"
                      value={passwordData.confirmPassword}
                      onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                      className="w-full px-3 py-2 bg-input border border-border rounded-md text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                    />
                  </div>
                  <div className="bg-muted rounded-md p-3 text-sm text-muted-foreground">
                    <p className="font-medium text-foreground mb-2">Password Requirements:</p>
                    <ul className="list-disc list-inside space-y-1 text-xs">
                      <li>At least 6 characters</li>
                      <li>Enter your mobile number for verification</li>
                    </ul>
                  </div>
                  <div className="pt-4 border-t border-border">
                    <Button
                      onClick={handleChangePassword}
                      disabled={saving}
                      className="w-full bg-primary text-primary-foreground hover:bg-primary/90 gap-2"
                    >
                      <Lock size={18} />
                      {saving ? "Updating..." : "Update Password"}
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {/* Company Info */}
            {activeTab === "company" && (
              <div className="bg-card border border-border rounded-lg p-6 shadow-sm">
                <h2 className="text-xl font-bold text-foreground mb-6">Company Information</h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">Company Name</label>
                    <input
                      type="text"
                      value={profileData.companyName}
                      onChange={(e) => setProfileData({ ...profileData, companyName: e.target.value })}
                      className="w-full px-3 py-2 bg-input border border-border rounded-md text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">Phone</label>
                    <input
                      type="tel"
                      value={profileData.phone}
                      onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
                      className="w-full px-3 py-2 bg-input border border-border rounded-md text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                    />
                  </div>
                  <div className="pt-4 border-t border-border">
                    <Button
                      onClick={handleSaveProfile}
                      disabled={saving}
                      className="bg-primary text-primary-foreground hover:bg-primary/90 gap-2"
                    >
                      <Save size={18} />
                      {saving ? "Saving..." : "Save Company Info"}
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Logout */}
        <div className="mt-8 text-center">
          <Button onClick={handleSignOut} variant="outline" className="px-6 bg-transparent">
            Sign Out
          </Button>
        </div>
      </div>
    </div>
  )
}
