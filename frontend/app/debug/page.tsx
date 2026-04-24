"use client";

import { useAuth } from "@/lib/authContext";

export default function DebugPage() {
  const { user, profile, loading } = useAuth();

  return (
    <main className="min-h-screen bg-background text-foreground p-8">
      <h1 className="text-2xl font-bold mb-6">🔍 BAGA Debug Info</h1>
      <div className="glass-card p-6 rounded-2xl space-y-4 font-mono text-sm">
        <div>
          <p className="text-muted-foreground text-xs uppercase tracking-widest mb-1">Auth Loading</p>
          <p>{loading ? "true" : "false"}</p>
        </div>
        <div>
          <p className="text-muted-foreground text-xs uppercase tracking-widest mb-1">Logged In UID</p>
          <p>{user?.uid || "not logged in"}</p>
        </div>
        <div>
          <p className="text-muted-foreground text-xs uppercase tracking-widest mb-1">Email</p>
          <p>{user?.email || "—"}</p>
        </div>
        <div>
          <p className="text-muted-foreground text-xs uppercase tracking-widest mb-1">Role</p>
          <p>{profile?.role || "—"}</p>
        </div>
        <div>
          <p className="text-muted-foreground text-xs uppercase tracking-widest mb-1">Verification Status</p>
          <p>{profile?.verification_status || "—"}</p>
        </div>
        <div>
          <p className="text-muted-foreground text-xs uppercase tracking-widest mb-1">District</p>
          <p>{profile?.district || "—"}</p>
        </div>
        <div>
          <p className="text-muted-foreground text-xs uppercase tracking-widest mb-1">Department</p>
          <p>{profile?.department || "—"}</p>
        </div>
        <div>
          <p className="text-muted-foreground text-xs uppercase tracking-widest mb-1">Flask API URL</p>
          <p>{process.env.NEXT_PUBLIC_FLASK_API_URL || "http://localhost:5001 (fallback)"}</p>
        </div>
      </div>
    </main>
  );
}
