"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const router = useRouter();
  const supabase = createClient();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [checkEmail, setCheckEmail] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit() {
    setError("");
    setCheckEmail(false);
    setLoading(true);

    if (mode === "signin") {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      setLoading(false);
      if (error) {
        setError(error.message);
        return;
      }
      router.push("/");
      router.refresh();
      return;
    }

    const { data, error } = await supabase.auth.signUp({ email, password });
    setLoading(false);
    if (error) {
      setError(error.message);
      return;
    }

    if (!data.session) {
      // Email confirmation is required before a session exists.
      setCheckEmail(true);
      return;
    }

    router.push("/");
    router.refresh();
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="w-full max-w-sm space-y-4">
        <h1 className="text-xl font-semibold">
          {mode === "signin" ? "Sign in" : "Create account"}
        </h1>

        {checkEmail ? (
          <p className="text-sm text-emerald-700">
            Check your email for a confirmation link, then sign in.
          </p>
        ) : (
          <>
            <input
              className="w-full border rounded px-3 py-2"
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <input
              className="w-full border rounded px-3 py-2"
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            {error ? <p className="text-sm text-red-600">{error}</p> : null}
            <button
              className="w-full bg-black text-white rounded px-3 py-2 disabled:opacity-50"
              onClick={handleSubmit}
              disabled={loading || !email || !password}
            >
              {loading
                ? "Please wait"
                : mode === "signin"
                  ? "Sign in"
                  : "Create account"}
            </button>
          </>
        )}

        <button
          className="w-full text-sm text-gray-600"
          onClick={() => {
            setMode(mode === "signin" ? "signup" : "signin");
            setError("");
            setCheckEmail(false);
          }}
        >
          {mode === "signin"
            ? "Need an account? Create one"
            : "Have an account? Sign in"}
        </button>
      </div>
    </div>
  );
}
