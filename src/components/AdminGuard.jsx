"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

const getAdminEmails = () =>
  (process.env.NEXT_PUBLIC_ADMIN_EMAILS || "")
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);

export default function AdminGuard({ children }) {
  const [status, setStatus] = useState("checking");
  const [userEmail, setUserEmail] = useState("");

  useEffect(() => {
    const checkAdmin = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      const email = session?.user?.email?.toLowerCase() || "";
      const adminEmails = getAdminEmails();

      setUserEmail(email);
      setStatus(email && adminEmails.includes(email) ? "allowed" : "blocked");
    };

    checkAdmin();
  }, []);

  if (status === "checking") {
    return (
      <main className="mx-auto max-w-3xl p-8">
        <p className="text-center">Checking admin access...</p>
      </main>
    );
  }

  if (status === "blocked") {
    return (
      <main className="mx-auto max-w-3xl p-8">
        <div className="rounded-xl bg-white p-6 shadow">
          <h1 className="text-2xl font-bold">Admin Access</h1>
          <p className="mt-4 text-gray-600">
            {userEmail
              ? "Your account does not have admin access."
              : "Please log in with an admin account."}
          </p>

          <div className="mt-6 flex gap-3">
            <Link
              href="/login"
              className="rounded bg-blue-600 px-4 py-2 text-white"
            >
              Login
            </Link>
            <Link href="/matches" className="rounded bg-gray-200 px-4 py-2">
              Matches
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return children;
}
