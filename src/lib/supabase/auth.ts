import { createClient } from './client'

export async function signUpUser({
  fullName,
  email,
  password,
}: {
  fullName: string
  email: string
  password: string
}) {
  const supabase = createClient()

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { full_name: fullName },
    },
  })

  return { data, error }
}

export async function signInUser({
  email,
  password,
}: {
  email: string
  password: string
}) {
  const supabase = createClient()

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  return { data, error }
}

export async function signOutUser() {
  const supabase = createClient()
  const { error } = await supabase.auth.signOut()
  return { error }
}

export async function getCurrentUser() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  return user
}