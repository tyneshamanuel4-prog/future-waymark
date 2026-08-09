"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "../lib/supabase";

type Step = { id: string; title: string; due_date: string | null; completed: boolean };
type Notice = { key: string; title: string; detail: string; href: string; tone: "urgent" | "soon" | "win" | "focus" };

const daysFromNow = (date: string) => Math.ceil((new Date(`${date.slice(0, 10)}T12:00:00`).getTime() - Date.now()) / 86400000);

export function StudentNotifications({ userId, steps }: { userId: string; steps: Step[] }) {
  const [open, setOpen] = useState(false);
  const [dismissed, setDismissed] = useState<string[]>([]);
  const [applications, setApplications] = useState<{ id: string; college_name: string; deadline: string }[]>([]);
  const [weekly, setWeekly] = useState<{ goal: string; completed: boolean } | null>(null);
  const [recentWins, setRecentWins] = useState(0);
  const [followUps, setFollowUps] = useState<{ id: string; name: string; role: string; follow_up_date: string }[]>([]);
  const [lastSection, setLastSection] = useState("");

  useEffect(() => {
    const weekAgo = new Date(Date.now() - 7 * 86400000).toISOString();
    Promise.all([
      supabase.from("student_notification_dismissals").select("notification_key").eq("user_id", userId),
      supabase.from("college_applications").select("id,college_name,deadline").eq("user_id", userId).not("deadline", "is", null),
      supabase.from("student_weekly_focus").select("goal,completed").eq("user_id", userId).order("week_start", { ascending: false }).limit(1).maybeSingle(),
      supabase.from("student_steps").select("id", { count: "exact", head: true }).eq("user_id", userId).eq("completed", true).gte("updated_at", weekAgo),
      supabase.from("student_support_contacts").select("id,name,role,follow_up_date").eq("user_id", userId).not("follow_up_date", "is", null),
    ]).then(([dismissals, colleges, focus, wins, contacts]) => {
      setDismissed((dismissals.data ?? []).map((item) => item.notification_key));
      setApplications((colleges.data ?? []) as { id: string; college_name: string; deadline: string }[]);
      setWeekly(focus.data);
      setRecentWins(wins.count ?? 0);
      setFollowUps((contacts.data ?? []) as { id: string; name: string; role: string; follow_up_date: string }[]);
    });
    setLastSection(localStorage.getItem("future-waymark-last-section") ?? "");
  }, [userId]);

  const notices = useMemo(() => {
    const items: Notice[] = [];
    const overdue = steps.filter((step) => !step.completed && step.due_date && daysFromNow(step.due_date) < 0);
    if (overdue.length) items.push({ key: `overdue-${overdue.length}`, title: `${overdue.length} overdue item${overdue.length === 1 ? "" : "s"}`, detail: "Review the dates and update your plan.", href: "#deadlines", tone: "urgent" });
    const soon = applications.filter((application) => application.deadline && daysFromNow(application.deadline) >= 0 && daysFromNow(application.deadline) <= 30);
    if (soon.length) items.push({ key: `applications-${soon.map((item) => item.id).join("-")}`, title: `${soon.length} application deadline${soon.length === 1 ? "" : "s"} within 30 days`, detail: soon.slice(0, 2).map((item) => item.college_name).join(" and "), href: "#applications", tone: "soon" });
    if (weekly && !weekly.completed) items.push({ key: `focus-${weekly.goal}`, title: "Your weekly focus is still open", detail: weekly.goal, href: "#getting-started", tone: "focus" });
    if (recentWins) items.push({ key: `wins-${recentWins}`, title: `${recentWins} recent win${recentWins === 1 ? "" : "s"}`, detail: "You completed important steps this week. Keep going.", href: "#path", tone: "win" });
    const contactsDue = followUps.filter((contact) => daysFromNow(contact.follow_up_date) <= 7);
    if (contactsDue.length) items.push({ key: `contacts-${contactsDue.map((item) => item.id).join("-")}`, title: `${contactsDue.length} contact follow-up${contactsDue.length === 1 ? "" : "s"} due`, detail: contactsDue.slice(0, 2).map((item) => `${item.name} (${item.role})`).join(" and "), href: "#support-network", tone: contactsDue.some((item) => daysFromNow(item.follow_up_date) < 0) ? "urgent" : "soon" });
    return items.filter((item) => !dismissed.includes(item.key));
  }, [applications, dismissed, followUps, recentWins, steps, weekly]);

  async function dismiss(key: string) {
    const { error } = await supabase.from("student_notification_dismissals").upsert({ user_id: userId, notification_key: key, dismissed_at: new Date().toISOString() }, { onConflict: "user_id,notification_key" });
    if (!error) setDismissed((current) => [...current, key]);
  }

  async function dismissAll() {
    if (!notices.length) return;
    const { error } = await supabase.from("student_notification_dismissals").upsert(notices.map((item) => ({ user_id: userId, notification_key: item.key, dismissed_at: new Date().toISOString() })), { onConflict: "user_id,notification_key" });
    if (!error) setDismissed((current) => [...current, ...notices.map((item) => item.key)]);
  }

  return <>
    <div className="notification-tools">
      {lastSection && lastSection !== "#today" && <a className="resume-location" href={lastSection}>Resume where I left off</a>}
      <button className="notification-bell" aria-expanded={open} aria-controls="student-notification-panel" onClick={() => setOpen(!open)}>Updates {notices.length > 0 && <b>{notices.length}</b>}</button>
    </div>
    {open && <aside className="notification-panel" id="student-notification-panel" aria-label="Student updates">
      <div><span className="kicker dark">YOUR UPDATES</span><button onClick={() => setOpen(false)}>Close</button></div>
      <h2>What needs your attention</h2>
      {notices.length ? <>{notices.map((notice) => <article className={`notice-${notice.tone}`} key={notice.key}><a href={notice.href} onClick={() => setOpen(false)}><b>{notice.title}</b><span>{notice.detail}</span></a><button aria-label={`Dismiss ${notice.title}`} onClick={() => dismiss(notice.key)}>Dismiss</button></article>)}<button className="dismiss-all" onClick={dismissAll}>Mark all as seen</button></> : <div className="all-caught-up"><b>You are all caught up.</b><p>New deadlines, weekly goals, and progress updates will appear here.</p></div>}
    </aside>}
  </>;
}
