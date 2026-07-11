"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export default function ClaimPlayerPage() {
  const [user, setUser] = useState(null);
  const [code, setCode] = useState("");
  const [linkedPlayer, setLinkedPlayer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [claiming, setClaiming] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    const loadUser = async () => {
      const {
        data: { session },
        error,
      } = await supabase.auth.getSession();

      if (error) {
        setMessage(error.message);
        setLoading(false);
        return;
      }

      const currentUser = session?.user || null;
      setUser(currentUser);

      if (currentUser) {
        const { data: player, error: playerError } = await supabase
          .from("players")
          .select("*")
          .eq("user_id", currentUser.id)
          .maybeSingle();

        if (playerError) {
          setMessage(playerError.message);
        } else {
          setLinkedPlayer(player);
        }
      }

      setLoading(false);
    };

    loadUser();
  }, []);

  const handleClaim = async (event) => {
    event.preventDefault();

    if (!user) return;

    setClaiming(true);
    setMessage("");

    const normalizedCode = code.trim().toUpperCase();

    const { data: existingPlayer, error: existingPlayerError } = await supabase
      .from("players")
      .select("id,name")
      .eq("user_id", user.id)
      .maybeSingle();

    if (existingPlayerError) {
      setMessage(existingPlayerError.message);
      setClaiming(false);
      return;
    }

    if (existingPlayer) {
      setLinkedPlayer(existingPlayer);
      setMessage(`Your account is already linked to ${existingPlayer.name}.`);
      setClaiming(false);
      return;
    }

    const { data: player, error: playerError } = await supabase
      .from("players")
      .select("*")
      .eq("claim_code", normalizedCode)
      .maybeSingle();

    if (playerError) {
      setMessage(playerError.message);
      setClaiming(false);
      return;
    }

    if (!player) {
      setMessage("No player found with that claim code.");
      setClaiming(false);
      return;
    }

    if (player.user_id) {
      setMessage("This claim code has already been used.");
      setClaiming(false);
      return;
    }

    const { data: claimedPlayer, error: updateError } = await supabase
      .from("players")
      .update({
        user_id: user.id,
        claimed_at: new Date().toISOString(),
      })
      .eq("id", player.id)
      .is("user_id", null)
      .select("*")
      .single();

    if (updateError) {
      setMessage(updateError.message);
      setClaiming(false);
      return;
    }

    setLinkedPlayer(claimedPlayer);
    setMessage(`Claimed ${claimedPlayer.name}. You can now vote.`);
    setCode("");
    setClaiming(false);
  };

  if (loading) {
    return (
      <main className="mx-auto max-w-md p-8">
        <p className="text-center">Checking account...</p>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-md p-8">
      <div className="rounded-xl bg-white p-6 shadow">
        <h1 className="text-2xl font-bold">Activate Voting</h1>

        {!user ? (
          <div className="mt-4">
            <p className="text-gray-600">
              Login first, then enter your private player code.
            </p>
            <Link
              href="/login"
              className="mt-4 inline-block rounded bg-blue-600 px-4 py-2 text-white"
            >
              Login
            </Link>
          </div>
        ) : linkedPlayer ? (
          <div className="mt-4">
            <p className="text-gray-600">
              Your account is linked to{" "}
              <span className="font-medium">{linkedPlayer.name}</span>.
            </p>
            <Link
              href="/matches"
              className="mt-4 inline-block rounded bg-green-600 px-4 py-2 text-white"
            >
              Go to Matches
            </Link>
          </div>
        ) : (
          <form onSubmit={handleClaim} className="mt-6 space-y-4">
            <p className="text-sm text-gray-600">
              Ask the match organiser for your private player code.
            </p>

            <input
              type="text"
              placeholder="Claim code"
              value={code}
              onChange={(event) => setCode(event.target.value.toUpperCase())}
              className="w-full rounded border p-3 uppercase"
              required
            />

            <button
              type="submit"
              disabled={claiming}
              className="w-full rounded bg-green-600 px-4 py-3 text-white hover:bg-green-700 disabled:opacity-60"
            >
              {claiming ? "Activating..." : "Activate Voting"}
            </button>
          </form>
        )}

        {message && (
          <p className="mt-4 rounded border border-blue-200 bg-blue-50 p-3 text-sm text-blue-700">
            {message}
          </p>
        )}
      </div>
    </main>
  );
}
