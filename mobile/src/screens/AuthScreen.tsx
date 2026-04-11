import AsyncStorage from "@react-native-async-storage/async-storage";
import { type NativeStackScreenProps } from "@react-navigation/native-stack";
import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { apiLogin, apiSignup } from "../api/client";
import { type RootStackParamList } from "../navigation";

type Props = NativeStackScreenProps<RootStackParamList, "Auth">;
type AuthMode = "signup" | "login";

export function AuthScreen({ navigation }: Props) {
  const [mode, setMode] = useState<AuthMode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit() {
    if (!email.trim() || !password.trim()) {
      Alert.alert("Missing fields", "Please enter your email and password.");
      return;
    }
    setLoading(true);
    try {
      if (mode === "signup") {
        const message = await apiSignup(email.trim(), password);
        Alert.alert("Account created", `${message}\n\nYou can now log in.`, [
          { text: "OK", onPress: () => setMode("login") },
        ]);
      } else {
        const { accessToken } = await apiLogin(email.trim(), password);
        await AsyncStorage.setItem("accessToken", accessToken);
        await AsyncStorage.setItem("userEmail", email.trim());
        navigation.replace("Home", { token: accessToken, email: email.trim() });
      }
    } catch (err) {
      Alert.alert("Error", err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={styles.kav}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <View style={styles.hero}>
            <Text style={styles.eyebrow}>Todo Manager</Text>
            <Text style={styles.headline}>Your tasks,{"\n"}organised.</Text>
            <Text style={styles.lede}>
              {mode === "signup" ? "Create an account to start." : "Log in to access your lists."}
            </Text>
          </View>

          <View style={styles.card}>
            <View style={styles.modeRow}>
              <Pressable
                style={[styles.modeBtn, mode === "signup" && styles.modeBtnActive]}
                onPress={() => setMode("signup")}
              >
                <Text style={[styles.modeBtnText, mode === "signup" && styles.modeBtnTextActive]}>
                  Sign up
                </Text>
              </Pressable>
              <Pressable
                style={[styles.modeBtn, mode === "login" && styles.modeBtnActive]}
                onPress={() => setMode("login")}
              >
                <Text style={[styles.modeBtnText, mode === "login" && styles.modeBtnTextActive]}>
                  Log in
                </Text>
              </Pressable>
            </View>

            <Text style={styles.label}>Email</Text>
            <TextInput
              style={styles.input}
              value={email}
              onChangeText={setEmail}
              placeholder="you@example.com"
              placeholderTextColor="#9ca3af"
              autoCapitalize="none"
              keyboardType="email-address"
              autoComplete="email"
            />

            <Text style={styles.label}>Password</Text>
            <TextInput
              style={styles.input}
              value={password}
              onChangeText={setPassword}
              placeholder="Enter a password"
              placeholderTextColor="#9ca3af"
              secureTextEntry
            />

            <Pressable
              style={[styles.submitBtn, loading && styles.submitBtnDisabled]}
              onPress={() => void handleSubmit()}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.submitBtnText}>
                  {mode === "signup" ? "Create account" : "Log in"}
                </Text>
              )}
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#1a1a2e" },
  kav: { flex: 1 },
  scroll: { flexGrow: 1, padding: 24, justifyContent: "center" },
  hero: { marginBottom: 32 },
  eyebrow: {
    color: "#7c6af7", fontSize: 13, fontWeight: "600",
    letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 8,
  },
  headline: { color: "#fff", fontSize: 36, fontWeight: "700", lineHeight: 44, marginBottom: 12 },
  lede: { color: "#9ca3af", fontSize: 16, lineHeight: 24 },
  card: { backgroundColor: "#16213e", borderRadius: 16, padding: 24 },
  modeRow: {
    flexDirection: "row", backgroundColor: "#0f3460",
    borderRadius: 10, padding: 4, marginBottom: 24,
  },
  modeBtn: { flex: 1, paddingVertical: 10, borderRadius: 8, alignItems: "center" },
  modeBtnActive: { backgroundColor: "#7c6af7" },
  modeBtnText: { color: "#9ca3af", fontWeight: "600", fontSize: 14 },
  modeBtnTextActive: { color: "#fff" },
  label: { color: "#d1d5db", fontSize: 14, fontWeight: "600", marginBottom: 6, marginTop: 4 },
  input: {
    backgroundColor: "#0f3460", color: "#fff", borderRadius: 10,
    paddingHorizontal: 16, paddingVertical: 14, fontSize: 16,
    marginBottom: 16, borderWidth: 1, borderColor: "#1e4a8a",
  },
  submitBtn: { backgroundColor: "#7c6af7", borderRadius: 10, paddingVertical: 16, alignItems: "center", marginTop: 8 },
  submitBtnDisabled: { opacity: 0.6 },
  submitBtnText: { color: "#fff", fontSize: 16, fontWeight: "700" },
});
