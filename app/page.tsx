"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertTriangle, ArrowRight, CheckCircle2, Factory, ShieldCheck, Mail, Eye, EyeOff } from "lucide-react"
import { signIn, getCurrentUser, resetPassword } from "@/lib/supabase/auth"

export default function LoginPage() {
  const router = useRouter()
  const [role, setRole] = useState<"owner" | "labour">("owner")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
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
      window.history.replaceState({}, "", "/")
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
      <main className="min-h-screen grid lg:grid-cols-2">
        <div className="hidden lg:flex flex-col justify-center items-center bg-sidebar text-sidebar-foreground p-12">
          <div className="animate-pulse">
            <div className="w-16 h-16 bg-primary/20 rounded-2xl flex items-center justify-center border border-primary/20 shadow-sm mb-4">
              <span className="text-3xl font-black text-primary">S</span>
            </div>
          </div>
        </div>
        <div className="flex items-center justify-center bg-background">
          <p className="text-muted-foreground animate-pulse">Initializing Secure Session...</p>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen w-full grid lg:grid-cols-2 relative overflow-hidden">

      {/* LEFT PANEL - BRANDING (Desktop Only) */}
      <div className="hidden lg:flex relative flex-col justify-between bg-sidebar border-r border-sidebar-border p-12 overflow-hidden z-10">
        {/* Abstract Pattern background */}
        <div className="absolute inset-0 opacity-5 pointer-events-none">
          <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-primary via-transparent to-transparent" />
          <svg className="absolute w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
            <pattern id="grid" width="10" height="10" patternUnits="userSpaceOnUse">
              <path d="M 10 0 L 0 0 0 10" fill="none" stroke="currentColor" strokeWidth="0.5" />
            </pattern>
            <rect width="100" height="100" fill="url(#grid)" />
          </svg>
        </div>

        {/* Content */}
        <div className="relative z-10">
          <div className="inline-flex items-center gap-3 mb-8">
            <div className="w-12 h-12 bg-primary/20 rounded-xl flex items-center justify-center border border-primary/20 shadow-md">
              <span className="text-2xl font-black text-primary">S</span>
            </div>
            <div>
              <h1 className="text-2xl font-black text-sidebar-foreground tracking-wide leading-none">STORIX</h1>
              <p className="text-[10px] font-bold text-sidebar-foreground/60 tracking-widest uppercase mt-0.5">Raj Agency</p>
            </div>
          </div>

          <div className="space-y-6 max-w-md">
            <h2 className="text-4xl font-bold text-sidebar-foreground leading-tight tracking-tight">
              Manage your warehouse with precision.
            </h2>
            <p className="text-lg text-sidebar-foreground/80 leading-relaxed text-pretty">
              The complete solution for inventory tracking, billing, and team management. Designed for efficiency.
            </p>
          </div>
        </div>

        <div className="relative z-10 space-y-4">
          <div className="flex items-center gap-4 text-sm font-medium text-sidebar-foreground/70">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-primary" />
              <span>Real-time Sync</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-primary" />
              <span>Secure Access</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-primary" />
              <span>Smart Billing</span>
            </div>
          </div>
          <p className="text-xs text-sidebar-foreground/40">© 2025 Storix</p>
        </div>
      </div>

      {/* RIGHT PANEL - FORM */}
      <div className="flex flex-col justify-center items-center p-6 lg:p-12 relative bg-background">

        {/* Mobile Header (Visible only on small screens) */}
        <div className="lg:hidden w-full max-w-[400px] mb-8 text-center">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-primary/10 rounded-2xl mb-4 border border-primary/10 shadow-sm">
            <span className="text-3xl font-black text-primary">S</span>
          </div>
          <h1 className="text-2xl font-bold text-foreground tracking-tight">Welcome Back</h1>
          <p className="text-muted-foreground mt-2">Sign in to your account</p>
        </div>

        <div className="w-full max-w-[400px] space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">

          {/* Inactivity Alert */}
          {inactivityLogout && (
            <div className="bg-amber-500/10 border border-amber-500/20 text-amber-700 dark:text-amber-500 px-4 py-3 rounded-lg flex items-start gap-3 shadow-sm">
              <ShieldCheck className="w-5 h-5 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-medium text-sm">Session Expired</p>
                <p className="text-xs opacity-90">For your security, you were logged out.</p>
              </div>
            </div>
          )}

          {/* MAIN FORM CARD */}
          <div className="space-y-6">
            {!showForgotPassword ? (
              <>
                <div className="space-y-2 text-center lg:text-left">
                  <h2 className="text-3xl font-bold tracking-tight text-foreground hidden lg:block">Sign in</h2>
                  <p className="text-muted-foreground hidden lg:block">Access your dashboard and manage operations.</p>
                </div>

                {/* Role Switcher */}
                <div className="grid grid-cols-2 p-1 bg-muted/40 rounded-xl border border-border/50">
                  <button
                    onClick={() => setRole("owner")}
                    className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg text-sm font-semibold transition-all duration-300 ${role === "owner"
                      ? "bg-background text-foreground shadow-sm ring-1 ring-black/5"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                      }`}
                  >
                    <ShieldCheck className="w-4 h-4" />
                    Owner
                  </button>
                  <button
                    onClick={() => setRole("labour")}
                    className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg text-sm font-semibold transition-all duration-300 ${role === "labour"
                      ? "bg-background text-foreground shadow-sm ring-1 ring-black/5"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                      }`}
                  >
                    <Factory className="w-4 h-4" />
                    Labour
                  </button>
                </div>

                {/* Error Alert */}
                {error && (
                  <Alert variant="destructive" className="border-destructive/20 bg-destructive/5 animate-in fade-in zoom-in-95">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertTitle>Error</AlertTitle>
                    <AlertDescription>
                      {error}
                    </AlertDescription>
                  </Alert>
                )}

                <form onSubmit={handleLogin} className="space-y-5">
                  <div className="space-y-2">
                    <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70" htmlFor="email">Email</label>
                    <input
                      id="email"
                      type="email"
                      placeholder="name@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="flex h-11 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:border-primary/50 transition-all duration-200"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-sm font-medium leading-none" htmlFor="password">Password</label>
                      <button
                        type="button"
                        onClick={() => setShowForgotPassword(true)}
                        className="text-xs font-medium text-primary hover:text-primary/80 transition-colors"
                      >
                        Forgot password?
                      </button>
                    </div>
                    <div className="relative">
                      <input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="flex h-11 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:border-primary/50 transition-all duration-200 pr-10"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>

                  <Button
                    type="submit"
                    disabled={loading}
                    className="w-full h-11 text-base font-semibold shadow-md active:scale-[0.98] transition-all"
                  >
                    {loading ? "Signing in..." : "Sign In"}
                    {!loading && <ArrowRight className="w-4 h-4 ml-2" />}
                  </Button>
                </form>
              </>
            ) : (
              <div className="animate-in fade-in slide-in-from-right-8 duration-500">
                {!resetEmailSent ? (
                  <div className="space-y-6">
                    <div className="space-y-2">
                      <h2 className="text-2xl font-bold tracking-tight">Reset Password</h2>
                      <p className="text-muted-foreground text-sm">Enter your email to receive a reset link.</p>
                    </div>

                    {error && (
                      <Alert variant="destructive" className="border-destructive/20 bg-destructive/5">
                        <AlertTriangle className="h-4 w-4" />
                        <AlertDescription>{error}</AlertDescription>
                      </Alert>
                    )}

                    <form onSubmit={handleForgotPassword} className="space-y-4">
                      <div className="space-y-2">
                        <label className="text-sm font-medium leading-none" htmlFor="reset-email">Email</label>
                        <input
                          id="reset-email"
                          type="email"
                          placeholder="name@example.com"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          className="flex h-11 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:border-primary/50 transition-all duration-200"
                          required
                        />
                      </div>
                      <Button type="submit" disabled={loading} className="w-full h-11 font-semibold">
                        {loading ? "Sending..." : "Send Reset Link"}
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        onClick={() => {
                          setShowForgotPassword(false)
                          setError(null)
                        }}
                        className="w-full h-11"
                      >
                        Back to Login
                      </Button>
                    </form>
                  </div>
                ) : (
                  <div className="text-center space-y-6">
                    <div className="w-16 h-16 bg-green-500/10 text-green-600 rounded-full flex items-center justify-center mx-auto ring-4 ring-green-500/5">
                      <Mail className="w-8 h-8" />
                    </div>
                    <div className="space-y-2">
                      <h3 className="text-xl font-bold">Check your inbox</h3>
                      <p className="text-muted-foreground text-sm">
                        We've sent a password reset link to <br />
                        <span className="font-semibold text-foreground">{email}</span>
                      </p>
                    </div>
                    <Button
                      onClick={() => {
                        setShowForgotPassword(false)
                        setResetEmailSent(false)
                        setError(null)
                      }}
                      variant="outline"
                      className="w-full h-11"
                    >
                      Back to Login
                    </Button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  )
}
