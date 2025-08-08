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

interface NaverLoginWebViewProps {
  visible: boolean;
  onClose: () => void;
  onSuccess: (authCode: string) => void;
}

const NAVER_CLIENT_ID = "YOUR_NAVER_CLIENT_ID";
const NAVER_REDIRECT_URI = "YOUR_REDIRECT_URI";

export default function NaverLoginWebView({
  visible,
  onClose,
  onSuccess,
}: NaverLoginWebViewProps) {
  const webViewRef = useRef<WebView>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleNavigationStateChange = (navState: any) => {
    const { url } = navState;

    // 리다이렉트 URI로부터 인증 코드 추출
    if (url.includes(NAVER_REDIRECT_URI)) {
      const urlParams = new URLSearchParams(url.split("?")[1]);
      const authCode = urlParams.get("code");
      const error = urlParams.get("error");

      if (authCode) {
        onSuccess(authCode);
        onClose();
      } else if (error) {
        Alert.alert("오류", "네이버 로그인에 실패했습니다.");
        onClose();
      }
    }
  };

  const handleError = (syntheticEvent: any) => {
    const { nativeEvent } = syntheticEvent;
    console.warn("WebView error: ", nativeEvent);
    Alert.alert("오류", "네이버 로그인 페이지를 불러올 수 없습니다.");
    onClose();
  };

  const handleLoadStart = () => {
    setIsLoading(true);
  };

  const handleLoadEnd = () => {
    setIsLoading(false);
  };

  const naverAuthUrl = `https://nid.naver.com/oauth2.0/authorize?client_id=${NAVER_CLIENT_ID}&redirect_uri=${NAVER_REDIRECT_URI}&response_type=code&state=naver_login`;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
    >
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>네이버 로그인</Text>
          <TouchableOpacity onPress={onClose}>
            <Text style={styles.closeButton}>닫기</Text>
          </TouchableOpacity>
        </View>

        <WebView
          ref={webViewRef}
          source={{ uri: naverAuthUrl }}
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
              네이버 로그인 페이지를 불러오는 중...
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
