import AsyncStorage from "@react-native-async-storage/async-storage";
import { type NativeStackScreenProps } from "@react-navigation/native-stack";
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { apiCreateList, apiDeleteList, apiGetLists, apiLogout, type TodoList } from "../api/client";
import { type RootStackParamList } from "../navigation";

type Props = NativeStackScreenProps<RootStackParamList, "Home">;

export function HomeScreen({ route, navigation }: Props) {
  const { token, email } = route.params;
  const [lists, setLists] = useState<TodoList[]>([]);
  const [listName, setListName] = useState("");
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);

  const loadLists = useCallback(async () => {
    try {
      const data = await apiGetLists(token);
      setLists(data);
    } catch (err) {
      Alert.alert("Error", err instanceof Error ? err.message : "Could not load lists");
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => { void loadLists(); }, [loadLists]);

  useEffect(() => {
    return navigation.addListener("focus", () => { void loadLists(); });
  }, [navigation, loadLists]);

  async function handleCreateList() {
    if (!listName.trim()) return;
    setCreating(true);
    try {
      const newList = await apiCreateList(token, listName.trim());
      setLists((cur) => [...cur, newList]);
      setListName("");
    } catch (err) {
      Alert.alert("Error", err instanceof Error ? err.message : "Could not create list");
    } finally {
      setCreating(false);
    }
  }

  function confirmDeleteList(list: TodoList) {
    Alert.alert("Delete list", `Delete "${list.name}" and all its todos?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete", style: "destructive",
        onPress: async () => {
          try {
            await apiDeleteList(token, list.id);
            setLists((cur) => cur.filter((l) => l.id !== list.id));
          } catch (err) {
            Alert.alert("Error", err instanceof Error ? err.message : "Could not delete list");
          }
        },
      },
    ]);
  }

  function confirmLogout() {
    Alert.alert("Log out", "Are you sure?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Log out", style: "destructive",
        onPress: async () => {
          try { await apiLogout(token); } finally {
            await AsyncStorage.multiRemove(["accessToken", "userEmail"]);
            navigation.replace("Auth");
          }
        },
      },
    ]);
  }

  const totalTodos = lists.reduce((s, l) => s + l.todos.length, 0);
  const doneTodos = lists.reduce((s, l) => s + l.todos.filter((t) => t.completed).length, 0);
  const pct = totalTodos > 0 ? Math.round((doneTodos / totalTodos) * 100) : 0;

  function renderList({ item }: { item: TodoList }) {
    const done = item.todos.filter((t) => t.completed).length;
    const total = item.todos.length;
    const listPct = total > 0 ? Math.round((done / total) * 100) : 0;
    return (
      <Pressable
        style={styles.card}
        onPress={() => navigation.navigate("ListDetail", { token, listId: item.id, listName: item.name })}
      >
        <View style={styles.cardHeader}>
          <Text style={styles.cardName} numberOfLines={1}>{item.name}</Text>
          <View style={styles.cardRight}>
            <Text style={styles.cardCount}>{done}/{total}</Text>
            <Pressable style={styles.deleteBtn} onPress={() => confirmDeleteList(item)} hitSlop={8}>
              <Text style={styles.deleteBtnText}>×</Text>
            </Pressable>
          </View>
        </View>
        {total > 0 && (
          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: `${listPct}%` }]} />
          </View>
        )}
        <Text style={styles.cardSub}>
          {total === 0 ? "No items yet — tap to add" : `${listPct}% complete`}
        </Text>
      </Pressable>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
      <View style={styles.header}>
        <View>
          <Text style={styles.eyebrow}>Todo Manager</Text>
          <Text style={styles.title}>Your lists</Text>
        </View>
        <Pressable style={styles.logoutBtn} onPress={confirmLogout}>
          <Text style={styles.logoutText}>Log out</Text>
        </Pressable>
      </View>

      <View style={styles.summaryCard}>
        <View style={styles.summaryRow}>
          <View>
            <Text style={styles.summaryEmail} numberOfLines={1}>{email}</Text>
            <Text style={styles.summaryStats}>{doneTodos}/{totalTodos} todos done</Text>
          </View>
          <Text style={styles.summaryPct}>{pct}%</Text>
        </View>
        {totalTodos > 0 && (
          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: `${pct}%` }]} />
          </View>
        )}
      </View>

      <View style={styles.createRow}>
        <TextInput
          style={styles.input}
          value={listName}
          onChangeText={setListName}
          placeholder="New list name…"
          placeholderTextColor="#9ca3af"
          returnKeyType="done"
          onSubmitEditing={() => void handleCreateList()}
        />
        <Pressable style={[styles.addBtn, creating && styles.addBtnDisabled]} onPress={() => void handleCreateList()} disabled={creating}>
          {creating ? <ActivityIndicator color="#fff" size="small" /> : <Text style={styles.addBtnText}>+ Add</Text>}
        </Pressable>
      </View>

      {loading ? (
        <View style={styles.centered}><ActivityIndicator color="#7c6af7" size="large" /></View>
      ) : lists.length === 0 ? (
        <View style={styles.centered}>
          <Text style={styles.emptyIcon}>📋</Text>
          <Text style={styles.emptyText}>No lists yet. Create one above to get started.</Text>
        </View>
      ) : (
        <FlatList
          data={lists}
          keyExtractor={(item) => item.id}
          renderItem={renderList}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#1a1a2e" },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", paddingHorizontal: 20, paddingTop: 8, paddingBottom: 16 },
  eyebrow: { color: "#7c6af7", fontSize: 11, fontWeight: "600", letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 2 },
  title: { color: "#fff", fontSize: 26, fontWeight: "700" },
  logoutBtn: { backgroundColor: "#16213e", borderRadius: 8, paddingHorizontal: 14, paddingVertical: 8, marginTop: 4 },
  logoutText: { color: "#ef4444", fontWeight: "600", fontSize: 14 },
  summaryCard: { backgroundColor: "#16213e", marginHorizontal: 20, borderRadius: 14, padding: 16, marginBottom: 16 },
  summaryRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 10 },
  summaryEmail: { color: "#d1d5db", fontSize: 14, fontWeight: "500", maxWidth: 220 },
  summaryStats: { color: "#9ca3af", fontSize: 13, marginTop: 2 },
  summaryPct: { color: "#7c6af7", fontSize: 24, fontWeight: "700" },
  progressTrack: { height: 6, backgroundColor: "#0f3460", borderRadius: 3, overflow: "hidden" },
  progressFill: { height: "100%", backgroundColor: "#7c6af7", borderRadius: 3 },
  createRow: { flexDirection: "row", paddingHorizontal: 20, marginBottom: 16, gap: 10 },
  input: { flex: 1, backgroundColor: "#16213e", color: "#fff", borderRadius: 10, paddingHorizontal: 16, paddingVertical: 12, fontSize: 15, borderWidth: 1, borderColor: "#1e4a8a" },
  addBtn: { backgroundColor: "#7c6af7", borderRadius: 10, paddingHorizontal: 18, alignItems: "center", justifyContent: "center", minWidth: 72 },
  addBtnDisabled: { opacity: 0.6 },
  addBtnText: { color: "#fff", fontWeight: "700", fontSize: 14 },
  listContent: { paddingHorizontal: 20, paddingBottom: 24, gap: 12 },
  card: { backgroundColor: "#16213e", borderRadius: 14, padding: 16 },
  cardHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8 },
  cardName: { color: "#fff", fontSize: 17, fontWeight: "600", flex: 1, marginRight: 8 },
  cardRight: { flexDirection: "row", alignItems: "center", gap: 10 },
  cardCount: { color: "#7c6af7", fontSize: 13, fontWeight: "600" },
  deleteBtn: { width: 26, height: 26, backgroundColor: "#0f3460", borderRadius: 13, alignItems: "center", justifyContent: "center" },
  deleteBtnText: { color: "#ef4444", fontSize: 18, lineHeight: 22, fontWeight: "700" },
  cardSub: { color: "#9ca3af", fontSize: 13, marginTop: 6 },
  centered: { flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 40 },
  emptyIcon: { fontSize: 48, marginBottom: 12 },
  emptyText: { color: "#9ca3af", fontSize: 16, textAlign: "center", lineHeight: 24 },
});
