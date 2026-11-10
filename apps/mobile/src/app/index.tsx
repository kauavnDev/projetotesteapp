import { Redirect } from "expo-router";
import { View, ActivityIndicator } from "react-native";
import { useAuth } from "../stores/auth";
import { useTheme } from "../theme";

export default function Gate() {
  const { user, loading } = useAuth();
  const { colors } = useTheme();
  if (loading) return <View style={{ flex: 1, backgroundColor: colors.bg, alignItems: "center", justifyContent: "center" }}><ActivityIndicator color={colors.primary} /></View>;
  if (!user) return <Redirect href="/(auth)/login" />;
  if (!user.onboardingCompleted) return <Redirect href="/(onboarding)/welcome" />;
  return <Redirect href="/(tabs)" />;
}