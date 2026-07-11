import { supabase } from "@/lib/supabase";

export const dynamic = "force-dynamic";

const getInitials = (name) =>
  name
    .split(" ")
    .map((word) => word[0])
    .join("")
    .toUpperCase();

const getAverageRating = (ratings) => {
  if (ratings.length === 0) return "-";

  const total = ratings.reduce((sum, item) => sum + Number(item.rating || 0), 0);
  return (total / ratings.length).toFixed(1);
};

const PlayerCard = ({ player }) => (
  <div className="relative flex w-20 flex-col items-center text-white">
    <div className="absolute -top-2 -right-1 rounded-full bg-blue-600 px-2 py-1 text-xs font-bold shadow">
      {player.rating}
    </div>

    {player.photo_url ? (
      <img
        src={player.photo_url}
        alt={player.name}
        className="h-14 w-14 rounded-full border-4 border-white object-cover shadow-lg"
      />
    ) : (
      <div className="flex h-14 w-14 items-center justify-center rounded-full border-4 border-white bg-gray-800 text-base font-bold shadow-lg">
        {getInitials(player.name)}
      </div>
    )}

    <p className="mt-2 w-full truncate text-center text-sm font-semibold">
      {player.name}
    </p>
    <p className="text-xs opacity-80">{player.position}</p>
  </div>
);

const PitchRow = ({ players, emptyText, spread = false }) => (
  <div
    className={`flex min-h-24 w-full items-center ${
      spread ? "justify-evenly" : "justify-center gap-8"
    }`}
  >
    {players.length > 0 ? (
      players.map((player) => <PlayerCard key={player.id} player={player} />)
    ) : (
      <p className="text-sm text-white/70">{emptyText}</p>
    )}
  </div>
);

const TeamPitch = ({ team, players }) => {
  const attack = players.filter((player) => player.role === "Attack");
  const midfield = players.filter((player) => player.role === "Midfield");
  const defence = players.filter((player) => player.role === "Defence");
  const gk = players.filter((player) => player.role === "Rotating GK");

  return (
    <section>
      <h2 className="mb-3 text-lg font-semibold">Team {team}</h2>
      <div className="rounded-2xl bg-green-700 p-4 shadow-inner">
        <div className="flex min-h-[540px] flex-col justify-between rounded-xl border-4 border-white/70 p-4">
          <PitchRow players={attack} emptyText="No attackers" />
          <PitchRow players={midfield} emptyText="No midfielders" spread />
          <PitchRow players={defence} emptyText="No defenders" spread />
          <PitchRow players={gk} emptyText="Rotating GK" />
        </div>
      </div>
    </section>
  );
};

async function getLineupData(matchId) {
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
    .order("created_at", { ascending: false });

  if (matchPlayersError) throw matchPlayersError;

  if (matchPlayers.length === 0) {
    return {
      match: matchData,
      teams: [],
      players: [],
    };
  }

  const latestMatchPlayers = [
    ...matchPlayers
      .reduce((latestByPlayer, matchPlayer) => {
        if (!latestByPlayer.has(matchPlayer.player_id)) {
          latestByPlayer.set(matchPlayer.player_id, matchPlayer);
        }

        return latestByPlayer;
      }, new Map())
      .values(),
  ];

  const playerIds = latestMatchPlayers
    .map((item) => item.player_id)
    .filter(Boolean);

  const { data: playersData = [], error: playersError } = await supabase
    .from("players")
    .select("*")
    .in("id", playerIds);

  if (playersError) throw playersError;

  const { data: ratings = [], error: ratingsError } = await supabase
    .from("ratings")
    .select("*")
    .eq("match_id", matchId);

  if (ratingsError) throw ratingsError;

  const players = latestMatchPlayers
    .map((matchPlayer) => {
      const player = playersData.find((item) => item.id === matchPlayer.player_id);

      if (!player) return null;

      return {
        id: player.id,
        name: player.name,
        position: player.position,
        photo_url: player.photo_url,
        role: matchPlayer.role,
        team: matchPlayer.team,
        rating: getAverageRating(
          ratings.filter((rating) => rating.player_id === player.id)
        ),
      };
    })
    .filter(Boolean);

  const teams = [...new Set(players.map((player) => player.team).filter(Boolean))];

  return {
    match: matchData,
    teams,
    players,
  };
}

export default async function LineupPage({ params }) {
  const resolvedParams = await params;
  const matchId = resolvedParams?.id;

  let match = null;
  let teams = [];
  let players = [];
  let errorMessage = "";

  try {
    const data = await getLineupData(matchId);
    match = data.match;
    teams = data.teams;
    players = data.players;
  } catch (error) {
    console.error(error);
    errorMessage = error?.message || "Could not load lineup.";
  }

  return (
    <main className="mx-auto max-w-6xl p-8">
      <div className="rounded-xl bg-white p-6 shadow">
        <h1 className="text-2xl font-bold">Lineup</h1>

        <p className="mt-2 text-gray-600">
          Match: <span className="font-medium">{match?.title || matchId}</span>
        </p>

        {errorMessage && (
          <p className="mt-4 rounded border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            {errorMessage}
          </p>
        )}

        {teams.length === 0 ? (
          <p className="mt-6 text-gray-600">No players assigned yet.</p>
        ) : (
          <div className="mt-6 grid gap-6 lg:grid-cols-2">
            {teams.map((team) => (
              <TeamPitch
                key={team}
                team={team}
                players={players.filter((player) => player.team === team)}
              />
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
