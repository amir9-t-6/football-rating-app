"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";

export default function NewMatchPage() {
  const [title, setTitle] = useState("");
  const [date, setDate] = useState("");
  const [location, setLocation] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();

    const { data, error } = await supabase
      .from("matches")
      .insert([
        {
          title,
          match_date: date,
          location,
        },
      ])
      .select();

    console.log("insert match data:", data);
    console.log("insert match error:", error);

    if (error) {
      alert(error.message);
      return;
    }

    alert("Match saved to database");
    setTitle("");
    setDate("");
    setLocation("");
  };

  return (
    <main className="mx-auto max-w-md p-8">
      <div className="rounded-xl bg-white p-6 shadow">
        <h1 className="text-2xl font-bold">Create Match</h1>
        <p className="mt-2 text-gray-600">Create a weekly match manually.</p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <input
            type="text"
            placeholder="Example: Monday 7-a-side"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full rounded border border-gray-300 p-3"
            required
          />

          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full rounded border border-gray-300 p-3"
            required
          />

          <input
            type="text"
            placeholder="Optional location"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            className="w-full rounded border border-gray-300 p-3"
          />

          <button
            type="submit"
            className="w-full rounded bg-green-600 px-4 py-3 text-white hover:bg-green-700"
          >
            Save Match
          </button>
        </form>
      </div>
    </main>
  );
}