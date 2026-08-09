"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "../lib/supabase";

type Step = { id: string; title: string; due_date: string | null; completed: boolean; category: string };
type Application = { college_name: string; status: string; deadline: string | null };

export function AdvisorBrief({ userId, studentName, graduationYear, pathways, schools, steps }: { userId: string; studentName: string; graduationYear: number; pathways: string[]; schools: string[]; steps: Step[] }) {
  const [meetingDate, setMeetingDate] = useState("");
  const [questions, setQuestions] = useState("");
  const [notes, setNotes] = useState("");
  const [applications, setApplications] = useState<Application[]>([]);
  const [tests, setTests] = useState<{ exam: string; target_score: number | null; planned_test_date: string | null }[]>([]);
  const [scholarships, setScholarships] = useState<{ scholarship_name: string; status: string; deadline: string | null }[]>([]);
  const [contacts, setContacts] = useState<{ name: string; role: string; follow_up_date: string | null }[]>([]);
  const [submissionChecks, setSubmissionChecks] = useState<{ item_name: string; confirmation_saved: boolean; follow_up_needed: boolean }[]>([]);
  const [message, setMessage] = useState("");

  useEffect(() => {
    Promise.all([
      supabase.from("student_advisor_briefs").select("meeting_date,questions,meeting_notes").eq("user_id", userId).maybeSingle(),
      supabase.from("college_applications").select("college_name,status,deadline").eq("user_id", userId).order("deadline"),
      supabase.from("test_plans").select("exam,target_score,planned_test_date").eq("user_id", userId),
      supabase.from("scholarship_applications").select("scholarship_name,status,deadline").eq("user_id", userId).order("deadline"),
      supabase.from("student_support_contacts").select("name,role,follow_up_date").eq("user_id", userId).order("follow_up_date", { ascending: true, nullsFirst: false }),
      supabase.from("student_submission_checkpoints").select("item_name,confirmation_saved,follow_up_needed").eq("user_id", userId),
    ]).then(([brief, colleges, testPlans, awards, support, checkpoints]) => {
      if (brief.data) { setMeetingDate(brief.data.meeting_date ?? ""); setQuestions(brief.data.questions); setNotes(brief.data.meeting_notes); }
      setApplications((colleges.data ?? []) as Application[]);
      setTests((testPlans.data ?? []) as typeof tests);
      setScholarships((awards.data ?? []) as typeof scholarships);
      setContacts((support.data ?? []) as typeof contacts);
      setSubmissionChecks((checkpoints.data ?? []) as typeof submissionChecks);
    });
  }, [userId]);

  const upcoming = useMemo(() => steps.filter((step) => !step.completed).sort((a, b) => (a.due_date ?? "9999").localeCompare(b.due_date ?? "9999")).slice(0, 6), [steps]);
  const lines = [
    `FUTURE WAYMARK - ADVISOR MEETING BRIEF`,
    `${studentName || "Student"} | Graduation year: ${graduationYear || "Not entered"}`,
    `Meeting date: ${meetingDate || "Not scheduled"}`,
    "",
    `PATHS: ${pathways.length ? pathways.join(", ") : "Still exploring"}`,
    `SCHOOLS OF INTEREST: ${schools.length ? schools.join(", ") : "None added yet"}`,
    "",
    "APPLICATIONS",
    ...(applications.length ? applications.map((item) => `- ${item.college_name}: ${item.status}${item.deadline ? ` (deadline ${item.deadline})` : ""}`) : ["- No applications added yet"]),
    "",
    "TEST PLAN",
    ...(tests.length ? tests.map((item) => `- ${item.exam}: target ${item.target_score ?? "not set"}${item.planned_test_date ? `, planned ${item.planned_test_date}` : ""}`) : ["- No test plan added yet"]),
    "",
    "UPCOMING STEPS",
    ...(upcoming.length ? upcoming.map((item) => `- ${item.title}${item.due_date ? ` (${item.due_date})` : ""}`) : ["- No open milestones"]),
    "",
    "SCHOLARSHIPS",
    ...(scholarships.length ? scholarships.slice(0, 6).map((item) => `- ${item.scholarship_name}: ${item.status}${item.deadline ? ` (${item.deadline})` : ""}`) : ["- No scholarships added yet"]),
    "",
    "SUPPORT CONTACTS AND FOLLOW-UPS",
    ...(contacts.length ? contacts.slice(0, 8).map((item) => `- ${item.name} (${item.role})${item.follow_up_date ? ` - follow up ${item.follow_up_date}` : ""}`) : ["- No support contacts added yet"]),
    "",
    "OFFICIAL SUBMISSION CHECKS",
    ...(submissionChecks.length ? submissionChecks.map((item) => `- ${item.item_name}: ${item.follow_up_needed ? "follow-up needed" : item.confirmation_saved ? "confirmation recorded" : "confirmation not recorded"}`) : ["- No submission checkpoints recorded yet"]),
    "",
    "QUESTIONS TO DISCUSS",
    questions || "No questions entered yet.",
    "",
    "MEETING NOTES / NEXT STEPS",
    notes || "No meeting notes entered yet.",
    "",
    "This student-prepared summary supports planning and does not replace official admissions, financial aid, or testing guidance.",
  ];

  async function save() {
    const { error } = await supabase.from("student_advisor_briefs").upsert({ user_id: userId, meeting_date: meetingDate || null, questions, meeting_notes: notes, updated_at: new Date().toISOString() }, { onConflict: "user_id" });
    setMessage(error ? error.message : "Advisor meeting brief saved.");
  }
  function download() {
    const url = URL.createObjectURL(new Blob([lines.join("\n")], { type: "text/plain;charset=utf-8" }));
    const link = document.createElement("a"); link.href = url; link.download = "future-waymark-advisor-brief.txt"; link.click(); URL.revokeObjectURL(url);
  }
  function print() { document.body.classList.add("printing-advisor-brief"); window.print(); setTimeout(() => document.body.classList.remove("printing-advisor-brief"), 300); }

  return <section className="advisor-brief" id="advisor-brief">
    <div className="advisor-heading"><div><span className="kicker dark">MEETING PREP</span><h2>Walk into your next conversation prepared.</h2><p>Create a private working brief for a counselor, parent, mentor, or other trusted advisor.</p></div><div><button onClick={download}>Download summary</button><button onClick={print}>Print summary</button></div></div>
    <div className="advisor-grid"><article><label>Meeting date<input type="date" value={meetingDate} onChange={(event) => setMeetingDate(event.target.value)} /></label><label>Questions I want to ask<textarea maxLength={5000} value={questions} onChange={(event) => setQuestions(event.target.value)} placeholder="What requirements should I verify? Which deadlines need attention?" /></label><label>Meeting notes and next steps<textarea maxLength={10000} value={notes} onChange={(event) => setNotes(event.target.value)} placeholder="Record decisions, follow-ups, and who is responsible." /></label><button onClick={save}>Save meeting brief</button>{message && <p role="status">{message}</p>}</article><article className="brief-preview" id="advisor-brief-print"><pre>{lines.join("\n")}</pre></article></div>
  </section>;
}
