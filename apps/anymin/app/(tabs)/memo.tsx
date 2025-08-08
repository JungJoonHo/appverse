import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  Modal,
  TextInput,
} from "react-native";
import { useAuth } from "@/context/AuthContext";
import { firebase_database_service, Memo } from "@/services/firebaseDatabase";

export default function MemoScreen() {
  const { user } = useAuth();
  const [memos, set_memos] = useState<Memo[]>([]);
  const [modal_visible, set_modal_visible] = useState(false);
  const [editing_memo, set_editing_memo] = useState<Memo | null>(null);

  // 새 메모 폼 상태
  const [title, set_title] = useState("");
  const [content, set_content] = useState("");

  useEffect(() => {
    load_memos();
  }, []);

  const load_memos = async () => {
    if (!user) return;

    try {
      const user_memos = await firebase_database_service.get_memos(user.uid);
      set_memos(user_memos);
    } catch (error) {
      console.error("Failed to load memos:", error);
    }
  };

  const handle_add_memo = () => {
    set_editing_memo(null);
    set_title("");
    set_content("");
    set_modal_visible(true);
  };

  const handle_edit_memo = (memo: Memo) => {
    set_editing_memo(memo);
    set_title(memo.title);
    set_content(memo.content);
    set_modal_visible(true);
  };

  const handle_delete_memo = (memo: Memo) => {
    Alert.alert("메모 삭제", "이 메모를 삭제하시겠습니까?", [
      { text: "취소", style: "cancel" },
      {
        text: "삭제",
        style: "destructive",
        onPress: async () => {
          try {
            await firebase_database_service.delete_memo(memo.id!);
            await load_memos();
          } catch (error) {
            Alert.alert("오류", "메모 삭제에 실패했습니다.");
          }
        },
      },
    ]);
  };

  const handle_save_memo = async () => {
    if (!title.trim()) {
      Alert.alert("오류", "메모 제목을 입력해주세요.");
      return;
    }

    if (!content.trim()) {
      Alert.alert("오류", "메모 내용을 입력해주세요.");
      return;
    }

    if (!user) return;

    try {
      const now = new Date().toISOString();

      if (editing_memo) {
        // 기존 메모 수정
        await firebase_database_service.update_memo(editing_memo.id!, {
          title: title.trim(),
          content: content.trim(),
          updated_at: now,
        });
      } else {
        // 새 메모 생성
        await firebase_database_service.create_memo({
          user_id: user.uid,
          title: title.trim(),
          content: content.trim(),
          created_at: now,
          updated_at: now,
        });
      }

      set_modal_visible(false);
      await load_memos();
    } catch (error) {
      Alert.alert("오류", "메모 저장에 실패했습니다.");
    }
  };

  const format_date = (date_string: string) => {
    const date = new Date(date_string);
    return date.toLocaleDateString("ko-KR", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const render_memo_item = ({ item }: { item: Memo }) => (
    <TouchableOpacity
      style={styles.memo_item}
      onPress={() => handle_edit_memo(item)}
    >
      <View style={styles.memo_header}>
        <Text style={styles.memo_title}>{item.title}</Text>
        <TouchableOpacity
          style={styles.delete_button}
          onPress={(e) => {
            e.stopPropagation();
            handle_delete_memo(item);
          }}
        >
          <Text style={styles.delete_text}>삭제</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.memo_content} numberOfLines={3}>
        {item.content}
      </Text>

      <Text style={styles.memo_time}>{format_date(item.updated_at)}</Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={memos}
        renderItem={render_memo_item}
        keyExtractor={(item) => item.id?.toString() || ""}
        contentContainerStyle={styles.list_container}
        ListEmptyComponent={
          <View style={styles.empty_state}>
            <Text style={styles.empty_text}>저장된 메모가 없습니다</Text>
            <TouchableOpacity
              style={styles.add_button}
              onPress={handle_add_memo}
            >
              <Text style={styles.add_button_text}>메모 작성하기</Text>
            </TouchableOpacity>
          </View>
        }
      />

      <TouchableOpacity style={styles.fab} onPress={handle_add_memo}>
        <Text style={styles.fab_text}>+</Text>
      </TouchableOpacity>

      <Modal
        visible={modal_visible}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <View style={styles.modal_container}>
          <View style={styles.modal_header}>
            <Text style={styles.modal_title}>
              {editing_memo ? "메모 수정" : "새 메모"}
            </Text>
            <TouchableOpacity onPress={() => set_modal_visible(false)}>
              <Text style={styles.close_button}>닫기</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.form}>
            <TextInput
              style={styles.title_input}
              placeholder="메모 제목"
              value={title}
              onChangeText={set_title}
              maxLength={100}
            />

            <TextInput
              style={styles.content_input}
              placeholder="메모 내용을 입력하세요..."
              value={content}
              onChangeText={set_content}
              multiline
              textAlignVertical="top"
            />

            <View style={styles.form_footer}>
              <Text style={styles.character_count}>{content.length}자</Text>
              <TouchableOpacity
                style={styles.save_button}
                onPress={handle_save_memo}
              >
                <Text style={styles.save_button_text}>저장</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  list_container: {
    padding: 20,
  },
  memo_item: {
    backgroundColor: "white",
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  memo_header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  memo_title: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
    flex: 1,
  },
  delete_button: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    backgroundColor: "#FF3B30",
    borderRadius: 5,
  },
  delete_text: {
    color: "white",
    fontSize: 12,
  },
  memo_content: {
    fontSize: 14,
    color: "#666",
    marginBottom: 10,
    lineHeight: 20,
  },
  memo_time: {
    fontSize: 12,
    color: "#999",
  },
  empty_state: {
    alignItems: "center",
    paddingVertical: 50,
  },
  empty_text: {
    fontSize: 16,
    color: "#666",
    marginBottom: 20,
  },
  add_button: {
    backgroundColor: "#007AFF",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  add_button_text: {
    color: "white",
    fontSize: 14,
    fontWeight: "600",
  },
  fab: {
    position: "absolute",
    bottom: 30,
    right: 30,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#007AFF",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  fab_text: {
    color: "white",
    fontSize: 24,
    fontWeight: "bold",
  },
  modal_container: {
    flex: 1,
    backgroundColor: "white",
  },
  modal_header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E5EA",
  },
  modal_title: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
  },
  close_button: {
    color: "#007AFF",
    fontSize: 16,
  },
  form: {
    flex: 1,
    padding: 20,
  },
  title_input: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    padding: 15,
    fontSize: 16,
    marginBottom: 15,
  },
  content_input: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    padding: 15,
    fontSize: 16,
    marginBottom: 15,
  },
  form_footer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  character_count: {
    fontSize: 12,
    color: "#666",
  },
  save_button: {
    backgroundColor: "#007AFF",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  save_button_text: {
    color: "white",
    fontSize: 14,
    fontWeight: "600",
  },
});
