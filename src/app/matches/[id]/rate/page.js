"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function RateMatchPage() {
  const params = useParams();
  const router = useRouter();
  const matchId = Number(params.id);

  const [matchTitle, setMatchTitle] = useState("");
  const [matchDate, setMatchDate] = useState("");
  const [players, setPlayers] = useState([]);
  const [ratings, setRatings] = useState({});
  const [user, setUser] = useState(null);
  const [linkedPlayer, setLinkedPlayer] = useState(null);
  const [alreadyVoted, setAlreadyVoted] = useState(false);
  const [allowedToVote, setAllowedToVote] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  const loadPage = useCallback(async () => {
    if (!matchId) return;

    setLoading(true);
    setMessage("");
    setAlreadyVoted(false);
    setAllowedToVote(false);
    setLinkedPlayer(null);
    setPlayers([]);
    setRatings({});

    try {
      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();

      if (sessionError) throw sessionError;

      const currentUser = session?.user || null;
      setUser(currentUser);

      if (!currentUser) {
        setMessage("Please log in before voting.");
        return;
      }

      const { data: match, error: matchError } = await supabase
        .from("matches")
        .select("*")
        .eq("id", matchId)
        .single();

      if (matchError) throw matchError;

      setMatchTitle(match?.title || "");
      setMatchDate(match?.match_date || "");

      const { data: playerProfile, error: profileError } = await supabase
        .from("players")
        .select("*")
        .eq("user_id", currentUser.id)
        .maybeSingle();

      if (profileError) throw profileError;

      if (!playerProfile) {
        setMessage("Your login is not linked to a player yet.");
        return;
      }

      setLinkedPlayer(playerProfile);

      const { data: voterMatchPlayer, error: voterError } = await supabase
        .from("match_players")
        .select("*")
        .eq("match_id", matchId)
        .eq("player_id", playerProfile.id)
        .maybeSingle();

      if (voterError) throw voterError;

      if (!voterMatchPlayer) {
        setMessage("Only players selected for this match can vote.");
        return;
      }

      const { data: existingVotes, error: existingVoteError } = await supabase
        .from("ratings")
        .select("id")
        .eq("match_id", matchId)
        .eq("voter_id", currentUser.id)
        .limit(1);

      if (existingVoteError) throw existingVoteError;

      if ((existingVotes || []).length > 0) {
        setAlreadyVoted(true);
        setMessage("You have already voted for this match.");
        return;
      }

      const { data: matchPlayers, error: matchPlayersError } = await supabase
        .from("match_players")
        .select("player_id")
        .eq("match_id", matchId);

      if (matchPlayersError) throw matchPlayersError;

      const playerIds = [
        ...new Set(
          (matchPlayers || []).map((item) => item.player_id).filter(Boolean),
        ),
      ];

      if (playerIds.length === 0) {
        setPlayers([]);
        return;
      }

      const { data: playersData, error: playersError } = await supabase
        .from("players")
        .select("*")
        .in("id", playerIds);

      if (playersError) throw playersError;

      setPlayers(playersData || []);
      setAllowedToVote(true);
    } catch (error) {
      console.error(error);
      setMessage(error?.message || "Could not check voting access.");
    } finally {
      setLoading(false);
    }
  }, [matchId]);

  useEffect(() => {
    queueMicrotask(() => {
      loadPage();
    });
  }, [loadPage]);

  const handleRatingChange = (playerId, value) => {
    setRatings((prev) => ({
      ...prev,
      [playerId]: value ? Number(value) : "",
    }));
  };

  const handleSaveRatings = async () => {
    if (!user || !linkedPlayer || !allowedToVote || alreadyVoted) return;

    const rows = players
      .filter((player) => player.id !== linkedPlayer.id && ratings[player.id])
      .map((player) => ({
        match_id: matchId,
        player_id: player.id,
        voter_id: user.id,
        rating: ratings[player.id],
      }));

    if (rows.length === 0) {
      alert("Please add at least one rating");
      return;
    }

    setSaving(true);

    const { error } = await supabase.from("ratings").insert(rows);

    if (error) {
      alert(error.message);
      setSaving(false);
      return;
    }

    setSaving(false);
    setAlreadyVoted(true);
    setAllowedToVote(false);
    router.push(`/matches/${matchId}/best-7`);
  };

  const rateablePlayers = linkedPlayer
    ? players.filter((player) => player.id !== linkedPlayer.id)
    : players;

  if (loading) {
    return (
      <main className="mx-auto max-w-3xl p-8">
        <p className="text-center">Checking voting access...</p>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-3xl p-8">
      <div className="rounded-xl bg-white p-6 shadow">
        <h1 className="text-2xl font-bold">Rate Match</h1>

        {matchTitle && (
          <p className="mt-2 text-gray-600">
            Match: <span className="font-medium">{matchTitle}</span>
          </p>
        )}

        {matchDate && (
          <p className="mt-1 text-sm text-gray-500">
            Date: <span className="font-medium">{matchDate}</span>
          </p>
        )}

        {linkedPlayer && (
          <p className="mt-2 text-sm text-gray-500">
            Voting as <span className="font-medium">{linkedPlayer.name}</span>
          </p>
        )}

        {message && (
          <p className="mt-4 rounded border border-blue-200 bg-blue-50 p-3 text-sm text-blue-700">
            {message}
          </p>
        )}

        <div className="mt-4 flex flex-wrap gap-3">
          {!user && (
            <Link
              href="/login"
              className="rounded bg-blue-600 px-4 py-2 text-white"
            >
              Login
            </Link>
          )}

          <Link
            href={`/matches/${matchId}/best-7`}
            className="rounded bg-gray-200 px-4 py-2 text-sm"
          >
            Best 7
          </Link>
        </div>

        {allowedToVote && (
          <>
            <div className="mt-6 space-y-3">
              {rateablePlayers.length === 0 ? (
                <p>No other players are available to rate.</p>
              ) : (
                rateablePlayers.map((player) => (
                  <div
                    key={player.id}
                    className="flex items-center justify-between rounded border p-3"
                  >
                    <div>
                      <p className="font-medium">{player.name}</p>
                      <p className="text-sm text-gray-500">{player.position}</p>
                    </div>

                    <select
                      value={ratings[player.id] || ""}
                      onChange={(e) =>
                        handleRatingChange(player.id, e.target.value)
                      }
                      className="rounded border p-2"
                    >
                      <option value="">Rate</option>
                      {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
                        <option key={num} value={num}>
                          {num}
                        </option>
                      ))}
                    </select>
                  </div>
                ))
              )}
            </div>

            <button
              onClick={handleSaveRatings}
              disabled={saving || rateablePlayers.length === 0}
              className="mt-6 w-full rounded bg-green-600 px-4 py-3 text-white hover:bg-green-700 disabled:opacity-60"
            >
              {saving ? "Saving..." : "Submit Vote"}
            </button>
          </>
        )}
      </div>
    </main>
  );
}
