import { createBrowserClient } from "@supabase/ssr"

export function createClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseKey) {
    console.error("Supabase environment variables are missing!")
  }

  return createBrowserClient(supabaseUrl || "", supabaseKey || "", {
    cookies: {
      getAll() {
        if (typeof document === "undefined") return []
        return document.cookie.split(";").map((c) => {
          const [key, ...v] = c.split("=")
          if (!key) return { name: "", value: "" }
          return { name: key.trim(), value: v.join("=") }
        })
      },
      setAll(cookiesToSet) {
        if (typeof document === "undefined") return

        cookiesToSet.forEach(({ name, value, options }) => {
          // Force session cookie by ignoring maxAge property
          // This ensures the cookie is deleted when the browser is closed
          let cookieString = `${name}=${encodeURIComponent(value)}`
          if (options.path) cookieString += `; path=${options.path}`
          if (options.domain) cookieString += `; domain=${options.domain}`
          if (options.sameSite) cookieString += `; samesite=${options.sameSite}`
          if (options.secure) cookieString += `; secure`

          document.cookie = cookieString
        })
      },
    },
  })
}
