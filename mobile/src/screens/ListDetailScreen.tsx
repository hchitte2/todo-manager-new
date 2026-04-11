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

import { apiCreateTodo, apiDeleteTodo, apiGetLists, apiToggleTodo, type Todo } from "../api/client";
import { type RootStackParamList } from "../navigation";

type Props = NativeStackScreenProps<RootStackParamList, "ListDetail">;

export function ListDetailScreen({ route, navigation }: Props) {
  const { token, listId, listName } = route.params;
  const [todos, setTodos] = useState<Todo[]>([]);
  const [todoName, setTodoName] = useState("");
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);

  const loadTodos = useCallback(async () => {
    try {
      const lists = await apiGetLists(token);
      const list = lists.find((l) => l.id === listId);
      setTodos(list?.todos ?? []);
    } catch (err) {
      Alert.alert("Error", err instanceof Error ? err.message : "Could not load todos");
    } finally {
      setLoading(false);
    }
  }, [token, listId]);

  useEffect(() => {
    navigation.setOptions({ title: listName });
    void loadTodos();
  }, [loadTodos, navigation, listName]);

  async function handleAddTodo() {
    if (!todoName.trim()) return;
    setAdding(true);
    try {
      const todo = await apiCreateTodo(token, listId, todoName.trim());
      setTodos((cur) => [...cur, todo]);
      setTodoName("");
    } catch (err) {
      Alert.alert("Error", err instanceof Error ? err.message : "Could not add todo");
    } finally {
      setAdding(false);
    }
  }

  async function handleToggle(todo: Todo) {
    try {
      const updated = await apiToggleTodo(token, listId, todo.id);
      setTodos((cur) => cur.map((t) => (t.id === todo.id ? updated : t)));
    } catch (err) {
      Alert.alert("Error", err instanceof Error ? err.message : "Could not update todo");
    }
  }

  function confirmDelete(todo: Todo) {
    Alert.alert("Delete todo", `Delete "${todo.name}"?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete", style: "destructive",
        onPress: async () => {
          try {
            await apiDeleteTodo(token, listId, todo.id);
            setTodos((cur) => cur.filter((t) => t.id !== todo.id));
          } catch (err) {
            Alert.alert("Error", err instanceof Error ? err.message : "Could not delete todo");
          }
        },
      },
    ]);
  }

  const done = todos.filter((t) => t.completed).length;
  const total = todos.length;
  const pct = total > 0 ? Math.round((done / total) * 100) : 0;

  function renderTodo({ item }: { item: Todo }) {
    return (
      <View style={styles.todoRow}>
        <Pressable
          style={[styles.checkbox, item.completed && styles.checkboxDone]}
          onPress={() => void handleToggle(item)}
          accessibilityRole="checkbox"
          accessibilityState={{ checked: item.completed }}
        >
          {item.completed && <Text style={styles.checkmark}>✓</Text>}
        </Pressable>
        <Text style={[styles.todoText, item.completed && styles.todoTextDone]} numberOfLines={2}>
          {item.name}
        </Text>
        <Pressable style={styles.deleteBtn} onPress={() => confirmDelete(item)} hitSlop={8}>
          <Text style={styles.deleteBtnText}>×</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={["bottom"]}>
      <View style={styles.progressCard}>
        <View style={styles.progressRow}>
          <Text style={styles.progressLabel}>{done}/{total} completed</Text>
          <Text style={styles.progressPct}>{pct}%</Text>
        </View>
        {total > 0 && (
          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: `${pct}%` }]} />
          </View>
        )}
      </View>

      <View style={styles.addRow}>
        <TextInput
          style={styles.input}
          value={todoName}
          onChangeText={setTodoName}
          placeholder={`Add a todo…`}
          placeholderTextColor="#9ca3af"
          returnKeyType="done"
          onSubmitEditing={() => void handleAddTodo()}
        />
        <Pressable style={[styles.addBtn, adding && styles.addBtnDisabled]} onPress={() => void handleAddTodo()} disabled={adding}>
          {adding ? <ActivityIndicator color="#fff" size="small" /> : <Text style={styles.addBtnText}>Add</Text>}
        </Pressable>
      </View>

      {loading ? (
        <View style={styles.centered}><ActivityIndicator color="#7c6af7" size="large" /></View>
      ) : todos.length === 0 ? (
        <View style={styles.centered}>
          <Text style={styles.emptyIcon}>✅</Text>
          <Text style={styles.emptyText}>No todos yet. Add one above!</Text>
        </View>
      ) : (
        <FlatList
          data={todos}
          keyExtractor={(item) => item.id}
          renderItem={renderTodo}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#1a1a2e" },
  progressCard: { backgroundColor: "#16213e", marginHorizontal: 20, marginTop: 16, marginBottom: 12, borderRadius: 14, padding: 16 },
  progressRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 10 },
  progressLabel: { color: "#d1d5db", fontSize: 15, fontWeight: "500" },
  progressPct: { color: "#7c6af7", fontSize: 20, fontWeight: "700" },
  progressTrack: { height: 6, backgroundColor: "#0f3460", borderRadius: 3, overflow: "hidden" },
  progressFill: { height: "100%", backgroundColor: "#7c6af7", borderRadius: 3 },
  addRow: { flexDirection: "row", paddingHorizontal: 20, marginBottom: 12, gap: 10 },
  input: { flex: 1, backgroundColor: "#16213e", color: "#fff", borderRadius: 10, paddingHorizontal: 16, paddingVertical: 12, fontSize: 15, borderWidth: 1, borderColor: "#1e4a8a" },
  addBtn: { backgroundColor: "#7c6af7", borderRadius: 10, paddingHorizontal: 20, alignItems: "center", justifyContent: "center", minWidth: 64 },
  addBtnDisabled: { opacity: 0.6 },
  addBtnText: { color: "#fff", fontWeight: "700", fontSize: 14 },
  listContent: { paddingHorizontal: 20, paddingBottom: 24, gap: 8 },
  todoRow: { flexDirection: "row", alignItems: "center", backgroundColor: "#16213e", borderRadius: 12, paddingHorizontal: 14, paddingVertical: 14, gap: 12 },
  checkbox: { width: 24, height: 24, borderRadius: 12, borderWidth: 2, borderColor: "#4b5563", alignItems: "center", justifyContent: "center" },
  checkboxDone: { backgroundColor: "#7c6af7", borderColor: "#7c6af7" },
  checkmark: { color: "#fff", fontSize: 13, fontWeight: "700" },
  todoText: { flex: 1, color: "#e5e7eb", fontSize: 15 },
  todoTextDone: { color: "#6b7280", textDecorationLine: "line-through" },
  deleteBtn: { width: 26, height: 26, backgroundColor: "#0f3460", borderRadius: 13, alignItems: "center", justifyContent: "center" },
  deleteBtnText: { color: "#ef4444", fontSize: 18, lineHeight: 22, fontWeight: "700" },
  centered: { flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 40 },
  emptyIcon: { fontSize: 48, marginBottom: 12 },
  emptyText: { color: "#9ca3af", fontSize: 16, textAlign: "center", lineHeight: 24 },
});
