import React, { useState, useRef } from "react";
import {
  View,
  Modal,
  StyleSheet,
  TouchableOpacity,
  Text,
  Alert,
} from "react-native";
import { WebView } from "react-native-webview";

interface KakaoLoginWebViewProps {
  visible: boolean;
  onClose: () => void;
  onSuccess: (authCode: string) => void;
}

const KAKAO_CLIENT_ID = "YOUR_KAKAO_CLIENT_ID";
const KAKAO_REDIRECT_URI = "YOUR_REDIRECT_URI";

export default function KakaoLoginWebView({
  visible,
  onClose,
  onSuccess,
}: KakaoLoginWebViewProps) {
  const webViewRef = useRef<WebView>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleNavigationStateChange = (navState: any) => {
    const { url } = navState;

    // 리다이렉트 URI로부터 인증 코드 추출
    if (url.includes(KAKAO_REDIRECT_URI)) {
      const urlParams = new URLSearchParams(url.split("?")[1]);
      const authCode = urlParams.get("code");
      const error = urlParams.get("error");

      if (authCode) {
        onSuccess(authCode);
        onClose();
      } else if (error) {
        Alert.alert("오류", "카카오 로그인에 실패했습니다.");
        onClose();
      }
    }
  };

  const handleError = (syntheticEvent: any) => {
    const { nativeEvent } = syntheticEvent;
    console.warn("WebView error: ", nativeEvent);
    Alert.alert("오류", "카카오 로그인 페이지를 불러올 수 없습니다.");
    onClose();
  };

  const handleLoadStart = () => {
    setIsLoading(true);
  };

  const handleLoadEnd = () => {
    setIsLoading(false);
  };

  const kakaoAuthUrl = `https://kauth.kakao.com/oauth/authorize?client_id=${KAKAO_CLIENT_ID}&redirect_uri=${KAKAO_REDIRECT_URI}&response_type=code`;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
    >
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>카카오 로그인</Text>
          <TouchableOpacity onPress={onClose}>
            <Text style={styles.closeButton}>닫기</Text>
          </TouchableOpacity>
        </View>

        <WebView
          ref={webViewRef}
          source={{ uri: kakaoAuthUrl }}
          style={styles.webview}
          onNavigationStateChange={handleNavigationStateChange}
          onError={handleError}
          onLoadStart={handleLoadStart}
          onLoadEnd={handleLoadEnd}
          startInLoadingState={true}
          javaScriptEnabled={true}
          domStorageEnabled={true}
        />

        {isLoading && (
          <View style={styles.loadingOverlay}>
            <Text style={styles.loadingText}>
              카카오 로그인 페이지를 불러오는 중...
            </Text>
          </View>
        )}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E5EA",
  },
  title: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
  },
  closeButton: {
    fontSize: 16,
    color: "#007AFF",
    fontWeight: "600",
  },
  webview: {
    flex: 1,
  },
  loadingOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(255, 255, 255, 0.8)",
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    fontSize: 16,
    color: "#666",
  },
});
