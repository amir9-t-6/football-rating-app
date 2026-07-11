"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";

const generateClaimCode = (name) => {
  const prefix =
    name
      ?.replace(/[^a-z0-9]/gi, "")
      .slice(0, 8)
      .toUpperCase() || "PLAYER";
  const suffix = Math.random().toString(36).slice(2, 6).toUpperCase();

  return `${prefix}-${suffix}`;
};

export default function NewPlayerPage() {
  const [name, setName] = useState("");
  const [position, setPosition] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();

    const { data, error } = await supabase
      .from("players")
      .insert([{ name, position, claim_code: generateClaimCode(name) }])
      .select();

    console.log("insert data:", data);
    console.log("insert error:", error);

    if (error) {
      alert(error.message);
      return;
    }

    alert("Player saved to database");
    setName("");
    setPosition("");
  };

  return (
    <main className="mx-auto max-w-md p-8">
      <div className="rounded-xl bg-white p-6 shadow">
        <h1 className="text-2xl font-bold">Add Player</h1>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <input
            type="text"
            placeholder="Player name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full rounded border p-3"
            required
          />

          <input
            type="text"
            placeholder="Position"
            value={position}
            onChange={(e) => setPosition(e.target.value)}
            className="w-full rounded border p-3"
          />

          <button
            type="submit"
            className="w-full rounded bg-blue-600 px-4 py-2 text-white"
          >
            Save Player
          </button>
        </form>
      </div>
    </main>
  );
} 
