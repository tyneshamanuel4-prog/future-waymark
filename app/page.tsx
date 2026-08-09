"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "../lib/supabase";
import { InterviewPreparationCenter } from "./interview-preparation-center";
import { ApplicationTracker } from "./application-tracker";
import { RecommendationCenter } from "./recommendation-center";
import { FinancialAidCenter } from "./financial-aid-center";
import { CollegeVisitCenter } from "./college-visit-center";
import { StudyCenter } from "./study-center";
import { SchoolPicker } from "./school-picker";
import { TestPrepCenter } from "./test-prep-center";
import { ResourceContent } from "./resource-content";
import { SchoolResearchCenter } from "./school-research-center";
import { DraftSafety, StudentCommandCenter } from "./student-experience";
import { StudentProductivityTools } from "./student-productivity-tools";
import { PlanningAssistant } from "./planning-assistant";
import { GuidedProgress } from "./guided-progress";
import { StudentNotifications } from "./student-notifications";
import { AdvisorBrief } from "./advisor-brief";
import { CollegeDecisionWorkspace } from "./college-decision-workspace";

type Resource = {
  id: number;
  type: "Guide" | "Video" | "Template" | "Checklist";
  title: string;
  category: string;
  detail: string;
  time: string;
  level: string;
  icon: string;
  accent: string;
};
type Profile = {
  id: string;
  first_name: string;
  last_name: string;
  grade_level: string;
  graduation_year: number;
  pathway: string;
  pathways: string[];
  interests: string[];
  goals: string[];
  target_schools: string[];
  onboarding_complete: boolean;
};
type Step = {
  id: string;
  title: string;
  due_date: string | null;
  reminder_date: string | null;
  notes: string;
  category: string;
  completed: boolean;
  position: number;
};

const fallbackResources: Resource[] = [
  {
    id: 1,
    type: "Guide",
    title: "Build a college list that fits you",
    category: "College Applications",
    detail:
      "Balance reach, target, and likely schools around what matters to you.",
    time: "7 min read",
    level: "Start here",
    icon: "01",
    accent: "sage",
  },
  {
    id: 2,
    type: "Video",
    title: "FAFSA: what families should know",
    category: "FAFSA & Financial Aid",
    detail: "A plain-language walkthrough for students and supporters.",
    time: "12 min",
    level: "Beginner",
    icon: "02",
    accent: "gold",
  },
  {
    id: 3,
    type: "Template",
    title: "Personal story map",
    category: "Essay Writing",
    detail: "Connect moments, choices, and growth before drafting your essay.",
    time: "15 min",
    level: "All levels",
    icon: "03",
    accent: "coral",
  },
  {
    id: 4,
    type: "Checklist",
    title: "Digital SAT test-day checklist",
    category: "SAT Preparation",
    detail: "Know what to bring and how to arrive ready.",
    time: "5 min",
    level: "Test day",
    icon: "04",
    accent: "blue",
  },
  {
    id: 5,
    type: "Guide",
    title: "Ask for a strong recommendation",
    category: "Recommendation Letters",
    detail: "Choose a recommender, ask thoughtfully, and share useful context.",
    time: "6 min",
    level: "Start here",
    icon: "05",
    accent: "violet",
  },
  {
    id: 6,
    type: "Video",
    title: "Answer interview questions with STAR",
    category: "Interview Preparation",
    detail: "Turn your experiences into clear, memorable answers.",
    time: "9 min",
    level: "Practice",
    icon: "06",
    accent: "rose",
  },
];

const pathways = [
  "Four-year college",
  "Community college",
  "Trade school",
  "Apprenticeship",
  "Career or internship",
  "Military service",
  "Still exploring",
];
const interestOptions = [
  "Scholarships",
  "Financial aid",
  "SAT / ACT",
  "Essay writing",
  "Career planning",
  "Resume building",
  "Interview practice",
  "Mental wellness",
];
const milestoneCategories = [
  ["Path Planning", "#path"],
  ["College Applications", "#applications"],
  ["Scholarships", "#applications"],
  ["FAFSA & Financial Aid", "#financial-aid"],
  ["SAT & ACT", "#testing"],
  ["Essay Writing", "#essays"],
  ["Recommendation Letters", "#recommendations"],
  ["Resume Building", "#resume"],
  ["Interview Preparation", "#interviews"],
  ["College Visits", "#college-visits"],
  ["Study Skills", "#study-skills"],
] as const;
const categoryHref = (category: string) =>
  milestoneCategories.find(([name]) => name === category)?.[1] ?? "#path";
const inferCategory = (title: string) =>
  /FAFSA|financial aid/i.test(title)
    ? "FAFSA & Financial Aid"
    : /scholarship/i.test(title)
      ? "Scholarships"
      : /SAT|ACT|test score|test prep/i.test(title)
        ? "SAT & ACT"
        : /essay|personal statement/i.test(title)
          ? "Essay Writing"
          : /recommend/i.test(title)
            ? "Recommendation Letters"
            : /resume/i.test(title)
              ? "Resume Building"
              : /interview/i.test(title)
                ? "Interview Preparation"
                : /campus|college visit/i.test(title)
                  ? "College Visits"
                  : /study|time management|note-taking/i.test(title)
                    ? "Study Skills"
                    : /college list|college application|apply for admission/i.test(
                          title,
                        )
                      ? "College Applications"
                      : "Path Planning";
const pathTemplates: Record<string, string[]> = {
  "Four-year college": [
    "Build a balanced college list",
    "Request recommendation letters",
    "Complete FAFSA",
    "Draft your personal statement",
    "Submit applications",
  ],
  "Community college": [
    "Compare local programs",
    "Review transfer pathways",
    "Complete FAFSA",
    "Apply for admission",
    "Attend orientation",
  ],
  "Trade school": [
    "Choose a skilled-trade pathway",
    "Compare accredited programs",
    "Review costs and aid",
    "Apply to programs",
    "Prepare for enrollment",
  ],
  Apprenticeship: [
    "Explore apprenticeship fields",
    "Build a first resume",
    "Gather references",
    "Apply to opportunities",
    "Practice for interviews",
  ],
  "Career or internship": [
    "Identify career interests",
    "Build your resume",
    "Create a professional email",
    "Apply to opportunities",
    "Practice interviews",
  ],
  "Military service": [
    "Explore service branches",
    "Speak with trusted adults",
    "Review eligibility and commitments",
    "Prepare questions for recruiters",
    "Compare education benefits",
  ],
  "Still exploring": [
    "Complete a career-interest reflection",
    "Compare college, trade, and work paths",
    "Talk with a trusted advisor",
    "Choose two paths to research",
    "Set a next-step decision date",
  ],
};

const emptyProfile: Profile = {
  id: "",
  first_name: "",
  last_name: "",
  grade_level: "12",
  graduation_year: new Date().getFullYear(),
  pathway: "Still exploring",
  pathways: ["Still exploring"],
  interests: [],
  goals: [],
  target_schools: [],
  onboarding_complete: false,
};

function AuthPanel({ close }: { close: () => void }) {
  const [mode, setMode] = useState<"signup" | "signin" | "reset">("signup");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setMessage("");
    const fd = new FormData(e.currentTarget);
    const email = String(fd.get("email"));
    if (mode === "reset") {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/`,
      });
      setBusy(false);
      setMessage(
        error
          ? error.message
          : "Check your email for a secure password-reset link.",
      );
      return;
    }
    const password = String(fd.get("password"));
    const result =
      mode === "signup"
        ? await supabase.auth.signUp({
            email,
            password,
            options: {
              data: { first_name: String(fd.get("firstName") || "") },
              emailRedirectTo: window.location.origin,
            },
          })
        : await supabase.auth.signInWithPassword({ email, password });
    setBusy(false);
    if (result.error) {
      setMessage(result.error.message);
      return;
    }
    if (mode === "signup" && !result.data.session) {
      setMessage(
        "Check your email to confirm your account, then return here to sign in.",
      );
      return;
    }
    close();
  }
  return (
    <div className="modal-backdrop" role="presentation">
      <section
        className="auth-panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby="auth-title"
      >
        <button className="close" onClick={close} aria-label="Close">
          ×
        </button>
        <span className="kicker dark">YOUR PRIVATE WORKSPACE</span>
        <h2 id="auth-title">
          {mode === "signup"
            ? "Create your student account"
            : mode === "reset"
              ? "Reset your password"
              : "Welcome back"}
        </h2>
        <p>
          {mode === "reset"
            ? "Enter your account email and we’ll send you a secure reset link."
            : "Your path, saved resources, and progress will follow you on any device."}
        </p>
        <form onSubmit={submit}>
          {mode === "signup" && (
            <label>
              First name
              <input name="firstName" required autoComplete="given-name" />
            </label>
          )}
          <label>
            Email address
            <input name="email" type="email" required autoComplete="email" />
          </label>
          {mode !== "reset" && (
            <label>
              Password
              <input
                name="password"
                type="password"
                minLength={8}
                required
                autoComplete={
                  mode === "signup" ? "new-password" : "current-password"
                }
              />
            </label>
          )}
          <button className="primary" disabled={busy}>
            {busy
              ? "Please wait…"
              : mode === "signup"
                ? "Create my account"
                : mode === "reset"
                  ? "Send reset link"
                  : "Sign in"}
          </button>
        </form>
        {message && (
          <div className="form-message" role="status">
            {message}
          </div>
        )}
        {mode === "signin" && (
          <button
            className="auth-switch"
            onClick={() => {
              setMode("reset");
              setMessage("");
            }}
          >
            Forgot your password?
          </button>
        )}
        <button
          className="auth-switch"
          onClick={() => {
            setMode(
              mode === "signup"
                ? "signin"
                : mode === "signin"
                  ? "signup"
                  : "signin",
            );
            setMessage("");
          }}
        >
          {mode === "signup"
            ? "Already have an account? Sign in"
            : mode === "reset"
              ? "Return to sign in"
              : "New to Future Waymark? Create an account"}
        </button>
        <small>
          Future Waymark provides educational support and does not replace
          official admissions, financial-aid, or counseling guidance.
        </small>
      </section>
    </div>
  );
}

function PasswordUpdate({ done }: { done: () => void }) {
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setMessage("");
    const fd = new FormData(e.currentTarget);
    const password = String(fd.get("password"));
    const confirm = String(fd.get("confirm"));
    if (password !== confirm) {
      setMessage("The passwords do not match.");
      setBusy(false);
      return;
    }
    const { error } = await supabase.auth.updateUser({ password });
    setBusy(false);
    if (error) {
      setMessage(error.message);
      return;
    }
    setMessage("Your password has been updated.");
    setTimeout(done, 900);
  }
  return (
    <main className="onboarding">
      <div className="onboarding-intro">
        <span className="kicker">ACCOUNT RECOVERY</span>
        <h1>
          Choose a new
          <br />
          <em>password.</em>
        </h1>
        <p>
          Use at least eight characters and choose something unique to Future
          Waymark.
        </p>
      </div>
      <form className="onboarding-card" onSubmit={submit}>
        <div className="step-label">SECURE PASSWORD UPDATE</div>
        <label>
          New password
          <input
            name="password"
            type="password"
            minLength={8}
            required
            autoComplete="new-password"
          />
        </label>
        <label>
          Confirm new password
          <input
            name="confirm"
            type="password"
            minLength={8}
            required
            autoComplete="new-password"
          />
        </label>
        {message && (
          <div className="form-message" role="status">
            {message}
          </div>
        )}
        <button className="primary" disabled={busy}>
          {busy ? "Updating…" : "Update password"}
        </button>
      </form>
    </main>
  );
}

type TestPlan = {
  exam: "SAT" | "ACT";
  planned_test_date: string | null;
  target_score: number | null;
  strongest_subject: string;
  weakest_subject: string;
  colleges_requiring_scores: string[];
};
type PracticeLog = {
  id: string;
  exam: "SAT" | "ACT";
  practice_date: string;
  total_score: number;
  math_score: number | null;
  reading_writing_score: number | null;
  english_score: number | null;
  reading_score: number | null;
  science_score: number | null;
  notes: string;
};
const emptyTestPlan = (exam: "SAT" | "ACT"): TestPlan => ({
  exam,
  planned_test_date: null,
  target_score: null,
  strongest_subject: "",
  weakest_subject: "",
  colleges_requiring_scores: [],
});

function LegacyTestPrepCenter({ userId }: { userId: string }) {
  const [exam, setExam] = useState<"SAT" | "ACT">("SAT");
  const [plans, setPlans] = useState<Record<string, TestPlan>>({
    SAT: emptyTestPlan("SAT"),
    ACT: emptyTestPlan("ACT"),
  });
  const [logs, setLogs] = useState<PracticeLog[]>([]);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    Promise.all([
      supabase
        .from("test_plans")
        .select(
          "exam,planned_test_date,target_score,strongest_subject,weakest_subject,colleges_requiring_scores",
        )
        .eq("user_id", userId),
      supabase
        .from("practice_test_logs")
        .select(
          "id,exam,practice_date,total_score,math_score,reading_writing_score,english_score,reading_score,science_score,notes",
        )
        .eq("user_id", userId)
        .order("practice_date", { ascending: false }),
    ]).then(([planResult, logResult]) => {
      const next = { SAT: emptyTestPlan("SAT"), ACT: emptyTestPlan("ACT") };
      for (const plan of planResult.data ?? [])
        next[plan.exam as "SAT" | "ACT"] = plan as TestPlan;
      setPlans(next);
      setLogs((logResult.data ?? []) as PracticeLog[]);
    });
  }, [userId]);
  const plan = plans[exam];
  const examLogs = logs.filter((x) => x.exam === exam);
  const best = examLogs.length
    ? Math.max(...examLogs.map((x) => x.total_score))
    : null;
  function update(patch: Partial<TestPlan>) {
    setPlans({ ...plans, [exam]: { ...plan, ...patch } });
  }
  async function savePlan(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    const { error } = await supabase
      .from("test_plans")
      .upsert({
        user_id: userId,
        ...plan,
        updated_at: new Date().toISOString(),
      });
    setBusy(false);
    setMessage(error ? error.message : `${exam} plan saved.`);
  }
  async function addPractice(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    const fd = new FormData(e.currentTarget);
    const total = Number(fd.get("total"));
    const max = exam === "SAT" ? 1600 : 36;
    if (total < 1 || total > max) {
      setMessage(`Enter a total ${exam} score between 1 and ${max}.`);
      setBusy(false);
      return;
    }
    const row = {
      user_id: userId,
      exam,
      practice_date: String(fd.get("date")),
      total_score: total,
      math_score: Number(fd.get("math")) || null,
      reading_writing_score: Number(fd.get("rw")) || null,
      english_score: Number(fd.get("english")) || null,
      reading_score: Number(fd.get("reading")) || null,
      science_score: Number(fd.get("science")) || null,
      notes: String(fd.get("notes") || ""),
    };
    const { data, error } = await supabase
      .from("practice_test_logs")
      .insert(row)
      .select()
      .single();
    setBusy(false);
    if (error) {
      setMessage(error.message);
      return;
    }
    setLogs([data as PracticeLog, ...logs]);
    e.currentTarget.reset();
    setMessage("Practice score added.");
  }
  async function removeLog(id: string) {
    const { error } = await supabase
      .from("practice_test_logs")
      .delete()
      .eq("id", id);
    if (!error) {
      setLogs(logs.filter((x) => x.id !== id));
      setMessage("Practice score removed.");
    }
  }
  return (
    <section className="test-center" id="testing">
      <div className="test-heading">
        <div>
          <span className="kicker dark">TEST PREP TRACKER</span>
          <h2>SAT & ACT planning</h2>
          <p>
            Record your own scores and use official testing-provider materials
            for practice.
          </p>
        </div>
        <div className="exam-tabs">
          <button
            className={exam === "SAT" ? "active" : ""}
            onClick={() => {
              setExam("SAT");
              setMessage("");
            }}
          >
            SAT
          </button>
          <button
            className={exam === "ACT" ? "active" : ""}
            onClick={() => {
              setExam("ACT");
              setMessage("");
            }}
          >
            ACT
          </button>
        </div>
      </div>
      <div className="score-summary">
        <div>
          <small>TARGET SCORE</small>
          <b>{plan.target_score ?? "—"}</b>
        </div>
        <div>
          <small>PERSONAL BEST</small>
          <b>{best ?? "—"}</b>
        </div>
        <div>
          <small>PLANNED DATE</small>
          <b>
            {plan.planned_test_date
              ? new Date(
                  `${plan.planned_test_date}T12:00:00`,
                ).toLocaleDateString(undefined, {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })
              : "Not set"}
          </b>
        </div>
      </div>
      {message && (
        <div className="form-message test-message" role="status">
          {message}
        </div>
      )}
      <div className="test-grid">
        <form className="test-plan-form" onSubmit={savePlan}>
          <h3>My {exam} plan</h3>
          <div className="two-col">
            <label>
              Planned test date
              <input
                type="date"
                value={plan.planned_test_date ?? ""}
                onChange={(e) =>
                  update({ planned_test_date: e.target.value || null })
                }
              />
            </label>
            <label>
              Target score
              <input
                type="number"
                min="1"
                max={exam === "SAT" ? 1600 : 36}
                value={plan.target_score ?? ""}
                onChange={(e) =>
                  update({
                    target_score: e.target.value
                      ? Number(e.target.value)
                      : null,
                  })
                }
              />
            </label>
          </div>
          <div className="two-col">
            <label>
              Strongest subject
              <input
                value={plan.strongest_subject}
                onChange={(e) => update({ strongest_subject: e.target.value })}
              />
            </label>
            <label>
              Focus area
              <input
                value={plan.weakest_subject}
                onChange={(e) => update({ weakest_subject: e.target.value })}
              />
            </label>
          </div>
          <label>
            Colleges that may require scores <span>(separate with commas)</span>
            <textarea
              value={plan.colleges_requiring_scores.join(", ")}
              onChange={(e) =>
                update({
                  colleges_requiring_scores: e.target.value
                    .split(",")
                    .map((x) => x.trim())
                    .filter(Boolean),
                })
              }
            />
          </label>
          <button disabled={busy}>Save {exam} plan</button>
        </form>
        <form className="practice-form" onSubmit={addPractice}>
          <h3>Add a practice result</h3>
          <div className="two-col">
            <label>
              Practice date
              <input
                name="date"
                type="date"
                required
                defaultValue={new Date().toISOString().slice(0, 10)}
              />
            </label>
            <label>
              Total score
              <input
                name="total"
                type="number"
                min="1"
                max={exam === "SAT" ? 1600 : 36}
                required
              />
            </label>
          </div>
          {exam === "SAT" ? (
            <div className="two-col">
              <label>
                Math
                <input name="math" type="number" min="0" max="800" />
              </label>
              <label>
                Reading & writing
                <input name="rw" type="number" min="0" max="800" />
              </label>
            </div>
          ) : (
            <div className="score-fields">
              <label>
                English
                <input name="english" type="number" min="1" max="36" />
              </label>
              <label>
                Math
                <input name="math" type="number" min="1" max="36" />
              </label>
              <label>
                Reading
                <input name="reading" type="number" min="1" max="36" />
              </label>
              <label>
                Science
                <input name="science" type="number" min="1" max="36" />
              </label>
            </div>
          )}
          <label>
            Notes
            <textarea
              name="notes"
              maxLength={1200}
              placeholder="What improved? What needs more practice?"
            />
          </label>
          <button disabled={busy}>Add practice score</button>
        </form>
      </div>
      <div className="practice-history">
        <h3>Practice test history</h3>
        {examLogs.length ? (
          <div>
            {examLogs.map((log) => (
              <article key={log.id}>
                <time>
                  {new Date(
                    `${log.practice_date}T12:00:00`,
                  ).toLocaleDateString()}
                </time>
                <b>{log.total_score}</b>
                <span>
                  {exam === "SAT"
                    ? `Math ${log.math_score ?? "—"} · R&W ${log.reading_writing_score ?? "—"}`
                    : `E ${log.english_score ?? "—"} · M ${log.math_score ?? "—"} · R ${log.reading_score ?? "—"} · S ${log.science_score ?? "—"}`}
                </span>
                <p>{log.notes || "No notes"}</p>
                <button onClick={() => removeLog(log.id)}>Remove</button>
              </article>
            ))}
          </div>
        ) : (
          <p className="empty-note">No {exam} practice scores recorded yet.</p>
        )}
      </div>
      <small className="official-note">
        Future Waymark does not create or reproduce copyrighted test questions.
        Use official College Board and ACT resources for practice content and
        verify current test requirements directly with colleges.
      </small>
    </section>
  );
}

type ResumeContact = {
  name: string;
  email: string;
  phone: string;
  city: string;
};
type ResumeSections = {
  education: string;
  experience: string;
  internships: string;
  summer_programs: string;
  activities: string;
  honors: string;
  skills: string;
  certifications: string;
  languages: string;
};
type ResumeVersion = {
  id: string;
  title: string;
  template: "classic" | "modern";
  contact_info: ResumeContact;
  sections: ResumeSections;
};
const emptyResume = (email: string): ResumeVersion => ({
  id: "",
  title: "My Resume",
  template: "classic",
  contact_info: { name: "", email, phone: "", city: "" },
  sections: {
    education: "",
    experience: "",
    internships: "",
    summer_programs: "",
    activities: "",
    honors: "",
    skills: "",
    certifications: "",
    languages: "",
  },
});

function ResumeBuilder({
  userId,
  defaultEmail,
}: {
  userId: string;
  defaultEmail: string;
}) {
  const [versions, setVersions] = useState<ResumeVersion[]>([]);
  const [draft, setDraft] = useState<ResumeVersion>(emptyResume(defaultEmail));
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    supabase
      .from("resume_versions")
      .select("id,title,template,contact_info,sections")
      .eq("user_id", userId)
      .order("updated_at", { ascending: false })
      .then(({ data }) => {
        const loaded = (data ?? []) as ResumeVersion[];
        setVersions(loaded);
        if (loaded[0]) setDraft(loaded[0]);
      });
  }, [userId]);
  function contact(field: keyof ResumeContact, value: string) {
    setDraft({
      ...draft,
      contact_info: { ...draft.contact_info, [field]: value },
    });
  }
  function section(field: keyof ResumeSections, value: string) {
    setDraft({ ...draft, sections: { ...draft.sections, [field]: value } });
  }
  async function save() {
    setBusy(true);
    const payload = {
      user_id: userId,
      title: draft.title.trim() || "My Resume",
      template: draft.template,
      contact_info: draft.contact_info,
      sections: draft.sections,
      updated_at: new Date().toISOString(),
    };
    if (draft.id) {
      const { data, error } = await supabase
        .from("resume_versions")
        .update(payload)
        .eq("id", draft.id)
        .select("id,title,template,contact_info,sections")
        .single();
      setBusy(false);
      if (error) {
        setMessage(error.message);
        return;
      }
      const updated = data as ResumeVersion;
      setDraft(updated);
      setVersions(versions.map((x) => (x.id === updated.id ? updated : x)));
      setMessage("Resume saved.");
    } else {
      const { data, error } = await supabase
        .from("resume_versions")
        .insert(payload)
        .select("id,title,template,contact_info,sections")
        .single();
      setBusy(false);
      if (error) {
        setMessage(error.message);
        return;
      }
      const created = data as ResumeVersion;
      setDraft(created);
      setVersions([created, ...versions]);
      setMessage("Resume version created.");
    }
  }
  async function duplicate() {
    const { data, error } = await supabase
      .from("resume_versions")
      .insert({
        user_id: userId,
        title: `${draft.title} copy`,
        template: draft.template,
        contact_info: draft.contact_info,
        sections: draft.sections,
      })
      .select("id,title,template,contact_info,sections")
      .single();
    if (error) {
      setMessage(error.message);
      return;
    }
    const created = data as ResumeVersion;
    setVersions([created, ...versions]);
    setDraft(created);
    setMessage("Resume duplicated.");
  }
  async function remove() {
    if (!draft.id) return;
    const { error } = await supabase
      .from("resume_versions")
      .delete()
      .eq("id", draft.id);
    if (error) {
      setMessage(error.message);
      return;
    }
    const remaining = versions.filter((x) => x.id !== draft.id);
    setVersions(remaining);
    setDraft(remaining[0] ?? emptyResume(defaultEmail));
    setMessage("Resume version removed.");
  }
  const checks = [
    [
      "Contact details",
      Boolean(draft.contact_info.name && draft.contact_info.email),
    ],
    ["Education", Boolean(draft.sections.education)],
    [
      "Activities or experience",
      Boolean(draft.sections.activities || draft.sections.experience),
    ],
    ["Skills", Boolean(draft.sections.skills)],
    ["Proofread", false],
  ];
  const complete = checks.filter((x) => x[1]).length;
  const renderLines = (value: string) =>
    value
      .split("\n")
      .filter(Boolean)
      .map((line, i) => <li key={i}>{line}</li>);
  return (
    <section className="resume-builder" id="resume">
      <div className="resume-heading">
        <div>
          <span className="kicker dark">RESUME BUILDER</span>
          <h2>Turn your experience into a clear story.</h2>
          <p>
            Create versions for college, scholarships, jobs, internships, or
            apprenticeships.
          </p>
        </div>
        <div className="resume-top-actions">
          <button
            onClick={() => {
              setDraft(emptyResume(defaultEmail));
              setMessage("");
            }}
          >
            New version
          </button>
          <button onClick={duplicate} disabled={!draft.id}>
            Duplicate
          </button>
          <button
            className="primary"
            onClick={() => {
              document.body.classList.add("printing-resume");
              window.print();
              setTimeout(() => document.body.classList.remove("printing-resume"), 500);
            }}
          >
            Save as PDF
          </button>
        </div>
      </div>
      <div className="version-bar">
        <label>
          Resume version
          <select
            value={draft.id}
            onChange={(e) =>
              setDraft(
                versions.find((x) => x.id === e.target.value) ??
                  emptyResume(defaultEmail),
              )
            }
          >
            <option value="">Unsaved resume</option>
            {versions.map((v) => (
              <option key={v.id} value={v.id}>
                {v.title}
              </option>
            ))}
          </select>
        </label>
        <label>
          Version name
          <input
            value={draft.title}
            maxLength={80}
            onChange={(e) => setDraft({ ...draft, title: e.target.value })}
          />
        </label>
        <label>
          Template
          <select
            value={draft.template}
            onChange={(e) =>
              setDraft({
                ...draft,
                template: e.target.value as "classic" | "modern",
              })
            }
          >
            <option value="classic">Classic</option>
            <option value="modern">Modern</option>
          </select>
        </label>
      </div>
      {message && (
        <div className="form-message resume-message" role="status">
          {message}
        </div>
      )}
      <div className="resume-workspace">
        <div className="resume-editor">
          <fieldset>
            <legend>Contact information</legend>
            <div className="two-col">
              <label>
                Full name
                <input
                  value={draft.contact_info.name}
                  onChange={(e) => contact("name", e.target.value)}
                />
              </label>
              <label>
                Email
                <input
                  type="email"
                  value={draft.contact_info.email}
                  onChange={(e) => contact("email", e.target.value)}
                />
              </label>
              <label>
                Phone
                <input
                  value={draft.contact_info.phone}
                  onChange={(e) => contact("phone", e.target.value)}
                />
              </label>
              <label>
                City and state
                <input
                  value={draft.contact_info.city}
                  onChange={(e) => contact("city", e.target.value)}
                />
              </label>
            </div>
          </fieldset>
          <fieldset>
            <legend>Resume sections</legend>
            <label>
              Education
              <textarea
                value={draft.sections.education}
                onChange={(e) => section("education", e.target.value)}
                placeholder={
                  "School name · Graduation year\nGPA, AP courses, or dual enrollment"
                }
              />
            </label>
            <label>
              Employment and experience
              <textarea
                value={draft.sections.experience}
                onChange={(e) => section("experience", e.target.value)}
                placeholder={
                  "Role · Organization · Dates\nUse a new line for each achievement or responsibility"
                }
              />
            </label>
            <label>
              Internships completed
              <textarea
                value={draft.sections.internships ?? ""}
                onChange={(e) => section("internships", e.target.value)}
                placeholder={
                  "Internship role · Organization · Dates\nContribution, skill developed, or result"
                }
              />
            </label>
            <label>
              Summer programs completed
              <textarea
                value={draft.sections.summer_programs ?? ""}
                onChange={(e) => section("summer_programs", e.target.value)}
                placeholder={
                  "Program name · Provider · Summer/year\nCoursework, project, credential, or achievement"
                }
              />
            </label>
            <label>
              Activities, athletics, clubs, leadership, and volunteer work
              <textarea
                value={draft.sections.activities}
                onChange={(e) => section("activities", e.target.value)}
                placeholder="One achievement or responsibility per line"
              />
            </label>
            <label>
              Honors and awards
              <textarea
                value={draft.sections.honors}
                onChange={(e) => section("honors", e.target.value)}
                placeholder="One honor per line"
              />
            </label>
            <div className="two-col">
              <label>
                Skills
                <textarea
                  value={draft.sections.skills}
                  onChange={(e) => section("skills", e.target.value)}
                  placeholder="One skill per line"
                />
              </label>
              <label>
                Certifications
                <textarea
                  value={draft.sections.certifications}
                  onChange={(e) => section("certifications", e.target.value)}
                  placeholder="One certification per line"
                />
              </label>
            </div>
            <label>
              Languages
              <textarea
                value={draft.sections.languages}
                onChange={(e) => section("languages", e.target.value)}
                placeholder="Language · proficiency"
              />
            </label>
          </fieldset>
          <div className="resume-save-row">
            <button className="danger" onClick={remove} disabled={!draft.id}>
              Delete version
            </button>
            <button className="primary" onClick={save} disabled={busy}>
              {busy ? "Saving…" : "Save resume"}
            </button>
          </div>
        </div>
        <div>
          <article
            className={`resume-preview ${draft.template}`}
            id="resume-print"
          >
            <header>
              <h1>{draft.contact_info.name || "Your Name"}</h1>
              <p>
                {[
                  draft.contact_info.email,
                  draft.contact_info.phone,
                  draft.contact_info.city,
                ]
                  .filter(Boolean)
                  .join(" · ") || "email · phone · city"}
              </p>
            </header>
            {draft.sections.education && (
              <section>
                <h2>Education</h2>
                <ul>{renderLines(draft.sections.education)}</ul>
              </section>
            )}
            {draft.sections.experience && (
              <section>
                <h2>Experience</h2>
                <ul>{renderLines(draft.sections.experience)}</ul>
              </section>
            )}
            {draft.sections.internships && (
              <section>
                <h2>Internships</h2>
                <ul>{renderLines(draft.sections.internships)}</ul>
              </section>
            )}
            {draft.sections.summer_programs && (
              <section>
                <h2>Summer Programs</h2>
                <ul>{renderLines(draft.sections.summer_programs)}</ul>
              </section>
            )}
            {draft.sections.activities && (
              <section>
                <h2>Activities & Leadership</h2>
                <ul>{renderLines(draft.sections.activities)}</ul>
              </section>
            )}
            {draft.sections.honors && (
              <section>
                <h2>Honors & Awards</h2>
                <ul>{renderLines(draft.sections.honors)}</ul>
              </section>
            )}
            {draft.sections.skills && (
              <section>
                <h2>Skills</h2>
                <ul>{renderLines(draft.sections.skills)}</ul>
              </section>
            )}
            {draft.sections.certifications && (
              <section>
                <h2>Certifications</h2>
                <ul>{renderLines(draft.sections.certifications)}</ul>
              </section>
            )}
            {draft.sections.languages && (
              <section>
                <h2>Languages</h2>
                <ul>{renderLines(draft.sections.languages)}</ul>
              </section>
            )}
          </article>
          <aside className="resume-checklist">
            <b>
              Resume checklist · {complete}/{checks.length}
            </b>
            {checks.map(([label, done]) => (
              <span key={String(label)} className={done ? "done" : ""}>
                {done ? "✓" : "○"} {label}
              </span>
            ))}
          </aside>
        </div>
      </div>
    </section>
  );
}

type EssayDraft = {
  id: string;
  title: string;
  essay_type:
    | "College Essay"
    | "Scholarship Essay"
    | "Personal Statement"
    | "Supplemental Essay";
  prompt: string;
  planning_template: string;
  brainstorm: string;
  outline: string;
  content: string;
  word_limit: number | null;
  stage: string;
  checklist: Record<string, boolean>;
};
const emptyEssay = (): EssayDraft => ({
  id: "",
  title: "Untitled Essay",
  essay_type: "College Essay",
  prompt: "",
  planning_template: "Essay Outline",
  brainstorm: "",
  outline: "",
  content: "",
  word_limit: 650,
  stage: "Planning",
  checklist: {},
});
const essayChecks = [
  ["answersPrompt", "Directly answers the prompt"],
  ["authenticVoice", "Sounds like my own voice"],
  ["specificDetails", "Uses specific details and reflection"],
  ["clearStructure", "Has a clear beginning, middle, and end"],
  ["proofread", "Checked grammar and punctuation"],
  ["studentReviewed", "Reviewed every sentence myself"],
];

function EssayWritingCenter({ userId }: { userId: string }) {
  const [drafts, setDrafts] = useState<EssayDraft[]>([]);
  const [draft, setDraft] = useState<EssayDraft>(emptyEssay());
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    supabase
      .from("essay_drafts")
      .select(
        "id,title,essay_type,prompt,planning_template,brainstorm,outline,content,word_limit,stage,checklist",
      )
      .eq("user_id", userId)
      .order("updated_at", { ascending: false })
      .then(({ data }) => {
        const loaded = (data ?? []) as EssayDraft[];
        setDrafts(loaded);
        if (loaded[0]) setDraft(loaded[0]);
      });
  }, [userId]);
  const words = draft.content.trim()
    ? draft.content.trim().split(/\s+/).length
    : 0;
  const completed = essayChecks.filter(([key]) => draft.checklist[key]).length;
  const prompts: Record<string, string[]> = {
    "Essay Outline": [
      "What central idea should the reader remember?",
      "What moment opens the story?",
      "What reflection or growth closes it?",
    ],
    "Brainstorm Worksheet": [
      "Which experiences changed how you think?",
      "What do you care about when no one is watching?",
      "What would a close friend say is distinctly you?",
    ],
    "Story Map": [
      "Where does the story begin?",
      "What tension or choice changed the direction?",
      "What did you understand afterward?",
    ],
    "Personal Timeline": [
      "List five moments that shaped you.",
      "Which moment reveals growth rather than just achievement?",
      "What connects the past to your next step?",
    ],
    "Topic Organizer": [
      "What does the prompt truly ask?",
      "What evidence from your life supports the answer?",
      "Which details are essential and which distract?",
    ],
  };
  function update(patch: Partial<EssayDraft>) {
    setDraft({ ...draft, ...patch });
  }
  async function save() {
    setBusy(true);
    const payload = {
      user_id: userId,
      title: draft.title.trim() || "Untitled Essay",
      essay_type: draft.essay_type,
      prompt: draft.prompt,
      planning_template: draft.planning_template,
      brainstorm: draft.brainstorm,
      outline: draft.outline,
      content: draft.content,
      word_limit: draft.word_limit,
      stage: draft.stage,
      checklist: draft.checklist,
      updated_at: new Date().toISOString(),
    };
    if (draft.id) {
      const { data, error } = await supabase
        .from("essay_drafts")
        .update(payload)
        .eq("id", draft.id)
        .select()
        .single();
      setBusy(false);
      if (error) {
        setMessage(error.message);
        return;
      }
      const saved = data as EssayDraft;
      setDraft(saved);
      setDrafts(drafts.map((x) => (x.id === saved.id ? saved : x)));
      setMessage("Essay saved privately.");
    } else {
      const { data, error } = await supabase
        .from("essay_drafts")
        .insert(payload)
        .select()
        .single();
      setBusy(false);
      if (error) {
        setMessage(error.message);
        return;
      }
      const created = data as EssayDraft;
      setDraft(created);
      setDrafts([created, ...drafts]);
      setMessage("New essay workspace created.");
    }
  }
  async function duplicate() {
    const { data, error } = await supabase
      .from("essay_drafts")
      .insert({
        user_id: userId,
        ...draft,
        id: undefined,
        title: `${draft.title} copy`,
      })
      .select()
      .single();
    if (error) {
      setMessage(error.message);
      return;
    }
    const created = data as EssayDraft;
    setDraft(created);
    setDrafts([created, ...drafts]);
    setMessage("Essay duplicated.");
  }
  async function remove() {
    if (!draft.id) return;
    const { error } = await supabase
      .from("essay_drafts")
      .delete()
      .eq("id", draft.id);
    if (error) {
      setMessage(error.message);
      return;
    }
    const remaining = drafts.filter((x) => x.id !== draft.id);
    setDrafts(remaining);
    setDraft(remaining[0] ?? emptyEssay());
    setMessage("Essay removed.");
  }
  return (
    <section className="essay-center" id="essays">
      <div className="essay-heading">
        <div>
          <span className="kicker dark">ESSAY WRITING CENTER</span>
          <h2>Plan, draft, and revise in your own voice.</h2>
          <p>
            Your writing remains private to your account. Templates organize
            ideas—they do not supply essays to copy.
          </p>
        </div>
        <div className="essay-actions">
          <button
            onClick={() => {
              setDraft(emptyEssay());
              setMessage("");
            }}
          >
            New essay
          </button>
          <button onClick={duplicate} disabled={!draft.id}>
            Duplicate
          </button>
          <button className="primary" onClick={save} disabled={busy}>
            {busy ? "Saving…" : "Save essay"}
          </button>
        </div>
      </div>
      <div className="essay-toolbar">
        <label>
          Essay
          <select
            value={draft.id}
            onChange={(e) =>
              setDraft(
                drafts.find((x) => x.id === e.target.value) ?? emptyEssay(),
              )
            }
          >
            <option value="">Unsaved essay</option>
            {drafts.map((x) => (
              <option key={x.id} value={x.id}>
                {x.title}
              </option>
            ))}
          </select>
        </label>
        <label>
          Title
          <input
            value={draft.title}
            maxLength={120}
            onChange={(e) => update({ title: e.target.value })}
          />
        </label>
        <label>
          Type
          <select
            value={draft.essay_type}
            onChange={(e) =>
              update({ essay_type: e.target.value as EssayDraft["essay_type"] })
            }
          >
            <option>College Essay</option>
            <option>Scholarship Essay</option>
            <option>Personal Statement</option>
            <option>Supplemental Essay</option>
          </select>
        </label>
        <label>
          Stage
          <select
            value={draft.stage}
            onChange={(e) => update({ stage: e.target.value })}
          >
            <option>Planning</option>
            <option>Drafting</option>
            <option>Revising</option>
            <option>Proofreading</option>
            <option>Complete</option>
          </select>
        </label>
      </div>
      {message && (
        <div className="form-message essay-message" role="status">
          {message}
        </div>
      )}
      <div className="essay-workspace">
        <div className="essay-planner">
          <label>
            Application prompt
            <textarea
              value={draft.prompt}
              onChange={(e) => update({ prompt: e.target.value })}
              placeholder="Paste or summarize the official prompt here."
            />
          </label>
          <label>
            Planning template
            <select
              value={draft.planning_template}
              onChange={(e) => update({ planning_template: e.target.value })}
            >
              <option>Essay Outline</option>
              <option>Brainstorm Worksheet</option>
              <option>Story Map</option>
              <option>Personal Timeline</option>
              <option>Topic Organizer</option>
            </select>
          </label>
          <div className="planning-questions">
            <b>{draft.planning_template}</b>
            {(prompts[draft.planning_template] ?? []).map((q) => (
              <p key={q}>{q}</p>
            ))}
          </div>
          <label>
            Brainstorm notes
            <textarea
              value={draft.brainstorm}
              onChange={(e) => update({ brainstorm: e.target.value })}
              placeholder="Capture moments, details, questions, and possibilities."
            />
          </label>
          <label>
            Outline
            <textarea
              value={draft.outline}
              onChange={(e) => update({ outline: e.target.value })}
              placeholder={
                "Opening moment\nKey development\nReflection and conclusion"
              }
            />
          </label>
        </div>
        <div className="essay-drafting">
          <div className="draft-meta">
            <label>
              Word limit
              <input
                type="number"
                min="1"
                max="5000"
                value={draft.word_limit ?? ""}
                onChange={(e) =>
                  update({
                    word_limit: e.target.value ? Number(e.target.value) : null,
                  })
                }
              />
            </label>
            <span
              className={
                draft.word_limit && words > draft.word_limit ? "over" : ""
              }
            >
              {words}
              {draft.word_limit ? ` / ${draft.word_limit}` : ""} words
            </span>
          </div>
          <label>
            My draft
            <textarea
              className="draft-area"
              value={draft.content}
              onChange={(e) => update({ content: e.target.value })}
              placeholder="Write your draft here. Focus first on meaning and authenticity; revise for clarity later."
            />
          </label>
          <div className="authenticity-note">
            <b>Your experience. Your thinking. Your voice.</b>
            <p>
              Do not submit writing you have not carefully reviewed and made
              your own. Verify that every sentence accurately reflects your
              experiences.
            </p>
          </div>
        </div>
      </div>
      <div className="revision-checklist">
        <div>
          <b>
            Revision checklist · {completed}/{essayChecks.length}
          </b>
          <span>{draft.stage}</span>
        </div>
        {essayChecks.map(([key, label]) => (
          <label key={key} className={draft.checklist[key] ? "done" : ""}>
            <input
              type="checkbox"
              checked={Boolean(draft.checklist[key])}
              onChange={(e) =>
                update({
                  checklist: { ...draft.checklist, [key]: e.target.checked },
                })
              }
            />
            {label}
          </label>
        ))}
        <button className="danger" onClick={remove} disabled={!draft.id}>
          Delete essay
        </button>
      </div>
    </section>
  );
}

function AccountSettings({ session }: { session: Session }) {
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  async function changePassword(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setMessage("");
    const fd = new FormData(e.currentTarget);
    const current = String(fd.get("current"));
    const next = String(fd.get("next"));
    const confirm = String(fd.get("confirm"));
    if (next !== confirm) {
      setMessage("The new passwords do not match.");
      setBusy(false);
      return;
    }
    const { error } = await supabase.auth.updateUser({
      password: next,
      current_password: current,
    });
    setBusy(false);
    setMessage(error ? error.message : "Password updated successfully.");
    if (!error) e.currentTarget.reset();
  }
  return (
    <>
      <TestPrepCenter userId={session.user.id} />
      <ResumeBuilder
        userId={session.user.id}
        defaultEmail={session.user.email ?? ""}
      />
      <EssayWritingCenter userId={session.user.id} />
      <InterviewPreparationCenter userId={session.user.id} />
      <ApplicationTracker userId={session.user.id} />
      <RecommendationCenter userId={session.user.id} />
      <FinancialAidCenter userId={session.user.id} />
      <CollegeDecisionWorkspace userId={session.user.id} />
      <CollegeVisitCenter userId={session.user.id} />
      <StudyCenter userId={session.user.id} />
      <section className="account-settings" id="account">
        <div>
          <span className="kicker dark">ACCOUNT SETTINGS</span>
          <h2>Sign-in and security</h2>
          <p>
            <b>Account email</b>
            <br />
            {session.user.email}
          </p>
        </div>
        <form onSubmit={changePassword}>
          <label>
            Current password
            <input
              name="current"
              type="password"
              required
              autoComplete="current-password"
            />
          </label>
          <label>
            New password
            <input
              name="next"
              type="password"
              minLength={8}
              required
              autoComplete="new-password"
            />
          </label>
          <label>
            Confirm new password
            <input
              name="confirm"
              type="password"
              minLength={8}
              required
              autoComplete="new-password"
            />
          </label>
          {message && (
            <div className="form-message" role="status">
              {message}
            </div>
          )}
          <button disabled={busy}>
            {busy ? "Updating…" : "Change password"}
          </button>
        </form>
      </section>
    </>
  );
}

function Onboarding({
  profile,
  onSaved,
}: {
  profile: Profile;
  onSaved: (p: Profile) => void;
}) {
  const normalized = {
    ...profile,
    pathways: profile.pathways?.length
      ? profile.pathways
      : [profile.pathway || "Still exploring"],
  };
  const [draft, setDraft] = useState<Profile>(normalized);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  function toggleInterest(value: string) {
    setDraft((p) => ({
      ...p,
      interests: p.interests.includes(value)
        ? p.interests.filter((x) => x !== value)
        : [...p.interests, value],
    }));
  }
  function setPathChecked(value: string, checked: boolean) {
    setDraft((p) => {
      let selected = p.pathways.filter((x) => x !== "Still exploring");
      if (value === "Still exploring")
        selected = checked ? ["Still exploring"] : [];
      else if (checked) selected = [...new Set([...selected, value])];
      else selected = selected.filter((x) => x !== value);
      const safe = selected.length ? selected : ["Still exploring"];
      return { ...p, pathways: safe, pathway: safe[0] };
    });
  }
  async function save(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    const selected = draft.pathways.length
      ? draft.pathways
      : ["Still exploring"];
    const goals = [
      ...new Set(
        selected.flatMap(
          (path) => pathTemplates[path] ?? pathTemplates["Still exploring"],
        ),
      ),
    ];
    const payload = {
      ...draft,
      pathway: selected[0],
      pathways: selected,
      onboarding_complete: true,
      updated_at: new Date().toISOString(),
    };
    const { error: profileError } = await supabase
      .from("student_profiles")
      .upsert(payload);
    if (profileError) {
      setError(profileError.message);
      setSaving(false);
      return;
    }
    const { count } = await supabase
      .from("student_steps")
      .select("id", { count: "exact", head: true })
      .eq("user_id", draft.id);
    if (!count) {
      const { error: stepsError } = await supabase
        .from("student_steps")
        .insert(
          goals.map((title, i) => ({
            user_id: draft.id,
            title,
            category: inferCategory(title),
            position: i + 1,
          })),
        );
      if (stepsError) {
        setError(stepsError.message);
        setSaving(false);
        return;
      }
    }
    setSaving(false);
    onSaved(payload as Profile);
  }
  return (
    <main className="onboarding">
      <div className="onboarding-intro">
        <span className="kicker">BUILD YOUR WAYMARK</span>
        <h1>
          Your future is personal.
          <br />
          <em>Your plan should be too.</em>
        </h1>
        <p>
          Tell us where you are and what you’re considering. You can change
          every answer later.
        </p>
      </div>
      <form className="onboarding-card" onSubmit={save}>
        <div className="step-label">STEP 1 OF 1 · ABOUT YOU</div>
        <div className="two-col">
          <label>
            First name
            <input
              required
              value={draft.first_name}
              onChange={(e) =>
                setDraft({ ...draft, first_name: e.target.value })
              }
            />
          </label>
          <label>
            Last name
            <input
              value={draft.last_name}
              onChange={(e) =>
                setDraft({ ...draft, last_name: e.target.value })
              }
            />
          </label>
        </div>
        <div className="two-col">
          <label>
            Current grade
            <select
              value={draft.grade_level}
              onChange={(e) =>
                setDraft({ ...draft, grade_level: e.target.value })
              }
            >
              <option>9</option>
              <option>10</option>
              <option>11</option>
              <option>12</option>
              <option>Graduated</option>
            </select>
          </label>
          <label>
            Graduation year
            <input
              type="number"
              min="2024"
              max="2035"
              value={draft.graduation_year}
              onChange={(e) =>
                setDraft({ ...draft, graduation_year: Number(e.target.value) })
              }
            />
          </label>
        </div>
        <fieldset>
          <legend>
            Paths I’m considering <span>(select all that apply)</span>
          </legend>
          <div className="choice-grid path-choices">
            {pathways.map((x) => (
              <label
                className={draft.pathways.includes(x) ? "selected" : ""}
                key={x}
              >
                <input
                  type="checkbox"
                  checked={draft.pathways.includes(x)}
                  onChange={(e) => setPathChecked(x, e.target.checked)}
                />
                {x}
              </label>
            ))}
          </div>
          <p className="selected-path-summary" aria-live="polite">
            <b>Selected:</b> {draft.pathways.join(" · ")}
          </p>
        </fieldset>
        <fieldset>
          <legend>What would you like help with?</legend>
          <div className="choice-grid">
            {interestOptions.map((x) => (
              <label
                className={draft.interests.includes(x) ? "selected" : ""}
                key={x}
              >
                <input
                  type="checkbox"
                  checked={draft.interests.includes(x)}
                  onChange={() => toggleInterest(x)}
                />
                {x}
              </label>
            ))}
          </div>
        </fieldset>
        <SchoolPicker
          value={draft.target_schools}
          onChange={(target_schools) => setDraft({ ...draft, target_schools })}
        />
        {error && <div className="form-message">{error}</div>}
        <button className="primary" disabled={saving}>
          {saving ? "Building your path…" : "Create my path →"}
        </button>
      </form>
    </main>
  );
}

function MilestoneEditor({
  step,
  onSave,
  onDelete,
  onClose,
}: {
  step: Step;
  onSave: (step: Step) => void;
  onDelete: (id: string) => void;
  onClose: () => void;
}) {
  const [draft, setDraft] = useState(step);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  async function save(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    const { data, error } = await supabase
      .from("student_steps")
      .update({
        title: draft.title.trim(),
        category: draft.category || "Path Planning",
        due_date: draft.due_date || null,
        reminder_date: draft.reminder_date || null,
        notes: draft.notes,
        updated_at: new Date().toISOString(),
      })
      .eq("id", draft.id)
      .select(
        "id,title,due_date,reminder_date,notes,category,completed,position",
      )
      .single();
    setBusy(false);
    if (error) {
      setMessage(error.message);
      return;
    }
    onSave(data as Step);
    onClose();
  }
  return (
    <div className="modal-backdrop" role="presentation">
      <form
        className="milestone-editor"
        role="dialog"
        aria-modal="true"
        aria-labelledby="milestone-title"
        onSubmit={save}
      >
        <button
          type="button"
          className="close"
          onClick={onClose}
          aria-label="Close"
        >
          ×
        </button>
        <span className="kicker dark">MILESTONE DETAILS</span>
        <h2 id="milestone-title">Plan this step</h2>
        <label>
          Milestone
          <input
            required
            maxLength={180}
            value={draft.title}
            onChange={(e) => setDraft({ ...draft, title: e.target.value })}
          />
        </label>
        <label>
          Category
          <select
            value={
              milestoneCategories.some(([name]) => name === draft.category)
                ? draft.category
                : "Path Planning"
            }
            onChange={(e) => setDraft({ ...draft, category: e.target.value })}
          >
            {milestoneCategories.map(([name]) => (
              <option key={name}>{name}</option>
            ))}
          </select>
        </label>
        <div className="two-col">
          <label>
            Due date
            <input
              type="date"
              value={draft.due_date ?? ""}
              onChange={(e) =>
                setDraft({ ...draft, due_date: e.target.value || null })
              }
            />
          </label>
          <label>
            Remind me on
            <input
              type="date"
              value={draft.reminder_date ?? ""}
              onChange={(e) =>
                setDraft({ ...draft, reminder_date: e.target.value || null })
              }
            />
          </label>
        </div>
        <label>
          Notes
          <textarea
            maxLength={1200}
            value={draft.notes ?? ""}
            onChange={(e) => setDraft({ ...draft, notes: e.target.value })}
            placeholder="Questions, requirements, or next actions"
          />
        </label>
        {message && <div className="form-message">{message}</div>}
        <div className="editor-actions">
          <button
            type="button"
            className="danger"
            onClick={() => onDelete(step.id)}
          >
            Remove milestone
          </button>
          <button className="primary" disabled={busy}>
            {busy ? "Saving…" : "Save details"}
          </button>
        </div>
      </form>
    </div>
  );
}

function StudentDashboard({
  session,
  profile,
  onProfile,
}: {
  session: Session;
  profile: Profile;
  onProfile: (p: Profile) => void;
}) {
  const [steps, setSteps] = useState<Step[]>([]);
  const [newStep, setNewStep] = useState("");
  const [newDue, setNewDue] = useState("");
  const [newCategory, setNewCategory] = useState("Path Planning");
  const [editing, setEditing] = useState<Step | null>(null);
  const [message, setMessage] = useState("");
  useEffect(() => {
    supabase
      .from("student_steps")
      .select(
        "id,title,due_date,reminder_date,notes,category,completed,position",
      )
      .eq("user_id", session.user.id)
      .order("position")
      .then(({ data }) => setSteps((data ?? []) as Step[]));
  }, [session.user.id]);
  useEffect(() => {
    const remember = () => {
      if (window.location.hash)
        localStorage.setItem("future-waymark-last-section", window.location.hash);
    };
    window.addEventListener("hashchange", remember);
    const last = localStorage.getItem("future-waymark-last-section");
    if (!window.location.hash && last)
      requestAnimationFrame(() => document.querySelector(last)?.scrollIntoView());
    return () => window.removeEventListener("hashchange", remember);
  }, []);
  async function toggle(step: Step) {
    const completed = !step.completed;
    const { error } = await supabase
      .from("student_steps")
      .update({ completed, updated_at: new Date().toISOString() })
      .eq("id", step.id);
    if (!error)
      setSteps((s) =>
        s.map((x) => (x.id === step.id ? { ...x, completed } : x)),
      );
  }
  async function addStep(e: FormEvent) {
    e.preventDefault();
    if (!newStep.trim()) return;
    const { data, error } = await supabase
      .from("student_steps")
      .insert({
        user_id: session.user.id,
        title: newStep.trim(),
        category: newCategory,
        due_date: newDue || null,
        position: steps.length + 1,
      })
      .select(
        "id,title,due_date,reminder_date,notes,category,completed,position",
      )
      .single();
    if (error) {
      setMessage(error.message);
      return;
    }
    setSteps([...steps, data as Step]);
    setNewStep("");
    setNewDue("");
    setMessage("Milestone added to your path.");
  }
  async function removeStep(id: string) {
    const { error } = await supabase
      .from("student_steps")
      .delete()
      .eq("id", id);
    if (error) {
      setMessage(error.message);
      return;
    }
    setSteps(steps.filter((x) => x.id !== id));
    setEditing(null);
    setMessage("Milestone removed.");
  }
  const complete = steps.filter((x) => x.completed).length;
  const progress = steps.length
    ? Math.round((complete / steps.length) * 100)
    : 0;
  const today = new Date().toISOString().slice(0, 10);
  const upcoming = steps
    .filter((x) => !x.completed && x.due_date)
    .sort((a, b) => (a.due_date ?? "").localeCompare(b.due_date ?? ""))
    .slice(0, 4);
  const reminders = steps.filter(
    (x) => !x.completed && x.reminder_date && x.reminder_date <= today,
  );
  return (
    <main className="student-app">
      <DraftSafety />
      <aside className="app-sidebar">
        <a className="brand" href="#">
          <span className="brand-mark">F</span>
          <span>
            Future
            <br />
            <b>Waymark</b>
          </span>
        </a>
        <nav className="grouped-nav">
          <a className="active" href="#today">Today</a>
          <details open>
            <summary>Planning</summary>
            <a href="#getting-started">Getting started</a>
            <a href="#path">My path</a>
            <a href="#deadlines">All deadlines</a>
            <a href="#planning-assistant">Calendar and documents</a>
            <a href="#school-research">Schools and comparisons</a>
            <a href="#school-workspaces">School workspaces</a>
            <a href="#advisor-brief">Advisor meeting brief</a>
          </details>
          <details open>
            <summary>Applications</summary>
            <a href="#applications">Applications and scholarships</a>
            <a href="#recommendations">Recommendations</a>
            <a href="#financial-aid">Financial aid</a>
            <a href="#college-decisions">College decisions</a>
            <a href="#college-visits">College visits</a>
          </details>
          <details>
            <summary>Preparation</summary>
            <a href="#testing">SAT and ACT</a>
            <a href="#essays">Essay center</a>
            <a href="#resume">Resume builder</a>
            <a href="#interviews">Interview preparation</a>
            <a href="#study-skills">Study skills</a>
          </details>
          <details>
            <summary>Library and account</summary>
            <a href="#resources">Resources</a>
            <a href="#profile">My information</a>
            <a href="#account">Account settings</a>
            <a href="#privacy">Privacy and my data</a>
          </details>
        </nav>
        <div className="sidebar-note">
          <b>Official guidance matters</b>
          <p>
            Confirm deadlines and requirements with the appropriate
            organization.
          </p>
        </div>
      </aside>
      <section className="app-main" id="dashboard">
        <header className="app-top">
          <div>
            <span className="kicker dark">MY WAYMARK</span>
            <h1>Hi, {profile.first_name || "student"}.</h1>
          </div>
          <button
            className="avatar-menu"
            onClick={() => supabase.auth.signOut()}
          >
            <span>
              {(
                profile.first_name?.[0] ||
                session.user.email?.[0] ||
                "S"
              ).toUpperCase()}
            </span>{" "}
            Sign out
          </button>
        </header>
        <StudentCommandCenter userId={session.user.id} steps={steps} />
        <StudentNotifications userId={session.user.id} steps={steps} />
        <GuidedProgress
          userId={session.user.id}
          hasProfile={Boolean(profile.first_name && profile.graduation_year)}
          schoolCount={profile.target_schools.length}
        />
        <AdvisorBrief
          userId={session.user.id}
          studentName={[profile.first_name, profile.last_name].filter(Boolean).join(" ")}
          graduationYear={profile.graduation_year}
          pathways={profile.pathways}
          schools={profile.target_schools}
          steps={steps}
        />
        <PlanningAssistant userId={session.user.id} />
        {reminders.length > 0 && (
          <div className="reminder-banner">
            <b>
              {reminders.length} reminder{reminders.length === 1 ? "" : "s"}{" "}
              ready
            </b>
            <span>{reminders.map((x) => x.title).join(" · ")}</span>
          </div>
        )}
        <div className="dashboard-grid">
          <article className="path-summary">
            <div>
              <span className="kicker">YOUR CURRENT DIRECTION</span>
              <h2>
                {(profile.pathways?.length
                  ? profile.pathways
                  : [profile.pathway]
                ).join(" · ")}
              </h2>
              <p>
                Graduation {profile.graduation_year} · Grade{" "}
                {profile.grade_level}
              </p>
            </div>
            <div
              className="progress-ring"
              style={
                { "--progress": `${progress * 3.6}deg` } as React.CSSProperties
              }
            >
              <b>{progress}%</b>
              <small>complete</small>
            </div>
          </article>
          <article className="next-action">
            <span className="kicker dark">NEXT BEST STEP</span>
            <h3>
              {steps.find((x) => !x.completed)?.title ||
                "Your current path is complete"}
            </h3>
            <p>Small, consistent actions create momentum.</p>
          </article>
        </div>
        <section className="path-board" id="path">
          <div className="section-title">
            <div>
              <span className="kicker dark">CUSTOMIZABLE PLAN</span>
              <h2>Your path forward</h2>
            </div>
            <button
              onClick={() =>
                onProfile({ ...profile, onboarding_complete: false })
              }
            >
              Edit my information
            </button>
          </div>
          {message && (
            <div className="form-message path-message" role="status">
              {message}
            </div>
          )}
          <div className="steps-list">
            {steps.map((step, i) => (
              <article
                key={step.id}
                className={step.completed ? "step complete" : "step"}
              >
                <button
                  className="step-check"
                  onClick={() => toggle(step)}
                  aria-label={
                    step.completed
                      ? `Mark ${step.title} incomplete`
                      : `Mark ${step.title} complete`
                  }
                >
                  {step.completed ? "✓" : String(i + 1).padStart(2, "0")}
                </button>
                <a className="step-copy" href={categoryHref(step.category)}>
                  <b>{step.title}</b>
                  <small>
                    {step.category}
                    {step.due_date ? ` · Due ${step.due_date}` : ""}
                    {step.reminder_date
                      ? ` · Reminder ${step.reminder_date}`
                      : ""}
                  </small>
                  {step.notes && <em>{step.notes}</em>}
                </a>
                <a className="step-open" href={categoryHref(step.category)}>
                  Open section →
                </a>
                <button className="step-edit" onClick={() => setEditing(step)}>
                  Edit
                </button>
              </article>
            ))}
          </div>
          <form className="add-step expanded" onSubmit={addStep}>
            <input
              value={newStep}
              onChange={(e) => setNewStep(e.target.value)}
              placeholder="Add your own goal or milestone"
              aria-label="New milestone"
            />
            <select
              value={newCategory}
              onChange={(e) => setNewCategory(e.target.value)}
              aria-label="Milestone category"
            >
              {milestoneCategories.map(([name]) => (
                <option key={name}>{name}</option>
              ))}
            </select>
            <input
              type="date"
              value={newDue}
              onChange={(e) => setNewDue(e.target.value)}
              aria-label="Due date"
            />
            <button>Add to my path</button>
          </form>
        </section>
        <section className="deadline-board" id="deadlines">
          <div>
            <span className="kicker dark">UPCOMING DEADLINES</span>
            <h2>What’s coming up</h2>
          </div>
          {upcoming.length ? (
            <div className="deadline-list">
              {upcoming.map((step) => (
                <button key={step.id} onClick={() => setEditing(step)}>
                  <time>
                    {new Date(`${step.due_date}T12:00:00`).toLocaleDateString(
                      undefined,
                      { month: "short", day: "numeric" },
                    )}
                  </time>
                  <span>
                    <b>{step.title}</b>
                    <small>{step.category}</small>
                  </span>
                  <i>Edit</i>
                </button>
              ))}
            </div>
          ) : (
            <p className="empty-note">
              Add due dates to milestones and they’ll appear here.
            </p>
          )}
        </section>
      <section className="profile-snapshot" id="profile">
          <span className="kicker dark">YOUR INFORMATION</span>
          <h2>What this plan is built around</h2>
          <div>
            <p>
              <b>Interests</b>
              {profile.interests.join(" · ") || "Not selected yet"}
            </p>
            <p>
              <b>Schools, programs, or careers</b>
              {profile.target_schools.join(" · ") ||
                "Add these whenever you’re ready"}
            </p>
          </div>
      </section>
      <SchoolResearchCenter
        userId={session.user.id}
        initialSchools={profile.target_schools}
        initialGoals={profile.goals}
        onProfile={(target_schools, goals) => onProfile({ ...profile, target_schools, goals })}
      />
      <StudentProductivityTools
        userId={session.user.id}
        schools={profile.target_schools}
        email={session.user.email ?? ""}
      />
      <AccountSettings session={session} />
        <ResourceLibrary userId={session.user.id} />
      </section>
      {editing && (
        <MilestoneEditor
          step={editing}
          onSave={(updated) =>
            setSteps(steps.map((x) => (x.id === updated.id ? updated : x)))
          }
          onDelete={removeStep}
          onClose={() => setEditing(null)}
        />
      )}
    </main>
  );
}

type ResourceActivity = {
  resource_id: number;
  progress: number;
  completed: boolean;
  last_viewed_at: string;
};
type ResourceCollection = { id: string; name: string };

function ResourceLibrary({ userId }: { userId?: string }) {
  const [resources, setResources] = useState(fallbackResources);
  const [query, setQuery] = useState("");
  const [saved, setSaved] = useState<number[]>([]);
  const [activity, setActivity] = useState<Record<number, ResourceActivity>>(
    {},
  );
  const [collections, setCollections] = useState<ResourceCollection[]>([]);
  const [collectionItems, setCollectionItems] = useState<
    Record<string, number[]>
  >({});
  const [activeCollection, setActiveCollection] = useState("");
  const [newCollection, setNewCollection] = useState("");
  const [openResource, setOpenResource] = useState<Resource | null>(null);
  const [draftProgress, setDraftProgress] = useState(0);
  const [message, setMessage] = useState("");
  useEffect(() => {
    supabase
      .from("resources")
      .select(
        "id,type,title,category,description,duration,skill_level,icon,accent",
      )
      .order("id")
      .then(({ data }) => {
        if (data?.length)
          setResources(
            data.map((r) => ({
              id: Number(r.id),
              type: r.type,
              title: r.title,
              category: r.category,
              detail: r.description,
              time: r.duration,
              level: r.skill_level,
              icon: r.icon,
              accent: r.accent,
            })),
          );
      });
    if (!userId) return;
    Promise.all([
      supabase.from("saved_resources").select("resource_id"),
      supabase
        .from("resource_activity")
        .select("resource_id,progress,completed,last_viewed_at")
        .order("last_viewed_at", { ascending: false }),
      supabase
        .from("resource_collections")
        .select("id,name")
        .order("created_at"),
      supabase.from("collection_resources").select("collection_id,resource_id"),
    ]).then(([savedResult, activityResult, collectionResult, itemResult]) => {
      setSaved((savedResult.data ?? []).map((x) => Number(x.resource_id)));
      setActivity(
        Object.fromEntries(
          ((activityResult.data ?? []) as ResourceActivity[]).map((x) => [
            Number(x.resource_id),
            { ...x, resource_id: Number(x.resource_id) },
          ]),
        ),
      );
      const nextCollections = (collectionResult.data ??
        []) as ResourceCollection[];
      setCollections(nextCollections);
      if (nextCollections[0]) setActiveCollection(nextCollections[0].id);
      const grouped: Record<string, number[]> = {};
      for (const item of itemResult.data ?? []) {
        (grouped[item.collection_id] ??= []).push(Number(item.resource_id));
      }
      setCollectionItems(grouped);
    });
  }, [userId]);
  const filtered = useMemo(
    () =>
      resources.filter((r) =>
        `${r.title} ${r.category} ${r.detail} ${r.type} ${r.level}`
          .toLowerCase()
          .includes(query.toLowerCase()),
      ),
    [resources, query],
  );
  const recent = useMemo(
    () =>
      Object.values(activity)
        .sort((a, b) => b.last_viewed_at.localeCompare(a.last_viewed_at))
        .slice(0, 3)
        .map((a) => resources.find((r) => r.id === a.resource_id))
        .filter(Boolean) as Resource[],
    [activity, resources],
  );
  async function toggle(id: number) {
    if (!userId) {
      setMessage("Create a free account to save resources.");
      return;
    }
    if (saved.includes(id)) {
      const { error } = await supabase
        .from("saved_resources")
        .delete()
        .eq("resource_id", id);
      if (!error) setSaved(saved.filter((x) => x !== id));
    } else {
      const { error } = await supabase
        .from("saved_resources")
        .insert({ user_id: userId, resource_id: id });
      if (!error) setSaved([...saved, id]);
    }
  }
  async function view(resource: Resource) {
    setOpenResource(resource);
    const current = activity[resource.id];
    setDraftProgress(current?.progress ?? 0);
    if (!userId) return;
    const row = {
      user_id: userId,
      resource_id: resource.id,
      progress: Math.max(current?.progress ?? 0, 5),
      completed: current?.completed ?? false,
      last_viewed_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    const { error } = await supabase.from("resource_activity").upsert(row);
    if (!error) setActivity({ ...activity, [resource.id]: row });
  }
  async function saveProgress(completed = false) {
    if (!userId || !openResource) return;
    const progress = completed ? 100 : draftProgress;
    const row = {
      user_id: userId,
      resource_id: openResource.id,
      progress,
      completed: completed || progress === 100,
      last_viewed_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    const { error } = await supabase.from("resource_activity").upsert(row);
    if (error) {
      setMessage(error.message);
      return;
    }
    setActivity({ ...activity, [openResource.id]: row });
    setDraftProgress(progress);
    setMessage(
      completed ? "Resource marked complete." : "Reading progress saved.",
    );
  }
  async function createCollection(e: FormEvent) {
    e.preventDefault();
    if (!userId || !newCollection.trim()) return;
    const { data, error } = await supabase
      .from("resource_collections")
      .insert({ user_id: userId, name: newCollection.trim() })
      .select("id,name")
      .single();
    if (error) {
      setMessage(error.message);
      return;
    }
    const next = data as ResourceCollection;
    setCollections([...collections, next]);
    setActiveCollection(next.id);
    setNewCollection("");
    setMessage(`Created “${next.name}.”`);
  }
  async function addToCollection(resourceId: number) {
    if (!userId || !activeCollection) {
      setMessage("Create or choose a collection first.");
      return;
    }
    if ((collectionItems[activeCollection] ?? []).includes(resourceId)) {
      setMessage("That resource is already in this collection.");
      return;
    }
    const { error } = await supabase
      .from("collection_resources")
      .insert({
        collection_id: activeCollection,
        user_id: userId,
        resource_id: resourceId,
      });
    if (error) {
      setMessage(error.message);
      return;
    }
    setCollectionItems({
      ...collectionItems,
      [activeCollection]: [
        ...(collectionItems[activeCollection] ?? []),
        resourceId,
      ],
    });
    setMessage("Added to your collection.");
  }
  return (
    <section className="resource-section" id="resources">
      <div className="section-title">
        <div>
          <span className="kicker dark">RESOURCE LIBRARY</span>
          <h2>Guidance for your next step</h2>
        </div>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search title, topic, type, or level"
          aria-label="Search resources"
        />
      </div>
      {userId && (
        <div className="resource-tools">
          {recent.length > 0 && (
            <div>
              <span className="kicker dark">RECENTLY VIEWED</span>
              <div className="recent-list">
                {recent.map((r) => (
                  <button key={r.id} onClick={() => view(r)}>
                    <b>{r.title}</b>
                    <small>{activity[r.id]?.progress ?? 0}% complete</small>
                  </button>
                ))}
              </div>
            </div>
          )}
          <div>
            <span className="kicker dark">MY COLLECTIONS</span>
            <form onSubmit={createCollection}>
              <input
                value={newCollection}
                onChange={(e) => setNewCollection(e.target.value)}
                placeholder="New collection name"
                aria-label="New collection name"
              />
              <button>Create</button>
            </form>
            {collections.length > 0 && (
              <select
                value={activeCollection}
                onChange={(e) => setActiveCollection(e.target.value)}
                aria-label="Active collection"
              >
                {collections.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({collectionItems[c.id]?.length ?? 0})
                  </option>
                ))}
              </select>
            )}
          </div>
        </div>
      )}
      {message && (
        <div className="form-message resource-message" role="status">
          {message}
        </div>
      )}
      <div className="resource-grid">
        {filtered.map((r) => (
          <article className="resource-card" key={r.id}>
            <button
              className="resource-open"
              onClick={() => view(r)}
              aria-label={`Open ${r.title}`}
            >
              <div className={`resource-art ${r.accent}`}>
                <span>{r.icon}</span>
                <small>{r.type}</small>
              </div>
              <div className="resource-body">
                <small>{r.category}</small>
                <h3>{r.title}</h3>
                <p>{r.detail}</p>
                <div>
                  {r.time} · {r.level}
                  {activity[r.id] &&
                    ` · ${activity[r.id].completed ? "Complete" : `${activity[r.id].progress}% read`}`}
                </div>
              </div>
            </button>
            <div className="card-actions">
              <button
                className={saved.includes(r.id) ? "save saved" : "save"}
                onClick={() => toggle(r.id)}
                aria-label={`Save ${r.title}`}
              >
                {saved.includes(r.id) ? "♥" : "♡"}
              </button>
              {userId && collections.length > 0 && (
                <button
                  className="collect"
                  onClick={() => addToCollection(r.id)}
                  aria-label={`Add ${r.title} to collection`}
                >
                  +
                </button>
              )}
            </div>
          </article>
        ))}
      </div>
      {openResource && (
        <div className="modal-backdrop" role="presentation">
          <section
            className="resource-reader"
            role="dialog"
            aria-modal="true"
            aria-labelledby="resource-title"
          >
            <button
              className="close"
              onClick={() => {
                setOpenResource(null);
                setMessage("");
              }}
              aria-label="Close"
            >
              ×
            </button>
            <span className="kicker dark">
              {openResource.type} · {openResource.category}
            </span>
            <h2 id="resource-title">{openResource.title}</h2>
            <p>{openResource.detail}</p>
            <ResourceContent title={openResource.title} />
            {userId ? (
              <div className="progress-control">
                <label>
                  Reading progress: <b>{draftProgress}%</b>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    step="5"
                    value={draftProgress}
                    onChange={(e) => setDraftProgress(Number(e.target.value))}
                  />
                </label>
                <div>
                  <button onClick={() => saveProgress(false)}>
                    Save progress
                  </button>
                  <button
                    className="primary"
                    onClick={() => saveProgress(true)}
                  >
                    Mark complete
                  </button>
                </div>
              </div>
            ) : (
              <button
                className="primary"
                onClick={() =>
                  setMessage("Create a free account to track your progress.")
                }
              >
                Sign in to track progress
              </button>
            )}
          </section>
        </div>
      )}
    </section>
  );
}

export default function Home() {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [authOpen, setAuthOpen] = useState(false);
  const [recovering, setRecovering] = useState(false);
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, next) => {
      setSession(next);
      if (event === "PASSWORD_RECOVERY") setRecovering(true);
      if (!next) setProfile(null);
    });
    return () => subscription.unsubscribe();
  }, []);
  const sessionUserId = session?.user.id;
  useEffect(() => {
    if (!sessionUserId) {
      setLoading(false);
      return;
    }
    if (profile?.id === sessionUserId) return;
    setLoading(true);
    supabase
      .from("student_profiles")
      .select("*")
      .eq("id", sessionUserId)
      .maybeSingle()
      .then(({ data }) => {
        setProfile(
          data
            ? (data as Profile)
            : {
                ...emptyProfile,
                id: sessionUserId,
                first_name: String(
                  session?.user.user_metadata?.first_name || "",
                ),
              },
        );
        setLoading(false);
      });
  }, [sessionUserId, profile?.id]);
  if (loading)
    return (
      <div className="loading-screen">
        <span className="brand-mark">F</span>
        <p>Finding your waymark…</p>
      </div>
    );
  if (recovering && session)
    return <PasswordUpdate done={() => setRecovering(false)} />;
  if (session && profile && !profile.onboarding_complete)
    return <Onboarding profile={profile} onSaved={setProfile} />;
  if (session && profile)
    return (
      <StudentDashboard
        session={session}
        profile={profile}
        onProfile={setProfile}
      />
    );
  return (
    <div className="public-site">
      <header className="site-header">
        <a className="brand" href="#top">
          <span className="brand-mark">F</span>
          <span>
            Future
            <br />
            <b>Waymark</b>
          </span>
        </a>
        <nav>
          <a href="#how">How it works</a>
          <a href="#resources">Resources</a>
          <a href="#families">For families</a>
        </nav>
        <div>
          <button className="text-button" onClick={() => setAuthOpen(true)}>
            Sign in
          </button>
          <button className="header-cta" onClick={() => setAuthOpen(true)}>
            Create your path
          </button>
        </div>
      </header>
      <main>
        <section className="hero" id="top">
          <div className="hero-copy">
            <span className="kicker">A PLAN THAT BELONGS TO YOU</span>
            <h1>
              Find your way
              <br />
              <em>forward.</em>
            </h1>
            <p>
              Create a private student account, tell us what you’re considering,
              and build a path you can adjust as your plans change.
            </p>
            <div className="hero-actions">
              <button className="light-cta" onClick={() => setAuthOpen(true)}>
                Create my free account →
              </button>
              <button
                className="ghost-cta"
                onClick={() =>
                  document
                    .getElementById("how")
                    ?.scrollIntoView({ behavior: "smooth" })
                }
              >
                See how it works
              </button>
            </div>
            <small>
              No school partnership required. Students sign up directly.
            </small>
          </div>
          <div className="path-preview">
            <span>MY WAYMARK</span>
            <h2>Four-year college</h2>
            <div>
              <i className="done">✓</i>
              <p>
                <b>Build a balanced college list</b>
                <small>Completed</small>
              </p>
            </div>
            <div>
              <i>2</i>
              <p>
                <b>Request recommendation letters</b>
                <small>Your next best step</small>
              </p>
            </div>
            <div>
              <i>3</i>
              <p>
                <b>Complete FAFSA</b>
                <small>Coming up</small>
              </p>
            </div>
            <footer>
              <b>40%</b>
              <span>
                <i style={{ width: "40%" }}></i>
              </span>
              <small>of path complete</small>
            </footer>
          </div>
        </section>
        <section className="how-section" id="how">
          <span className="kicker dark">BUILT AROUND THE STUDENT</span>
          <h2>One account. A path that evolves with you.</h2>
          <div className="how-grid">
            <article>
              <b>01</b>
              <h3>Tell us about yourself</h3>
              <p>
                Add your graduation year, interests, possible schools, programs,
                or careers.
              </p>
            </article>
            <article>
              <b>02</b>
              <h3>Get a starting path</h3>
              <p>
                Receive practical milestones based on college, trade,
                apprenticeship, work, military, or exploration goals.
              </p>
            </article>
            <article>
              <b>03</b>
              <h3>Make it your own</h3>
              <p>
                Add goals, mark progress, save resources, and update your
                direction whenever life changes.
              </p>
            </article>
          </div>
        </section>
        <ResourceLibrary />
        <section className="family-banner" id="families">
          <div>
            <span className="kicker">FOR STUDENTS AND FAMILIES</span>
            <h2>Support without taking over.</h2>
            <p>
              Future Waymark helps students prepare and stay organized while
              encouraging them to verify official requirements with colleges,
              programs, testing organizations, financial-aid offices, and
              counselors.
            </p>
          </div>
          <button onClick={() => setAuthOpen(true)}>
            Start a student path
          </button>
        </section>
      </main>
      <footer className="site-footer">
        <div className="brand">
          <span className="brand-mark">F</span>
          <span>
            Future <b>Waymark</b>
          </span>
        </div>
        <p>Educational guidance for every path forward.</p>
      </footer>
      {authOpen && <AuthPanel close={() => setAuthOpen(false)} />}
    </div>
  );
}
