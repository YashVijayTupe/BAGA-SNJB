"use client";

import { useState, useEffect } from "react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { useAuth } from "@/lib/authContext";
import { Shield, Mail, Lock, LogIn } from "lucide-react";
import { useRouter } from "next/navigation";

// ── ALLOWED ADMIN EMAILS ──
const ALLOWED_ADMIN_EMAILS = [
  "admin@baga.gov.in",
];

export default function AdminLoginPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Redirect already logged-in admins to dashboard
  useEffect(() => {
    if (user && ALLOWED_ADMIN_EMAILS.map(e => e.toLowerCase()).includes(user.email?.toLowerCase() || "")) {
      router.push("/admin");
    }
  }, [user, router]);

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center animate-pulse">
        Loading...
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      // Check if email is allowed
      if (!ALLOWED_ADMIN_EMAILS.map(e => e.toLowerCase()).includes(email.toLowerCase())) {
        throw new Error("Access denied. This email is not authorized for admin access.");
      }

      // Sign in
      await signInWithEmailAndPassword(auth, email, password);

      // Redirect to admin dashboard
      router.push("/admin");
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Login failed. Please check your credentials.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-background flex items-center justify-center p-4">
      {/* Background gradient */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-red-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-rose-500/10 rounded-full blur-3xl" />
      </div>

      <div className="glass-card w-full max-w-md p-8 rounded-2xl animate-slide-up">
        {/* Header */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-red-500 to-rose-700 flex items-center justify-center mb-4 shadow-lg shadow-red-500/25">
            <Shield className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight">Admin Portal</h1>
          <p className="text-sm text-muted-foreground mt-1">
            BAGA System Administration
          </p>
        </div>

        {/* Admin Badge */}
        <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3 mb-6 text-center">
          <p className="text-xs font-semibold text-red-400 uppercase tracking-wider">
            Restricted Access - Administrators Only
          </p>
        </div>

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Email */}
          <div className="relative">
            <Mail className="absolute left-3 top-3.5 w-4 h-4 text-muted-foreground" />
            <input
              type="email"
              placeholder="Admin Email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-secondary/30 border border-border/50 rounded-xl pl-10 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-red-500/50"
            />
          </div>

          {/* Password */}
          <div className="relative">
            <Lock className="absolute left-3 top-3.5 w-4 h-4 text-muted-foreground" />
            <input
              type="password"
              placeholder="Password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-secondary/30 border border-border/50 rounded-xl pl-10 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-red-500/50"
            />
          </div>

          {error && (
            <p className="text-xs text-red-400 bg-red-500/10 p-3 rounded-lg">{error}</p>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading || authLoading}
            className={`w-full py-3 rounded-xl font-semibold text-white shadow-lg transition-all mt-2 flex items-center justify-center gap-2 ${
              loading || authLoading ? "opacity-50" : "hover:scale-[1.02] active:scale-[0.98]"
            } bg-gradient-to-r from-red-500 to-rose-600 shadow-red-500/25`}
          >
            <LogIn className="w-4 h-4" />
            {loading ? "Signing in..." : "Sign In to Admin Panel"}
          </button>
        </form>

        {/* Footer Links */}
        <div className="mt-6 text-center space-y-2">
          <p className="text-xs text-muted-foreground">
            Forgot password? Contact the system administrator.
          </p>
          <a
            href="/"
            className="text-xs text-saffron-500 hover:underline font-medium"
          >
            Back to Citizen Portal
          </a>
        </div>
      </div>
    </main>
  );
}
