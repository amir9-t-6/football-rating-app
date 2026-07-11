"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

export default function AdminMatchesPage() {
  const [matches, setMatches] = useState([]);

  useEffect(() => {
    fetchMatches();
  }, []);

  const fetchMatches = async () => {
    const { data, error } = await supabase
      .from("matches")
      .select("*")
      .order("match_date", { ascending: false });

    console.log("matches data:", data);
    console.log("matches error:", error);

    if (error) return;

    setMatches(data || []);
  };

  return (
    <main className="mx-auto max-w-4xl p-8">
      <div className="rounded-xl bg-white p-6 shadow">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-bold">Matches</h1>

          <Link
            href="/admin/matches/new"
            className="rounded bg-green-600 px-4 py-2 text-white"
          >
            Create Match
          </Link>
        </div>

        {matches.length === 0 ? (
          <p>No matches yet.</p>
        ) : (
          <div className="space-y-3">
            {matches.map((match) => (
              <div
                key={match.id}
                className="flex justify-between rounded border p-3"
              >
                <div>
                  <p className="font-semibold">{match.title}</p>
                  <p className="text-sm text-gray-500">{match.location}</p>
                </div>
                <span className="text-gray-600">{match.match_date}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}