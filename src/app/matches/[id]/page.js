"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function MatchResultsPage() {
  const params = useParams();
  const matchId = Number(params?.id);

  const [matchTitle, setMatchTitle] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!matchId) return;

    const loadPage = async () => {
      setLoading(true);
      setMessage("");

      try {
        const { data: matchData, error: matchError } = await supabase
          .from("matches")
          .select("id, title")
          .eq("id", matchId)
          .single();

        if (matchError) throw matchError;

        setMatchTitle(matchData?.title || "");

        const { data: ratingsData, error: ratingsError } = await supabase
          .from("ratings")
          .select("player_id, rating")
          .eq("match_id", matchId);

        if (ratingsError) throw ratingsError;

        if (!ratingsData || ratingsData.length === 0) {
          setResults([]);
          return;
        }

        const playerIds = [
          ...new Set(ratingsData.map((rating) => rating.player_id)),
        ];

        const { data: playersData, error: playersError } = await supabase
          .from("players")
          .select("id, name, position, photo_url")
          .in("id", playerIds);

        if (playersError) throw playersError;

        const finalResults = (playersData || []).map((player) => {
          const playerRatings = ratingsData.filter(
            (rating) => rating.player_id === player.id,
          );

          const total = playerRatings.reduce(
            (sum, item) => sum + Number(item.rating || 0),
            0,
          );

          const average =
            playerRatings.length > 0 ? total / playerRatings.length : 0;

          return {
            ...player,
            averageRating: average,
            voteCount: playerRatings.length,
          };
        });

        finalResults.sort((a, b) => b.averageRating - a.averageRating);

        setResults(finalResults);
      } catch (error) {
        console.error(error);
        setMessage(error?.message || "Could not load match results.");
        setResults([]);
      } finally {
        setLoading(false);
      }
    };

    loadPage();
  }, [matchId]);

  return (
    <main className="mx-auto max-w-4xl p-8">
      <div className="rounded-xl bg-white p-6 shadow">
        <h1 className="text-2xl font-bold">Match Results</h1>

        <p className="mt-2 text-gray-600">
          Match: <span className="font-medium">{matchTitle || matchId}</span>
        </p>

        {message && (
          <p className="mt-4 rounded border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            {message}
          </p>
        )}

        <div className="mt-6 space-y-3">
          {loading ? (
            <p>Loading results...</p>
          ) : results.length === 0 ? (
            <p>No ratings submitted yet.</p>
          ) : (
            results.map((player, index) => (
              <div
                key={player.id}
                className={`flex items-center justify-between rounded border p-4 ${
                  index === 0 ? "border-yellow-400 bg-yellow-100" : ""
                }`}
              >
                <div className="flex items-center gap-3">
                  {player.photo_url ? (
                    <img
                      src={player.photo_url}
                      alt={player.name}
                      className="h-12 w-12 rounded-full object-cover"
                    />
                  ) : (
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gray-200 font-bold">
                      {player.name?.charAt(0)?.toUpperCase()}
                    </div>
                  )}

                  <div>
                    <p className="font-medium">
                      {index === 0 && "🏆 "}
                      {index + 1}. {player.name}
                    </p>

                    <p className="text-sm text-gray-500">
                      {player.position || "No position"} · {player.voteCount}{" "}
                      vote(s)
                    </p>
                  </div>
                </div>

                <div className="rounded bg-green-600 px-4 py-2 font-bold text-white">
                  {player.averageRating.toFixed(1)}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </main>
  );
}
