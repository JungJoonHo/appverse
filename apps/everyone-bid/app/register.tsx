import { useState } from "react";
import { View, Text, TextInput, Button, StyleSheet, Alert } from "react-native";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { auth, db } from "../firebase";
import { useRouter } from "expo-router";
import { setDoc, doc } from "firebase/firestore";

export default function Register() {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const router = useRouter();

  const handleRegister = async () => {
    if (!name || !phone || !email || !password) {
      Alert.alert("입력 오류", "모든 필드를 입력해주세요.");
      return;
    }
    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password,
      );
      // Firestore에 사용자 정보 저장
      await setDoc(doc(db, "users", userCredential.user.uid), {
        uid: userCredential.user.uid,
        name: name,
        phone: phone,
        email: email,
      });
      // navigation is now handled by AuthContext
    } catch (e: any) {
      Alert.alert("회원가입 실패", e.message);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>회원가입</Text>
      <TextInput
        style={styles.input}
        placeholder="이름"
        value={name}
        onChangeText={setName}
        autoCapitalize="words"
      />
      <TextInput
        style={styles.input}
        placeholder="전화번호"
        value={phone}
        onChangeText={setPhone}
        keyboardType="phone-pad"
      />
      <TextInput
        style={styles.input}
        placeholder="이메일"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
      />
      <TextInput
        style={styles.input}
        placeholder="비밀번호"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />
      <Button title="가입하기" onPress={handleRegister} />
      <Text onPress={() => router.push("/login")}>
        이미 계정이 있으신가요? 로그인
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, flex: 1, justifyContent: "center" },
  title: { fontSize: 24, marginBottom: 20, textAlign: "center" },
  input: {
    borderWidth: 1,
    padding: 10,
    marginBottom: 10,
    borderRadius: 5,
  },
});
