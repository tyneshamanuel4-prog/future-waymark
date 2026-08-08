"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { supabase } from "../lib/supabase";

const monday = () => {
  const date = new Date();
  const day = date.getDay();
  date.setDate(date.getDate() - day + (day === 0 ? -6 : 1));
  return date.toISOString().slice(0, 10);
};

type Focus = { id?: string; goal: string; completed: boolean; reflection: string };

export function GuidedProgress({ userId, hasProfile, schoolCount }: { userId: string; hasProfile: boolean; schoolCount: number }) {
  const [focus, setFocus] = useState<Focus>({ goal: "", completed: false, reflection: "" });
  const [stats, setStats] = useState({ steps: 0, dates: 0, resources: 0, applications: 0 });
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const [category, setCategory] = useState("Bug");
  const [feedback, setFeedback] = useState("");
  const [message, setMessage] = useState("");
  const week = monday();

  useEffect(() => {
    Promise.all([
      supabase.from("student_weekly_focus").select("id,goal,completed,reflection").eq("user_id", userId).eq("week_start", week).maybeSingle(),
      supabase.from("student_steps").select("id,due_date", { count: "exact" }).eq("user_id", userId),
      supabase.from("saved_resources").select("resource_id", { count: "exact", head: true }).eq("user_id", userId),
      supabase.from("college_applications").select("id", { count: "exact", head: true }).eq("user_id", userId),
    ]).then(([weekly, steps, resources, applications]) => {
      if (weekly.data) setFocus(weekly.data as Focus);
      setStats({
        steps: steps.count ?? 0,
        dates: (steps.data ?? []).filter((step) => step.due_date).length,
        resources: resources.count ?? 0,
        applications: applications.count ?? 0,
      });
    });
  }, [userId, week]);

  const setup = useMemo(() => [
    { label: "Complete my student profile", done: hasProfile, href: "#profile" },
    { label: "Add at least one school or pathway", done: schoolCount > 0, href: "#school-research" },
    { label: "Create my first milestone", done: stats.steps > 0, href: "#path" },
    { label: "Add a deadline", done: stats.dates > 0, href: "#planning-assistant" },
    { label: "Save a useful resource", done: stats.resources > 0, href: "#resources" },
    { label: "Start an application tracker", done: stats.applications > 0, href: "#applications" },
  ], [hasProfile, schoolCount, stats]);
  const complete = setup.filter((item) => item.done).length;

  async function saveFocus() {
    if (!focus.goal.trim()) return setMessage("Enter one realistic goal for this week.");
    const { data, error } = await supabase.from("student_weekly_focus").upsert({
      user_id: userId,
      week_start: week,
      goal: focus.goal.trim(),
      completed: focus.completed,
      reflection: focus.reflection,
      updated_at: new Date().toISOString(),
    }, { onConflict: "user_id,week_start" }).select("id,goal,completed,reflection").single();
    if (error) return setMessage(error.message);
    setFocus(data as Focus);
    setMessage(focus.completed ? "Weekly goal completed - well done." : "Weekly focus saved.");
  }

  async function sendFeedback(event: FormEvent) {
    event.preventDefault();
    if (feedback.trim().length < 5) return;
    const { error } = await supabase.from("student_feedback").insert({
      user_id: userId,
      category,
      message: feedback.trim(),
      page_section: window.location.hash || "Dashboard",
    });
    if (error) return setMessage(error.message);
    setFeedback("");
    setFeedbackOpen(false);
    setMessage("Thank you. Your feedback was saved for review.");
  }

  return <section className="guided-progress" id="getting-started">
    <div className="setup-card">
      <div><span className="kicker dark">GETTING STARTED</span><h2>{complete === setup.length ? "Your foundation is ready." : "Build your Waymark one step at a time."}</h2><p>{complete}/{setup.length} setup steps complete</p><span className="setup-progress"><i style={{ width: `${Math.round(complete / setup.length * 100)}%` }} /></span></div>
      <div className="setup-list">{setup.map((item) => <a href={item.href} key={item.label} className={item.done ? "done" : ""}><span>{item.done ? "Done" : "Next"}</span>{item.label}</a>)}</div>
    </div>
    <div className="weekly-focus">
      <div><span className="kicker dark">THIS WEEK</span><h2>One focus creates momentum.</h2><p>Choose a goal small enough to finish this week.</p></div>
      <div><label>My weekly focus<input value={focus.goal} maxLength={240} onChange={(event) => setFocus({ ...focus, goal: event.target.value })} placeholder="Example: Finish my activity list" /></label><label className="focus-complete"><input type="checkbox" checked={focus.completed} onChange={(event) => setFocus({ ...focus, completed: event.target.checked })} />I completed this goal</label><label>Reflection or next step<textarea value={focus.reflection} onChange={(event) => setFocus({ ...focus, reflection: event.target.value })} placeholder="What worked? What should happen next?" /></label><button onClick={saveFocus}>Save weekly focus</button></div>
    </div>
    {message && <div className="form-message" role="status">{message}</div>}
    <button className="feedback-launch" onClick={() => setFeedbackOpen(true)}>Report a problem or share an idea</button>
    {feedbackOpen && <div className="modal-backdrop"><form className="feedback-panel" onSubmit={sendFeedback}><button type="button" className="close" aria-label="Close feedback form" onClick={() => setFeedbackOpen(false)}>Close</button><span className="kicker dark">HELP IMPROVE FUTURE WAYMARK</span><h2>Tell us what happened.</h2><label>Feedback type<select value={category} onChange={(event) => setCategory(event.target.value)}><option>Bug</option><option>Confusing</option><option>Suggestion</option><option>Missing Information</option><option>Other</option></select></label><label>What should we know?<textarea required minLength={5} maxLength={3000} value={feedback} onChange={(event) => setFeedback(event.target.value)} placeholder="Describe what you expected, what happened, and what would make it easier." /></label><button>Send feedback</button><small>Do not include passwords, Social Security numbers, financial documents, or other sensitive information.</small></form></div>}
  </section>;
}
