import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  RefreshControl,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";
import { useAuth } from "@/context/AuthContext";
import {
  collection,
  getDocs,
  query,
  orderBy,
  doc,
  setDoc,
} from "firebase/firestore";
import { db } from "@/firebase/config";
import { ENTITY_USERS } from "@/constants/firebase";

interface UserInfo {
  id: string;
  name: string;
  email: string;
  phone: string;
  created_at: string;
  created_by?: string;
}

export default function UsersScreen() {
  const { user } = useAuth();
  const [users, set_users] = useState<UserInfo[]>([]);
  const [refreshing, set_refreshing] = useState(false);
  const [show_add_modal, set_show_add_modal] = useState(false);
  const [show_edit_modal, set_show_edit_modal] = useState(false);
  const [editing_user, set_editing_user] = useState<UserInfo | null>(null);
  const [name, set_name] = useState("");
  const [email, set_email] = useState("");
  const [phone, set_phone] = useState("");
  const [is_loading, set_is_loading] = useState(false);

  useEffect(() => {
    load_users();
  }, []);

  const load_users = async () => {
    try {
      const users_query = query(
        collection(db, ENTITY_USERS.NAME),
        orderBy(ENTITY_USERS.FIELDS.CREATED_AT, "desc"),
      );
      const query_snapshot = await getDocs(users_query);

      const users_data: UserInfo[] = [];
      query_snapshot.forEach((doc) => {
        const data = doc.data();
        users_data.push({
          id: doc.id,
          name: data[ENTITY_USERS.FIELDS.NAME],
          email: data[ENTITY_USERS.FIELDS.EMAIL] || "N/A",
          phone: data[ENTITY_USERS.FIELDS.PHONE],
          created_at:
            data[ENTITY_USERS.FIELDS.CREATED_AT]?.toDate?.()?.toISOString() ||
            data[ENTITY_USERS.FIELDS.CREATED_AT],
          created_by: data[ENTITY_USERS.FIELDS.CREATED_BY],
        });
      });

      set_users(users_data);
    } catch (error) {
      console.error("Failed to load users:", error);
      Alert.alert("오류", "회원 목록을 불러오는데 실패했습니다.");
    }
  };

  const on_refresh = async () => {
    set_refreshing(true);
    await load_users();
    set_refreshing(false);
  };

  const handle_add_user = async () => {
    if (!name || !email || !phone) {
      Alert.alert("오류", "모든 필드를 입력해주세요.");
      return;
    }

    set_is_loading(true);
    try {
      // 고유 ID 생성 (이메일 기반)
      const user_id = email.replace(/[^a-zA-Z0-9]/g, "_");

      // Firestore에 사용자 정보 저장
      const user_info = {
        [ENTITY_USERS.FIELDS.NAME]: name.trim(),
        [ENTITY_USERS.FIELDS.EMAIL]: email.trim(),
        [ENTITY_USERS.FIELDS.PHONE]: phone.trim(),
        [ENTITY_USERS.FIELDS.CREATED_AT]: new Date(),
        [ENTITY_USERS.FIELDS.CREATED_BY]: user?.uid, // 추가한 관리자 정보
      };

      await setDoc(doc(db, ENTITY_USERS.NAME, user_id), user_info);

      Alert.alert("성공", "회원이 추가되었습니다.", [
        {
          text: "확인",
          onPress: () => {
            set_show_add_modal(false);
            reset_form();
            load_users(); // 목록 새로고침
          },
        },
      ]);
    } catch (error: any) {
      console.error("Add user failed:", error);
      let error_message = "회원 추가에 실패했습니다.";

      if (error.code === "permission-denied") {
        error_message = "권한이 없습니다.";
      }

      Alert.alert("오류", error_message);
    } finally {
      set_is_loading(false);
    }
  };

  const reset_form = () => {
    set_name("");
    set_email("");
    set_phone("");
    set_editing_user(null);
  };

  const handle_edit_user = (user_info: UserInfo) => {
    set_editing_user(user_info);
    set_name(user_info.name);
    set_email(user_info.email);
    set_phone(user_info.phone);
    set_show_edit_modal(true);
  };

  const handle_update_user = async () => {
    if (!editing_user || !name || !email || !phone) {
      Alert.alert("오류", "모든 필드를 입력해주세요.");
      return;
    }

    set_is_loading(true);
    try {
      // Firestore에 사용자 정보 업데이트
      const user_info = {
        [ENTITY_USERS.FIELDS.NAME]: name.trim(),
        [ENTITY_USERS.FIELDS.EMAIL]: email.trim(),
        [ENTITY_USERS.FIELDS.PHONE]: phone.trim(),
      };

      await setDoc(doc(db, ENTITY_USERS.NAME, editing_user.id), user_info, {
        merge: true,
      });

      Alert.alert("성공", "회원 정보가 수정되었습니다.", [
        {
          text: "확인",
          onPress: () => {
            set_show_edit_modal(false);
            reset_form();
            load_users(); // 목록 새로고침
          },
        },
      ]);
    } catch (error: any) {
      console.error("Update user failed:", error);
      let error_message = "회원 수정에 실패했습니다.";

      if (error.code === "permission-denied") {
        error_message = "권한이 없습니다.";
      }

      Alert.alert("오류", error_message);
    } finally {
      set_is_loading(false);
    }
  };

  const handle_delete_user = (user_info: UserInfo) => {
    Alert.alert("회원 삭제", `${user_info.name} 회원을 삭제하시겠습니까?`, [
      { text: "취소", style: "cancel" },
      {
        text: "삭제",
        style: "destructive",
        onPress: () => {
          // 실제 삭제 로직은 Firebase Admin SDK가 필요합니다
          Alert.alert("알림", "회원 삭제 기능은 관리자 권한이 필요합니다.");
        },
      },
    ]);
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

  const render_user_item = ({ item }: { item: UserInfo }) => (
    <TouchableOpacity
      style={styles.user_item}
      onPress={() => handle_edit_user(item)}
      onLongPress={() => handle_delete_user(item)}
    >
      <View style={styles.user_header}>
        <Text style={styles.user_name}>{item.name}</Text>
        <TouchableOpacity
          style={styles.delete_button_icon}
          onPress={(e) => {
            e.stopPropagation();
            handle_delete_user(item);
          }}
        >
          <Text style={styles.delete_icon}>×</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.user_info}>
        <Text style={styles.user_email}>이메일: {item.email}</Text>
        <Text style={styles.user_phone}>전화번호: {item.phone}</Text>
        <Text style={styles.user_date}>
          가입일: {format_date(item.created_at)}
        </Text>
        {item.created_by && (
          <Text style={styles.user_creator}>
            추가자: {item.created_by === user?.uid ? "본인" : "관리자"}
          </Text>
        )}
        <Text style={styles.user_hint}>탭하여 수정 • 길게 눌러 삭제</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.header_content}>
          <View>
            <Text style={styles.title}>회원 목록</Text>
            <Text style={styles.subtitle}>총 {users.length}명의 회원</Text>
          </View>
          <TouchableOpacity
            style={styles.add_button}
            onPress={() => set_show_add_modal(true)}
          >
            <Text style={styles.add_button_text}>+ 추가</Text>
          </TouchableOpacity>
        </View>
      </View>

      <FlatList
        data={users}
        renderItem={render_user_item}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list_container}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={on_refresh} />
        }
        ListEmptyComponent={
          <View style={styles.empty_state}>
            <Text style={styles.empty_text}>등록된 회원이 없습니다</Text>
            <TouchableOpacity
              style={styles.empty_add_button}
              onPress={() => set_show_add_modal(true)}
            >
              <Text style={styles.empty_add_text}>첫 번째 회원 추가하기</Text>
            </TouchableOpacity>
          </View>
        }
      />

      {/* 회원 추가 모달 */}
      <Modal
        visible={show_add_modal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <KeyboardAvoidingView
          style={styles.modal_container}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
        >
          <View style={styles.modal_header}>
            <Text style={styles.modal_title}>회원 추가</Text>
            <TouchableOpacity
              onPress={() => {
                set_show_add_modal(false);
                reset_form();
              }}
            >
              <Text style={styles.modal_close}>취소</Text>
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={styles.modal_content}>
            <Text style={styles.modal_subtitle}>새로운 회원을 추가합니다</Text>

            <View style={styles.form}>
              <TextInput
                style={styles.input}
                placeholder="이름"
                value={name}
                onChangeText={set_name}
                autoCapitalize="words"
              />

              <TextInput
                style={styles.input}
                placeholder="이메일"
                value={email}
                onChangeText={set_email}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
              />

              <TextInput
                style={styles.input}
                placeholder="전화번호"
                value={phone}
                onChangeText={set_phone}
                keyboardType="phone-pad"
              />

              <TouchableOpacity
                style={[styles.button, is_loading && styles.button_disabled]}
                onPress={handle_add_user}
                disabled={is_loading}
              >
                <Text style={styles.button_text}>
                  {is_loading ? "추가 중..." : "회원 추가"}
                </Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </Modal>

      {/* 회원 수정 모달 */}
      <Modal
        visible={show_edit_modal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <KeyboardAvoidingView
          style={styles.modal_container}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
        >
          <View style={styles.modal_header}>
            <Text style={styles.modal_title}>회원 수정</Text>
            <TouchableOpacity
              onPress={() => {
                set_show_edit_modal(false);
                reset_form();
              }}
            >
              <Text style={styles.modal_close}>취소</Text>
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={styles.modal_content}>
            <Text style={styles.modal_subtitle}>회원 정보를 수정합니다</Text>

            <View style={styles.form}>
              <TextInput
                style={styles.input}
                placeholder="이름"
                value={name}
                onChangeText={set_name}
                autoCapitalize="words"
              />

              <TextInput
                style={styles.input}
                placeholder="이메일"
                value={email}
                onChangeText={set_email}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
              />

              <TextInput
                style={styles.input}
                placeholder="전화번호"
                value={phone}
                onChangeText={set_phone}
                keyboardType="phone-pad"
              />

              <TouchableOpacity
                style={[styles.button, is_loading && styles.button_disabled]}
                onPress={handle_update_user}
                disabled={is_loading}
              >
                <Text style={styles.button_text}>
                  {is_loading ? "수정 중..." : "회원 수정"}
                </Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  header: {
    backgroundColor: "white",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E5EA",
  },
  header_content: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 14,
    color: "#666",
  },
  add_button: {
    backgroundColor: "#007AFF",
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 8,
  },
  add_button_text: {
    color: "white",
    fontSize: 14,
    fontWeight: "600",
  },
  list_container: {
    padding: 20,
  },
  user_item: {
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
  user_header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  user_name: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
  },
  delete_button_icon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "#FF3B30",
    justifyContent: "center",
    alignItems: "center",
  },
  delete_icon: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
    lineHeight: 18,
  },
  user_info: {
    gap: 5,
  },
  user_email: {
    fontSize: 14,
    color: "#666",
  },
  user_phone: {
    fontSize: 14,
    color: "#666",
  },
  user_date: {
    fontSize: 12,
    color: "#999",
  },
  user_creator: {
    fontSize: 12,
    color: "#007AFF",
    fontStyle: "italic",
  },
  user_hint: {
    fontSize: 11,
    color: "#999",
    fontStyle: "italic",
    marginTop: 8,
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
  empty_add_button: {
    backgroundColor: "#007AFF",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  empty_add_text: {
    color: "white",
    fontSize: 14,
    fontWeight: "600",
  },
  // 모달 스타일
  modal_container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  modal_header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    backgroundColor: "white",
    borderBottomWidth: 1,
    borderBottomColor: "#E5E5EA",
  },
  modal_title: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
  },
  modal_close: {
    fontSize: 16,
    color: "#007AFF",
    fontWeight: "600",
  },
  modal_content: {
    flex: 1,
    padding: 20,
  },
  modal_subtitle: {
    fontSize: 16,
    textAlign: "center",
    marginBottom: 30,
    color: "#666",
  },
  form: {
    width: "100%",
  },
  input: {
    backgroundColor: "white",
    paddingHorizontal: 15,
    paddingVertical: 15,
    borderRadius: 10,
    marginBottom: 15,
    fontSize: 16,
    borderWidth: 1,
    borderColor: "#ddd",
  },
  button: {
    backgroundColor: "#007AFF",
    paddingVertical: 15,
    borderRadius: 10,
    marginBottom: 15,
  },
  button_disabled: {
    backgroundColor: "#ccc",
  },
  button_text: {
    color: "white",
    textAlign: "center",
    fontSize: 16,
    fontWeight: "600",
  },
});
