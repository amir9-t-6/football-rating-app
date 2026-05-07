import Link from "next/link";

export default function HomePage() {
  return (
    <main className="min-h-screen bg-gray-100 p-8">
      <div className="mx-auto max-w-4xl rounded-xl bg-white p-8 shadow">
        <h1 className="text-3xl font-bold">7-a-side Player Ratings ⚽</h1>

        <p className="mt-4 text-gray-600">
          Rate players after each match, vote for MOTM, and track performance weekly.
        </p>

        <div className="mt-6 flex gap-4">
          <Link
            href="/login"
            className="rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
          >
            Login
          </Link>

          <Link
            href="/matches"
            className="rounded border border-blue-600 px-4 py-2 text-blue-600 hover:bg-blue-50"
          >
            View Matches
          </Link>
        </div>
      </div>
    </main>
  );
}