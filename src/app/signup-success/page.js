import Link from "next/link";

export default function SignupSuccessPage() {
  return (
    <main className="mx-auto max-w-md p-8">
      <div className="rounded-xl bg-white p-8 text-center shadow">
        <div className="text-5xl">✅</div>

        <h1 className="mt-4 text-2xl font-bold">Account Created</h1>

        <p className="mt-3 text-gray-600">
          Your account has been created successfully.
        </p>

        <p className="mt-2 text-sm text-gray-500">
          Check your email to confirm your account, then log in and enter the
          private player code given to you by the match organiser.
        </p>

        <div className="mt-6 flex flex-col gap-3">
          <Link
            href="/login"
            className="rounded bg-blue-600 px-4 py-3 text-white hover:bg-blue-700"
          >
            Continue to Login
          </Link>

          <Link
            href="/"
            className="rounded border border-gray-300 px-4 py-3 text-gray-700 hover:bg-gray-50"
          >
            Return Home
          </Link>
        </div>
      </div>
    </main>
  );
}
