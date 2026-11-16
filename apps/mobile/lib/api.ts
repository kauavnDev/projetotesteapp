import {useAuth} from "../store/auth";
const BASE=process.env.EXPO_PUBLIC_API_URL||"http://localhost:8787/v1";
export async function api(path:string,options:RequestInit={}){
 const state=useAuth.getState(),headers={...(options.headers as any),...(state.accessToken?{Authorization:`Bearer ${state.accessToken}`}:{})};
 let response=await fetch(BASE+path,{...options,headers});
 if(response.status===401&&state.refreshToken&&path!=="/auth/refresh"){
  const rr=await fetch(BASE+"/auth/refresh",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({refreshToken:state.refreshToken})});
  if(rr.ok){const next=await rr.json();useAuth.getState().setSession(next);response=await fetch(BASE+path,{...options,headers:{...(options.headers as any),Authorization:`Bearer ${next.accessToken}`}})}else useAuth.getState().clear();
 }
 const data=await response.json().catch(()=>({}));
 if(!response.ok)throw new Error(data.error?.message||"Não foi possível concluir.");
 return data;
}
