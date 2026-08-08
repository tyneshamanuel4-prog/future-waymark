"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "../lib/supabase";

type Step = {
  id: string;
  title: string;
  due_date: string | null;
  completed: boolean;
  category: string;
};
type Deadline = {
  id: string;
  title: string;
  date: string;
  type: string;
  href: string;
};
type Readiness = {
  id: string;
  college_name: string;
  status: string;
  requirements: Record<string, boolean>;
};
type Recent = { title: string; kind: string; updated_at: string; href: string };

const collegeRequirements = [
  "application",
  "essay",
  "supplements",
  "transcript",
  "recommendations",
  "scores",
  "fafsa",
];
const formatDate = (date: string) =>
  new Date(`${date.slice(0, 10)}T12:00:00`).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });

export function StudentCommandCenter({
  userId,
  steps,
}: {
  userId: string;
  steps: Step[];
}) {
  const [external, setExternal] = useState<Deadline[]>([]);
  const [readiness, setReadiness] = useState<Readiness[]>([]);
  const [recent, setRecent] = useState<Recent[]>([]);
  const [quickOpen, setQuickOpen] = useState(false);
  useEffect(() => {
    Promise.all([
      supabase
        .from("college_applications")
        .select("id,college_name,deadline,status,requirements,updated_at")
        .eq("user_id", userId),
      supabase
        .from("scholarship_applications")
        .select("id,scholarship_name,deadline,status,updated_at")
        .eq("user_id", userId),
      supabase
        .from("recommendation_requests")
        .select("id,recommender_name,destination,deadline,status,updated_at")
        .eq("user_id", userId),
      supabase
        .from("financial_aid_offers")
        .select("id,school_name,deadline,status,updated_at")
        .eq("user_id", userId),
      supabase
        .from("test_plans")
        .select("exam,planned_test_date,updated_at")
        .eq("user_id", userId),
      supabase
        .from("college_visits")
        .select("id,college_name,visit_date,status,updated_at")
        .eq("user_id", userId),
      supabase
        .from("interview_preparations")
        .select("id,title,interview_date,follow_up_date,updated_at")
        .eq("user_id", userId),
      supabase
        .from("essay_drafts")
        .select("id,title,stage,updated_at")
        .eq("user_id", userId)
        .order("updated_at", { ascending: false })
        .limit(3),
      supabase
        .from("resume_versions")
        .select("id,title,updated_at")
        .eq("user_id", userId)
        .order("updated_at", { ascending: false })
        .limit(3),
    ]).then(([c, s, r, a, t, v, i, e, res]) => {
      const deadlines: Deadline[] = [];
      for (const x of c.data ?? []) {
        if (x.deadline)
          deadlines.push({
            id: `c-${x.id}`,
            title: x.college_name,
            date: x.deadline,
            type: "College application",
            href: "#applications",
          });
      }
      for (const x of s.data ?? []) {
        if (x.deadline)
          deadlines.push({
            id: `s-${x.id}`,
            title: x.scholarship_name,
            date: x.deadline,
            type: "Scholarship",
            href: "#applications",
          });
      }
      for (const x of r.data ?? []) {
        if (x.deadline)
          deadlines.push({
            id: `r-${x.id}`,
            title: `Recommendation · ${x.destination || x.recommender_name}`,
            date: x.deadline,
            type: "Recommendation",
            href: "#recommendations",
          });
      }
      for (const x of a.data ?? []) {
        if (x.deadline)
          deadlines.push({
            id: `a-${x.id}`,
            title: `Financial aid · ${x.school_name}`,
            date: x.deadline,
            type: "Financial aid",
            href: "#financial-aid",
          });
      }
      for (const x of t.data ?? []) {
        if (x.planned_test_date)
          deadlines.push({
            id: `t-${x.exam}`,
            title: `${x.exam} test date`,
            date: x.planned_test_date,
            type: "Testing",
            href: "#testing",
          });
      }
      for (const x of v.data ?? []) {
        if (x.visit_date)
          deadlines.push({
            id: `v-${x.id}`,
            title: `Visit · ${x.college_name}`,
            date: x.visit_date.slice(0, 10),
            type: "College visit",
            href: "#college-visits",
          });
      }
      for (const x of i.data ?? []) {
        if (x.interview_date)
          deadlines.push({
            id: `i-${x.id}`,
            title: x.title,
            date: x.interview_date.slice(0, 10),
            type: "Interview",
            href: "#interviews",
          });
        if (x.follow_up_date)
          deadlines.push({
            id: `if-${x.id}`,
            title: `Follow up · ${x.title}`,
            date: x.follow_up_date,
            type: "Interview follow-up",
            href: "#interviews",
          });
      }
      setExternal(deadlines);
      setReadiness((c.data ?? []) as Readiness[]);
      setRecent(
        [
          ...(e.data ?? []).map((x) => ({
            title: x.title,
            kind: `Essay · ${x.stage}`,
            updated_at: x.updated_at,
            href: "#essays",
          })),
          ...(res.data ?? []).map((x) => ({
            title: x.title,
            kind: "Resume",
            updated_at: x.updated_at,
            href: "#resume",
          })),
        ]
          .sort((x, y) => y.updated_at.localeCompare(x.updated_at))
          .slice(0, 4),
      );
    });
  }, [userId]);
  const deadlines = useMemo(
    () =>
      [
        ...steps
          .filter((x) => !x.completed && x.due_date)
          .map((x) => ({
            id: `step-${x.id}`,
            title: x.title,
            date: x.due_date!,
            type: x.category,
            href: "#path",
          })),
        ...external,
      ].sort((a, b) => a.date.localeCompare(b.date)),
    [steps, external],
  );
  const today = new Date().toISOString().slice(0, 10),
    next = deadlines.filter((x) => x.date >= today).slice(0, 5),
    overdue = deadlines.filter((x) => x.date < today);
  return (
    <section className="command-center" id="today">
      <div className="command-heading">
        <div>
          <span className="kicker dark">TODAY</span>
          <h2>Your next moves, all in one place.</h2>
        </div>
        <button
          className="quick-add-toggle"
          onClick={() => setQuickOpen(!quickOpen)}
        >
          ＋ Quick add
        </button>
      </div>
      {quickOpen && (
        <div className="quick-add-menu">
          <a href="#path">Goal or milestone</a>
          <a href="#applications">College application</a>
          <a href="#applications">Scholarship</a>
          <a href="#essays">Essay</a>
          <a href="#testing">Test score</a>
          <a href="#resume">Resume</a>
          <a href="#interviews">Interview</a>
          <a href="#school-research">School</a>
        </div>
      )}
      <div className="command-grid">
        <article className="today-next">
          <small>NEXT IMPORTANT DATE</small>
          {next[0] ? (
            <>
              <time>{formatDate(next[0].date)}</time>
              <h3>{next[0].title}</h3>
              <p>{next[0].type}</p>
              <a href={next[0].href}>Open this item →</a>
            </>
          ) : (
            <>
              <h3>No upcoming dates yet</h3>
              <p>Add a deadline to build your schedule.</p>
              <a href="#path">Add a date →</a>
            </>
          )}
        </article>
        <article className="deadline-glance">
          <div>
            <h3>Upcoming</h3>
            {overdue.length > 0 && (
              <span className="overdue-count">{overdue.length} overdue</span>
            )}
          </div>
          {next.slice(0, 4).map((x) => (
            <a key={x.id} href={x.href}>
              <time>{formatDate(x.date)}</time>
              <span>
                <b>{x.title}</b>
                <small>{x.type}</small>
              </span>
            </a>
          ))}
        </article>
        <article className="recent-work">
          <h3>Continue working</h3>
          {recent.length ? (
            recent.map((x) => (
              <a key={`${x.kind}-${x.title}`} href={x.href}>
                <b>{x.title}</b>
                <span>
                  {x.kind} · edited{" "}
                  {new Date(x.updated_at).toLocaleDateString()}
                </span>
              </a>
            ))
          ) : (
            <p>Your recent essays and resumes will appear here.</p>
          )}
        </article>
      </div>
      {readiness.length > 0 && (
        <div className="readiness-strip">
          <div>
            <span className="kicker dark">APPLICATION READINESS</span>
            <p>
              Use this as an organization check—not an admission prediction.
            </p>
          </div>
          {readiness.slice(0, 4).map((x) => {
            const done = collegeRequirements.filter(
                (k) => x.requirements?.[k],
              ).length,
              percent = Math.round((done / collegeRequirements.length) * 100);
            return (
              <a href="#applications" key={x.id}>
                <b>{x.college_name}</b>
                <span>
                  <i style={{ width: `${percent}%` }} />
                </span>
                <small>
                  {percent}% checklist complete · {x.status}
                </small>
              </a>
            );
          })}
        </div>
      )}
    </section>
  );
}

type DraftValue = {
  key: string;
  value: string | boolean;
  kind: "value" | "checked";
};
const draftKey = "future-waymark-unsaved-draft-v1";
function fieldKey(
  el: HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement,
) {
  const section =
    el.closest("section")?.id || el.closest("form")?.className || "dashboard";
  const label = el.closest("label")?.textContent?.trim().slice(0, 80);
  const placeholder =
    el instanceof HTMLSelectElement ? "" : el.placeholder;
  return `${section}::${el.name || el.id || el.getAttribute("aria-label") || placeholder || label || el.tagName}`;
}
export function DraftSafety() {
  const [available, setAvailable] = useState(false),
    [status, setStatus] = useState("");
  useEffect(() => {
    try {
      setAvailable(Boolean(localStorage.getItem(draftKey)));
    } catch {}
    let timer: number | undefined;
    const capture = (event: Event) => {
      const el = event.target;
      if (
        !(
          el instanceof HTMLInputElement ||
          el instanceof HTMLTextAreaElement ||
          el instanceof HTMLSelectElement
        ) ||
        el.type === "password"
      )
        return;
      window.clearTimeout(timer);
      setStatus("Unsaved changes");
      timer = window.setTimeout(() => {
        try {
          const current: DraftValue[] = JSON.parse(
              localStorage.getItem(draftKey) || "[]",
            ),
            key = fieldKey(el),
            next = current.filter((x) => x.key !== key);
          next.push({
            key,
            value:
              el instanceof HTMLInputElement &&
              ["checkbox", "radio"].includes(el.type)
                ? el.checked
                : el.value,
            kind:
              el instanceof HTMLInputElement &&
              ["checkbox", "radio"].includes(el.type)
                ? "checked"
                : "value",
          });
          localStorage.setItem(draftKey, JSON.stringify(next.slice(-120)));
          setAvailable(true);
          setStatus("Draft saved on this device");
        } catch {}
      }, 600);
    };
    const clear = (event: Event) => {
      const target = event.target as HTMLElement;
      if (!target.closest("button")) return;
      const text = target.closest("button")?.textContent?.toLowerCase() || "";
      if (/save|create|add|update|mark complete/.test(text)) {
        try {
          localStorage.removeItem(draftKey);
          setAvailable(false);
          setStatus("Saved");
        } catch {}
      }
    };
    document.addEventListener("input", capture, true);
    document.addEventListener("change", capture, true);
    document.addEventListener("click", clear, true);
    return () => {
      document.removeEventListener("input", capture, true);
      document.removeEventListener("change", capture, true);
      document.removeEventListener("click", clear, true);
      window.clearTimeout(timer);
    };
  }, []);
  function restore() {
    try {
      const values: DraftValue[] = JSON.parse(
        localStorage.getItem(draftKey) || "[]",
      );
      const fields = [
        ...document.querySelectorAll<
          HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
        >("input,textarea,select"),
      ];
      for (const item of values) {
        const el = fields.find((x) => fieldKey(x) === item.key);
        if (!el) continue;
        if (item.kind === "checked" && el instanceof HTMLInputElement) {
          const setter = Object.getOwnPropertyDescriptor(
            HTMLInputElement.prototype,
            "checked",
          )?.set;
          setter?.call(el, Boolean(item.value));
        } else {
          const proto =
            el instanceof HTMLTextAreaElement
              ? HTMLTextAreaElement.prototype
              : el instanceof HTMLSelectElement
                ? HTMLSelectElement.prototype
                : HTMLInputElement.prototype;
          Object.getOwnPropertyDescriptor(proto, "value")?.set?.call(
            el,
            String(item.value),
          );
        }
        el.dispatchEvent(new Event("input", { bubbles: true }));
        el.dispatchEvent(new Event("change", { bubbles: true }));
      }
      setStatus("Draft restored");
      setAvailable(false);
    } catch {
      setStatus("Draft could not be restored");
    }
  }
  function discard() {
    localStorage.removeItem(draftKey);
    setAvailable(false);
    setStatus("");
  }
  return (
    <>
      {available && (
        <div className="draft-recovery" role="status">
          <span>
            <b>Unsaved work is available.</b> Restore the last draft saved on
            this device?
          </span>
          <button onClick={restore}>Restore draft</button>
          <button onClick={discard}>Discard</button>
        </div>
      )}
      {status && (
        <div className="autosave-status" aria-live="polite">
          {status}
        </div>
      )}
    </>
  );
}
