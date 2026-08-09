"use client";

import { useEffect,useMemo,useState } from "react";
import { supabase } from "../lib/supabase";

type SearchItem={id:string;title:string;detail:string;type:string;href:string};
type SchoolFlow={application?:string;aid?:string;visit?:string;applicationDeadline?:string;aidDeadline?:string;notes?:string};
const glossary=[
  ["Cost of attendance","A college’s estimate of tuition, fees, housing, food, books, transportation, and other education expenses for one year."],
  ["Net price","The estimated cost of attendance minus grants and scholarships. It is not the same as the published tuition price."],
  ["Early Decision","A generally binding application plan. Confirm the agreement and financial implications with the college before applying."],
  ["Early Action","An earlier application plan that is generally nonbinding, although rules vary by college."],
  ["Demonstrated financial need","The difference between a school’s cost of attendance and the amount its financial-aid formula determines a family can contribute."],
  ["Work-study","Financial-aid eligibility that allows a student to earn money through qualifying employment; it is not normally deducted upfront from the bill."],
  ["Conditionally admitted","Admission that depends on completing stated requirements, such as final coursework, grades, documents, or a transition program."],
  ["Test optional","A policy allowing applicants to decide whether SAT or ACT scores are considered. Requirements can differ by program, scholarship, or applicant type."],
  ["Rolling admission","Applications are reviewed as they are completed, often until spaces are filled."],
  ["Verification","A financial-aid process requiring documentation to confirm information submitted through the FAFSA."],
] as const;

export function StudentProductivityTools({userId,schools,email}:{userId:string;schools:string[];email:string}){
  const[searchOpen,setSearchOpen]=useState(false),[helpOpen,setHelpOpen]=useState(false),[query,setQuery]=useState(""),[items,setItems]=useState<SearchItem[]>([]),[flows,setFlows]=useState<Record<string,SchoolFlow>>({}),[exporting,setExporting]=useState(false),[deleteText,setDeleteText]=useState(""),[message,setMessage]=useState("");
  useEffect(()=>{Promise.all([
    supabase.from("student_steps").select("id,title,category").eq("user_id",userId),
    supabase.from("college_applications").select("id,college_name,status,deadline").eq("user_id",userId),
    supabase.from("scholarship_applications").select("id,scholarship_name,status,deadline").eq("user_id",userId),
    supabase.from("essay_drafts").select("id,title,stage").eq("user_id",userId),
    supabase.from("resume_versions").select("id,title,template").eq("user_id",userId),
    supabase.from("recommendation_requests").select("id,recommender_name,destination,status").eq("user_id",userId),
    supabase.from("school_research_notes").select("id,school_name,application_deadline,financial_aid_deadline,notes").eq("user_id",userId),
    supabase.from("financial_aid_offers").select("id,school_name,status,deadline").eq("user_id",userId),
    supabase.from("college_visits").select("id,college_name,status,visit_date").eq("user_id",userId)
  ]).then(([steps,colleges,scholarships,essays,resumes,recs,notes,aid,visits])=>{
    setItems([
      ...(steps.data??[]).map(x=>({id:`step-${x.id}`,title:x.title,detail:x.category,type:"Milestone",href:"#path"})),
      ...(colleges.data??[]).map(x=>({id:`college-${x.id}`,title:x.college_name,detail:`${x.status}${x.deadline?` · ${x.deadline}`:""}`,type:"College application",href:"#applications"})),
      ...(scholarships.data??[]).map(x=>({id:`scholarship-${x.id}`,title:x.scholarship_name,detail:`${x.status}${x.deadline?` · ${x.deadline}`:""}`,type:"Scholarship",href:"#applications"})),
      ...(essays.data??[]).map(x=>({id:`essay-${x.id}`,title:x.title,detail:x.stage,type:"Essay",href:"#essays"})),
      ...(resumes.data??[]).map(x=>({id:`resume-${x.id}`,title:x.title,detail:`${x.template} template`,type:"Resume",href:"#resume"})),
      ...(recs.data??[]).map(x=>({id:`rec-${x.id}`,title:x.destination||x.recommender_name,detail:x.status,type:"Recommendation",href:"#recommendations"})),
      ...(notes.data??[]).map(x=>({id:`school-${x.id}`,title:x.school_name,detail:x.notes||"School research",type:"School",href:"#school-research"}))
    ]);
    const next:Record<string,SchoolFlow>={};for(const school of schools)next[school]={};
    for(const x of colleges.data??[]){const name=schools.find(s=>s.toLowerCase()===x.college_name.toLowerCase());if(name)next[name]={...next[name],application:x.status,applicationDeadline:x.deadline??""}}
    for(const x of aid.data??[]){const name=schools.find(s=>s.toLowerCase()===x.school_name.toLowerCase());if(name)next[name]={...next[name],aid:x.status,aidDeadline:x.deadline??""}}
    for(const x of visits.data??[]){const name=schools.find(s=>s.toLowerCase()===x.college_name.toLowerCase());if(name)next[name]={...next[name],visit:x.status}}
    for(const x of notes.data??[]){const name=schools.find(s=>s.toLowerCase()===x.school_name.toLowerCase());if(name)next[name]={...next[name],applicationDeadline:x.application_deadline??next[name]?.applicationDeadline,aidDeadline:x.financial_aid_deadline??next[name]?.aidDeadline,notes:x.notes}}
    setFlows(next);
  })},[userId,schools]);
  const results=useMemo(()=>{const q=query.trim().toLowerCase();return q?items.filter(x=>`${x.title} ${x.detail} ${x.type}`.toLowerCase().includes(q)).slice(0,20):items.slice(0,8)},[items,query]);
  async function exportData(){setExporting(true);setMessage("");const tables=["student_profiles","student_steps","saved_resources","resource_activity","resource_collections","collection_resources","college_applications","scholarship_applications","recommendation_requests","financial_aid_plans","financial_aid_offers","test_plans","practice_test_logs","essay_drafts","resume_versions","interview_preparations","interview_practice_sessions","college_visits","study_sessions","school_research_notes","school_comparisons","student_weekly_focus","student_feedback","student_document_checklist","student_notification_preferences","student_notification_dismissals","student_advisor_briefs","student_college_decisions","student_support_contacts","student_submission_checkpoints","student_progress_snapshots"];
    const data:Record<string,unknown>={exported_at:new Date().toISOString(),account_email:email};for(const table of tables){const column=table==="student_profiles"?"id":"user_id";const result=await supabase.from(table).select("*").eq(column,userId);if(!result.error)data[table]=result.data}
    const blob=new Blob([JSON.stringify(data,null,2)],{type:"application/json"}),url=URL.createObjectURL(blob),a=document.createElement("a");a.href=url;a.download=`future-waymark-data-${new Date().toISOString().slice(0,10)}.json`;a.click();URL.revokeObjectURL(url);setExporting(false);setMessage("Your data export was downloaded.")}
  function clearLocalDrafts(){localStorage.removeItem("future-waymark-unsaved-draft-v1");setMessage("Draft-recovery data was removed from this device.")}
  async function deleteAccount(){if(deleteText!=="DELETE")return;const{error}=await supabase.rpc("delete_own_future_waymark_account");if(error)return setMessage(error.message);localStorage.removeItem("future-waymark-unsaved-draft-v1");await supabase.auth.signOut();window.location.href="/"}
  return <><div className="utility-launchers"><button onClick={()=>setSearchOpen(true)}>⌕ Search my work</button><button onClick={()=>setHelpOpen(true)}>? Help with terms</button></div>{searchOpen&&<div className="modal-backdrop"><section className="student-search" role="dialog" aria-modal="true" aria-labelledby="search-title"><button className="close" onClick={()=>setSearchOpen(false)}>×</button><span className="kicker dark">MY WAYMARK SEARCH</span><h2 id="search-title">Find anything you saved.</h2><input autoFocus value={query} onChange={e=>setQuery(e.target.value)} placeholder="Search schools, essays, scholarships, goals, and more"/><div>{results.map(x=><a key={x.id} href={x.href} onClick={()=>setSearchOpen(false)}><span>{x.type}</span><b>{x.title}</b><small>{x.detail}</small></a>)}</div></section></div>}{helpOpen&&<div className="modal-backdrop"><section className="glossary-panel" role="dialog" aria-modal="true" aria-labelledby="glossary-title"><button className="close" onClick={()=>setHelpOpen(false)}>×</button><span className="kicker dark">PLAIN-LANGUAGE HELP</span><h2 id="glossary-title">Admissions and financial-aid terms</h2>{glossary.map(([term,definition])=><details key={term}><summary>{term}</summary><p>{definition}</p></details>)}<p className="official-note">Policies vary. Confirm definitions, eligibility, and requirements with the appropriate college or official organization.</p></section></div>}<section className="school-workspaces" id="school-workspaces"><div><span className="kicker dark">SCHOOL WORKSPACES</span><h2>Everything connected to each school.</h2><p>Use these summaries to move between research, applications, financial aid, visits, and your private notes.</p></div>{schools.length?<div className="workspace-grid">{schools.map(s=>{const f=flows[s]??{};return <article key={s}><h3>{s}</h3><div><a href="#school-research"><b>Research</b><span>{f.notes?"Notes saved":"Review school profile"}</span></a><a href="#applications"><b>Application</b><span>{f.application||"Not started"}{f.applicationDeadline&&` · ${f.applicationDeadline}`}</span></a><a href="#financial-aid"><b>Financial aid</b><span>{f.aid||"No offer recorded"}{f.aidDeadline&&` · ${f.aidDeadline}`}</span></a><a href="#college-visits"><b>Visit</b><span>{f.visit||"Not planned"}</span></a></div></article>})}</div>:<p className="empty-note">Add schools in the School Research Center to create school workspaces.</p>}</section><section className="privacy-center" id="privacy"><div><span className="kicker dark">PRIVACY & YOUR DATA</span><h2>You control your Future Waymark information.</h2><p>Download a copy, remove device-local recovery drafts, or permanently delete your account and saved app data.</p>{message&&<div className="form-message" role="status">{message}</div>}</div><div className="privacy-actions"><button onClick={exportData} disabled={exporting}>{exporting?"Preparing export…":"Download my data"}</button><button onClick={clearLocalDrafts}>Clear local draft recovery</button><div className="delete-account"><b>Delete account permanently</b><p>This cannot be undone. All Future Waymark records connected to this account will be deleted.</p><label>Type DELETE to confirm<input value={deleteText} onChange={e=>setDeleteText(e.target.value)}/></label><button className="danger" disabled={deleteText!=="DELETE"} onClick={deleteAccount}>Permanently delete my account</button></div></div></section></>}
