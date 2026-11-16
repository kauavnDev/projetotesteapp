import {create} from "zustand";
type User={id:string;name:string;email:string;role:string};
type State={accessToken:string|null;refreshToken:string|null;user:User|null;setSession:(d:any)=>void;clear:()=>void};
export const useAuth=create<State>(set=>({accessToken:null,refreshToken:null,user:null,setSession:d=>set({accessToken:d.accessToken,refreshToken:d.refreshToken,user:d.user}),clear:()=>set({accessToken:null,refreshToken:null,user:null})}));
