"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function LoginPage() {
  const router = useRouter();

  const [mode, setMode] = useState("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const isSignup = mode === "signup";
  const isForgotPassword = mode === "forgot";
  const isResetPassword = mode === "reset";

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);

    if (params.get("mode") === "reset") {
      queueMicrotask(() => {
        setMode("reset");
      });
    }
  }, []);

  const getTitle = () => {
    if (isSignup) return "Create Account";
    if (isForgotPassword) return "Reset Password";
    if (isResetPassword) return "Set New Password";
    return "Login";
  };

  const getIntro = () => {
    if (isSignup) {
      return "Create your account, then ask the match organiser for your private player code.";
    }

    if (isForgotPassword) {
      return "Enter your email and we will send you a password reset link.";
    }

    if (isResetPassword) {
      return "Enter a new password for your account.";
    }

    return "Login to vote for matches you played in.";
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      if (isForgotPassword) {
        const { error } = await supabase.auth.resetPasswordForEmail(
          email.trim().toLowerCase(),
          {
            redirectTo: `${window.location.origin}/login?mode=reset`,
          }
        );

        if (error) throw error;

        setMessage("Check your email for the password reset link.");
      } else if (isResetPassword) {
        const { error } = await supabase.auth.updateUser({ password });

        if (error) throw error;

        setMessage("Password updated. You can now login.");
        setPassword("");
        setMode("login");
      } else if (isSignup) {
        const { data, error } = await supabase.auth.signUp({
          email: email.trim().toLowerCase(),
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/claim-player`,
          },
        });

        if (error) throw error;

        if (data.user) {
          setMessage(
            "Check your email, then come back to activate voting with your player code."
          );
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email: email.trim().toLowerCase(),
          password,
        });

        if (error) throw error;

        router.push("/claim-player");
      }
    } catch (error) {
      setMessage(error?.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="mx-auto max-w-md p-8">
      <div className="rounded-xl bg-white p-6 shadow">
        <h1 className="text-2xl font-bold">{getTitle()}</h1>

        <p className="mt-2 text-sm text-gray-600">{getIntro()}</p>

        {!isResetPassword && !isForgotPassword && (
          <div className="mt-4 grid grid-cols-2 rounded border p-1">
            <button
              type="button"
              onClick={() => setMode("login")}
              className={`rounded px-3 py-2 text-sm ${
                !isSignup ? "bg-blue-600 text-white" : "text-gray-700"
              }`}
            >
              Login
            </button>

            <button
              type="button"
              onClick={() => setMode("signup")}
              className={`rounded px-3 py-2 text-sm ${
                isSignup ? "bg-blue-600 text-white" : "text-gray-700"
              }`}
            >
              Sign Up
            </button>
          </div>
        )}

        {message && (
          <p className="mt-4 rounded border border-blue-200 bg-blue-50 p-3 text-sm text-blue-700">
            {message}
          </p>
        )}

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          {!isResetPassword && (
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="w-full rounded border p-3"
              required
            />
          )}

          {!isForgotPassword && (
            <input
              type="password"
              placeholder={isResetPassword ? "New password" : "Password"}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="w-full rounded border p-3"
              required
              minLength={6}
            />
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded bg-green-600 px-4 py-3 text-white hover:bg-green-700 disabled:opacity-60"
          >
            {loading
              ? "Please wait..."
              : isSignup
                ? "Create Account"
                : isForgotPassword
                  ? "Send Reset Link"
                  : isResetPassword
                    ? "Update Password"
                    : "Login"}
          </button>
        </form>

        <div className="mt-4 flex justify-between text-sm">
          {!isForgotPassword && !isResetPassword && (
            <button
              type="button"
              onClick={() => {
                setMode("forgot");
                setMessage("");
              }}
              className="text-blue-700"
            >
              Forgot password?
            </button>
          )}

          {(isForgotPassword || isResetPassword) && (
            <button
              type="button"
              onClick={() => {
                setMode("login");
                setMessage("");
              }}
              className="text-blue-700"
            >
              Back to login
            </button>
          )}
        </div>
      </div>
    </main>
  );
}
