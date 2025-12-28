"use client"

import type React from "react"

import { useEffect, useState, useRef, useCallback } from "react"
import { useRouter, usePathname } from "next/navigation"
import { signOut } from "@/lib/supabase/auth"

const INACTIVITY_TIMEOUT = 10 * 60 * 1000 // 10 minutes
const WARNING_BEFORE_LOGOUT = 2 * 60 * 1000 // 2 minutes warning
const CHECK_INTERVAL = 5000 // Check every 5 seconds
const ACTIVITY_DEBOUNCE = 1000 // Only count activity once per second

export function InactivityProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const [showWarning, setShowWarning] = useState(false)
  const [countdown, setCountdown] = useState(120) // 2 minutes in seconds
  const lastActivityRef = useRef<number>(Date.now())
  const lastActivityUpdateRef = useRef<number>(Date.now())
  const checkIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const countdownIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const hasWarningShownRef = useRef(false)

  const isAuthenticatedRoute =
    pathname?.startsWith("/owner") || pathname?.startsWith("/labour") || pathname?.startsWith("/settings")

  const handleLogout = useCallback(async () => {
    try {
      console.log("[v0] Auto-logout due to inactivity")
      // Set flag in localStorage for login page to show message
      localStorage.setItem("logoutReason", "inactivity")
      await signOut()
      router.push("/?logout=inactivity")
    } catch (error) {
      console.error("[v0] Auto-logout error:", error)
      localStorage.setItem("logoutReason", "inactivity")
      router.push("/?logout=inactivity")
    }
  }, [router])

  const updateActivity = useCallback(() => {
    const now = Date.now()

    // Only update if enough time has passed since last update (debounce)
    if (now - lastActivityUpdateRef.current < ACTIVITY_DEBOUNCE) {
      return
    }

    lastActivityRef.current = now
    lastActivityUpdateRef.current = now

    if (showWarning) {
      setShowWarning(false)
      hasWarningShownRef.current = false
    }
    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current)
      countdownIntervalRef.current = null
    }
    console.log("[v0] Real user activity detected, timer reset at", new Date(now).toLocaleTimeString())
  }, [showWarning])

  const checkInactivity = useCallback(() => {
    const now = Date.now()
    const inactiveTime = now - lastActivityRef.current
    const timeUntilLogout = INACTIVITY_TIMEOUT - inactiveTime
    const timeUntilWarning = INACTIVITY_TIMEOUT - WARNING_BEFORE_LOGOUT - inactiveTime

    if (Math.floor(inactiveTime / 1000) % 60 === 0) {
      console.log("[v0] Inactivity check:", {
        inactiveMinutes: Math.floor(inactiveTime / 60000),
        timeUntilWarning: Math.floor(timeUntilWarning / 1000),
        timeUntilLogout: Math.floor(timeUntilLogout / 1000),
      })
    }

    // Show warning if we're within warning period and haven't shown it yet
    if (timeUntilWarning <= 0 && !hasWarningShownRef.current) {
      console.log("[v0] Showing inactivity warning")
      hasWarningShownRef.current = true
      setShowWarning(true)
      setCountdown(Math.floor(timeUntilLogout / 1000))

      // Start countdown
      if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current)
      countdownIntervalRef.current = setInterval(() => {
        const now = Date.now()
        const remaining = Math.floor((INACTIVITY_TIMEOUT - (now - lastActivityRef.current)) / 1000)
        if (remaining <= 0) {
          setCountdown(0)
          if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current)
        } else {
          setCountdown(remaining)
        }
      }, 1000)
    }

    // Auto logout if time expired
    if (timeUntilLogout <= 0) {
      console.log("[v0] Timeout reached, logging out automatically")
      handleLogout()
    }
  }, [handleLogout])

  const handleStayLoggedIn = () => {
    console.log("[v0] User chose to stay logged in")
    setShowWarning(false)
    hasWarningShownRef.current = false
    updateActivity()
  }

  useEffect(() => {
    if (!isAuthenticatedRoute) {
      // Cleanup timers if user navigates to non-authenticated route
      if (checkIntervalRef.current) clearInterval(checkIntervalRef.current)
      if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current)
      setShowWarning(false)
      hasWarningShownRef.current = false
      return
    }

    console.log("[v0] Inactivity provider initialized for 10 minute timeout")

    const events = ["mousedown", "keydown", "touchstart", "click"]

    // Add event listeners
    events.forEach((event) => {
      window.addEventListener(event, updateActivity, { passive: true })
    })

    checkIntervalRef.current = setInterval(checkInactivity, CHECK_INTERVAL)

    // Initialize activity timestamp
    lastActivityRef.current = Date.now()
    lastActivityUpdateRef.current = Date.now()

    // Cleanup
    return () => {
      events.forEach((event) => {
        window.removeEventListener(event, updateActivity)
      })
      if (checkIntervalRef.current) clearInterval(checkIntervalRef.current)
      if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current)
    }
  }, [isAuthenticatedRoute, updateActivity, checkInactivity])

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, "0")}`
  }

  return (
    <>
      {children}

      {/* Removed warning dialog, now auto-logout directly and redirect with inactivity flag */}
    </>
  )
}
