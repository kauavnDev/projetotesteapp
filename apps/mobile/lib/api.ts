import {useAuth} from "../store/auth";

export const API_BASE=(process.env.EXPO_PUBLIC_API_URL??"").replace(/\/+$/,"");
const endpoint=(path:string)=>`${API_BASE}${path.startsWith("/")?path:`/${path}`}`;

export async function api(path:string,options:RequestInit={}){
 if(!API_BASE)throw new Error("API não configurada. Defina EXPO_PUBLIC_API_URL no ambiente do aplicativo.");
 const current=useAuth.getState();
 const headers=new Headers(options.headers);
 if(current.accessToken)headers.set("Authorization",`Bearer ${current.accessToken}`);
 let response=await fetch(endpoint(path),{...options,headers});
 if(response.status===401&&current.refreshToken&&path!=="/auth/refresh"){
  const refreshed=await fetch(endpoint("/auth/refresh"),{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({refreshToken:current.refreshToken})});
  if(refreshed.ok){
   const next=await refreshed.json();
   useAuth.getState().setSession(next);
   const retryHeaders=new Headers(options.headers);
   retryHeaders.set("Authorization",`Bearer ${next.accessToken}`);
   response=await fetch(endpoint(path),{...options,headers:retryHeaders});
  }else useAuth.getState().clear();
 }
 const data=await response.json().catch(()=>({}));
 if(!response.ok)throw new Error(data.error?.message||"Não foi possível concluir.");
 return data;
}
