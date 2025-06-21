import { View, Button, Text, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { auth, db } from "../firebase";
import { doc, setDoc } from "firebase/firestore";

export default function RoleSelect() {
  const router = useRouter();

  const handleSelect = async (role: "buyer" | "seller") => {
    const user = auth.currentUser;
    if (!user) return;

    await setDoc(doc(db, "users", user.uid), {
      email: user.email,
      role,
    });

    router.replace("/home");
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>역할을 선택하세요</Text>
      <Button title="🛒 구매자" onPress={() => handleSelect("buyer")} />
      <Button title="📦 판매자" onPress={() => handleSelect("seller")} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 16,
  },
  title: { fontSize: 20, marginBottom: 20 },
});
