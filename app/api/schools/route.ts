import { NextRequest, NextResponse } from "next/server";

export async function GET(request:NextRequest){
  const rawQuery=request.nextUrl.searchParams.get("q")?.trim()??"";
  const alias=rawQuery.toUpperCase().replace(/[^A-Z0-9&]/g,"");
  const query=({"NCA&T":"North Carolina A & T State University","NCAT":"North Carolina A & T State University","A&T":"North Carolina A & T State University"} as Record<string,string>)[alias]??rawQuery;
  if(query.length<2)return NextResponse.json({schools:[]});
  const params=new URLSearchParams({api_key:"DEMO_KEY","school.name":query,"school.operating":"1",_fields:"id,school.name,school.city,school.state",per_page:"20"});
  try{
    const response=await fetch(`https://api.data.gov/ed/collegescorecard/v1/schools?${params}`,{next:{revalidate:86400}});
    if(!response.ok)throw new Error("School directory unavailable");
    const body=await response.json();
    return NextResponse.json({schools:(body.results??[]).map((school:Record<string,string|number>)=>({id:school.id,name:school["school.name"],city:school["school.city"],state:school["school.state"]}))});
  }catch{return NextResponse.json({schools:[],error:"School search is temporarily unavailable."},{status:503})}
}
