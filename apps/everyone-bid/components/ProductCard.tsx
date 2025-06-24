import { View, Text, Image, StyleSheet, TouchableOpacity } from "react-native";
import { Timestamp } from "firebase/firestore";
import { useRouter } from "expo-router";

export type Product = {
  id: string;
  title: string;
  description: string;
  startPrice: number;
  imageUrl: string;
  endAt: Timestamp;
  sellerId: string;
  createdAt: Timestamp;
  status: "active" | "completed" | "failed" | "ended" | "error";
  winnerEmail?: string;
  finalPrice?: number;
};

type ProductCardProps = {
  product: Product;
};

export default function ProductCard({ product }: ProductCardProps) {
  const router = useRouter();

  const handlePress = () => {
    router.push(`/product/${product.id}`);
  };

  return (
    <TouchableOpacity style={styles.card} onPress={handlePress}>
      <Image source={{ uri: product.imageUrl }} style={styles.image} />
      <View style={styles.infoContainer}>
        <Text style={styles.title}>{product.title}</Text>
        <Text style={styles.price}>
          {product.startPrice.toLocaleString()}원
        </Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "white",
    borderRadius: 8,
    overflow: "hidden",
    marginBottom: 16,
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.22,
    shadowRadius: 2.22,
  },
  image: {
    width: "100%",
    height: 200,
  },
  infoContainer: {
    padding: 12,
  },
  title: {
    fontSize: 16,
    fontWeight: "bold",
  },
  price: {
    fontSize: 14,
    color: "#888",
    marginTop: 4,
  },
}); 