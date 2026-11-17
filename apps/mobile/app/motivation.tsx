import {useEffect,useState} from "react";
import {View,Text,Pressable,StyleSheet,Switch,ScrollView,ActivityIndicator,Alert} from "react-native";
import {router} from "expo-router";
import {api} from "../lib/api";
const fallback={text:"Ninguém vai construir a vida que você quer por você. Levanta, faz o que precisa ser feito e prova pra si mesmo do que é capaz.",color:"#FB923C",author:"Forge",animation:"fade"};
export default function Motivation(){
 const [quote,setQuote]=useState<any>(fallback),[show,setShow]=useState(true),[loading,setLoading]=useState(true),[saving,setSaving]=useState(false);
 useEffect(()=>{(async()=>{try{const [q,p]=await Promise.all([api("/quotes/today"),api("/preferences")]);setQuote(q);setShow(p.showMotivationOnOpen)}catch{Alert.alert("Aviso","Não consegui carregar suas preferências. Você ainda pode continuar.")}finally{setLoading(false)}})()},[]);
 async function toggle(value:boolean){setShow(value);setSaving(true);try{await api("/preferences",{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify({showMotivationOnOpen:value})})}catch(e:any){setShow(!value);Alert.alert("Não foi salvo",e.message)}finally{setSaving(false)}}
 return <ScrollView contentContainerStyle={s.page}>
  <Text style={s.brand}>FORGE <Text style={s.dot}>/ MINDSET</Text></Text>
  <View style={s.top}><Text style={s.eyebrow}>UM NOVO DIA. UMA NOVA CHANCE.</Text><Text style={s.greeting}>Bom te ver de volta.</Text><Text style={s.sub}>Antes de começar, lembra do que você está construindo.</Text></View>
  <View style={s.quote}><Text style={s.spark}>✦  SUA MENSAGEM DE HOJE</Text><Text style={[s.quoteText,{color:quote?.color||"#FB923C"}]}>{quote?.text||fallback.text}</Text><Text style={s.author}>— {quote?.author||"Forge"}</Text><View style={s.line}/><Text style={s.small}>Não espere o momento perfeito. Faça o próximo movimento.</Text></View>
  <View style={s.preference}><View style={{flex:1}}><Text style={s.prefTitle}>Ver motivação ao abrir</Text><Text style={s.prefSub}>Quando ativado, esta tela aparece sempre que você entrar na sua conta.</Text></View><Switch value={show} onValueChange={toggle} disabled={saving} trackColor={{false:"#454552",true:"#E11D48"}} thumbColor="#FFFFFF"/></View>
  {saving&&<Text style={s.saving}>Salvando preferência...</Text>}
  <Pressable style={s.primary} onPress={()=>router.replace("/home")}><Text style={s.primaryText}>ENTRAR NO MEU DIA  →</Text></Pressable>
  <Pressable style={s.secondary} onPress={()=>router.push("/habits")}><Text style={s.secondaryText}>Abrir minha rotina</Text></Pressable>
  {loading&&<ActivityIndicator color="#FB923C" style={{marginTop:18}}/>}
  <Text style={s.footer}>DISCIPLINA NO PROCESSO. ORGULHO NO RESULTADO.</Text>
 </ScrollView>
}
const s=StyleSheet.create({page:{flexGrow:1,backgroundColor:"#09090F",padding:24,paddingTop:64,justifyContent:"center"},brand:{color:"#F4F4F5",fontSize:12,fontWeight:"900",letterSpacing:4},dot:{color:"#FB923C"},top:{marginTop:58,marginBottom:26},eyebrow:{color:"#FB923C",fontSize:10,fontWeight:"800",letterSpacing:2},greeting:{fontFamily:"Sora_700Bold_Italic",fontStyle:"italic",fontSize:34,color:"white",marginTop:12},sub:{color:"#A1A1AA",fontSize:14,lineHeight:21,marginTop:8},quote:{backgroundColor:"#19151B",borderColor:"#6A263C",borderWidth:1,borderRadius:24,padding:23},spark:{color:"#FB923C",fontSize:10,fontWeight:"800",letterSpacing:2},quoteText:{fontFamily:"Sora_700Bold_Italic",fontStyle:"italic",fontSize:25,lineHeight:35,marginTop:24},author:{color:"#D4D4D8",fontSize:13,marginTop:20},line:{height:1,backgroundColor:"#39303A",marginVertical:18},small:{color:"#A1A1AA",fontSize:12,lineHeight:18},preference:{backgroundColor:"#171720",borderRadius:17,padding:16,marginTop:22,flexDirection:"row",alignItems:"center",gap:14},prefTitle:{color:"white",fontWeight:"800",fontSize:14},prefSub:{color:"#999",fontSize:11,lineHeight:16,marginTop:5},saving:{color:"#FB923C",fontSize:11,marginTop:8},primary:{backgroundColor:"#E11D48",padding:18,borderRadius:15,alignItems:"center",marginTop:24},primaryText:{color:"white",fontSize:12,fontWeight:"900",letterSpacing:1},secondary:{padding:15,alignItems:"center"},secondaryText:{color:"#FB923C",fontWeight:"700"},footer:{color:"#666675",fontSize:9,textAlign:"center",letterSpacing:1.8,marginTop:28}});
