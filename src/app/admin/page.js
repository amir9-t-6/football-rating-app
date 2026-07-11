import Link from "next/link";
import AdminGuard from "@/components/AdminGuard";

export default function AdminPage() {
  return (
    <AdminGuard>
      <main className="mx-auto max-w-4xl p-8">
        <div className="rounded-xl bg-white p-6 shadow">
          <h1 className="text-2xl font-bold">Admin Dashboard</h1>

          <p className="mt-4 text-gray-600">Manage players and matches.</p>

          <div className="mt-6 flex gap-4">
            <Link
              href="/admin/players"
              className="rounded bg-blue-600 px-4 py-2 text-white"
            >
              Players
            </Link>

            <Link
              href="/admin/matches"
              className="rounded bg-green-600 px-4 py-2 text-white"
            >
              Matches
            </Link>
          </div>
        </div>
      </main>
    </AdminGuard>
  );
}
