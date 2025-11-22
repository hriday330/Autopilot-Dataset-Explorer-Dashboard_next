"use client";

import React, { useState } from "react";
import { supabase } from "@lib/supabaseClient";
import Link from "next/link";

export default function RegisterPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    if (!email) {
      setError("Please enter an email address.");
      return;
    }
    if (!password || password.length < 6) {
      setError("Please enter a password with at least 6 characters.");
      return;
    }

    setLoading(true);
    try {
      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
      });

      if (signUpError) {
        setError(signUpError.message);
      } else {
        setSuccess(
          "Registration successful. If your email requires confirmation, please check your inbox.",
        );
        setEmail("");
        setPassword("");
      }
    } catch (err: any) {
      setError(err?.message ?? String(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0E0E0E] p-6">
      <div className="w-full max-w-md bg-[#121212] border border-[#1F1F1F] rounded-lg p-6">
        <h1 className="text-2xl text-white mb-4">Create an account</h1>
        <p className="text-sm text-[#A3A3A3] mb-4">
          Register with your email and a password.
        </p>

        {error && (
          <div className="mb-4 p-3 bg-red-900/30 text-red-300 rounded">
            {error}
          </div>
        )}
        {success && (
          <div className="mb-4 p-3 bg-green-900/30 text-green-300 rounded">
            {success}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <label className="block">
            <span className="text-sm text-[#A3A3A3]">Email</span>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 block w-full rounded border border-[#1F1F1F] bg-transparent px-3 py-2 text-white focus:outline-none"
              placeholder="you@example.com"
              required
            />
          </label>

          <label className="block">
            <span className="text-sm text-[#A3A3A3]">Password</span>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 block w-full rounded border border-[#1F1F1F] bg-transparent px-3 py-2 text-white focus:outline-none"
              placeholder="At least 6 characters"
              required
            />
          </label>

          <div className="flex items-center justify-between">
            <button
              type="submit"
              className="bg-[#E82127] hover:bg-[#D01F25] text-white px-4 py-2 rounded"
              disabled={loading}
            >
              {loading ? "Creating..." : "Create account"}
            </button>
            <Link
              href="/auth/login"
              className="text-sm text-[#A3A3A3] hover:text-white"
            >
              Have an account?
            </Link>
          </div>
        </form>

        <div className="mt-6 text-xs text-[#6B6B6B]">
          By creating an account you agree to any project-specific terms.
        </div>
      </div>
    </div>
  );
}
