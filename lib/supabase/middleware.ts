import { createServerClient } from "@supabase/ssr"
import { type NextRequest, NextResponse } from "next/server"

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseKey) {
    console.warn("[v0] Supabase environment variables are missing in middleware. Skipping session refresh.")
    return response
  }

  const supabase = createServerClient(supabaseUrl, supabaseKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll()
      },
      setAll(cookiesToSet) {
        // Update the request cookies
        cookiesToSet.forEach(({ name, value, options }) => request.cookies.set(name, value))

        // Update the response cookies
        response = NextResponse.next({
          request,
        })

        cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options))
      },
    },
  })

  // Refresh session if expired - required for Server Components
  try {
    await supabase.auth.getUser()
  } catch (error) {
    // Silently handle auth session refresh errors
    // The user's existing session will still work even if refresh fails
    console.error("[v0] Session refresh failed:", error)
  }

  return response
}
