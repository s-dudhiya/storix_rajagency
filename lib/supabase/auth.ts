import { createClient } from "./client"

export async function signIn(email: string, password: string) {
  const supabase = createClient()

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  console.log("SignIn response:", { error, user: data?.user?.email })
  if (error) throw error
  return data
}

export async function signOut() {
  const supabase = createClient()
  const { error } = await supabase.auth.signOut({ scope: "global" })
  if (error) throw error
}

export async function getCurrentUser() {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  return user
}

export async function getUserProfile(userId: string) {
  const supabase = createClient()
  const { data, error } = await supabase.from("users").select("*").eq("id", userId).single()
  if (error) throw error
  return data
}

export async function resetPassword(email: string) {
  const supabase = createClient()

  // Determine the base URL for the redirect
  // let siteUrl =
  //   process.env.NEXT_PUBLIC_SITE_URL ??
  //   process.env.NEXT_PUBLIC_VERCEL_URL ??
  //   (typeof window !== "undefined" ? window.location.origin : "http://localhost:3000")

  // // Ensure protocol is present (Vercel env vars don't include it)
  // if (!siteUrl.startsWith("http")) {
  //   siteUrl = `https://${siteUrl}`
  // }

  // // Remove trailing slash if present
  // siteUrl = siteUrl.replace(/\/$/, "")

  const redirectUrl = "https://storix-rajagency.vercel.app/api/auth/confirm?next=/reset-password"

  console.log("Reset Password Redirect URL:", redirectUrl)

  const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: redirectUrl,
  })

  if (error) throw error
  return data
}
