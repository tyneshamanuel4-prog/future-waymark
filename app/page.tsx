"use client";

import { useMemo, useState } from "react";

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
  featured?: boolean;
};

const resources: Resource[] = [
  { id: 1, type: "Guide", title: "Build a college list that fits you", category: "College Applications", detail: "Balance reach, target, and likely schools around the things that matter to you.", time: "7 min read", level: "Start here", icon: "⌂", accent: "sage", featured: true },
  { id: 2, type: "Video", title: "FAFSA: what families should know", category: "FAFSA & Financial Aid", detail: "A plain-language walkthrough for students and supporters.", time: "12 min", level: "Beginner", icon: "▶", accent: "gold", featured: true },
  { id: 3, type: "Template", title: "Personal story map", category: "Essay Writing", detail: "Connect moments, choices, and growth before drafting your essay.", time: "15 min", level: "All levels", icon: "✎", accent: "coral", featured: true },
  { id: 4, type: "Checklist", title: "Digital SAT test-day checklist", category: "SAT Preparation", detail: "Know what to bring, what to leave home, and how to arrive ready.", time: "5 min", level: "Test day", icon: "✓", accent: "blue" },
  { id: 5, type: "Guide", title: "Ask for a strong recommendation", category: "Recommendation Letters", detail: "Choose a recommender, ask thoughtfully, and share useful context.", time: "6 min", level: "Start here", icon: "✦", accent: "violet" },
  { id: 6, type: "Video", title: "Answer interview questions with STAR", category: "Interview Preparation", detail: "Turn your experiences into clear, memorable answers.", time: "9 min", level: "Practice", icon: "◉", accent: "rose" },
  { id: 7, type: "Template", title: "High school senior resume", category: "Resume Building", detail: "Organize classes, leadership, service, work, and skills.", time: "20 min", level: "All levels", icon: "▤", accent: "mint" },
  { id: 8, type: "Guide", title: "Compare college financial aid offers", category: "Scholarships", detail: "Look beyond the headline number to understand your real cost.", time: "10 min", level: "Intermediate", icon: "$", accent: "gold" },
];

const categoryGroups = [
  { title: "Apply & pay", icon: "↗", items: ["College Applications", "Scholarships", "FAFSA & Financial Aid", "Recommendation Letters"] },
  { title: "Test prep", icon: "◎", items: ["SAT Preparation", "ACT Preparation", "AP Exams", "Study Skills"] },
  { title: "Tell your story", icon: "✎", items: ["Essay Writing", "Personal Statements", "Supplemental Essays", "Resume Building"] },
  { title: "Plan what’s next", icon: "⌁", items: ["Career Planning", "Trade School", "Community College", "Apprenticeships"] },
  { title: "Stay well", icon: "♡", items: ["Mental Wellness", "Stress Management", "Time Management", "Campus Life"] },
  { title: "For supporters", icon: "◌", items: ["Parent Resources", "College Visits", "Graduation Planning", "Financial Aid"] },
];

const centers = [
  { title: "SAT Success Center", icon: "SAT", detail: "Study plans, score tracking, deadlines, and official practice resources.", progress: 62, tone: "forest" },
  { title: "Essay Writing Center", icon: "Aa", detail: "Find your story, shape your draft, and keep your authentic voice.", progress: 35, tone: "orange" },
  { title: "Interview Prep", icon: "◉", detail: "Practice with purpose for college, scholarship, and job interviews.", progress: 20, tone: "navy" },
];

function ResourceCard({ resource, saved, onSave }: { resource: Resource; saved: boolean; onSave: () => void }) {
  return (
    <article className="resource-card">
      <div className={`resource-art ${resource.accent}`}><span>{resource.icon}</span><small>{resource.type}</small></div>
      <div className="resource-body">
        <div className="eyebrow">{resource.category}</div>
        <h3>{resource.title}</h3>
        <p>{resource.detail}</p>
        <div className="resource-meta"><span>{resource.time}</span><span>•</span><span>{resource.level}</span></div>
      </div>
      <button className={`save-button ${saved ? "saved" : ""}`} aria-label={saved ? `Remove ${resource.title} from saved` : `Save ${resource.title}`} onClick={onSave}>{saved ? "♥" : "♡"}</button>
    </article>
  );
}

export default function Home() {
  const [query, setQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("All resources");
  const [saved, setSaved] = useState<number[]>([3]);
  const [highContrast, setHighContrast] = useState(false);
  const [largeText, setLargeText] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [showAll, setShowAll] = useState(false);

  const filtered = useMemo(() => {
    const normalized = query.toLowerCase();
    return resources.filter((item) => {
      const matchesQuery = `${item.title} ${item.category} ${item.type} ${item.detail}`.toLowerCase().includes(normalized);
      const matchesCategory = activeCategory === "All resources" || item.category === activeCategory;
      return matchesQuery && matchesCategory;
    });
  }, [query, activeCategory]);

  const toggleSaved = (id: number) => setSaved((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id]);
  const visibleResources = showAll || query || activeCategory !== "All resources" ? filtered : filtered.slice(0, 4);

  return (
    <div className={`${highContrast ? "high-contrast" : ""} ${largeText ? "large-text" : ""}`}>
      <a className="skip-link" href="#main">Skip to main content</a>
      <header className="site-header">
        <a className="brand" href="#top" aria-label="Student Success Center home"><span className="brand-mark">S</span><span>Student Success<br/><b>Center</b></span></a>
        <nav className={menuOpen ? "open" : ""} aria-label="Main navigation">
          <a className="active" href="#explore">Explore</a><a href="#centers">Learning centers</a><a href="#progress">My progress</a><a href="#families">For families</a>
        </nav>
        <div className="header-actions">
          <button className="icon-button" onClick={() => setHighContrast(!highContrast)} aria-label="Toggle high contrast">◐</button>
          <button className="icon-button font-button" onClick={() => setLargeText(!largeText)} aria-label="Toggle larger text">Aa</button>
          <button className="profile-button" aria-label="Open profile for Maya"><span>MS</span><b>Maya</b><i>⌄</i></button>
          <button className="menu-button" onClick={() => setMenuOpen(!menuOpen)} aria-label="Toggle menu">☰</button>
        </div>
      </header>

      <main id="main">
        <section className="hero" id="top">
          <div className="hero-copy">
            <div className="kicker">WELCOME BACK, MAYA <span>✦</span></div>
            <h1>Your senior year,<br/><em>one clear step</em> at a time.</h1>
            <p>Explore trusted guidance, build your plan, and keep moving toward what’s next—at your own pace.</p>
            <div className="search-wrap">
              <span>⌕</span><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search guides, videos, templates, and more…" aria-label="Search all resources" />
              <kbd>⌘ K</kbd>
            </div>
            <div className="quick-links"><span>Popular:</span>{["FAFSA", "Essay ideas", "SAT plan", "Resume"].map((item) => <button key={item} onClick={() => setQuery(item)}>{item}</button>)}</div>
          </div>
          <div className="hero-planner" aria-label="Upcoming milestones">
            <div className="tape tape-one"></div><div className="tape tape-two"></div>
            <div className="planner-label">MY NEXT STEPS</div>
            <div className="planner-date"><strong>OCT</strong><b>15</b></div>
            <div className="planner-line"><span></span><div><b>FAFSA opens</b><small>Get your documents ready</small></div><button>→</button></div>
            <div className="planner-line"><span className="orange-dot"></span><div><b>College list review</b><small>4 days left</small></div><button>→</button></div>
            <div className="planner-note">Small steps add up.<br/><b>You’ve got this.</b> <span>↗</span></div>
          </div>
        </section>

        <section className="progress-strip" id="progress">
          <div><span className="progress-icon">✓</span><p><small>THIS WEEK</small><b>3 of 5 goals complete</b></p><div className="bar"><i style={{width:"60%"}}></i></div></div>
          <div><span className="progress-icon book">▤</span><p><small>KEEP READING</small><b>Understanding your financial aid offer</b></p><button>Continue <span>→</span></button></div>
          <div><span className="progress-icon flame">♨</span><p><small>STUDY STREAK</small><b>6 days</b></p><span className="streak">Best: 9</span></div>
        </section>

        <section className="section" id="explore">
          <div className="section-heading"><div><span className="kicker dark">START WHERE YOU ARE</span><h2>Explore by topic</h2><p>Practical guidance for every part of your journey.</p></div><button className="text-link" onClick={() => {setActiveCategory("All resources"); document.getElementById("resources")?.scrollIntoView({behavior:"smooth"})}}>View all 26 categories →</button></div>
          <div className="category-grid">
            {categoryGroups.map((group) => <button className="category-card" key={group.title} onClick={() => {setActiveCategory(group.items[0]); document.getElementById("resources")?.scrollIntoView({behavior:"smooth"})}}><span className="category-icon">{group.icon}</span><h3>{group.title}</h3><ul>{group.items.map((item) => <li key={item}>{item}<span>→</span></li>)}</ul></button>)}
          </div>
        </section>

        <section className="section cream-section" id="centers">
          <div className="section-heading"><div><span className="kicker dark">GUIDED LEARNING</span><h2>Pick up where you left off</h2><p>Focused learning centers that turn big goals into doable steps.</p></div></div>
          <div className="center-grid">
            {centers.map((center) => <article className="center-card" key={center.title}><div className={`center-visual ${center.tone}`}><span>{center.icon}</span><i style={{width:`${center.progress}%`}}></i><small>{center.progress}% complete</small></div><div className="center-copy"><h3>{center.title}</h3><p>{center.detail}</p><button>Continue learning <span>→</span></button></div></article>)}
          </div>
          <div className="center-links"><button>ACT Success Center</button><button>Resume Builder</button><button>Study Skills Center</button><button>Parent Learning Center</button></div>
        </section>

        <section className="section" id="resources">
          <div className="section-heading resource-heading"><div><span className="kicker dark">CURATED FOR YOU</span><h2>{query ? `Results for “${query}”` : activeCategory !== "All resources" ? activeCategory : "Recommended resources"}</h2><p>Reviewed, practical, and worth your time.</p></div><div className="filter-row"><select value={activeCategory} onChange={(e) => setActiveCategory(e.target.value)} aria-label="Filter by category"><option>All resources</option>{Array.from(new Set(resources.map((r) => r.category))).map((category) => <option key={category}>{category}</option>)}</select><button onClick={() => {setQuery("");setActiveCategory("All resources")}}>Clear filters</button></div></div>
          <div className="resource-grid">{visibleResources.map((resource) => <ResourceCard key={resource.id} resource={resource} saved={saved.includes(resource.id)} onSave={() => toggleSaved(resource.id)} />)}</div>
          {visibleResources.length === 0 && <div className="empty-state"><span>⌕</span><h3>No exact matches yet</h3><p>Try a broader keyword or clear your category filter.</p><button onClick={() => {setQuery(""); setActiveCategory("All resources")}}>See all resources</button></div>}
          {!showAll && !query && activeCategory === "All resources" && <button className="outline-button" onClick={() => setShowAll(true)}>Browse all resources <span>→</span></button>}
        </section>

        <section className="support-banner" id="families"><div><span className="support-icon">♡</span><div><span className="kicker dark">A NOTE FOR STUDENTS</span><h2>Guidance for the journey—not a substitute for official advice.</h2><p>Use these resources to learn, prepare, and ask better questions. Always confirm requirements and deadlines with colleges, testing organizations, and your school counselor.</p></div></div><a href="#explore">Find trusted sources →</a></section>
      </main>

      <footer><div className="brand footer-brand"><span className="brand-mark">S</span><span>Student Success<br/><b>Center</b></span></div><p>Clear guidance for what comes next.</p><nav aria-label="Footer navigation"><a href="#explore">Resource library</a><a href="#centers">Learning centers</a><a href="#families">Accessibility</a><a href="#families">For parents</a></nav><small>Resources are educational and reviewed regularly. Verify official requirements with the appropriate organization.</small></footer>
    </div>
  );
}
