"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
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

export default function PlayersPage() {
  const [players, setPlayers] = useState([]);
  const [savingPlayerId, setSavingPlayerId] = useState(null);

  const fetchPlayers = useCallback(async () => {
    const { data, error } = await supabase
      .from("players")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      alert(error.message);
      return;
    }

    setPlayers(data || []);
  }, []);

  useEffect(() => {
    queueMicrotask(() => {
      fetchPlayers();
    });
  }, [fetchPlayers]);

  const handleGenerateCode = async (player) => {
    const claimCode = generateClaimCode(player.name);

    setSavingPlayerId(player.id);

    const { data, error } = await supabase
      .from("players")
      .update({ claim_code: claimCode })
      .eq("id", player.id)
      .select("*")
      .single();

    setSavingPlayerId(null);

    if (error) {
      alert(error.message);
      return;
    }

    setPlayers((prev) =>
      prev.map((item) => (item.id === player.id ? data : item))
    );
  };

  return (
    <main className="mx-auto max-w-3xl p-8">
      <div className="rounded-xl bg-white p-6 shadow">
        <div className="flex items-center justify-between gap-4">
          <h1 className="text-2xl font-bold">Players</h1>

          <Link
            href="/admin/players/new"
            className="rounded bg-blue-600 px-4 py-2 text-sm text-white"
          >
            Add Player
          </Link>
        </div>

        {players.length === 0 ? (
          <p className="mt-6">No players yet.</p>
        ) : (
          <div className="mt-6 space-y-3">
            {players.map((player) => (
              <div key={player.id} className="rounded border p-3">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="font-medium">{player.name}</p>
                    <p className="text-sm text-gray-500">{player.position}</p>
                    <p className="mt-1 text-xs text-gray-500">
                      {player.user_id ? "Claimed" : "Not claimed"}
                    </p>
                  </div>

                  <div className="text-right">
                    {player.claim_code ? (
                      <p className="rounded bg-gray-100 px-3 py-2 font-mono text-sm">
                        {player.claim_code}
                      </p>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleGenerateCode(player)}
                        disabled={savingPlayerId === player.id}
                        className="rounded bg-green-600 px-3 py-2 text-sm text-white disabled:opacity-60"
                      >
                        {savingPlayerId === player.id
                          ? "Generating"
                          : "Generate Code"}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
