import { NextRequest, NextResponse } from "next/server";

type Program = {
  title: string;
  credential?: { title?: string };
  counts?: { ipeds_awards2?: number };
};
const fields = [
  "id",
  "school.name",
  "school.city",
  "school.state",
  "school.school_url",
  "school.price_calculator_url",
  "school.ownership",
  "school.locale",
  "school.degrees_awarded.predominant",
  "latest.student.size",
  "latest.cost.tuition.in_state",
  "latest.cost.tuition.out_of_state",
  "latest.cost.avg_net_price.overall",
  "latest.cost.attendance.academic_year",
  "latest.admissions.admission_rate.overall",
  "latest.admissions.sat_scores.average.overall",
  "latest.completion.rate_suppressed.overall",
  "latest.programs.cip_4_digit",
].join(",");
const norm = (v: string) =>
  v
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]/g, "");
const ownership = (v: number) =>
  v === 1
    ? "Public"
    : v === 2
      ? "Private nonprofit"
      : v === 3
        ? "Private for-profit"
        : "Not reported";
const setting = (v: number) =>
  v >= 11 && v <= 13
    ? "City"
    : v >= 21 && v <= 23
      ? "Suburban"
      : v >= 31 && v <= 33
        ? "Town"
        : v >= 41 && v <= 43
        ? "Rural"
        : "Not reported";
const degreeType = (v: number) =>
  v === 1
    ? "Primarily certificates"
    : v === 2
      ? "Primarily associate degrees"
      : v === 3
        ? "Primarily bachelor's degrees"
        : v === 4
          ? "Primarily graduate degrees"
          : "Not reported";
const aliases: Record<string, string[]> = {
  nurse: ["nursing", "registered nursing"],
  doctor: ["biology", "biological sciences", "chemistry", "health professions"],
  physician: [
    "biology",
    "biological sciences",
    "chemistry",
    "health professions",
  ],
  lawyer: ["political science", "history", "philosophy", "legal professions"],
  attorney: ["political science", "history", "philosophy", "legal professions"],
  "software engineer": [
    "computer science",
    "computer software",
    "information technology",
  ],
  teacher: ["education", "teacher education"],
  psychologist: ["psychology"],
  engineer: ["engineering"],
  business: ["business", "management", "marketing"],
};
function matchPrograms(programs: string[], goals: string[]) {
  const exact: string[] = [],
    related: string[] = [];
  for (const program of programs) {
    const p = program.toLowerCase();
    for (const raw of goals) {
      const goal = raw.toLowerCase().trim();
      if (!goal) continue;
      if (p.includes(goal) || goal.includes(p.replace(/, general\.?$/, ""))) {
        exact.push(program);
        break;
      }
      const terms = [
        ...(aliases[goal] ?? []),
        ...Object.entries(aliases)
          .filter(([key]) => goal.includes(key))
          .flatMap(([, v]) => v),
        ...goal.split(/\s+/).filter((x) => x.length > 4),
      ];
      if (terms.some((x) => p.includes(x))) {
        related.push(program);
        break;
      }
    }
  }
  return {
    status: exact.length
      ? "Exact match"
      : related.length
        ? "Related options"
        : "No reported match",
    exact: [...new Set(exact)].slice(0, 8),
    related: [...new Set(related)].slice(0, 8),
  };
}
async function school(name: string, goals: string[]) {
  const params = new URLSearchParams({
    api_key: process.env.COLLEGE_SCORECARD_API_KEY ?? "DEMO_KEY",
    "school.name": name,
    "school.operating": "1",
    _fields: fields,
    per_page: "20",
  });
  const response = await fetch(
    `https://api.data.gov/ed/collegescorecard/v1/schools?${params}`,
    { next: { revalidate: 86400 } },
  );
  if (!response.ok)
    throw new Error("Official school data is temporarily unavailable.");
  const body = await response.json();
  const choices = (body.results ?? []) as Record<string, any>[];
  const row =
    choices.find((x) => norm(String(x["school.name"])) === norm(name)) ??
    choices[0];
  if (!row) return { name, error: "No federal school record was found." };
  const rawPrograms = (row["latest.programs.cip_4_digit"] ?? []) as Program[];
  const programs = [
    ...new Set(
      rawPrograms
        .filter((x) => (x.counts?.ipeds_awards2 ?? 1) > 0)
        .map((x) => x.title)
        .filter(Boolean),
    ),
  ].sort();
  return {
    id: row.id,
    name: row["school.name"],
    city: row["school.city"],
    state: row["school.state"],
    website: row["school.school_url"]
      ? `https://${String(row["school.school_url"]).replace(/^https?:\/\//, "")}`
      : "",
    netPriceUrl: row["school.price_calculator_url"]
      ? `https://${String(row["school.price_calculator_url"]).replace(/^https?:\/\//, "")}`
      : "",
    ownership: ownership(row["school.ownership"]),
    setting: setting(row["school.locale"]),
    degreeType: degreeType(row["school.degrees_awarded.predominant"]),
    enrollment: row["latest.student.size"],
    tuitionInState: row["latest.cost.tuition.in_state"],
    tuitionOutState: row["latest.cost.tuition.out_of_state"],
    costAttendance: row["latest.cost.attendance.academic_year"],
    netPrice: row["latest.cost.avg_net_price.overall"],
    admissionRate: row["latest.admissions.admission_rate.overall"],
    satAverage: row["latest.admissions.sat_scores.average.overall"],
    graduationRate: row["latest.completion.rate_suppressed.overall"],
    programs,
    match: matchPrograms(programs, goals),
    source: "U.S. Department of Education College Scorecard",
    lastVerified: new Date().toISOString().slice(0, 10),
  };
}
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const names = Array.isArray(body.names)
      ? body.names.filter((x: unknown) => typeof x === "string").slice(0, 10)
      : [];
    const goals = Array.isArray(body.goals)
      ? body.goals.filter((x: unknown) => typeof x === "string").slice(0, 10)
      : [];
    if (!names.length) return NextResponse.json({ schools: [] });
    const schools = await Promise.all(
      names.map((name: string) => school(name, goals)),
    );
    return NextResponse.json({ schools });
  } catch (error) {
    return NextResponse.json(
      {
        schools: [],
        error:
          error instanceof Error
            ? error.message
            : "School research is temporarily unavailable.",
      },
      { status: 503 },
    );
  }
}
