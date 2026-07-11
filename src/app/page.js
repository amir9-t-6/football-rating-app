"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export default function HomePage() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setUser(data.session?.user || null);
    });

    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user || null);
      },
    );

    return () => {
      listener.subscription.unsubscribe();
    };
  }, []);

  const username =
    user?.user_metadata?.full_name ||
    user?.raw_user_meta_data?.full_name ||
    user?.email?.split("@")[0]?.replace("_", " ") ||
    "Player";

  return (
    <main className="min-h-screen bg-gray-100 p-8">
      <div className="mx-auto max-w-4xl rounded-xl bg-white p-8 shadow">
        <h1 className="text-3xl font-bold">
          {user ? `Welcome back, ${username} 👋` : "7-a-side Player Ratings ⚽"}
        </h1>

        <p className="mt-4 text-gray-600">
          {user
            ? "Ready to rate this week's match?"
            : "Rate players after each match, vote for MOTM, and track performance weekly."}
        </p>

        <div className="mt-6 flex gap-4">
          {!user && (
            <Link
              href="/login"
              className="rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
            >
              Login
            </Link>
          )}

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
