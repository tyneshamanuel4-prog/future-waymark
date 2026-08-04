"use client";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { supabase } from "../lib/supabase";
import { SchoolPicker } from "./school-picker";
type School = {
  id?: number;
  name: string;
  city?: string;
  state?: string;
  website?: string;
  netPriceUrl?: string;
  ownership?: string;
  setting?: string;
  degreeType?: string;
  enrollment?: number;
  tuitionInState?: number;
  tuitionOutState?: number;
  costAttendance?: number;
  netPrice?: number;
  admissionRate?: number;
  satAverage?: number;
  graduationRate?: number;
  programs?: string[];
  match?: { status: string; exact: string[]; related: string[] };
  source?: string;
  lastVerified?: string;
  error?: string;
};
type Note = {
  id?: string;
  school_name: string;
  application_deadline: string;
  financial_aid_deadline: string;
  notes: string;
  last_verified_on: string;
};
type Comparison = { id: string; name: string; schools: string[] };
const emptyNote = (name: string): Note => ({
  school_name: name,
  application_deadline: "",
  financial_aid_deadline: "",
  notes: "",
  last_verified_on: "",
});
const money = (v?: number) =>
  v == null ? "Not reported" : `$${v.toLocaleString()}`;
const percent = (v?: number) =>
  v == null ? "Not reported" : `${Math.round(v * 100)}%`;
const text = (v?: string | number) =>
  v == null || v === "" ? "Not reported" : String(v);
export function SchoolResearchCenter({
  userId,
  initialSchools,
  initialGoals,
  onProfile,
}: {
  userId: string;
  initialSchools: string[];
  initialGoals: string[];
  onProfile: (schools: string[], goals: string[]) => void;
}) {
  const [schools, setSchools] = useState(initialSchools),
    [goals, setGoals] = useState(initialGoals),
    [goal, setGoal] = useState(""),
    [data, setData] = useState<Record<string, School>>({}),
    [active, setActive] = useState(""),
    [compare, setCompare] = useState<string[]>([]),
    [notes, setNotes] = useState<Record<string, Note>>({}),
    [saved, setSaved] = useState<Comparison[]>([]),
    [comparisonName, setComparisonName] = useState("My college comparison"),
    [message, setMessage] = useState(""),
    [loading, setLoading] = useState(false);
  useEffect(() => {
    Promise.all([
      supabase
        .from("school_research_notes")
        .select(
          "id,school_name,application_deadline,financial_aid_deadline,notes,last_verified_on",
        )
        .eq("user_id", userId),
      supabase
        .from("school_comparisons")
        .select("id,name,schools")
        .eq("user_id", userId)
        .order("updated_at", { ascending: false }),
    ]).then(([n, c]) => {
      setNotes(
        Object.fromEntries(
          (n.data ?? []).map((x) => [x.school_name, x as Note]),
        ),
      );
      setSaved((c.data ?? []) as Comparison[]);
    });
  }, [userId]);
  useEffect(() => {
    if (!schools.length) {
      setData({});
      return;
    }
    setLoading(true);
    fetch("/api/school-research", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ names: schools, goals }),
    })
      .then((r) => r.json())
      .then((body) =>
        setData(
          Object.fromEntries(
            (body.schools ?? []).map((x: School) => [x.name, x]),
          ),
        ),
      )
      .catch(() => setMessage("School research is temporarily unavailable."))
      .finally(() => setLoading(false));
  }, [schools, goals]);
  function addGoal() {
    const value = goal.trim();
    if (value && !goals.some((x) => x.toLowerCase() === value.toLowerCase()))
      setGoals([...goals, value]);
    setGoal("");
  }
  async function saveProfile() {
    const { error } = await supabase
      .from("student_profiles")
      .update({
        target_schools: schools,
        goals,
        updated_at: new Date().toISOString(),
      })
      .eq("id", userId);
    if (error) return setMessage(error.message);
    onProfile(schools, goals);
    setMessage("Study interests and schools saved.");
  }
  function toggleCompare(name: string) {
    if (compare.includes(name)) setCompare(compare.filter((x) => x !== name));
    else if (compare.length < 3) setCompare([...compare, name]);
    else setMessage("You can compare up to three institutions at a time.");
  }
  async function saveNote() {
    if (!active) return;
    const value = notes[active] ?? emptyNote(active);
    const payload = {
      user_id: userId,
      school_name: active,
      application_deadline: value.application_deadline || null,
      financial_aid_deadline: value.financial_aid_deadline || null,
      notes: value.notes,
      last_verified_on: value.last_verified_on || null,
      updated_at: new Date().toISOString(),
    };
    const { data: row, error } = await supabase
      .from("school_research_notes")
      .upsert(payload, { onConflict: "user_id,school_name" })
      .select(
        "id,school_name,application_deadline,financial_aid_deadline,notes,last_verified_on",
      )
      .single();
    if (error) return setMessage(error.message);
    setNotes({ ...notes, [active]: row as Note });
    setMessage("School deadlines and notes saved.");
  }
  async function saveComparison(e: FormEvent) {
    e.preventDefault();
    if (!compare.length)
      return setMessage("Select at least one school to compare.");
    const { data: row, error } = await supabase
      .from("school_comparisons")
      .insert({
        user_id: userId,
        name: comparisonName.trim() || "My college comparison",
        schools: compare,
      })
      .select("id,name,schools")
      .single();
    if (error) return setMessage(error.message);
    setSaved([row as Comparison, ...saved]);
    setMessage("Comparison saved.");
  }
  async function removeComparison(id: string) {
    const { error } = await supabase
      .from("school_comparisons")
      .delete()
      .eq("id", id);
    if (!error) setSaved(saved.filter((x) => x.id !== id));
  }
  function printComparison() {
    document.body.classList.add("printing-comparison");
    window.print();
    setTimeout(
      () => document.body.classList.remove("printing-comparison"),
      500,
    );
  }
  const compared = useMemo(
    () =>
      compare.map(
        (name) =>
          data[name] ??
          Object.values(data).find((x) => x.name === name) ?? { name },
      ),
    [compare, data],
  );
  const activeData =
    data[active] ?? Object.values(data).find((x) => x.name === active);
  const activeNote = notes[active] ?? emptyNote(active);
  const rows: [string, (s: School) => string][] = [
    [
      "Location",
      (s) => (s.city && s.state ? `${s.city}, ${s.state}` : "Not reported"),
    ],
    ["Campus setting", (s) => text(s.setting)],
    ["Institution type", (s) => text(s.ownership)],
    ["Primary degree type", (s) => text(s.degreeType)],
    [
      "Undergraduate enrollment",
      (s) => s.enrollment?.toLocaleString() ?? "Not reported",
    ],
    ["Desired-field match", (s) => s.match?.status ?? "Not evaluated"],
    [
      "Matching programs",
      (s) =>
        [...(s.match?.exact ?? []), ...(s.match?.related ?? [])]
          .slice(0, 3)
          .join("; ") || "Not reported",
    ],
    ["In-state tuition", (s) => money(s.tuitionInState)],
    ["Out-of-state tuition", (s) => money(s.tuitionOutState)],
    ["Estimated cost of attendance", (s) => money(s.costAttendance)],
    ["Average net price", (s) => money(s.netPrice)],
    ["Admission rate", (s) => percent(s.admissionRate)],
    ["Average SAT", (s) => text(s.satAverage)],
    ["Graduation rate", (s) => percent(s.graduationRate)],
    [
      "Application deadline",
      (s) => notes[s.name]?.application_deadline || "Not entered",
    ],
    [
      "Financial-aid deadline",
      (s) => notes[s.name]?.financial_aid_deadline || "Not entered",
    ],
    ["Student notes", (s) => notes[s.name]?.notes || "None"],
  ];
  return (
    <section className="school-research" id="school-research">
      <div className="school-research-heading">
        <div>
          <span className="kicker dark">SCHOOL RESEARCH CENTER</span>
          <h2>Find schools that fit your goals.</h2>
          <p>
            Explore official public information, check program matches, and
            compare up to three institutions.
          </p>
        </div>
        <button className="primary" onClick={saveProfile}>
          Save interests and schools
        </button>
      </div>
      <div className="research-preferences">
        <div>
          <b>Desired fields of study or career goals</b>
          <div className="goal-entry">
            <input
              value={goal}
              onChange={(e) => setGoal(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  addGoal();
                }
              }}
              placeholder="Example: Nursing or software engineer"
            />
            <button onClick={addGoal}>Add</button>
          </div>
          <div className="goal-chips">
            {goals.map((x) => (
              <span key={x}>
                {x}
                <button
                  onClick={() => setGoals(goals.filter((g) => g !== x))}
                  aria-label={`Remove ${x}`}
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        </div>
        <SchoolPicker value={schools} onChange={setSchools} />
      </div>
      {message && (
        <div className="form-message" role="status">
          {message}
        </div>
      )}
      {loading && (
        <p className="research-loading">Loading official school information…</p>
      )}
      <div className="school-card-grid">
        {schools.map((name) => {
          const s =
            data[name] ?? Object.values(data).find((x) => x.name === name);
          return (
            <article key={name}>
              <div>
                <small>
                  {s?.city && s?.state
                    ? `${s.city}, ${s.state}`
                    : "Official profile loading"}
                </small>
                <h3>{name}</h3>
                <span
                  className={`match-badge ${(s?.match?.status ?? "").toLowerCase().replace(/\s/g, "-")}`}
                >
                  {s?.match?.status ?? "Not evaluated"}
                </span>
              </div>
              <p>
                {[...(s?.match?.exact ?? []), ...(s?.match?.related ?? [])]
                  .slice(0, 2)
                  .join(" · ") ||
                  "Add a study field or career goal to evaluate programs."}
              </p>
              <div>
                <button onClick={() => setActive(name)}>Research school</button>
                <label>
                  <input
                    type="checkbox"
                    checked={compare.includes(name)}
                    onChange={() => toggleCompare(name)}
                  />{" "}
                  Compare
                </label>
              </div>
            </article>
          );
        })}
      </div>
      {active && (
        <div className="research-profile">
          <div className="profile-title">
            <div>
              <span className="kicker dark">INSTITUTION PROFILE</span>
              <h3>{active}</h3>
              <p>
                {activeData?.source ?? "Official data unavailable"} · Last
                checked {activeData?.lastVerified ?? "today"}
              </p>
            </div>
            <button onClick={() => setActive("")}>Close</button>
          </div>
          {activeData?.error ? (
            <p>{activeData.error}</p>
          ) : (
            <>
              <div className="profile-facts">
                <span>
                  <b>Location</b>
                  {activeData?.city}, {activeData?.state}
                </span>
                <span>
                  <b>Type</b>
                  {text(activeData?.ownership)}
                </span>
                <span>
                  <b>Setting</b>
                  {text(activeData?.setting)}
                </span>
                <span>
                  <b>Enrollment</b>
                  {activeData?.enrollment?.toLocaleString() ?? "Not reported"}
                </span>
                <span>
                  <b>Cost of attendance</b>
                  {money(activeData?.costAttendance)}
                </span>
                <span>
                  <b>Average net price</b>
                  {money(activeData?.netPrice)}
                </span>
                <span>
                  <b>Admission rate</b>
                  {percent(activeData?.admissionRate)}
                </span>
                <span>
                  <b>Graduation rate</b>
                  {percent(activeData?.graduationRate)}
                </span>
              </div>
              <div className="program-results">
                <h4>{activeData?.match?.status ?? "Program availability"}</h4>
                {[
                  ...(activeData?.match?.exact ?? []),
                  ...(activeData?.match?.related ?? []),
                ].length ? (
                  <ul>
                    {[
                      ...(activeData?.match?.exact ?? []),
                      ...(activeData?.match?.related ?? []),
                    ].map((x) => (
                      <li key={x}>{x}</li>
                    ))}
                  </ul>
                ) : (
                  <p>
                    No matching program was reported in the current federal
                    dataset. Check the college’s academic catalog for
                    concentrations and newly renamed programs.
                  </p>
                )}
              </div>
              <div className="official-links">
                {activeData?.website && (
                  <a href={activeData.website} target="_blank" rel="noreferrer">
                    Official college website ↗
                  </a>
                )}
                {activeData?.netPriceUrl && (
                  <a
                    href={activeData.netPriceUrl}
                    target="_blank"
                    rel="noreferrer"
                  >
                    Official net price calculator ↗
                  </a>
                )}
              </div>
            </>
          )}
          <div className="research-notes">
            <h4>Deadlines and my notes</h4>
            <div className="two-col">
              <label>
                Application deadline
                <input
                  type="date"
                  value={activeNote.application_deadline ?? ""}
                  onChange={(e) =>
                    setNotes({
                      ...notes,
                      [active]: {
                        ...activeNote,
                        application_deadline: e.target.value,
                      },
                    })
                  }
                />
              </label>
              <label>
                Financial-aid deadline
                <input
                  type="date"
                  value={activeNote.financial_aid_deadline ?? ""}
                  onChange={(e) =>
                    setNotes({
                      ...notes,
                      [active]: {
                        ...activeNote,
                        financial_aid_deadline: e.target.value,
                      },
                    })
                  }
                />
              </label>
              <label>
                Last verified
                <input
                  type="date"
                  value={activeNote.last_verified_on ?? ""}
                  onChange={(e) =>
                    setNotes({
                      ...notes,
                      [active]: {
                        ...activeNote,
                        last_verified_on: e.target.value,
                      },
                    })
                  }
                />
              </label>
            </div>
            <label>
              Private notes
              <textarea
                value={activeNote.notes ?? ""}
                onChange={(e) =>
                  setNotes({
                    ...notes,
                    [active]: { ...activeNote, notes: e.target.value },
                  })
                }
              />
            </label>
            <button className="primary" onClick={saveNote}>
              Save deadlines and notes
            </button>
          </div>
        </div>
      )}
      <div className="comparison-controls">
        <div>
          <span className="kicker dark">COMPARE INSTITUTIONS</span>
          <h3>{compare.length}/3 selected</h3>
        </div>
        <form onSubmit={saveComparison}>
          <input
            value={comparisonName}
            onChange={(e) => setComparisonName(e.target.value)}
            maxLength={80}
          />
          <button disabled={!compare.length}>Save comparison</button>
        </form>
        <button onClick={printComparison} disabled={!compare.length}>
          Print / Save PDF
        </button>
      </div>
      {saved.length > 0 && (
        <div className="saved-comparisons">
          <b>Saved comparisons</b>
          {saved.map((c) => (
            <span key={c.id}>
              <button onClick={() => setCompare(c.schools)}>
                {c.name} · {c.schools.length} schools
              </button>
              <button
                onClick={() => removeComparison(c.id)}
                aria-label={`Delete ${c.name}`}
              >
                ×
              </button>
            </span>
          ))}
        </div>
      )}
      {compare.length > 0 && (
        <div className="comparison-print" id="school-comparison-print">
          <header>
            <span>FUTURE WAYMARK · SCHOOL COMPARISON</span>
            <h2>{comparisonName}</h2>
            <p>
              Public data should be confirmed with each institution. Missing
              information is shown as “Not reported.”
            </p>
          </header>
          <div
            className="comparison-matrix"
            style={{ "--school-count": compare.length } as React.CSSProperties}
          >
            <div className="matrix-row matrix-head">
              <b>Category</b>
              {compared.map((s) => (
                <strong key={s.name}>{s.name}</strong>
              ))}
            </div>
            {rows.map(([label, value]) => {
              const values = compared.map(value);
              const differs = new Set(values).size > 1;
              return (
                <div className="matrix-row" key={label}>
                  <b>{label}</b>
                  {compared.map((s, index) => (
                    <span className={differs ? "different" : ""} key={s.name}>
                      {values[index]}
                    </span>
                  ))}
                </div>
              );
            })}
            <div className="matrix-row">
              <b>Official links</b>
              {compared.map((s) => (
                <span key={s.name}>
                  {s.website ? (
                    <a href={s.website} target="_blank" rel="noreferrer">
                      College website
                    </a>
                  ) : (
                    "Not reported"
                  )}
                  {s.netPriceUrl && (
                    <>
                      {" "}
                      ·{" "}
                      <a href={s.netPriceUrl} target="_blank" rel="noreferrer">
                        Net price calculator
                      </a>
                    </>
                  )}
                </span>
              ))}
            </div>
            <div className="matrix-row">
              <b>Data checked</b>
              {compared.map((s) => (
                <span key={s.name}>{s.lastVerified ?? "Not reported"}</span>
              ))}
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
