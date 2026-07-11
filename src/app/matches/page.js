import Link from "next/link";
import { supabase } from "@/lib/supabase";

export const dynamic = "force-dynamic";

const getTeams = (title) => {
  if (!title?.toLowerCase().includes("vs")) return [];

  return title
    .split(/vs/i)
    .map((team) => team.trim())
    .filter(Boolean);
};

const formatDate = (date) => {
  if (!date) return "No date";

  return new Intl.DateTimeFormat("en", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(`${date}T00:00:00`));
};

export default async function MatchesPage() {
  const res = await supabase
    .from("matches")
    .select("*")
    .order("match_date", { ascending: false });

  const matches = res.data ?? [];
  const error = res.error;

  return (
    <main className="mx-auto max-w-4xl p-8">
      <div className="rounded-xl bg-white p-6 shadow">
        <h1 className="text-2xl font-bold">Matches</h1>

        {error && (
          <p className="mt-4 rounded border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            {error.message}
          </p>
        )}

        {!error && matches.length === 0 ? (
          <p className="mt-4 text-gray-600">No matches yet.</p>
        ) : (
          <div className="mt-6 space-y-4">
            {matches.map((match) => {
              const teams = getTeams(match.title);

              return (
                <div key={match.id} className="rounded border p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h2 className="font-semibold">{match.title}</h2>
                      <p className="text-sm text-gray-500">
                        {match.location || "Weekly match"}
                      </p>
                    </div>

                    <span className="rounded bg-gray-100 px-3 py-1 text-sm text-gray-700">
                      {formatDate(match.match_date)}
                    </span>
                  </div>

                  <div className="mt-4 flex flex-wrap gap-2">
                    <Link
                      href={`/matches/${match.id}`}
                      className="rounded bg-gray-200 px-3 py-2 text-sm"
                    >
                      Results
                    </Link>

                    <Link
                      href={`/matches/${match.id}/rate`}
                      className="rounded bg-green-600 px-3 py-2 text-sm text-white"
                    >
                      Vote
                    </Link>

                    <Link
                      href={`/matches/${match.id}/best-7`}
                      className="rounded bg-gray-200 px-3 py-2 text-sm"
                    >
                      Best 7
                    </Link>

                    <Link
                      href={`/matches/${match.id}/lineup`}
                      className="rounded bg-gray-200 px-3 py-2 text-sm"
                    >
                      Lineup
                    </Link>

                    {teams.map((team) => (
                      <Link
                        key={team}
                        href={`/matches/${match.id}/team/${encodeURIComponent(
                          team
                        )}`}
                        className="rounded bg-blue-50 px-3 py-2 text-sm text-blue-700"
                      >
                        Team {team}
                      </Link>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}
