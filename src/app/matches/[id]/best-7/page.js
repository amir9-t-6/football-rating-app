import { supabase } from "@/lib/supabase";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

const getRole = (position) => {
  const pos = position?.toLowerCase();

  if (["gk", "keeper", "goalkeeper"].includes(pos)) return "gk";
  if (["cb", "def", "defence", "defense", "lb", "rb"].includes(pos)) {
    return "defence";
  }
  if (["cm", "mid", "midfield", "dm", "am"].includes(pos)) return "midfield";
  if (["st", "cf", "lw", "rw", "attack", "attacker"].includes(pos)) {
    return "attack";
  }

  return "midfield";
};

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

async function getBestSevenData(matchId) {
  const { data: matchData, error: matchError } = await supabase
    .from("matches")
    .select("*")
    .eq("id", matchId)
    .single();

  if (matchError) throw matchError;

  const { data: ratingsData = [], error: ratingsError } = await supabase
    .from("ratings")
    .select("*")
    .eq("match_id", matchId)
    .order("created_at", { ascending: false });

  if (ratingsError) throw ratingsError;

  if (ratingsData.length === 0) {
    return {
      matchTitle: matchData?.title || "",
      players: [],
    };
  }

  const latestRatingsByVoter = ratingsData.reduce((latestByVote, rating) => {
    if (!rating.player_id) return latestByVote;

    const voterKey = rating.voter_id || "legacy";
    const ratingKey = `${rating.player_id}:${voterKey}`;

    if (!latestByVote.has(ratingKey)) {
      latestByVote.set(ratingKey, rating);
    }

    return latestByVote;
  }, new Map());

  const ratingsForAverage = [...latestRatingsByVoter.values()];
  const playerIds = [
    ...new Set(ratingsForAverage.map((rating) => rating.player_id)),
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

  const players = playersData.map((player) => {
    const playerRatings = ratingsForAverage.filter(
      (rating) => rating.player_id === player.id
    );

    const total = playerRatings.reduce(
      (sum, item) => sum + Number(item.rating || 0),
      0
    );
    const average = total / playerRatings.length;

    return {
      id: player.id,
      name: player.name,
      position: player.position,
      photo_url: player.photo_url,
      rating: average.toFixed(1),
      voteCount: playerRatings.length,
    };
  });

  players.sort((a, b) => Number(b.rating) - Number(a.rating));

  return {
    matchTitle: matchData?.title || "",
    players: players.slice(0, 7),
  };
}

export default async function BestSevenPage({ params }) {
  const resolvedParams = await params;
  const matchId = resolvedParams?.id;

  let matchTitle = "";
  let players = [];
  let errorMessage = "";

  try {
    const data = await getBestSevenData(matchId);
    matchTitle = data.matchTitle;
    players = data.players;
  } catch (error) {
    console.error(error);
    errorMessage = error?.message || "Could not load Best 7.";
  }

  const attack = players.filter((p) => getRole(p.position) === "attack");
  const midfield = players.filter((p) => getRole(p.position) === "midfield");
  const defence = players.filter((p) => getRole(p.position) === "defence");
  const gk = players.filter((p) => getRole(p.position) === "gk");

  return (
    <main className="mx-auto max-w-4xl p-8">
      <div className="rounded-xl bg-white p-6 shadow">
        <h1 className="text-2xl font-bold">Best 7</h1>

        <p className="mt-2 text-gray-600">
          Match: <span className="font-medium">{matchTitle || matchId}</span>
        </p>

        {errorMessage && (
          <p className="mt-4 rounded border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            {errorMessage}
          </p>
        )}

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
