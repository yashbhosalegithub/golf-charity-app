"use client"

import { useState } from "react"
import { supabase } from "@/lib/supabase"

export default function Signup() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")

  const handleSignup = async () => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    })

    if (error) {
      alert(error.message)
      return
    }

    const user = data.user

    await supabase.from("profiles").insert([
      {
        id: user.id,
        name: email,
        subscription_status: "inactive",
        subscription_type: "none",
        charity_percentage: 10,
      },
    ])

    alert("Signup successful")
  }

  return (
    <div style={{ padding: "20px" }}>
      <h1>Signup</h1>

      <input
        placeholder="Email"
        onChange={(e) => setEmail(e.target.value)}
      />

      <br /><br />

      <input
        placeholder="Password"
        type="password"
        onChange={(e) => setPassword(e.target.value)}
      />

      <br /><br />

      <button onClick={handleSignup}>Signup</button>
    </div>
  )
}