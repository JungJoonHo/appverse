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
} from "react-native";
import { router } from "expo-router";
import { useAuth } from "@/context/AuthContext";
import KakaoLoginWebView from "@/components/KakaoLoginWebView";

export default function LoginScreen() {
  const [email, set_email] = useState("");
  const [password, set_password] = useState("");
  const [is_loading, set_is_loading] = useState(false);
  const [show_kakao_webview, set_show_kakao_webview] = useState(false);
  const { login, loginWithKakao } = useAuth();

  const handle_login = async () => {
    if (!email || !password) {
      Alert.alert("오류", "이메일과 비밀번호를 입력해주세요.");
      return;
    }

    set_is_loading(true);
    try {
      const success = await login(email, password);
      if (success) {
        router.replace("/(tabs)");
      } else {
        Alert.alert("로그인 실패", "이메일 또는 비밀번호가 올바르지 않습니다.");
      }
    } catch (error) {
      Alert.alert("오류", "로그인 중 오류가 발생했습니다.");
    } finally {
      set_is_loading(false);
    }
  };

  const handle_kakao_login = async () => {
    set_show_kakao_webview(true);
  };

  const handle_kakao_auth_success = async (authCode: string) => {
    set_is_loading(true);
    try {
      // 카카오 인증 코드를 서비스에 전달
      const kakaoAuthService = await import("@/services/kakaoAuth");
      kakaoAuthService.default.setAuthCode(authCode);

      const success = await loginWithKakao();
      if (success) {
        router.replace("/(tabs)");
      } else {
        Alert.alert("로그인 실패", "카카오 로그인에 실패했습니다.");
      }
    } catch (error) {
      Alert.alert("오류", "카카오 로그인 중 오류가 발생했습니다.");
    } finally {
      set_is_loading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <View style={styles.content}>
        <Text style={styles.title}>Anymin</Text>
        <Text style={styles.subtitle}>회원관리 앱에 오신 것을 환영합니다</Text>

        <View style={styles.form}>
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
            placeholder="비밀번호"
            value={password}
            onChangeText={set_password}
            secureTextEntry
            autoCapitalize="none"
            autoCorrect={false}
          />

          <TouchableOpacity
            style={[styles.button, is_loading && styles.button_disabled]}
            onPress={handle_login}
            disabled={is_loading}
          >
            <Text style={styles.button_text}>
              {is_loading ? "로그인 중..." : "로그인"}
            </Text>
          </TouchableOpacity>

          <View style={styles.divider}>
            <View style={styles.divider_line} />
            <Text style={styles.divider_text}>또는</Text>
            <View style={styles.divider_line} />
          </View>

          <TouchableOpacity
            style={[styles.kakao_button, is_loading && styles.button_disabled]}
            onPress={handle_kakao_login}
            disabled={is_loading}
          >
            <Text style={styles.kakao_button_text}>
              {is_loading ? "로그인 중..." : "카카오로 로그인"}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.link_button}
            onPress={() => router.push("/auth/register")}
          >
            <Text style={styles.link_text}>계정이 없으신가요? 회원가입</Text>
          </TouchableOpacity>
        </View>
      </View>

      <KakaoLoginWebView
        visible={show_kakao_webview}
        onClose={() => set_show_kakao_webview(false)}
        onSuccess={handle_kakao_auth_success}
      />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  content: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: 20,
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
  divider: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 20,
  },
  divider_line: {
    flex: 1,
    height: 1,
    backgroundColor: "#ddd",
  },
  divider_text: {
    marginHorizontal: 15,
    color: "#666",
    fontSize: 14,
  },
  kakao_button: {
    backgroundColor: "#FEE500",
    paddingVertical: 15,
    borderRadius: 10,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#FDD800",
  },
  kakao_button_text: {
    color: "#3C1E1E",
    textAlign: "center",
    fontSize: 16,
    fontWeight: "600",
  },
});
