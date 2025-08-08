import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ScrollView,
  Modal,
  TextInput,
} from "react-native";
import { useAuth } from "@/context/AuthContext";
import { router } from "expo-router";

export default function ProfileScreen() {
  const { user, logout, updateProfile } = useAuth();
  const [edit_modal_visible, set_edit_modal_visible] = useState(false);
  const [name, set_name] = useState(user?.name || "");
  const [phone, set_phone] = useState(user?.phone || "");

  const handle_logout = async () => {
    Alert.alert("로그아웃", "정말 로그아웃하시겠습니까?", [
      { text: "취소", style: "cancel" },
      {
        text: "로그아웃",
        style: "destructive",
        onPress: async () => {
          await logout();
          router.replace("/auth/login");
        },
      },
    ]);
  };

  const handle_edit_profile = () => {
    set_name(user?.name || "");
    set_phone(user?.phone || "");
    set_edit_modal_visible(true);
  };

  const handle_save_profile = async () => {
    if (!name.trim()) {
      Alert.alert("오류", "이름을 입력해주세요.");
      return;
    }

    if (!phone.trim()) {
      Alert.alert("오류", "전화번호를 입력해주세요.");
      return;
    }

    try {
      const success = await updateProfile(name.trim(), phone.trim());

      if (success) {
        Alert.alert("성공", "프로필이 업데이트되었습니다.");
        set_edit_modal_visible(false);
      } else {
        Alert.alert("오류", "프로필 업데이트에 실패했습니다.");
      }
    } catch (error) {
      console.error("Profile update error:", error);
      Alert.alert("오류", "프로필 업데이트에 실패했습니다.");
    }
  };

  const format_date = (date: Date | string) => {
    const date_obj = typeof date === "string" ? new Date(date) : date;
    return date_obj.toLocaleDateString("ko-KR", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.avatar_container}>
          <Text style={styles.avatar_text}>
            {user?.name?.charAt(0).toUpperCase()}
          </Text>
        </View>
        <Text style={styles.user_name}>{user?.name}</Text>
        <Text style={styles.user_email}>{user?.email}</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.section_title}>계정 정보</Text>

        <View style={styles.info_item}>
          <Text style={styles.info_label}>이름</Text>
          <Text style={styles.info_value}>{user?.name}</Text>
        </View>

        <View style={styles.info_item}>
          <Text style={styles.info_label}>이메일</Text>
          <Text style={styles.info_value}>
            {user?.user_id || user?.email || "-"}
          </Text>
        </View>

        <View style={styles.info_item}>
          <Text style={styles.info_label}>전화번호</Text>
          <Text style={styles.info_value}>{user?.phone}</Text>
        </View>

        <View style={styles.info_item}>
          <Text style={styles.info_label}>가입일</Text>
          <Text style={styles.info_value}>
            {user?.created_at ? format_date(user.created_at) : "-"}
          </Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.section_title}>계정 관리</Text>

        <TouchableOpacity
          style={styles.menu_item}
          onPress={handle_edit_profile}
        >
          <Text style={styles.menu_text}>프로필 수정</Text>
          <Text style={styles.menu_arrow}>›</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.menu_item} onPress={handle_logout}>
          <Text style={[styles.menu_text, styles.logout_text]}>로그아웃</Text>
          <Text style={styles.menu_arrow}>›</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <Text style={styles.section_title}>앱 정보</Text>

        <View style={styles.info_item}>
          <Text style={styles.info_label}>앱 버전</Text>
          <Text style={styles.info_value}>1.0.0</Text>
        </View>

        <View style={styles.info_item}>
          <Text style={styles.info_label}>개발자</Text>
          <Text style={styles.info_value}>Anymin Team</Text>
        </View>
      </View>

      <Modal
        visible={edit_modal_visible}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <View style={styles.modal_container}>
          <View style={styles.modal_header}>
            <Text style={styles.modal_title}>프로필 수정</Text>
            <TouchableOpacity onPress={() => set_edit_modal_visible(false)}>
              <Text style={styles.close_button}>닫기</Text>
            </TouchableOpacity>
          </View>

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
              placeholder="전화번호"
              value={phone}
              onChangeText={set_phone}
              keyboardType="phone-pad"
            />

            <TouchableOpacity
              style={styles.save_button}
              onPress={handle_save_profile}
            >
              <Text style={styles.save_button_text}>저장</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  header: {
    backgroundColor: "white",
    padding: 30,
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: "#E5E5EA",
  },
  avatar_container: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#007AFF",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 15,
  },
  avatar_text: {
    color: "white",
    fontSize: 32,
    fontWeight: "bold",
  },
  user_name: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 5,
  },
  user_email: {
    fontSize: 16,
    color: "#666",
  },
  section: {
    margin: 20,
    backgroundColor: "white",
    borderRadius: 10,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  section_title: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 15,
  },
  info_item: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  info_label: {
    fontSize: 16,
    color: "#666",
  },
  info_value: {
    fontSize: 16,
    color: "#333",
    fontWeight: "500",
  },
  menu_item: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  menu_text: {
    fontSize: 16,
    color: "#333",
  },
  logout_text: {
    color: "#FF3B30",
  },
  menu_arrow: {
    fontSize: 18,
    color: "#999",
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
    padding: 20,
  },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    padding: 15,
    fontSize: 16,
    marginBottom: 15,
  },
  save_button: {
    backgroundColor: "#007AFF",
    paddingVertical: 15,
    borderRadius: 8,
    marginTop: 20,
  },
  save_button_text: {
    color: "white",
    textAlign: "center",
    fontSize: 16,
    fontWeight: "600",
  },
});
