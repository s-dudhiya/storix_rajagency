"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { signIn, getCurrentUser, resetPassword } from "@/lib/supabase/auth"

export default function LoginPage() {
  const router = useRouter()
  const [role, setRole] = useState<"owner" | "labour">("owner")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isCheckingAuth, setIsCheckingAuth] = useState(true)
  const [showSetupGuide, setShowSetupGuide] = useState(false)
  const [inactivityLogout, setInactivityLogout] = useState(false)
  const [showForgotPassword, setShowForgotPassword] = useState(false)
  const [resetEmailSent, setResetEmailSent] = useState(false)

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const user = await getCurrentUser()
        console.log("[v0] Current user:", user)
        if (user) {
          const userProfile = await fetch("/api/auth/user-profile").then((r) => r.json())
          console.log("[v0] User profile:", userProfile)
          if (userProfile.role === "owner") {
            router.push("/owner/dashboard")
          } else {
            router.push("/labour/dashboard")
          }
        }
      } catch (err) {
        console.log("[v0] Not authenticated")
      } finally {
        setIsCheckingAuth(false)
      }
    }

    checkAuth()

    const urlParams = new URLSearchParams(window.location.search)
    const logoutReason = urlParams.get("logout") || localStorage.getItem("logoutReason")

    if (logoutReason === "inactivity") {
      setInactivityLogout(true)
      localStorage.removeItem("logoutReason")
      // Clear URL parameter
      window.history.replaceState({}, "", "/")

      // Auto-hide message after 10 seconds
      setTimeout(() => {
        setInactivityLogout(false)
      }, 10000)
    }
  }, [router])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      console.log("[v0] Attempting login with:", email)
      const { user } = await signIn(email, password)
      console.log("[v0] Login successful:", user)

      if (user) {
        const userProfile = await fetch("/api/auth/user-profile").then((r) => r.json())
        console.log("[v0] User profile:", userProfile)
        console.log("[v0] Redirecting to:", userProfile.role === "owner" ? "/owner/dashboard" : "/labour/dashboard")
        const redirectPath = userProfile.role === "owner" ? "/owner/dashboard" : "/labour/dashboard"
        router.push(redirectPath)
      }
    } catch (err: any) {
      console.log("[v0] Login error:", err.message)
      setError("Invalid email or password. Please try again.")
      setShowSetupGuide(true)
    } finally {
      setLoading(false)
    }
  }

  const fillTestCredentials = (type: "owner" | "labour") => {
    setRole(type)
    if (type === "owner") {
      setEmail("owner@test.com")
      setPassword("Test@12345")
    } else {
      setEmail("labour@test.com")
      setPassword("Test@12345")
    }
  }

  // const handleSetupTestUsers = async () => {
  //   try {
  //     setLoading(true)
  //     const response = await fetch("/api/setup/create-test-users")
  //     const data = await response.json()

  //     if (data.success) {
  //       setError(null)
  //       alert("✓ Test users created! Now you can login with the credentials below.")
  //       setShowSetupGuide(false)
  //       fillTestCredentials("owner")
  //     } else {
  //       alert("Setup already done or users already exist. Try logging in!")
  //       setShowSetupGuide(false)
  //     }
  //   } catch (err) {
  //     alert("Error setting up. Please try manually via /api/setup/create-test-users")
  //   } finally {
  //     setLoading(false)
  //   }
  // }

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email) {
      setError("Please enter your email address")
      return
    }

    setError(null)
    setLoading(true)

    try {
      await resetPassword(email)
      setResetEmailSent(true)
      setError(null)
    } catch (err: any) {
      setError("Failed to send reset email. Please check your email address.")
    } finally {
      setLoading(false)
    }
  }

  if (isCheckingAuth) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-background to-muted flex items-center justify-center px-4">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-primary rounded-xl mb-4">
            <span className="text-2xl font-bold text-primary-foreground">S</span>
          </div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-background to-muted flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-primary rounded-xl mb-4">
            <span className="text-2xl font-bold text-primary-foreground">S</span>
          </div>
          <h1 className="text-3xl font-bold text-foreground mb-2">STORIX</h1>
          <p className="text-muted-foreground">RAJ AGENCY-Warehouse Management System</p>
        </div>

        {inactivityLogout && (
          <div className="bg-amber-500/10 border border-amber-500/30 text-amber-700 dark:text-amber-400 px-4 py-3 rounded-lg mb-4">
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
              <div className="flex-1">
                <p className="font-medium text-sm">Session Expired</p>
                <p className="text-xs mt-0.5">You were logged out due to inactivity. Please sign in again.</p>
              </div>
              <button
                onClick={() => setInactivityLogout(false)}
                className="text-amber-700 dark:text-amber-400 hover:text-amber-800 dark:hover:text-amber-300"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        )}

        {/* Login Card */}
        <div className="bg-card rounded-lg shadow-sm border border-border p-6 mb-4">
          {!showForgotPassword ? (
            <>
              {/* Role Selection */}
              <div className="flex gap-2 mb-6">
                <button
                  onClick={() => setRole("owner")}
                  className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-colors ${role === "owner"
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground hover:bg-secondary"
                    }`}
                >
                  Owner
                </button>
                <button
                  onClick={() => setRole("labour")}
                  className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-colors ${role === "labour"
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground hover:bg-secondary"
                    }`}
                >
                  Labour
                </button>
              </div>

              {/* Error Message */}
              {error && (
                <div className="bg-destructive/10 border border-destructive/20 text-destructive px-4 py-2 rounded-md text-sm mb-4">
                  {error}
                  {showSetupGuide && (
                    <div className="mt-2 text-xs">
                      <p className="font-medium mb-2">Invalid Credentials</p>

                    </div>
                  )}
                </div>
              )}

              {/* Form */}
              <form onSubmit={handleLogin} className="space-y-4">
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-foreground mb-2">
                    Email
                  </label>
                  <input
                    id="email"
                    type="email"
                    placeholder="your@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-3 py-2 bg-input border border-border rounded-md text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                    required
                  />
                </div>

                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-foreground mb-2">
                    Password
                  </label>
                  <input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-3 py-2 bg-input border border-border rounded-md text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                    required
                  />
                </div>

                <div className="text-right">
                  <button
                    type="button"
                    onClick={() => setShowForgotPassword(true)}
                    className="text-sm text-primary hover:underline"
                  >
                    Forgot password?
                  </button>
                </div>

                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-primary text-primary-foreground hover:bg-primary/90 font-medium py-2"
                >
                  {loading ? "Signing in..." : "Sign In"}
                </Button>
              </form>



            </>
          ) : (
            <>
              {!resetEmailSent ? (
                <>
                  <h2 className="text-xl font-semibold text-foreground mb-2">Reset Password</h2>
                  <p className="text-sm text-muted-foreground mb-6">
                    Enter your email address and we'll send you a link to reset your password.
                  </p>

                  {error && (
                    <div className="bg-destructive/10 border border-destructive/20 text-destructive px-4 py-2 rounded-md text-sm mb-4">
                      {error}
                    </div>
                  )}

                  <form onSubmit={handleForgotPassword} className="space-y-4">
                    <div>
                      <label htmlFor="reset-email" className="block text-sm font-medium text-foreground mb-2">
                        Email
                      </label>
                      <input
                        id="reset-email"
                        type="email"
                        placeholder="your@email.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full px-3 py-2 bg-input border border-border rounded-md text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                        required
                      />
                    </div>

                    <Button
                      type="submit"
                      disabled={loading}
                      className="w-full bg-primary text-primary-foreground hover:bg-primary/90 font-medium py-2"
                    >
                      {loading ? "Sending..." : "Send Reset Link"}
                    </Button>

                    <Button
                      type="button"
                      onClick={() => {
                        setShowForgotPassword(false)
                        setError(null)
                      }}
                      variant="outline"
                      className="w-full"
                    >
                      Back to Login
                    </Button>
                  </form>
                </>
              ) : (
                <>
                  <div className="text-center py-6">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-green-500/10 rounded-full mb-4">
                      <svg className="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <h2 className="text-xl font-semibold text-foreground mb-2">Check Your Email</h2>
                    <p className="text-sm text-muted-foreground mb-6">
                      We've sent a password reset link to <strong>{email}</strong>
                    </p>
                    <Button
                      onClick={() => {
                        setShowForgotPassword(false)
                        setResetEmailSent(false)
                        setError(null)
                      }}
                      className="w-full"
                    >
                      Back to Login
                    </Button>
                  </div>
                </>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-muted-foreground">STORIX © 2025 | Warehouse Management</p>
      </div>
    </main>
  )
}
