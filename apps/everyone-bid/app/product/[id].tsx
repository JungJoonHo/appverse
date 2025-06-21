import { useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import {
  View,
  Text,
  Image,
  TextInput,
  StyleSheet,
  ActivityIndicator,
  Alert,
  ScrollView,
  TouchableOpacity,
} from "react-native";
import { db, auth } from "../../firebase";
import {
  doc,
  getDoc,
  collection,
  addDoc,
  query,
  orderBy,
  onSnapshot,
  Timestamp,
} from "firebase/firestore";
import { useAuth } from "@/context/AuthContext";
import { Product } from "@/components/ProductCard";

type Bid = {
  id: string;
  userId: string;
  userEmail: string;
  amount: number;
  createdAt: Timestamp;
};

export default function ProductDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth();
  const [product, setProduct] = useState<Product | null>(null);
  const [bids, setBids] = useState<Bid[]>([]);
  const [bidAmount, setBidAmount] = useState("");
  const [loading, setLoading] = useState(true);
  const [timeLeft, setTimeLeft] = useState("");

  const isMyProduct = product?.sellerId === user?.uid;
  const highestBid = bids[0]?.amount ?? 0;
  const currentPrice = highestBid > 0 ? highestBid : product?.startPrice ?? 0;
  const isEnded = product
    ? new Date() > new Timestamp(product.endAt.seconds, product.endAt.nanoseconds).toDate()
    : false;

  useEffect(() => {
    if (!id) return;
    const productRef = doc(db, "products", id);

    const unsubscribeProduct = onSnapshot(productRef, (doc) => {
      if (doc.exists()) {
        setProduct({ id: doc.id, ...doc.data() } as Product);
      } else {
        Alert.alert("오류", "상품 정보를 찾을 수 없습니다.");
      }
      setLoading(false);
    });

    const bidsRef = collection(db, "products", id, "bids");
    const q = query(bidsRef, orderBy("amount", "desc"));
    const unsubscribeBids = onSnapshot(q, (snapshot) => {
      const bidList = snapshot.docs.map(
        (doc) => ({ id: doc.id, ...doc.data() }) as Bid,
      );
      setBids(bidList);
    });

    return () => {
      unsubscribeProduct();
      unsubscribeBids();
    };
  }, [id]);

  useEffect(() => {
    if (!product || isEnded) {
      setTimeLeft("경매 마감");
      return;
    }

    const timer = setInterval(() => {
      const now = new Date();
      const diff =
        new Timestamp(product.endAt.seconds, product.endAt.nanoseconds).toDate().getTime() -
        now.getTime();
      if (diff <= 0) {
        setTimeLeft("경매 마감");
        clearInterval(timer);
        return;
      }
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
      const minutes = Math.floor((diff / 1000 / 60) % 60);
      const seconds = Math.floor((diff / 1000) % 60);
      setTimeLeft(`${days}일 ${hours}시간 ${minutes}분 ${seconds}초`);
    }, 1000);

    return () => clearInterval(timer);
  }, [product, isEnded]);

  const handleBid = async () => {
    const amount = parseInt(bidAmount, 10);
    if (!user) return Alert.alert("로그인이 필요합니다.");
    if (isMyProduct) return Alert.alert("자신이 등록한 상품에는 입찰할 수 없습니다.");
    if (isNaN(amount) || amount <= 0) return Alert.alert("올바른 금액을 입력하세요.");
    if (amount <= currentPrice) {
      return Alert.alert(`현재 가격보다 높은 금액을 입력해야 합니다. (최소 ${currentPrice + 1}원)`);
    }

    try {
      const bidsRef = collection(db, "products", String(id), "bids");
      await addDoc(bidsRef, {
        userId: user.uid,
        userEmail: user.email,
        amount,
        createdAt: Timestamp.now(),
      });
      setBidAmount("");
      Alert.alert("성공", "입찰이 완료되었습니다.");
    } catch (error) {
      console.error("입찰 실패: ", error);
      Alert.alert("오류", "입찰 중 문제가 발생했습니다.");
    }
  };

  const maskEmail = (email: string) => {
    if (!email) return "익명";
    const [id, domain] = email.split("@");
    return `${id.substring(0, 3)}***@${domain}`;
  };

  if (loading) {
    return <ActivityIndicator style={styles.centered} size="large" />;
  }

  if (!product) {
    return (
      <View style={styles.centered}>
        <Text>상품을 찾을 수 없습니다.</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <Image source={{ uri: product.imageUrl }} style={styles.image} />

      <View style={styles.detailsContainer}>
        <Text style={styles.title}>{product.title}</Text>
        <Text style={styles.description}>{product.description}</Text>

        <View style={styles.priceInfo}>
          <Text style={styles.priceLabel}>시작가</Text>
          <Text style={styles.priceValue}>{product.startPrice.toLocaleString()}원</Text>
        </View>
        <View style={styles.priceInfo}>
          <Text style={styles.priceLabel}>현재가</Text>
          <Text style={[styles.priceValue, styles.currentPrice]}>
            {currentPrice.toLocaleString()}원
          </Text>
        </View>

        <View style={styles.timerContainer}>
          <Text style={styles.timerLabel}>남은 시간</Text>
          <Text style={styles.timerText}>{timeLeft}</Text>
        </View>

        {!isMyProduct && !isEnded && (
          <View style={styles.bidContainer}>
            <TextInput
              style={styles.input}
              placeholder="입찰 금액"
              keyboardType="numeric"
              value={bidAmount}
              onChangeText={setBidAmount}
            />
            <TouchableOpacity style={styles.bidButton} onPress={handleBid}>
              <Text style={styles.bidButtonText}>입찰하기</Text>
            </TouchableOpacity>
          </View>
        )}
         {isMyProduct && <Text style={styles.myProductText}>내가 등록한 상품입니다.</Text>}

      </View>

      <View style={styles.bidsSection}>
        <Text style={styles.bidsTitle}>입찰 내역 ({bids.length}개)</Text>
        {bids.map((bid) => (
          <View key={bid.id} style={styles.bidItem}>
            <Text style={styles.bidUser}>{maskEmail(bid.userEmail)}</Text>
            <Text style={styles.bidAmount}>{bid.amount.toLocaleString()}원</Text>
          </View>
        ))}
        {bids.length === 0 && <Text style={styles.noBidsText}>아직 입찰이 없습니다.</Text>}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  centered: { flex: 1, justifyContent: "center", alignItems: "center" },
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  contentContainer: {
    paddingBottom: 40,
  },
  image: {
    width: "100%",
    height: 300,
  },
  detailsContainer: {
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
  },
  description: {
    fontSize: 16,
    color: "#666",
    marginTop: 10,
    lineHeight: 24,
  },
  priceInfo: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 20,
    alignItems: "center",
  },
  priceLabel: {
    fontSize: 16,
    color: "#333",
  },
  priceValue: {
    fontSize: 18,
    fontWeight: "500",
  },
  currentPrice: {
    color: "#E53E3E",
    fontWeight: "bold",
    fontSize: 20,
  },
  timerContainer: {
    padding: 15,
    backgroundColor: "#E6F7FF",
    borderRadius: 8,
    marginTop: 20,
    alignItems: 'center'
  },
  timerLabel: {
    fontSize: 14,
    color: '#096DD9'
  },
  timerText: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#096DD9",
    marginTop: 5,
  },
  bidContainer: {
    marginTop: 20,
  },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    padding: 12,
    borderRadius: 8,
    fontSize: 16,
    marginBottom: 10,
  },
  bidButton: {
    backgroundColor: "#007BFF",
    padding: 15,
    borderRadius: 8,
    alignItems: "center",
  },
  bidButtonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
  },
  myProductText: {
    textAlign: 'center',
    color: '#888',
    marginTop: 20,
    fontStyle: 'italic'
  },
  bidsSection: {
    padding: 20,
    marginTop: 10,
    borderTopWidth: 8,
    borderTopColor: '#f0f0f0'
  },
  bidsTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 15,
  },
  bidItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  bidUser: {
    fontSize: 16,
  },
  bidAmount: {
    fontSize: 16,
    fontWeight: "600",
  },
  noBidsText: {
    textAlign: 'center',
    color: '#888',
    marginTop: 10,
  },
});
