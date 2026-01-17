import { createClient } from "./client"

export async function signIn(email: string, password: string) {
  const supabase = createClient()

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  console.log("[v0] SignIn response:", { error, user: data?.user?.email })
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

  // Points to the auth confirmation route which exchanges the code for a session
  const redirectUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/api/auth/confirm?next=/reset-password`
      : "https://storix-rajagency.vercel.app/api/auth/confirm?next=/reset-password"

  const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: redirectUrl,
  })

  if (error) throw error
  return data
}
