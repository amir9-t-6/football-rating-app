"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

const getAdminEmails = () =>
  (process.env.NEXT_PUBLIC_ADMIN_EMAILS || "")
    .split(",")
    .map((adminEmail) => adminEmail.trim().toLowerCase())
    .filter(Boolean);

export default function LoginPage() {
  const router = useRouter();

  const [mode, setMode] = useState("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const isSignup = mode === "signup";
  const isForgotPassword = mode === "forgot";
  const isResetPassword = mode === "reset";

  useEffect(() => {
    const handlePasswordRecovery = async () => {
      const params = new URLSearchParams(window.location.search);

      if (params.get("mode") === "reset") {
        setMode("reset");
      }

      if (params.get("code")) {
        const { error } = await supabase.auth.exchangeCodeForSession(
          window.location.href,
        );

        if (error) {
          setMessage(
            "Password reset link is invalid or expired. Please request a new one.",
          );
        } else {
          setMode("reset");
        }
      }
    };

    handlePasswordRecovery();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") {
        setMode("reset");
      }
    });

    return () => {
      subscription.unsubscribe();
    };
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
          },
        );

        if (error) throw error;

        setMessage("Check your email for the password reset link.");
        return;
      }

      if (isResetPassword) {
        const { error } = await supabase.auth.updateUser({
          password,
        });

        if (error) throw error;

        setMessage("Password updated. You can now login.");
        setPassword("");
        setMode("login");
        return;
      }

      if (isSignup) {
        const cleanName = name.trim();
        const cleanEmail = email.trim().toLowerCase();

        const { data, error } = await supabase.auth.signUp({
          email: cleanEmail,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/claim-player`,
            data: {
              full_name: cleanName,
            },
          },
        });

        if (error) throw error;

        if (data.session) {
          const { error: metadataError } = await supabase.auth.updateUser({
            data: {
              full_name: cleanName,
            },
          });

          if (metadataError) throw metadataError;
        }

        if (data.user) {
          setName("");
          setEmail("");
          setPassword("");

          router.push("/signup-success");
          return;
        }
      }

      const loginEmail = email.trim().toLowerCase();

      const { error } = await supabase.auth.signInWithPassword({
        email: loginEmail,
        password,
      });

      if (error) throw error;

      const adminEmails = getAdminEmails();

      if (adminEmails.includes(loginEmail)) {
        router.push("/admin");
      } else {
        router.push("/claim-player");
      }

      router.refresh();
    } catch (error) {
      console.error(error);

      const msg = error?.message || "Something went wrong.";
      const lowerMessage = msg.toLowerCase();

      if (
        lowerMessage.includes("rate limit") ||
        lowerMessage.includes("email rate limit")
      ) {
        setMessage(
          "Too many email requests. Please wait a while and try again.",
        );
      } else if (lowerMessage.includes("invalid api key")) {
        setMessage(
          "Supabase API key is invalid or missing. Check your .env.local and restart the development server.",
        );
      } else if (
        lowerMessage.includes("invalid login") ||
        lowerMessage.includes("invalid credentials") ||
        lowerMessage.includes("invalid password")
      ) {
        setMessage("Invalid email or password.");
      } else {
        setMessage(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  const switchMode = (newMode) => {
    setMode(newMode);
    setMessage("");
    setPassword("");

    if (newMode !== "signup") {
      setName("");
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
              onClick={() => switchMode("login")}
              className={`rounded px-3 py-2 text-sm ${
                !isSignup ? "bg-blue-600 text-white" : "text-gray-700"
              }`}
            >
              Login
            </button>

            <button
              type="button"
              onClick={() => switchMode("signup")}
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
          {isSignup && (
            <input
              type="text"
              placeholder="Name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              className="w-full rounded border p-3"
              required
            />
          )}

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
              onClick={() => switchMode("forgot")}
              className="text-blue-700"
            >
              Forgot password?
            </button>
          )}

          {(isForgotPassword || isResetPassword) && (
            <button
              type="button"
              onClick={() => switchMode("login")}
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
