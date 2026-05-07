import Link from "next/link";
import { supabase } from "@/lib/supabase";

export const dynamic = "force-dynamic";

const getInitials = (name) =>
  name
    .split(" ")
    .map((word) => word[0])
    .join("")
    .toUpperCase();

const PlayerCard = ({ player }) => (
  <div className="relative flex flex-col items-center text-white">
    <div className="absolute -top-2 -right-2 rounded-full bg-blue-600 px-2 py-1 text-xs font-bold shadow">
      {player.rating}
    </div>

    {player.photo_url ? (
      <img
        src={player.photo_url}
        alt={player.name}
        className="h-16 w-16 rounded-full border-4 border-white object-cover shadow-lg"
      />
    ) : (
      <div className="flex h-16 w-16 items-center justify-center rounded-full border-4 border-white bg-gray-800 text-lg font-bold shadow-lg">
        {getInitials(player.name)}
      </div>
    )}

    <p className="mt-2 text-center text-sm font-semibold">{player.name}</p>
    <p className="text-xs opacity-80">{player.position}</p>
  </div>
);

async function getTeamPageData(matchId, teamName) {
  const { data: matchData, error: matchError } = await supabase
    .from("matches")
    .select("*")
    .eq("id", matchId)
    .single();

  if (matchError) throw matchError;

  const { data: matchPlayers = [], error: matchPlayersError } = await supabase
    .from("match_players")
    .select("*")
    .eq("match_id", matchId)
    .eq("team", teamName);

  if (matchPlayersError) throw matchPlayersError;

  if (matchPlayers.length === 0) {
    return {
      matchTitle: matchData?.title || "",
      players: [],
    };
  }

  const playerIds = [
    ...new Set(matchPlayers.map((item) => item.player_id).filter(Boolean)),
  ];

  if (playerIds.length === 0) {
    return {
      matchTitle: matchData?.title || "",
      players: [],
    };
  }

  const { data: playersData = [], error: playersError } = await supabase
    .from("players")
    .select("*")
    .in("id", playerIds);

  if (playersError) throw playersError;

  const { data: ratingsData = [], error: ratingsError } = await supabase
    .from("ratings")
    .select("*")
    .eq("match_id", matchId);

  if (ratingsError) throw ratingsError;

  const latestMatchPlayers = playerIds.map((playerId) => {
    return matchPlayers
      .filter((mp) => mp.player_id === playerId)
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))[0];
  });

  const players = latestMatchPlayers
    .map((mp) => {
      const player = playersData.find((p) => p.id === mp.player_id);

      if (!player) return null;

      const playerRatings = ratingsData.filter(
        (rating) => rating.player_id === mp.player_id
      );

      const average =
        playerRatings.length > 0
          ? (
              playerRatings.reduce((sum, item) => sum + item.rating, 0) /
              playerRatings.length
            ).toFixed(1)
          : "-";

      return {
        id: player.id,
        name: player.name,
        position: player.position,
        role: mp.role,
        team: mp.team,
        rating: average,
        photo_url: player.photo_url,
      };
    })
    .filter(Boolean);

  return {
    matchTitle: matchData?.title || "",
    players,
  };
}

export default async function TeamLineupPage({ params }) {
  const resolvedParams = await params;
  const matchId = resolvedParams?.id;
  const teamName = decodeURIComponent(resolvedParams?.team || "");

  let matchTitle = "";
  let players = [];
  let errorMessage = "";

  try {
    const data = await getTeamPageData(matchId, teamName);
    matchTitle = data.matchTitle;
    players = data.players;
  } catch (error) {
    console.error(error);
    errorMessage = error?.message || "Could not load this team.";
  }

  const attack = players.filter((p) => p.role === "Attack");
  const midfield = players.filter((p) => p.role === "Midfield");
  const defence = players.filter((p) => p.role === "Defence");
  const gk = players.filter((p) => p.role === "Rotating GK");

  return (
    <main className="mx-auto max-w-4xl p-8">
      <div className="rounded-xl bg-white p-6 shadow">
        <h1 className="text-2xl font-bold">Team {teamName}</h1>

        <p className="mt-2 text-gray-600">
          Match: <span className="font-medium">{matchTitle || matchId}</span>
        </p>

        {errorMessage && (
          <p className="mt-4 rounded border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            {errorMessage}
          </p>
        )}

        <div className="mt-4 flex gap-3">
          <Link
            href={`/matches/${matchId}`}
            className="rounded bg-gray-200 px-4 py-2 text-sm"
          >
            Results
          </Link>

          <Link
            href={`/matches/${matchId}/best-7`}
            className="rounded bg-gray-200 px-4 py-2 text-sm"
          >
            Best 7
          </Link>
        </div>

        <div className="mt-6 rounded-2xl bg-green-700 p-6 shadow-inner">
          <div className="flex min-h-[650px] flex-col justify-between rounded-xl border-4 border-white/70 p-6">
            <div className="flex justify-center gap-10">
              {attack.length > 0 ? (
                attack.map((p) => <PlayerCard key={p.id} player={p} />)
              ) : (
                <p className="text-white/70">No STs</p>
              )}
            </div>

            <div className="flex justify-center gap-12">
              {midfield.length > 0 ? (
                midfield.map((p) => <PlayerCard key={p.id} player={p} />)
              ) : (
                <p className="text-white/70">No MIDs</p>
              )}
            </div>

            <div className="flex justify-center gap-16">
              {defence.length > 0 ? (
                defence.map((p) => <PlayerCard key={p.id} player={p} />)
              ) : (
                <p className="text-white/70">No CBs</p>
              )}
            </div>

            <div className="flex justify-center">
              {gk.length > 0 ? (
                gk.map((p) => <PlayerCard key={p.id} player={p} />)
              ) : (
                <div className="rounded-full border border-white/70 px-4 py-2 text-sm text-white">
                  Rotating GK
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
