import { View, Button, Text, StyleSheet } from "react-native";
import { auth, db } from "../firebase";
import { setDoc, doc } from "firebase/firestore";
import { useNavigation } from "@react-navigation/native";

export default function RoleSelect() {
  const navigation = useNavigation<any>();

  const handleRoleSelect = async (role: "buyer" | "seller") => {
    const user = auth.currentUser;
    if (!user) return;

    await setDoc(doc(db, "users", user.uid), {
      email: user.email,
      role,
    });

    navigation.navigate("Home");
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>역할을 선택하세요</Text>
      <Button title="🛒 구매자" onPress={() => handleRoleSelect("buyer")} />
      <Button title="📦 판매자" onPress={() => handleRoleSelect("seller")} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 12,
  },
  title: { fontSize: 20, marginBottom: 20 },
});
