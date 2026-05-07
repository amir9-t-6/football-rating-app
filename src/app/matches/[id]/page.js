"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function MatchResultsPage() {
  const params = useParams();
  const matchId = Number(params.id);

  const [matchTitle, setMatchTitle] = useState("");
  const [results, setResults] = useState([]);

  useEffect(() => {
    if (!matchId) return;

    fetchMatch();
    fetchResults();
  }, [matchId]);

  const fetchMatch = async () => {
    const { data } = await supabase
      .from("matches")
      .select("*")
      .eq("id", matchId)
      .single();

    if (data) setMatchTitle(data.title);
  };

  const fetchResults = async () => {
    const { data: ratingsData, error: ratingsError } = await supabase
      .from("ratings")
      .select("*")
      .eq("match_id", matchId);

    if (ratingsError) {
      alert(ratingsError.message);
      return;
    }

    if (!ratingsData || ratingsData.length === 0) {
      setResults([]);
      return;
    }

    const playerIds = ratingsData.map((rating) => rating.player_id);

    const { data: playersData, error: playersError } = await supabase
      .from("players")
      .select("*")
      .in("id", playerIds);

    if (playersError) {
      alert(playersError.message);
      return;
    }

    const finalResults = playersData.map((player) => {
      const playerRatings = ratingsData.filter(
        (rating) => rating.player_id === player.id
      );

      const total = playerRatings.reduce((sum, item) => sum + item.rating, 0);
      const average = total / playerRatings.length;

      return {
        ...player,
        averageRating: average.toFixed(1),
        voteCount: playerRatings.length,
      };
    });

    finalResults.sort((a, b) => b.averageRating - a.averageRating);

    setResults(finalResults);
  };

  return (
    <main className="mx-auto max-w-4xl p-8">
      <div className="rounded-xl bg-white p-6 shadow">
        <h1 className="text-2xl font-bold">Match Results</h1>

        <p className="mt-2 text-gray-600">
          Match: <span className="font-medium">{matchTitle || matchId}</span>
        </p>

        <div className="mt-6 space-y-3">
          {results.length === 0 ? (
            <p>No ratings submitted yet.</p>
          ) : (
            results.map((player, index) => (
              <div
  key={player.id}
  className={`flex items-center justify-between rounded border p-4 ${
    index === 0 ? "bg-yellow-100 border-yellow-400" : ""
  }`}
>
                <div>
                 <p className="font-medium">
  {index === 0 && "🏆 "}
  {index + 1}. {player.name}
</p>
                  <p className="text-sm text-gray-500">
                    {player.position} · {player.voteCount} vote(s)
                  </p>
                </div>

                <div className="rounded bg-green-600 px-4 py-2 font-bold text-white">
                  {player.averageRating}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </main>
  );
}