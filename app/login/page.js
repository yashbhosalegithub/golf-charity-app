"use client"

import { useState } from "react"
import { supabase } from "@/lib/supabase"
import { useRouter } from "next/navigation"

export default function Login() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const router = useRouter()

  const handleLogin = async () => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      alert(error.message)
    } else {
      alert("Login successful")
      router.push("/dashboard")
    }
  }

  return (
    <div style={{ padding: "20px" }}>
      <h1>Login</h1>

      <input placeholder="Email" onChange={(e)=>setEmail(e.target.value)} />
      <br /><br />

      <input placeholder="Password" type="password" onChange={(e)=>setPassword(e.target.value)} />
      <br /><br />

      <button onClick={handleLogin}>Login</button>
    </div>
  )
}