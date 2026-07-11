"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function MatchPlayersPage() {
  const params = useParams();
  const matchId = Number(params.id);

  const [players, setPlayers] = useState([]);
  const [selectedPlayers, setSelectedPlayers] = useState({});
  const [matchTitle, setMatchTitle] = useState("");

  const teams =
    matchTitle && matchTitle.toLowerCase().includes("vs")
      ? matchTitle.split(/vs/i).map((team) => team.trim())
      : ["Team A", "Team B"];

  useEffect(() => {
    if (!matchId) return;

    fetchMatch();
    fetchPlayers();
    fetchExistingMatchPlayers();
  }, [matchId]);

  const fetchMatch = async () => {
    const { data } = await supabase
      .from("matches")
      .select("*")
      .eq("id", matchId)
      .single();

    if (data) setMatchTitle(data.title);
  };

  const fetchPlayers = async () => {
    const { data, error } = await supabase
      .from("players")
      .select("*")
      .order("name", { ascending: true });

    if (!error) setPlayers(data || []);
  };

  const fetchExistingMatchPlayers = async () => {
    const { data, error } = await supabase
      .from("match_players")
      .select("*")
      .eq("match_id", matchId);

    if (error) return;

    const existing = {};

    data.forEach((item) => {
      existing[item.player_id] = {
        selected: true,
        team: item.team || teams[0],
        role: item.role || "Midfield",
      };
    });

    setSelectedPlayers(existing);
  };

  const togglePlayer = (playerId) => {
    setSelectedPlayers((prev) => ({
      ...prev,
      [playerId]: prev[playerId]
        ? undefined
        : {
            selected: true,
            team: teams[0],
            role: "Midfield",
          },
    }));
  };

  const updatePlayerField = (playerId, field, value) => {
    setSelectedPlayers((prev) => ({
      ...prev,
      [playerId]: {
        ...prev[playerId],
        [field]: value,
      },
    }));
  };

  const handleSave = async () => {
    const { error: deleteError } = await supabase
      .from("match_players")
      .delete()
      .eq("match_id", matchId);

    if (deleteError) {
      alert(deleteError.message);
      return;
    }

    const rowsToInsert = Object.entries(selectedPlayers)
      .filter(([_, value]) => value)
      .map(([playerId, value]) => ({
        match_id: matchId,
        player_id: Number(playerId),
        team: value.team,
        role: value.role,
      }));

    if (rowsToInsert.length === 0) {
      alert("No players selected");
      return;
    }

    const { error: insertError } = await supabase
      .from("match_players")
      .insert(rowsToInsert);

    if (insertError) {
      alert(insertError.message);
      return;
    }

    alert("Match players saved");
  };

  return (
    <main className="mx-auto max-w-4xl p-8">
      <div className="rounded-xl bg-white p-6 shadow">
        <h1 className="text-2xl font-bold">Manage Players</h1>

        <p className="mt-2 text-gray-600">
          Match: <span className="font-medium">{matchTitle || matchId}</span>
        </p>

        <div className="mt-6 space-y-4">
          {players.map((player) => {
            const selected = selectedPlayers[player.id];

            return (
              <div key={player.id} className="rounded border p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">{player.name}</p>
                    <p className="text-sm text-gray-500">{player.position}</p>
                  </div>

                  <input
                    type="checkbox"
                    checked={!!selected}
                    onChange={() => togglePlayer(player.id)}
                    className="h-5 w-5"
                  />
                </div>

                {selected && (
                  <div className="mt-4 grid grid-cols-2 gap-4">
                    <select
                      value={selected.team}
                      onChange={(e) =>
                        updatePlayerField(player.id, "team", e.target.value)
                      }
                      className="rounded border p-2"
                    >
                      {teams.map((team) => (
                        <option key={team} value={team}>
                          {team}
                        </option>
                      ))}
                    </select>

                    <select
                      value={selected.role}
                      onChange={(e) =>
                        updatePlayerField(player.id, "role", e.target.value)
                      }
                      className="rounded border p-2"
                    >
                      <option value="Defence">Defence</option>
                      <option value="Midfield">Midfield</option>
                      <option value="Attack">Attack</option>
                      <option value="Rotating GK">Rotating GK</option>
                    </select>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <button
          onClick={handleSave}
          className="mt-6 w-full rounded bg-blue-600 px-4 py-3 text-white hover:bg-blue-700"
        >
          Save Match Players
        </button>
      </div>
    </main>
  );
}