"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@lib/supabaseClient";
import { Button } from "@components/ui/button";

export default function ProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    const fetchUser = async () => {
      try {
        const { data, error } = await supabase.auth.getUser();
        if (error) {
          // If no session or error, redirect to login
          router.replace("/auth/login");
          return;
        }
        if (mounted) {
          setUser(data.user ?? null);
        }
      } catch (err: any) {
        setError(err?.message ?? String(err));
        router.replace("/auth/login");
      } finally {
        if (mounted) setLoading(false);
      }
    };

    fetchUser();

    return () => {
      mounted = false;
    };
  }, [router]);

  const handleSignOut = async () => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        setError(error.message);
        return;
      }
      router.replace("/auth/login");
    } catch (err: any) {
      setError(err?.message ?? String(err));
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0E0E0E]">
        <div className="text-[#A3A3A3]">Loading profile…</div>
      </div>
    );
  }

  if (!user) {
    return null; // redirecting
  }

  const name = user.user_metadata?.full_name || user.user_metadata?.name || "";

  return (
    <div className="min-h-screen p-8 bg-[#0E0E0E]">
      <div className="max-w-3xl mx-auto bg-[#121212] border border-[#1F1F1F] rounded-lg p-6">
        <h2 className="text-2xl text-white mb-4">Profile</h2>

        {error && (
          <div className="mb-4 p-3 bg-red-900/30 text-red-300 rounded">
            {error}
          </div>
        )}

        <div className="space-y-3 text-sm text-[#E5E5E5]">
          <div>
            <strong className="text-[#A3A3A3]">Email:</strong> {user.email}
          </div>
          <div>
            <strong className="text-[#A3A3A3]">Name:</strong> {name || "—"}
          </div>
          <div>
            <strong className="text-[#A3A3A3]">ID:</strong> {user.id}
          </div>
          <div>
            <strong className="text-[#A3A3A3]">Created at:</strong>{" "}
            {new Date(user.created_at).toLocaleString()}
          </div>
        </div>

        <div className="mt-6 flex items-center gap-3">
          <Button
            className="bg-[#E82127] hover:bg-[#D01F25] text-white"
            onClick={handleSignOut}
          >
            {loading ? "Signing out…" : "Sign out"}
          </Button>
          <Button
            variant="outline"
            className="border-[#1F1F1F] text-[#A3A3A3]"
            onClick={() => router.push("/")}
          >
            Back to dashboard
          </Button>
        </div>
      </div>
    </div>
  );
}
