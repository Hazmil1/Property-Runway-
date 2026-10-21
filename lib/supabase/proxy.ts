import {sameApplicationOrigin} from "../http-origin";
import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

const publicPath=(path:string)=>
  path==="/demo"||
  path==="/demo.html"||
  path==="/login"||
  path.startsWith("/auth/")||
  path==="/prototype.html"||
  path==="/api/health"||
  path==="/api/notifications/dispatch";

const unsafe=new Set(["POST","PUT","PATCH","DELETE"]);
function originAllowed(request:NextRequest){
 if(!unsafe.has(request.method)||!request.nextUrl.pathname.startsWith("/api/"))return true;
 if(request.nextUrl.pathname==="/api/notifications/dispatch")return true;
 const origin=request.headers.get("origin");
 if(!origin)return false;
 return sameApplicationOrigin(origin,request.nextUrl.origin,process.env.NEXT_PUBLIC_APP_URL);
}

export async function updateSession(request: NextRequest) {
  if(process.env.DEMO_ONLY==="true"){
   if(request.nextUrl.pathname.startsWith("/api/")&&request.nextUrl.pathname!=="/api/health")return NextResponse.json({error:"This demo does not access live portfolio data"},{status:403});
   if(!["/demo","/demo.html","/api/health"].includes(request.nextUrl.pathname)&&!request.nextUrl.pathname.startsWith("/_next/"))return NextResponse.redirect(new URL("/demo.html",request.url));
   return NextResponse.next({request});
  }
  if(!originAllowed(request))return NextResponse.json({error:"Invalid request origin"},{status:403});

  const url=process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key=process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (process.env.NODE_ENV!=="production"&&process.env.ALLOW_DEV_AUTH==="true") return NextResponse.next({request});

  if (!url || !key) {
    if (publicPath(request.nextUrl.pathname)) return NextResponse.next({request});
    const login=request.nextUrl.clone();
    login.pathname="/login";
    login.searchParams.set("next",request.nextUrl.pathname);
    login.searchParams.set("setup","supabase");
    return NextResponse.redirect(login);
  }

  let response=NextResponse.next({request});
  const supabase=createServerClient(url,key,{
    cookies:{
      getAll:()=>request.cookies.getAll(),
      setAll(cookiesToSet){
        cookiesToSet.forEach(({name,value})=>request.cookies.set(name,value));
        response=NextResponse.next({request});
        cookiesToSet.forEach(({name,value,options})=>response.cookies.set(name,value,options));
      }
    }
  });

  const {data}=await supabase.auth.getClaims();
  if(!data?.claims && !publicPath(request.nextUrl.pathname)){
    const login=request.nextUrl.clone();login.pathname="/login";login.searchParams.set("next",request.nextUrl.pathname);return NextResponse.redirect(login);
  }
  if(data?.claims && request.nextUrl.pathname==="/login"){
    const home=request.nextUrl.clone();home.pathname="/";home.search="";return NextResponse.redirect(home);
  }
  return response;
}
