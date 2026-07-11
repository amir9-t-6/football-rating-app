"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

const getAdminEmails = () =>
  (process.env.NEXT_PUBLIC_ADMIN_EMAILS || "")
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);

export default function Navbar() {
  const [user, setUser] = useState(null);
  const adminEmails = getAdminEmails();
  const isAdmin = user?.email
    ? adminEmails.includes(user.email.toLowerCase())
    : false;

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

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
  };

  return (
    <nav className="border-b bg-white">
      <div className="mx-auto flex max-w-6xl items-center justify-between p-4">
        <Link href="/" className="text-xl font-bold">
          Rating App
        </Link>

        <div className="flex gap-4">
          <Link href="/">Home</Link>
          {!user && <Link href="/login">Login</Link>}
          {user && !isAdmin && (
            <Link href="/claim-player">Activate Voting</Link>
          )}{" "}
          <Link href="/matches">Matches</Link>
          {isAdmin && <Link href="/admin">Admin</Link>}
          {user && (
            <button type="button" onClick={handleLogout}>
              Logout
            </button>
          )}
        </div>
      </div>
    </nav>
  );
}
