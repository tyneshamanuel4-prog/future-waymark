"use client";
import{useEffect,useMemo,useState}from"react";
const tasks=[
  ["Add or compare colleges","Search verified school information, save schools of interest, and compare up to three institutions.","#school-research","Schools"],
  ["Track an application","Record deadlines, requirements, fees, submission status, and admission decisions.","#applications","Applications"],
  ["Compare financial-aid offers","Separate grants, scholarships, work-study, and loans to understand estimated remaining cost.","#financial-aid","Financial aid"],
  ["Choose between admission offers","Compare admission status, estimated net price, and personal-fit priorities.","#college-decisions","College decisions"],
  ["Plan SAT or ACT testing","Record target scores, test dates, section scores, and official preparation resources.","#testing","Testing"],
  ["Draft an essay","Brainstorm, outline, revise, and review original writing without submitting copied essays.","#essays","Writing"],
  ["Build a resume","Create multiple resume versions and print or export a polished copy.","#resume","Resume"],
  ["Prepare for an interview","Practice responses, save notes, and schedule follow-ups.","#interviews","Interviews"],
  ["Request recommendations","Track recommenders, materials, deadlines, and thank-you notes.","#recommendations","Recommendations"],
  ["Remember who to contact","Save professional contacts, conversation notes, and follow-up dates.","#support-network","Support network"],
  ["Prepare for an advisor meeting","Create, print, or download a summary of current plans and questions.","#advisor-brief","Meeting prep"],
  ["Confirm that my work saved","Review recent changes across the app and return to the related workspace.","#recent-activity","Saved work"],
  ["Find an upcoming deadline","See deadlines from milestones, applications, scholarships, testing, visits, and interviews.","#deadlines","Planning"],
  ["Save a resource for later","Favorite resources, track reading progress, and organize custom collections.","#resources","Resources"],
] as const;
const faq=[
  ["Does Future Waymark submit applications for me?","No. Future Waymark helps students learn and organize. Submit and confirm applications through each institution's official system."],
  ["What saves automatically?","Most completed forms save when you use their Save or Add button. Draft recovery may preserve unfinished text on the current device. Recent Activity confirms saved account records."],
  ["Why should I verify dates and costs?","Deadlines, testing rules, admissions policies, and costs can change. Always confirm them with the college, testing provider, StudentAid.gov, or another official source."],
  ["What information should I never enter?","Do not enter passwords, Social Security numbers, FSA IDs, tax documents, bank details, verification codes, or other highly sensitive information."],
  ["Can I download my information?","Yes. Open Privacy & Your Data and choose Download my data."],
] as const;
export function HelpCenter(){const[open,setOpen]=useState(false),[query,setQuery]=useState("");const results=useMemo(()=>{const q=query.trim().toLowerCase();return q?tasks.filter(x=>x.join(" ").toLowerCase().includes(q)):tasks},[query]);useEffect(()=>{if(!open)return;const close=(event:KeyboardEvent)=>{if(event.key==="Escape")setOpen(false)};document.addEventListener("keydown",close);return()=>document.removeEventListener("keydown",close)},[open]);return <><button className="help-launch" onClick={()=>setOpen(true)} aria-haspopup="dialog">Help: where do I go?</button>{open&&<div className="modal-backdrop"><section className="task-help" role="dialog" aria-modal="true" aria-labelledby="task-help-title"><button className="close" onClick={()=>setOpen(false)} aria-label="Close Help Center">Close</button><span className="kicker dark">FUTURE WAYMARK HELP</span><h2 id="task-help-title">What would you like to do?</h2><input autoFocus value={query} onChange={e=>setQuery(e.target.value)} placeholder="Search: add a college, prepare for an interview..." aria-label="Search help topics"/><p className="help-result-count" aria-live="polite">{results.length} help topic{results.length===1?"":"s"} found</p><div className="help-task-list">{results.map(([title,detail,href,area])=><a href={href} key={title} onClick={()=>setOpen(false)}><span>{area}</span><b>{title}</b><small>{detail}</small></a>)}</div><div className="help-faq"><h3>Common questions</h3>{faq.map(([question,answer])=><details key={question}><summary>{question}</summary><p>{answer}</p></details>)}</div><p className="official-note">Future Waymark provides educational and organizational support. It does not replace official admissions, financial-aid, testing, legal, or counseling guidance.</p></section></div>}</>}
