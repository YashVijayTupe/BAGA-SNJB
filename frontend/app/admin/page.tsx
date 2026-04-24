"use client";

import { useState, useEffect } from "react";
import { db } from "@/lib/firebase";
import {
  collection, query, where, onSnapshot,
  doc, updateDoc, orderBy,
} from "firebase/firestore";
import {
  Shield, CheckCircle2, XCircle, Clock, MapPin,
  Briefcase, IdCard, User as UserIcon, LogOut,
  ShieldAlert, Flame, AlertCircle, Eye, Gavel,
} from "lucide-react";
import { useAuth } from "@/lib/authContext";
import { useRouter } from "next/navigation";
import type { UserProfile } from "@/lib/authContext";

const ALLOWED_ADMIN_EMAILS = ["admin@baga.gov.in"];

interface OfficerRecord extends UserProfile { firestore_id: string; }
interface OfficerComplaint {
  id: string;
  original_complaint_id: string;
  officer_title: string;
  officer_department: string;
  complaint_district: string;
  citizen_name: string;
  citizen_email: string;
  reason: string;
  original_issue: string;
  original_priority: string;
  predicted_hours: number;
  sla_breach_hours: number;
  filed_at: string;
  admin_status: "pending" | "reviewed" | "action_taken";
}

export default function AdminDashboard() {
  const { user, profile, loading: authLoading, logout } = useAuth();
  const router = useRouter();

  // Tab state
  const [activeTab, setActiveTab] = useState<"officers" | "officer_complaints">("officers");

  // Officers state
  const [officers, setOfficers] = useState<OfficerRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<"pending" | "approved" | "rejected" | "all">("pending");
  const [stats, setStats] = useState({ total: 0, pending: 0, approved: 0, rejected: 0 });
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Officer complaints state
  const [officerComplaints, setOfficerComplaints] = useState<OfficerComplaint[]>([]);
  const [ocLoading, setOcLoading] = useState(true);
  const [ocActionLoading, setOcActionLoading] = useState<string | null>(null);

  // Fetch officers
  useEffect(() => {
    const q = query(collection(db, "users"), where("role", "==", "officer"));
    return onSnapshot(q, (snap) => {
      const all = snap.docs.map((d) => ({ ...d.data(), firestore_id: d.id })) as OfficerRecord[];
      setOfficers(all);
      setStats({
        total: all.length,
        pending:  all.filter((o) => o.verification_status === "pending").length,
        approved: all.filter((o) => o.verification_status === "approved").length,
        rejected: all.filter((o) => o.verification_status === "rejected").length,
      });
      setLoading(false);
    });
  }, []);

  // Fetch officer complaints
  useEffect(() => {
    const q = query(collection(db, "officer_complaints"));
    return onSnapshot(q, (snap) => {
      const all = snap.docs.map((d) => ({ id: d.id, ...d.data() })) as OfficerComplaint[];
      all.sort((a, b) => new Date(b.filed_at).getTime() - new Date(a.filed_at).getTime());
      setOfficerComplaints(all);
      setOcLoading(false);
    });
  }, []);

  const updateOfficerStatus = async (id: string, status: "approved" | "rejected") => {
    setActionLoading(id + status);
    try {
      await updateDoc(doc(db, "users", id), {
        verification_status: status,
        verified_at: new Date().toISOString(),
        verified_by: user?.email,
      });
    } catch { alert("Failed to update."); }
    finally { setActionLoading(null); }
  };

  const updateOCStatus = async (id: string, status: "reviewed" | "action_taken") => {
    setOcActionLoading(id + status);
    try {
      await updateDoc(doc(db, "officer_complaints", id), {
        admin_status: status,
        reviewed_by: user?.email,
        reviewed_at: new Date().toISOString(),
      });
    } catch { alert("Failed to update."); }
    finally { setOcActionLoading(null); }
  };

  // Auth guard
  if (authLoading) return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center">
        <div className="w-12 h-12 border-4 border-red-500/30 border-t-red-500 rounded-full animate-spin mx-auto mb-4" />
        <p className="text-muted-foreground">Loading Admin Console...</p>
      </div>
    </div>
  );

  const userEmail = user?.email?.toLowerCase() || "";
  const isAdmin = ALLOWED_ADMIN_EMAILS.map((e) => e.toLowerCase()).includes(userEmail);

  if (!user || !isAdmin) return (
    <main className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
      <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center mb-6">
        <Shield className="w-8 h-8 text-red-500" />
      </div>
      <h2 className="text-xl font-bold mb-4">Admin Access Required</h2>
      <p className="text-muted-foreground mb-6 text-center max-w-sm">Please log in with an authorized admin account.</p>
      <button onClick={() => router.push("/admin/login")} className="bg-red-500/20 text-red-400 px-8 py-3 rounded-xl font-semibold hover:bg-red-500/30 transition-all">
        Admin Login
      </button>
    </main>
  );

  const filteredOfficers = filterStatus === "all" ? officers : officers.filter((o) => o.verification_status === filterStatus);
  const pendingOC = officerComplaints.filter((c) => c.admin_status === "pending").length;

  return (
    <main className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <header className="sticky top-0 z-50 glass border-b border-border/50">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-500 to-rose-700 flex items-center justify-center shadow-lg shadow-red-500/25">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold tracking-tight">BAGA Admin Panel</h1>
              <p className="text-[10px] text-muted-foreground uppercase tracking-widest">Governance Control Centre</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden sm:block text-right mr-2">
              <p className="text-sm font-semibold">{user.email}</p>
              <p className="text-[10px] text-red-400 uppercase tracking-wider">SUPER ADMIN</p>
            </div>
            <button onClick={logout} className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center hover:bg-red-500/10 hover:text-red-400 transition-colors" title="Logout">
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Tabs */}
        <div className="flex gap-2 p-1 bg-secondary/50 rounded-xl w-fit mb-8">
          <button
            onClick={() => setActiveTab("officers")}
            className={`px-5 py-2.5 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${activeTab === "officers" ? "bg-background text-foreground shadow" : "text-muted-foreground hover:text-foreground"}`}
          >
            <UserIcon className="w-4 h-4" /> Officer Verification
            <span className="text-xs opacity-70">({stats.pending})</span>
          </button>
          <button
            onClick={() => setActiveTab("officer_complaints")}
            className={`px-5 py-2.5 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${activeTab === "officer_complaints" ? "bg-red-500/20 text-red-400 shadow" : "text-muted-foreground hover:text-foreground"}`}
          >
            <ShieldAlert className="w-4 h-4" /> Officer Complaints
            {pendingOC > 0 && (
              <span className="bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">{pendingOC}</span>
            )}
          </button>
        </div>

        {/* ── OFFICER VERIFICATION TAB ── */}
        {activeTab === "officers" && (
          <>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              {[
                { label: "Total Officers", value: stats.total,    color: "text-foreground",   bg: "bg-secondary/50" },
                { label: "Pending Review", value: stats.pending,  color: "text-yellow-400",   bg: "bg-yellow-500/10 border border-yellow-500/20" },
                { label: "Approved",       value: stats.approved, color: "text-emerald-400",  bg: "bg-emerald-500/10 border border-emerald-500/20" },
                { label: "Rejected",       value: stats.rejected, color: "text-red-400",      bg: "bg-red-500/10 border border-red-500/20" },
              ].map((s) => (
                <div key={s.label} className={`glass-card p-4 rounded-xl ${s.bg} text-center`}>
                  <p className={`text-3xl font-bold ${s.color}`}>{s.value}</p>
                  <p className="text-xs text-muted-foreground mt-1">{s.label}</p>
                </div>
              ))}
            </div>

            <div className="flex gap-2 p-1 bg-secondary/50 rounded-xl w-fit mb-6">
              {(["pending", "approved", "rejected", "all"] as const).map((tab) => (
                <button key={tab} onClick={() => setFilterStatus(tab)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium capitalize transition-all ${filterStatus === tab
                    ? tab === "pending" ? "bg-yellow-500/20 text-yellow-400"
                    : tab === "approved" ? "bg-emerald-500/20 text-emerald-400"
                    : tab === "rejected" ? "bg-red-500/20 text-red-400"
                    : "bg-background text-foreground shadow"
                    : "text-muted-foreground hover:text-foreground"}`}>
                  {tab}{tab !== "all" && <span className="ml-2 text-xs opacity-70">({stats[tab]})</span>}
                </button>
              ))}
            </div>

            {loading ? (
              <p className="text-center text-muted-foreground animate-pulse py-12">Loading officer registrations...</p>
            ) : filteredOfficers.length === 0 ? (
              <div className="text-center py-16 glass-card rounded-2xl">
                <CheckCircle2 className="w-12 h-12 text-emerald-500/40 mx-auto mb-4" />
                <p className="text-muted-foreground">No {filterStatus === "all" ? "" : filterStatus} officers found.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                {filteredOfficers.map((officer, i) => (
                  <div key={officer.firestore_id} className="glass-card p-6 rounded-2xl flex flex-col gap-4 animate-slide-up" style={{ animationDelay: `${i * 40}ms` }}>
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-emerald-500/15 flex items-center justify-center">
                          <UserIcon className="w-5 h-5 text-emerald-400" />
                        </div>
                        <div>
                          <p className="font-semibold text-sm">{officer.name}</p>
                          <p className="text-xs text-muted-foreground">{officer.email}</p>
                        </div>
                      </div>
                      <span className={`text-[10px] px-2 py-1 rounded-full font-semibold uppercase tracking-wider ${
                        officer.verification_status === "pending"  ? "bg-yellow-500/15 text-yellow-400" :
                        officer.verification_status === "approved" ? "bg-emerald-500/15 text-emerald-400" :
                        "bg-red-500/15 text-red-400"}`}>
                        {officer.verification_status}
                      </span>
                    </div>
                    <div className="space-y-2 text-xs text-muted-foreground">
                      <div className="flex items-center gap-2"><IdCard className="w-3.5 h-3.5 text-saffron-500" /><span className="font-mono font-semibold text-foreground">{officer.employee_id || "N/A"}</span></div>
                      <div className="flex items-center gap-2"><Briefcase className="w-3.5 h-3.5 text-emerald-500" /><span>{officer.department}</span></div>
                      <div className="flex items-center gap-2"><MapPin className="w-3.5 h-3.5 text-blue-400" /><span>{officer.city}, {officer.district}, {officer.state}</span></div>
                    </div>
                    {officer.verification_status === "pending" && (
                      <div className="flex gap-2 pt-2 border-t border-border/50">
                        <button onClick={() => updateOfficerStatus(officer.firestore_id, "approved")} disabled={actionLoading !== null}
                          className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-semibold bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 border border-emerald-500/30 transition-all disabled:opacity-50">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          {actionLoading === officer.firestore_id + "approved" ? "Approving..." : "Approve"}
                        </button>
                        <button onClick={() => updateOfficerStatus(officer.firestore_id, "rejected")} disabled={actionLoading !== null}
                          className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-semibold bg-red-500/15 text-red-400 hover:bg-red-500/25 border border-red-500/20 transition-all disabled:opacity-50">
                          <XCircle className="w-3.5 h-3.5" />
                          {actionLoading === officer.firestore_id + "rejected" ? "Rejecting..." : "Reject"}
                        </button>
                      </div>
                    )}
                    {officer.verification_status === "approved" && (
                      <div className="pt-2 border-t border-border/50">
                        <button onClick={() => updateOfficerStatus(officer.firestore_id, "rejected")} disabled={actionLoading !== null}
                          className="w-full py-2 rounded-xl text-xs font-semibold text-red-400/70 hover:bg-red-500/10 hover:text-red-400 transition-all">
                          Revoke Access
                        </button>
                      </div>
                    )}
                    {officer.verification_status === "rejected" && (
                      <div className="pt-2 border-t border-border/50">
                        <button onClick={() => updateOfficerStatus(officer.firestore_id, "approved")} disabled={actionLoading !== null}
                          className="w-full py-2 rounded-xl text-xs font-semibold text-emerald-400/70 hover:bg-emerald-500/10 hover:text-emerald-400 transition-all">
                          Re-approve
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* ── OFFICER COMPLAINTS TAB ── */}
        {activeTab === "officer_complaints" && (
          <>
            {/* Summary Stats */}
            <div className="grid grid-cols-3 gap-4 mb-8">
              {[
                { label: "Total Filed",   value: officerComplaints.length, color: "text-foreground",  bg: "bg-secondary/50" },
                { label: "Awaiting Review", value: officerComplaints.filter(c => c.admin_status === "pending").length, color: "text-orange-400", bg: "bg-orange-500/10 border border-orange-500/20" },
                { label: "Action Taken",  value: officerComplaints.filter(c => c.admin_status === "action_taken").length, color: "text-emerald-400", bg: "bg-emerald-500/10 border border-emerald-500/20" },
              ].map((s) => (
                <div key={s.label} className={`glass-card p-4 rounded-xl ${s.bg} text-center`}>
                  <p className={`text-3xl font-bold ${s.color}`}>{s.value}</p>
                  <p className="text-xs text-muted-foreground mt-1">{s.label}</p>
                </div>
              ))}
            </div>

            {ocLoading ? (
              <p className="text-center text-muted-foreground animate-pulse py-12">Loading officer complaints...</p>
            ) : officerComplaints.length === 0 ? (
              <div className="text-center py-16 glass-card rounded-2xl">
                <CheckCircle2 className="w-12 h-12 text-emerald-500/40 mx-auto mb-4" />
                <p className="text-muted-foreground">No complaints filed against officers yet.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
                {officerComplaints.map((oc, i) => (
                  <div key={oc.id} className={`glass-card p-6 rounded-2xl flex flex-col gap-4 animate-slide-up border ${
                    oc.admin_status === "pending" ? "border-orange-500/20" :
                    oc.admin_status === "action_taken" ? "border-emerald-500/20" : "border-border/30"
                  }`} style={{ animationDelay: `${i * 40}ms` }}>

                    {/* Card Header */}
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-9 h-9 rounded-xl bg-red-500/15 flex items-center justify-center shrink-0">
                          <ShieldAlert className="w-4.5 h-4.5 text-red-400" />
                        </div>
                        <div>
                          <p className="font-semibold text-sm">{oc.officer_title}</p>
                          <p className="text-[11px] text-muted-foreground">{oc.officer_department}</p>
                        </div>
                      </div>
                      <span className={`text-[10px] px-2.5 py-1 rounded-full font-semibold uppercase tracking-wider shrink-0 ${
                        oc.admin_status === "pending"     ? "bg-orange-500/15 text-orange-400" :
                        oc.admin_status === "reviewed"    ? "bg-blue-500/15 text-blue-400" :
                        "bg-emerald-500/15 text-emerald-400"}`}>
                        {oc.admin_status.replace("_", " ")}
                      </span>
                    </div>

                    {/* Breach Info */}
                    <div className="flex items-center gap-3 bg-red-500/8 border border-red-500/15 rounded-xl px-3 py-2">
                      <Flame className="w-4 h-4 text-red-400 shrink-0" />
                      <div className="flex-1 text-xs">
                        <span className="text-red-400 font-semibold">{oc.sla_breach_hours}h overdue</span>
                        <span className="text-muted-foreground"> · SLA was {oc.predicted_hours}h · Priority: </span>
                        <span className="font-semibold">{oc.original_priority}</span>
                      </div>
                      <div className="text-[10px] text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded-full border border-blue-500/20 shrink-0">
                        {oc.complaint_district}
                      </div>
                    </div>

                    {/* Original Issue */}
                    <div>
                      <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Original Issue</p>
                      <p className="text-xs bg-secondary/30 rounded-lg p-2.5 border border-border/30 text-foreground/80 line-clamp-2">
                        &ldquo;{oc.original_issue}&rdquo;
                      </p>
                    </div>

                    {/* Citizen Reason */}
                    <div>
                      <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Citizen&apos;s Reason</p>
                      <p className="text-xs bg-orange-500/5 border border-orange-500/15 rounded-lg p-2.5 text-foreground/80 line-clamp-3">
                        &ldquo;{oc.reason}&rdquo;
                      </p>
                    </div>

                    {/* Filed By + Date */}
                    <div className="flex items-center justify-between text-[11px] text-muted-foreground border-t border-border/30 pt-3">
                      <div className="flex items-center gap-1.5">
                        <UserIcon className="w-3.5 h-3.5" />
                        <span>{oc.citizen_name}</span>
                        <span className="opacity-50">·</span>
                        <span className="font-mono text-[10px]">{oc.citizen_email}</span>
                      </div>
                      <span>{new Date(oc.filed_at).toLocaleDateString("en-IN")}</span>
                    </div>

                    {/* Admin Actions */}
                    {oc.admin_status !== "action_taken" && (
                      <div className="flex gap-2 pt-1">
                        {oc.admin_status === "pending" && (
                          <button
                            onClick={() => updateOCStatus(oc.id, "reviewed")}
                            disabled={ocActionLoading !== null}
                            className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-semibold bg-blue-500/15 text-blue-400 hover:bg-blue-500/25 border border-blue-500/20 transition-all disabled:opacity-50"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            {ocActionLoading === oc.id + "reviewed" ? "Marking..." : "Mark Reviewed"}
                          </button>
                        )}
                        <button
                          onClick={() => updateOCStatus(oc.id, "action_taken")}
                          disabled={ocActionLoading !== null}
                          className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-semibold bg-emerald-500/15 text-emerald-400 hover:bg-emerald-500/25 border border-emerald-500/20 transition-all disabled:opacity-50"
                        >
                          <Gavel className="w-3.5 h-3.5" />
                          {ocActionLoading === oc.id + "action_taken" ? "Updating..." : "Action Taken"}
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </main>
  );
}
