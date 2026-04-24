"use client";

import { useState } from "react";
import { db } from "@/lib/firebase";
import { collection, addDoc } from "firebase/firestore";
import { useAuth } from "@/lib/authContext";
import {
  Building2, User, Clock, AlertTriangle, MapPin,
  CheckCircle2, ArrowRight, Zap, FileText,
  ShieldAlert, Send, X, Flame,
} from "lucide-react";
import type { ComplaintResult } from "@/app/page";

// ─── Style helpers ───────────────────────────────────────────
const priorityStyles: Record<string, string> = {
  Critical: "badge-critical",
  High: "badge-high",
  Medium: "badge-medium",
  Low: "badge-low",
};

const statusSteps = [
  { key: "Pending",     label: "Submitted",   icon: FileText },
  { key: "Routed",      label: "AI Routed",   icon: Zap },
  { key: "In-Progress", label: "In Progress", icon: ArrowRight },
  { key: "Resolved",    label: "Resolved",    icon: CheckCircle2 },
];

function getStatusIndex(status: string): number {
  const idx = statusSteps.findIndex((s) => s.key === status);
  return idx >= 0 ? idx : 1;
}

// ─── SLA helpers ─────────────────────────────────────────────
function isSLABreached(c: ComplaintResult): boolean {
  if (c.status === "Resolved") return false;
  if (!c.created_at || !c.predicted_hours) return false;
  const deadline = new Date(c.created_at).getTime() + c.predicted_hours * 3_600_000;
  return Date.now() > deadline;
}

function getBreachHours(c: ComplaintResult): number {
  if (!c.created_at || !c.predicted_hours) return 0;
  const deadline = new Date(c.created_at).getTime() + c.predicted_hours * 3_600_000;
  return Math.max(0, parseFloat(((Date.now() - deadline) / 3_600_000).toFixed(1)));
}

function getTimeLabel(c: ComplaintResult): string {
  if (!c.created_at || !c.predicted_hours) return "Unknown";
  const deadline = new Date(c.created_at).getTime() + c.predicted_hours * 3_600_000;
  const msLeft = deadline - Date.now();
  if (msLeft <= 0) {
    const h = Math.abs(Math.floor(-msLeft / 3_600_000));
    const m = Math.abs(Math.floor((-msLeft % 3_600_000) / 60_000));
    return `${h}h ${m}m overdue`;
  }
  const h = Math.floor(msLeft / 3_600_000);
  const m = Math.floor((msLeft % 3_600_000) / 60_000);
  return `${h}h ${m}m remaining`;
}

// ─── Root component ───────────────────────────────────────────
interface Props { complaints: ComplaintResult[]; }

export default function ComplaintTracker({ complaints }: Props) {
  const [modalTarget, setModalTarget] = useState<ComplaintResult | null>(null);
  const [reportedIds, setReportedIds] = useState<Set<string>>(new Set());

  if (complaints.length === 0) {
    return (
      <div className="animate-slide-up glass-card rounded-2xl p-12 text-center">
        <div className="w-16 h-16 rounded-2xl bg-secondary/50 flex items-center justify-center mx-auto mb-4">
          <FileText className="w-8 h-8 text-muted-foreground/50" />
        </div>
        <h3 className="text-lg font-semibold mb-2">No Complaints Yet</h3>
        <p className="text-sm text-muted-foreground">
          Submit your first complaint to see AI routing and tracking here.
        </p>
      </div>
    );
  }

  const handleSuccess = (id: string) => {
    setReportedIds((prev) => new Set(Array.from(prev).concat(id)));
    setModalTarget(null);
  };

  return (
    <>
      <div className="space-y-4 animate-slide-up">
        {complaints.map((c, i) => (
          <ComplaintCard
            key={c.id || i}
            complaint={c}
            index={i}
            alreadyReported={reportedIds.has(c.id || "")}
            onReport={() => setModalTarget(c)}
          />
        ))}
      </div>

      {modalTarget && (
        <OfficerComplaintModal
          complaint={modalTarget}
          onClose={() => setModalTarget(null)}
          onSuccess={() => handleSuccess(modalTarget.id || "")}
        />
      )}
    </>
  );
}

// ─── Complaint Card ───────────────────────────────────────────
function ComplaintCard({
  complaint: c, index, alreadyReported, onReport,
}: {
  complaint: ComplaintResult;
  index: number;
  alreadyReported: boolean;
  onReport: () => void;
}) {
  const currentStep = getStatusIndex(c.status);
  const breached = isSLABreached(c);
  const timeLabel = getTimeLabel(c);

  return (
    <div
      className={`glass-card rounded-2xl p-5 sm:p-6 transition-all duration-300 ${
        breached
          ? "border border-red-500/30 hover:border-red-500/50"
          : "hover:border-saffron-500/15"
      }`}
      style={{ animationDelay: `${index * 100}ms` }}
    >
      {/* SLA Breach Banner */}
      {breached && (
        <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-2.5 mb-4 flex-wrap">
          <Flame className="w-4 h-4 text-red-400 shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-red-400">SLA BREACH — Resolution Deadline Exceeded</p>
            <p className="text-[10px] text-red-400/70">{timeLabel}</p>
          </div>
          {alreadyReported ? (
            <span className="text-[10px] bg-orange-500/15 text-orange-400 px-3 py-1 rounded-full font-semibold border border-orange-500/20">
              ⚠ Complaint Filed
            </span>
          ) : (
            <button
              onClick={onReport}
              className="flex items-center gap-1.5 text-[11px] font-semibold bg-red-500/20 text-red-400 hover:bg-red-500/30 px-3 py-1.5 rounded-lg transition-all border border-red-500/30"
            >
              <ShieldAlert className="w-3.5 h-3.5" />
              File Against Officer
            </button>
          )}
        </div>
      )}

      {/* Header Row */}
      <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono text-muted-foreground bg-secondary/80 px-2 py-1 rounded">
            {c.id}
          </span>
          <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${priorityStyles[c.priority_level] || "badge-medium"}`}>
            {c.priority_level}
          </span>
        </div>
        <span className="text-xs text-muted-foreground">
          {c.created_at ? new Date(c.created_at).toLocaleString("en-IN") : "Just now"}
        </span>
      </div>

      {/* Complaint Text */}
      <p className="text-sm text-foreground/90 mb-5 leading-relaxed bg-secondary/30 rounded-lg p-3 border border-border/30">
        &ldquo;{c.raw_text}&rdquo;
      </p>

      {/* AI Routing Info */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-5">
        <InfoCard icon={<AlertTriangle className="w-4 h-4 text-saffron-400" />} label="Issue Category" value={c.issue_category} />
        <InfoCard icon={<MapPin className="w-4 h-4 text-blue-400" />}          label="Jurisdiction"    value={c.jurisdiction_level} />
        <InfoCard icon={<Building2 className="w-4 h-4 text-emerald-400" />}   label="Department"      value={c.assigned_department} />
        <InfoCard icon={<User className="w-4 h-4 text-purple-400" />}         label="Officer Title"   value={c.officer_title} />
      </div>

      {/* Time Widget */}
      <div className={`flex items-center gap-3 p-3 rounded-xl border mb-5 ${
        breached
          ? "bg-red-500/5 border-red-500/15"
          : "bg-gradient-to-r from-saffron-500/5 to-emerald-500/5 border-saffron-500/10"
      }`}>
        <Clock className={`w-5 h-5 shrink-0 ${breached ? "text-red-400" : "text-saffron-400"}`} />
        <div className="flex-1">
          <p className="text-xs text-muted-foreground">ML Predicted Resolution</p>
          <p className={`text-base font-bold ${breached ? "text-red-400" : "text-foreground"}`}>
            {c.predicted_hours < 24
              ? `${c.predicted_hours}h`
              : `${(c.predicted_hours / 24).toFixed(1)} days`}
            <span className="text-xs font-normal text-muted-foreground ml-2">({c.predicted_hours}h SLA)</span>
          </p>
        </div>
        <div className="text-right shrink-0">
          <p className="text-[10px] text-muted-foreground mb-0.5">Time Status</p>
          <p className={`text-xs font-semibold ${breached ? "text-red-400" : "text-emerald-400"}`}>
            {timeLabel}
          </p>
        </div>
      </div>

      {/* Status Timeline */}
      <div className="flex items-center justify-between gap-1">
        {statusSteps.map((step, i) => {
          const Icon = step.icon;
          const isActive = i <= currentStep;
          const isCurrent = i === currentStep;
          return (
            <div key={step.key} className="flex items-center flex-1">
              <div className="flex flex-col items-center gap-1 flex-1">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${
                  isCurrent
                    ? "bg-saffron-500 text-white shadow-lg shadow-saffron-500/30 scale-110"
                    : isActive
                      ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                      : "bg-secondary/50 text-muted-foreground/40 border border-border/30"
                }`}>
                  <Icon className="w-3.5 h-3.5" />
                </div>
                <span className={`text-[10px] font-medium ${
                  isCurrent ? "text-saffron-400" : isActive ? "text-emerald-400" : "text-muted-foreground/40"
                }`}>
                  {step.label}
                </span>
              </div>
              {i < statusSteps.length - 1 && (
                <div className={`h-0.5 flex-1 rounded-full -mt-4 mx-1 ${
                  i < currentStep ? "bg-emerald-500/40" : "bg-border/30"
                }`} />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Officer Complaint Modal ──────────────────────────────────
function OfficerComplaintModal({
  complaint, onClose, onSuccess,
}: {
  complaint: ComplaintResult;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const { user, profile } = useAuth();
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const breachHours = getBreachHours(complaint);

  const handleSubmit = async () => {
    if (reason.trim().length < 10) return;
    setSubmitting(true);
    try {
      await addDoc(collection(db, "officer_complaints"), {
        original_complaint_id: complaint.id || complaint.firestore_id || "",
        officer_title:         complaint.officer_title,
        officer_department:    complaint.assigned_department,
        complaint_district:    (complaint as any).citizen_district || profile?.district || "Unknown",
        citizen_uid:           user?.uid || "",
        citizen_name:          profile?.name || "Anonymous Citizen",
        citizen_email:         user?.email || "",
        reason:                reason.trim(),
        original_issue:        complaint.raw_text,
        original_priority:     complaint.priority_level,
        predicted_hours:       complaint.predicted_hours,
        sla_breach_hours:      breachHours,
        filed_at:              new Date().toISOString(),
        admin_status:          "pending",   // pending | reviewed | action_taken
      });
      setSubmitted(true);
      setTimeout(onSuccess, 1600);
    } catch (e) {
      console.error("Officer complaint error:", e);
      alert("Failed to submit. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
      <div className="glass-card w-full max-w-lg rounded-2xl p-6 animate-slide-up border border-red-500/25 shadow-2xl shadow-red-500/10">

        {submitted ? (
          <div className="text-center py-8">
            <div className="w-16 h-16 rounded-full bg-emerald-500/15 flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="w-8 h-8 text-emerald-400" />
            </div>
            <h3 className="text-lg font-bold mb-2">Complaint Registered</h3>
            <p className="text-sm text-muted-foreground max-w-xs mx-auto">
              Your complaint against the officer has been escalated to the Admin panel for review and consequences.
            </p>
          </div>
        ) : (
          <>
            {/* Header */}
            <div className="flex items-start justify-between mb-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-red-500/15 flex items-center justify-center">
                  <ShieldAlert className="w-5 h-5 text-red-400" />
                </div>
                <div>
                  <h3 className="font-bold text-base">File Complaint Against Officer</h3>
                  <p className="text-[11px] text-muted-foreground">Escalated directly to Admin for action</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center hover:bg-secondary/80 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Breach Info */}
            <div className="bg-red-500/8 border border-red-500/20 rounded-xl p-4 mb-4">
              <div className="flex items-center gap-2 mb-3">
                <Flame className="w-4 h-4 text-red-400" />
                <p className="text-xs font-semibold text-red-400 uppercase tracking-wider">SLA Breach Summary</p>
              </div>
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <p className="text-muted-foreground mb-0.5">Responsible Officer</p>
                  <p className="font-semibold">{complaint.officer_title}</p>
                </div>
                <div>
                  <p className="text-muted-foreground mb-0.5">Department</p>
                  <p className="font-semibold truncate">{complaint.assigned_department}</p>
                </div>
                <div>
                  <p className="text-muted-foreground mb-0.5">Promised SLA</p>
                  <p className="font-semibold text-saffron-400">{complaint.predicted_hours}h</p>
                </div>
                <div>
                  <p className="text-muted-foreground mb-0.5">Overdue By</p>
                  <p className="font-semibold text-red-400">{breachHours}h</p>
                </div>
              </div>
            </div>

            {/* Original Complaint */}
            <div className="mb-4">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1.5">Original Complaint</p>
              <p className="text-xs bg-secondary/40 rounded-lg p-3 border border-border/30 text-foreground/80 line-clamp-2">
                &ldquo;{complaint.raw_text}&rdquo;
              </p>
            </div>

            {/* Reason */}
            <div className="mb-5">
              <label className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1.5 block">
                Your Reason <span className="text-red-400">*</span>
              </label>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Describe why you're filing this (e.g. 'Issue unresolved for 3 days despite multiple follow-ups, officer not responding...')"
                rows={4}
                className="w-full bg-secondary/50 border border-border/50 rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-red-500/40 resize-none placeholder:text-muted-foreground/40"
              />
              <p className="text-[10px] text-muted-foreground mt-1">{reason.length}/500 · Min. 10 characters</p>
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <button
                onClick={onClose}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold bg-secondary text-muted-foreground hover:bg-secondary/80 transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={reason.trim().length < 10 || submitting}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold bg-red-500/20 text-red-400 hover:bg-red-500/30 border border-red-500/30 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <Send className="w-4 h-4" />
                {submitting ? "Submitting..." : "Submit Complaint"}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ─── Shared InfoCard ──────────────────────────────────────────
function InfoCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-start gap-3 p-3 rounded-lg bg-secondary/30 border border-border/30">
      <div className="mt-0.5 shrink-0">{icon}</div>
      <div className="min-w-0">
        <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-0.5">{label}</p>
        <p className="text-sm font-medium text-foreground truncate">{value}</p>
      </div>
    </div>
  );
}
