import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  TouchableOpacity,
} from "react-native";
import { useEffect, useState } from "react";
import { collection, onSnapshot, query, orderBy } from "firebase/firestore";
import { db, auth } from "@/firebase";
import ProductCard, { Product } from "@/components/ProductCard";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "expo-router";
import { signOut } from "firebase/auth";

export default function Home() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const { role } = useAuth();
  const router = useRouter();

  useEffect(() => {
    const q = query(collection(db, "products"), orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const prods = snapshot.docs.map(
          (doc) => ({ id: doc.id, ...doc.data() }) as Product,
        );
        setProducts(prods);
        setLoading(false);
      },
      (error) => {
        console.error("제품 로딩 실패: ", error);
        setLoading(false);
      },
    );

    return () => unsubscribe();
  }, []);

  const handleLogout = async () => {
    await signOut(auth);
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>실시간 경매</Text>
        <View style={styles.headerButtons}>
          <TouchableOpacity onPress={() => router.push('/payment-method')}>
            <Text style={styles.headerLink}>결제 관리</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={handleLogout}>
            <Text style={styles.headerLink}>로그아웃</Text>
          </TouchableOpacity>
        </View>
      </View>

      {products.length === 0 ? (
        <View style={styles.centered}>
          <Text>등록된 상품이 없습니다.</Text>
        </View>
      ) : (
        <FlatList
          data={products}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <ProductCard product={item} />}
          contentContainerStyle={styles.list}
        />
      )}
      {role === "seller" && (
        <TouchableOpacity
          style={styles.fab}
          onPress={() => router.push("/product-upload")}
        >
          <Text style={styles.fabText}>+</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  centered: { flex: 1, justifyContent: "center", alignItems: "center" },
  container: {
    flex: 1,
    backgroundColor: "#f8f9fa",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    backgroundColor: "white",
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
  },
  headerButtons: {
    flexDirection: 'row',
  },
  headerLink: {
    color: "#007BFF",
    marginLeft: 16,
  },
  logoutText: {
    color: "#007BFF",
  },
  list: {
    padding: 10,
  },
  fab: {
    position: "absolute",
    right: 30,
    bottom: 30,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#007BFF",
    justifyContent: "center",
    alignItems: "center",
    elevation: 8,
  },
  fabText: {
    fontSize: 30,
    color: "white",
  },
});
