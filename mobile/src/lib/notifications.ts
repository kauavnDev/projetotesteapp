import * as Notifications from "expo-notifications";
import * as Device from "expo-device";
import { api } from "./api";

export async function registerForPush() {
  if (!Device.isDevice) return;
  const { status } = await Notifications.getPermissionsAsync();
  let finalStatus = status;
  if (status !== "granted") {
    const ask = await Notifications.requestPermissionsAsync();
    finalStatus = ask.status;
  }
  if (finalStatus !== "granted") return;
  const token = (await Notifications.getExpoPushTokenAsync()).data;
  await api.post("/users/me/push-token", { token, platform: "android" });
}