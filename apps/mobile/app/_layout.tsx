import {Stack} from "expo-router";
import {StatusBar} from "expo-status-bar";
import {Text,useColorScheme} from "react-native";
import {useFonts,Inter_400Regular,Inter_500Medium,Inter_600SemiBold,Inter_700Bold} from "@expo-google-fonts/inter";
import {Sora_600SemiBold_Italic,Sora_700Bold_Italic} from "@expo-google-fonts/sora";
import "react-native-reanimated";
import * as Notifications from "expo-notifications";
Notifications.setNotificationHandler({handleNotification:async()=>({shouldShowAlert:true,shouldPlaySound:true,shouldSetBadge:false})});
export default function Layout(){const dark=useColorScheme()==="dark";const [loaded]=useFonts({Inter_400Regular,Inter_500Medium,Inter_600SemiBold,Inter_700Bold,Sora_600SemiBold_Italic,Sora_700Bold_Italic});if(!loaded)return null;const NativeText=Text as any;NativeText.defaultProps={...(NativeText.defaultProps||{}),style:[{fontFamily:"Inter_400Regular"},NativeText.defaultProps?.style]};return <><StatusBar style={dark?"light":"dark"}/><Stack screenOptions={{headerShown:false,animation:"fade",contentStyle:{backgroundColor:dark?"#09090F":"#F8F7F8"}}}/></>}
