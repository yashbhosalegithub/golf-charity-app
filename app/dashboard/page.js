"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"

export default function Dashboard() {
  const [user, setUser] = useState(null)
  const [score, setScore] = useState("")
  const [scores, setScores] = useState([])
  const [subscription, setSubscription] = useState(null)
  const [charities, setCharities] = useState([])
  const [selectedCharity, setSelectedCharity] = useState("")
  const [percentage, setPercentage] = useState(10)
  const [winners, setWinners] = useState([])

  useEffect(() => {
    getUser()
    fetchCharities()
  }, [])

  // ================= USER =================
  const getUser = async () => {
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser()

    if (error) {
      console.log(error)
      return alert("Error fetching user")
    }

    setUser(user)

    if (user) {
      fetchScores(user.id)
      checkSubscription(user.id)
      fetchWinners(user.id)
    }
  }

  // ================= SCORES =================
  const fetchScores = async (userId) => {
    const { data, error } = await supabase
      .from("scores")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })

    if (error) {
      console.log(error)
      return alert("Error fetching scores")
    }

    setScores(data || [])
  }

  const addScore = async () => {
    if (!user) return alert("User not loaded")
    if (!score) return alert("Enter score")

    const scoreValue = parseInt(score)

    if (isNaN(scoreValue)) return alert("Enter valid number")
    if (scoreValue < 1 || scoreValue > 45)
      return alert("Score must be between 1 and 45")

    const { data: existing } = await supabase
      .from("scores")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: true })

    if (existing.length >= 5) {
      const oldest = existing[0]
      await supabase.from("scores").delete().eq("id", oldest.id)
    }

    await supabase.from("scores").insert([
      {
        user_id: user.id,
        score: scoreValue,
      },
    ])

    setScore("")
    fetchScores(user.id)
  }

  // ================= SUBSCRIPTION =================
  const checkSubscription = async (userId) => {
    const { data } = await supabase
      .from("subscriptions")
      .select("*")
      .eq("user_id", userId)
      .eq("status", "active")
      .order("end_date", { ascending: false })
      .limit(1)

    setSubscription(data && data.length > 0 ? data[0] : null)
  }

  const subscribe = async (plan) => {
    if (!user) return alert("User not loaded")

    const startDate = new Date()
    let endDate = new Date()

    if (plan === "monthly") endDate.setMonth(endDate.getMonth() + 1)
    else endDate.setFullYear(endDate.getFullYear() + 1)

    await supabase.from("subscriptions").insert([
      {
        user_id: user.id,
        plan,
        status: "active",
        start_date: startDate.toISOString(),
        end_date: endDate.toISOString(),
      },
    ])

    alert("Subscription activated!")
    checkSubscription(user.id)
  }

  // ================= CHARITY =================
  const fetchCharities = async () => {
    const { data } = await supabase.from("charities").select("*")
    setCharities(data || [])
  }

  const saveCharity = async () => {
    if (!selectedCharity) return alert("Select charity")

    await supabase.from("user_charity").insert([
      {
        user_id: user.id,
        charity_id: selectedCharity,
        percentage,
      },
    ])

    alert("Charity saved!")
  }

  // ================= WINNERS =================
  const fetchWinners = async (userId) => {
    const { data } = await supabase
      .from("winners")
      .select("*")
      .eq("user_id", userId)

    setWinners(data || [])
  }

  // ================= DRAW =================
  const runDraw = async () => {
    const numbers = Array.from({ length: 5 }, () =>
      Math.floor(Math.random() * 45) + 1
    )

    await supabase.from("draws").insert([
      {
        draw_date: new Date().toISOString(),
        numbers: JSON.stringify(numbers),
        type: "random",
        status: "published",
      },
    ])

    alert("Draw: " + numbers.join(", "))
  }

  const checkMatch = async () => {
    if (!user) return alert("User not loaded")

    const { data: drawData } = await supabase
      .from("draws")
      .select("*")
      .order("draw_date", { ascending: false })
      .limit(1)

    if (!drawData || drawData.length === 0)
      return alert("No draw found")

    const drawNumbers = JSON.parse(drawData[0].numbers)

    const { data: userScores } = await supabase
      .from("scores")
      .select("score")
      .eq("user_id", user.id)

    const userNumbers = userScores.map((s) => s.score)

    const matches = userNumbers.filter((num) =>
      drawNumbers.includes(num)
    )

    const matchCount = matches.length

    let prize = "No Prize"

    if (matchCount === 3) prize = "25% Prize"
    else if (matchCount === 4) prize = "35% Prize"
    else if (matchCount === 5) prize = "Jackpot (40%)"

    if (matchCount >= 3) {
      await supabase.from("winners").insert([
        {
          user_id: user.id,
          match_count: matchCount,
          prize,
          status: "pending",
        },
      ])
    }

    fetchWinners(user.id)

    alert(
      `Draw: ${drawNumbers.join(", ")}\n` +
      `Your Numbers: ${userNumbers.join(", ")}\n` +
      `Matches: ${matchCount}\n` +
      `Result: ${prize}`
    )
  }

  // ================= UI =================
  return (
    <div style={{ padding: "20px", background: "#0f172a", minHeight: "100vh", color: "white" }}>
      <h1>Dashboard</h1>

      {user && <p>Email: {user.email}</p>}

      {/* Subscription */}
      {!subscription ? (
        <>
          <button onClick={() => subscribe("monthly")}>Monthly</button>
          <button onClick={() => subscribe("yearly")}>Yearly</button>
        </>
      ) : (
        <p>Active: {subscription.plan}</p>
      )}

      {!subscription ? (
        <p style={{ color: "red" }}>Please subscribe</p>
      ) : (
        <>
          {/* Scores */}
          <input value={score} onChange={(e) => setScore(e.target.value)} />
          <button onClick={addScore}>Add Score</button>

          <button onClick={runDraw}>Run Draw</button>
          <button onClick={checkMatch}>Check Match</button>

          <h3>Scores</h3>
          {scores.map((s) => (
            <p key={s.id}>{s.score}</p>
          ))}

          {/* Charity */}
          <h3>Charity</h3>
          <select onChange={(e) => setSelectedCharity(e.target.value)}>
            <option value="">Select</option>
            {charities.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>

          <input
            type="number"
            value={percentage}
            onChange={(e) => setPercentage(e.target.value)}
          />

          <button onClick={saveCharity}>Save Charity</button>

          {/* Winners */}
          <h3>Winnings</h3>
          {winners.length === 0 ? (
            <p>No winnings yet</p>
          ) : (
            winners.map((w) => (
              <p key={w.id}>
                Match: {w.match_count} → {w.prize} ({w.status})
              </p>
            ))
          )}
        </>
      )}
    </div>
  )
}