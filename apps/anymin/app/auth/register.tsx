import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";
import { router } from "expo-router";
import { useAuth } from "@/context/AuthContext";

export default function RegisterScreen() {
  const [name, set_name] = useState("");
  const [userId, setUserId] = useState("");
  const [phone, set_phone] = useState("");
  const [password, set_password] = useState("");
  const [confirm_password, set_confirm_password] = useState("");
  const [is_loading, set_is_loading] = useState(false);
  const { register } = useAuth();

  const handle_register = async () => {
    if (!name || !userId || !phone || !password || !confirm_password) {
      Alert.alert("오류", "모든 필드를 입력해주세요.");
      return;
    }

    if (password !== confirm_password) {
      Alert.alert("오류", "비밀번호가 일치하지 않습니다.");
      return;
    }

    if (password.length < 6) {
      Alert.alert("오류", "비밀번호는 6자 이상이어야 합니다.");
      return;
    }

    set_is_loading(true);
    try {
      const success = await register({
        name,
        user_id: userId,
        phone,
        password,
      });

      if (success) {
        Alert.alert("성공", "회원가입이 완료되었습니다.", [
          { text: "확인", onPress: () => router.replace("/(tabs)") },
        ]);
      } else {
        Alert.alert("회원가입 실패", "이미 존재하는 이메일입니다.");
      }
    } catch (error) {
      Alert.alert("오류", "회원가입 중 오류가 발생했습니다.");
    } finally {
      set_is_loading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView contentContainerStyle={styles.scroll_content}>
        <View style={styles.content}>
          <Text style={styles.title}>회원가입</Text>
          <Text style={styles.subtitle}>Anymin 회원이 되어보세요</Text>

          <View style={styles.form}>
            <TextInput
              style={styles.input}
              placeholder="이메일"
              value={userId}
              onChangeText={setUserId}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />

            <TextInput
              style={styles.input}
              placeholder="비밀번호 (6자 이상)"
              value={password}
              onChangeText={set_password}
              secureTextEntry
              autoCapitalize="none"
              autoCorrect={false}
            />

            <TextInput
              style={styles.input}
              placeholder="비밀번호 확인"
              value={confirm_password}
              onChangeText={set_confirm_password}
              secureTextEntry
              autoCapitalize="none"
              autoCorrect={false}
            />

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
              style={[styles.button, is_loading && styles.button_disabled]}
              onPress={handle_register}
              disabled={is_loading}
            >
              <Text style={styles.button_text}>
                {is_loading ? "가입 중..." : "회원가입"}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.link_button}
              onPress={() => router.back()}
            >
              <Text style={styles.link_text}>
                이미 계정이 있으신가요? 로그인
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  scroll_content: {
    flexGrow: 1,
  },
  content: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: 20,
    paddingVertical: 40,
  },
  title: {
    fontSize: 32,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 10,
    color: "#333",
  },
  subtitle: {
    fontSize: 16,
    textAlign: "center",
    marginBottom: 40,
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
    marginBottom: 20,
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
  link_button: {
    alignItems: "center",
  },
  link_text: {
    color: "#007AFF",
    fontSize: 14,
  },
});
