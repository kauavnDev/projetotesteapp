import * as Haptics from "expo-haptics";import {useCallback,useEffect,useState} from "react";
import {View,Text,TextInput,Pressable,ScrollView,StyleSheet,Alert,Switch} from "react-native";
import * as Notifications from "expo-notifications";
import {api} from "../lib/api";
import {router} from "expo-router";

type Alarm={id:string;parentAlarmId:string|null;habitId:string|null;time:string;days:number[];enabled:boolean;overrideDate:string|null};
const weekdayNames=["Dom","Seg","Ter","Qua","Qui","Sex","Sáb"];
export default function Alarms(){
 const [items,setItems]=useState<Alarm[]>([]),[time,setTime]=useState("07:00"),[days,setDays]=useState<number[]>([]),[exceptionDate,setExceptionDate]=useState(""),[exceptionTime,setExceptionTime]=useState("08:00"),[exceptionParent,setExceptionParent]=useState(""),[editing,setEditing]=useState<string|null>(null),[busy,setBusy]=useState(false);
 const schedule=useCallback(async(rows:Alarm[])=>{
  const permission=await Notifications.getPermissionsAsync();
  if(!permission.granted){const requested=await Notifications.requestPermissionsAsync();if(!requested.granted)return;}
  await Notifications.setNotificationChannelAsync("forge-reminders",{name:"Lembretes Forge",importance:Notifications.AndroidImportance.HIGH});
  const existing=await Notifications.getAllScheduledNotificationsAsync();
  for(const n of existing)if((n.content.data as any)?.forgeAlarmId)await Notifications.cancelScheduledNotificationAsync(n.identifier);
  const overrides=rows.filter(a=>a.parentAlarmId&&a.overrideDate);
  const makeTrigger=(date:Date)=>date;
  for(const alarm of rows.filter(a=>a.enabled&&!a.overrideDate&&!a.parentAlarmId)){
   // Schedule concrete dates for the next 30 days so a one-day exception replaces, rather than duplicates, the recurring reminder.
   for(let offset=0;offset<30;offset++){
    const date=new Date();date.setDate(date.getDate()+offset);date.setSeconds(0,0);
    if(alarm.days?.length&&!alarm.days.includes(date.getDay()))continue;
    const dateKey=`${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,"0")}-${String(date.getDate()).padStart(2,"0")}`;
    const exception=overrides.find(o=>o.parentAlarmId===alarm.id&&o.overrideDate===dateKey);
    if(exception&&!exception.enabled)continue;
    const chosen=exception??alarm;date.setHours(Number(chosen.time.slice(0,2)),Number(chosen.time.slice(3,5)),0,0);
    if(date.getTime()<=Date.now())continue;
    await Notifications.scheduleNotificationAsync({content:{title:"Forge · hora de agir",body:"Um pequeno passo hoje constrói o seu amanhã.",data:{forgeAlarmId:chosen.id}},trigger:makeTrigger(date)});
   }
  }
 },[]);
 const load=useCallback(async()=>{try{const rows=await api("/alarms");setItems(rows);await schedule(rows)}catch(e:any){Alert.alert("Erro ao carregar",e.message)}},[schedule]);
 useEffect(()=>{load()},[load]);
 async function create(exception=false){try{await Haptics.selectionAsync();setBusy(true);const payload=exception?{time:exceptionTime,enabled:true,overrideDate:exceptionDate,days:[],parentAlarmId:exceptionParent}:{time,enabled:true,days};await api("/alarms",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(payload)});setExceptionDate("");await load();Alert.alert("Alarme salvo","O lembrete foi sincronizado neste aparelho.")}catch(e:any){Alert.alert("Não foi possível salvar",e.message)}finally{setBusy(false)}}
 async function update(id:string,patch:any){try{await api(`/alarms/${id}`,{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify(patch)});await load();setEditing(null)}catch(e:any){Alert.alert("Erro",e.message)}}
 async function remove(id:string){try{await api(`/alarms/${id}`,{method:"DELETE"});await load()}catch(e:any){Alert.alert("Erro",e.message)}}
 function toggleDay(day:number){setDays(v=>v.includes(day)?v.filter(x=>x!==day):[...v,day].sort())}
 return <ScrollView style={s.page} contentContainerStyle={{paddingBottom:40}}><Pressable onPress={()=>router.back()}><Text style={s.back}>← Voltar</Text></Pressable><Text style={s.title}>Seus alarmes.</Text><Text style={s.copy}>Os lembretes são locais e ficam agendados neste aparelho. Uma exceção muda apenas a data escolhida.</Text>
 <View style={s.card}><Text style={s.section}>Novo alarme recorrente</Text><TextInput style={s.input} value={time} onChangeText={setTime} placeholder="HH:MM" placeholderTextColor="#888"/><View style={s.days}>{weekdayNames.map((d,i)=><Pressable key={d} onPress={()=>toggleDay(i)} style={[s.day,days.includes(i)&&s.dayOn]}><Text style={s.dayText}>{d}</Text></Pressable>)}</View><Text style={s.note}>Nenhum dia selecionado = todos os dias.</Text><Pressable style={s.btn} disabled={busy} onPress={()=>create(false)}><Text style={s.btnText}>Adicionar alarme</Text></Pressable></View>
 <View style={s.card}><Text style={s.section}>Exceção de um dia</Text><Text style={s.note}>Selecione o alarme que será substituído somente nessa data.</Text><View style={s.days}>{items.filter(a=>!a.overrideDate&&!a.parentAlarmId).map(a=><Pressable key={a.id} onPress={()=>setExceptionParent(a.id)} style={[s.day,exceptionParent===a.id&&s.dayOn]}><Text style={s.dayText}>{a.time}</Text></Pressable>)}</View><TextInput style={s.input} value={exceptionDate} onChangeText={setExceptionDate} placeholder="Data AAAA-MM-DD" placeholderTextColor="#888"/><TextInput style={s.input} value={exceptionTime} onChangeText={setExceptionTime} placeholder="Novo horário HH:MM" placeholderTextColor="#888"/><Pressable style={s.btn} disabled={busy||!exceptionDate||!exceptionParent} onPress={()=>create(true)}><Text style={s.btnText}>Salvar exceção</Text></Pressable></View>
 <Text style={s.section}>Agendamentos</Text>{items.map(a=><View key={a.id} style={s.row}><View style={{flex:1}}><Text style={s.itemTitle}>{a.time} {a.overrideDate?`· ${a.overrideDate}`:""}</Text><Text style={s.note}>{a.overrideDate?"Exceção de data":a.days?.length?a.days.map(d=>weekdayNames[d]).join(", "):"Todos os dias"}</Text>{editing===a.id&&<TextInput style={s.input} defaultValue={a.time} onEndEditing={e=>update(a.id,{time:e.nativeEvent.text})} placeholder="HH:MM"/>}</View><Switch value={a.enabled} onValueChange={v=>update(a.id,{enabled:v})}/><Pressable onPress={()=>setEditing(editing===a.id?null:a.id)}><Text style={s.action}>Editar</Text></Pressable><Pressable onPress={()=>remove(a.id)}><Text style={s.delete}>Excluir</Text></Pressable></View>)}{!items.length&&<Text style={s.note}>Você ainda não tem alarmes configurados.</Text>}</ScrollView>
}
const s=StyleSheet.create({page:{flex:1,backgroundColor:"#09090F",padding:22,paddingTop:55},back:{color:"#FB923C"},title:{fontFamily:"Sora_700Bold_Italic",fontStyle:"italic",color:"white",fontSize:34,fontWeight:"800",marginVertical:22},copy:{color:"#999",lineHeight:21,marginBottom:16},card:{backgroundColor:"#171720",borderRadius:18,padding:16,marginBottom:14},section:{fontFamily:"Sora_600SemiBold_Italic",fontStyle:"italic",color:"white",fontSize:19,fontWeight:"800",marginBottom:12},input:{backgroundColor:"#242430",color:"white",padding:14,borderRadius:12,marginBottom:10},days:{flexDirection:"row",gap:5,justifyContent:"space-between"},day:{padding:9,borderRadius:10,backgroundColor:"#292936"},dayOn:{backgroundColor:"#E11D48"},dayText:{color:"white",fontSize:12},note:{color:"#92929F",fontSize:12,marginVertical:8},btn:{backgroundColor:"#E11D48",padding:15,borderRadius:12,alignItems:"center",marginTop:8},btnText:{color:"white",fontWeight:"800"},row:{backgroundColor:"#171720",padding:14,borderRadius:14,marginBottom:8,flexDirection:"row",alignItems:"center",gap:9},itemTitle:{color:"white",fontWeight:"800"},action:{color:"#FB923C",fontWeight:"700"},delete:{color:"#FDA4AF",fontWeight:"700"}});
