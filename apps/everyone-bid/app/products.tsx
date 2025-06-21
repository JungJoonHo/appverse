import { useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
} from "react-native";
import { collection, query, where, getDocs, orderBy } from "firebase/firestore";
import { db } from "../firebase";
import { useRouter } from "expo-router";
import { format } from "date-fns";

type Product = {
  id: string;
  title: string;
  imageUrl: string;
  startPrice: number;
  createdAt: any;
};

export default function Products() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const fetchProducts = async () => {
    try {
      const q = query(
        collection(db, "products"),
        where("status", "==", "active"),
        orderBy("createdAt", "desc"),
      );

      const snap = await getDocs(q);
      const list = snap.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Product[];

      setProducts(list);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  if (loading) {
    return (
      <ActivityIndicator
        size="large"
        style={{ flex: 1, justifyContent: "center" }}
      />
    );
  }

  return (
    <FlatList
      data={products}
      keyExtractor={(item) => item.id}
      contentContainerStyle={{ padding: 16 }}
      renderItem={({ item }) => (
        <TouchableOpacity
          onPress={() => router.push(`/product/${item.id}`)}
          style={styles.card}
        >
          <Image source={{ uri: item.imageUrl }} style={styles.image} />
          <View style={{ flex: 1 }}>
            <Text style={styles.title}>{item.title}</Text>
            <Text>시작가: {item.startPrice.toLocaleString()}원</Text>
            <Text style={styles.date}>
              등록일: {format(item.createdAt.toDate(), "yyyy.MM.dd HH:mm")}
            </Text>
          </View>
        </TouchableOpacity>
      )}
    />
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    gap: 12,
    padding: 12,
    marginBottom: 12,
    backgroundColor: "#f9f9f9",
    borderRadius: 8,
    alignItems: "center",
  },
  image: {
    width: 80,
    height: 80,
    borderRadius: 6,
    backgroundColor: "#ccc",
  },
  title: {
    fontSize: 16,
    fontWeight: "bold",
  },
  date: {
    fontSize: 12,
    color: "#888",
    marginTop: 4,
  },
});
