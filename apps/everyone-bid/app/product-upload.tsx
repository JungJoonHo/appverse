import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  Button,
  Image,
  StyleSheet,
  ScrollView,
  Alert,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { auth, db } from "../firebase";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { collection, addDoc, Timestamp } from "firebase/firestore";
import { useRouter } from "expo-router";
import storage from "@repo/storage";

export default function ProductUpload() {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [startPrice, setStartPrice] = useState("");
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("이미지 라이브러리 접근 권한이 필요합니다.");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.7,
      allowsEditing: true,
    });

    if (!result.canceled) {
      setImageUri(result.assets[0].uri);
    }
  };

  const handleUpload = async () => {
    if (!auth.currentUser || !title || !startPrice || !imageUri) {
      Alert.alert("모든 필수 항목을 입력하고 이미지를 선택해주세요.");
      return;
    }
    setLoading(true);
    try {
      const downloadUrl = await storage.uploadFile(imageUri, `products/${Date.now()}_${auth.currentUser.uid}`);
      await addDoc(collection(db, "products"), {
        sellerId: auth.currentUser.uid,
        sellerEmail: auth.currentUser.email,
        title,
        description,
        startPrice: Number(startPrice),
        imageUrl: downloadUrl,
        createdAt: Timestamp.now(),
        status: "active", // active, sold, expired
        endAt: Timestamp.fromDate(new Date(Date.now() + 24 * 60 * 60 * 1000)), // 24시간 뒤 마감
      });

      Alert.alert("성공", "상품이 성공적으로 등록되었습니다.");
      router.back();
    } catch (err: any) {
      console.error(err);
      Alert.alert("업로드 실패", err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>상품 정보 입력</Text>

      <TouchableOpacity style={styles.imagePicker} onPress={pickImage}>
        {imageUri ? (
          <Image source={{ uri: imageUri }} style={styles.previewImage} />
        ) : (
          <Text style={styles.imagePickerText}>+ 이미지 추가</Text>
        )}
      </TouchableOpacity>

      <Text style={styles.label}>상품명</Text>
      <TextInput
        style={styles.input}
        placeholder="예: 한정판 나이키 신발"
        value={title}
        onChangeText={setTitle}
      />
      <Text style={styles.label}>시작가 (원)</Text>
      <TextInput
        style={styles.input}
        placeholder="경매 시작 가격"
        keyboardType="numeric"
        value={startPrice}
        onChangeText={setStartPrice}
      />
      <Text style={styles.label}>상세 설명</Text>
      <TextInput
        style={[styles.input, styles.textarea]}
        placeholder="상품의 상태, 특징 등을 자세히 적어주세요."
        value={description}
        onChangeText={setDescription}
        multiline
      />

      <TouchableOpacity
        style={[styles.button, loading && styles.buttonDisabled]}
        onPress={handleUpload}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>상품 등록하기</Text>
        )}
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: "#fff",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 20,
  },
  imagePicker: {
    width: "100%",
    height: 200,
    backgroundColor: "#f0f0f0",
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 8,
    marginBottom: 20,
  },
  imagePickerText: {
    color: "#888",
  },
  previewImage: {
    width: "100%",
    height: "100%",
    borderRadius: 8,
  },
  label: {
    fontSize: 16,
    fontWeight: "500",
    marginTop: 15,
    marginBottom: 5,
  },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  textarea: {
    height: 120,
    textAlignVertical: "top",
  },
  button: {
    backgroundColor: "#007BFF",
    padding: 15,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 30,
  },
  buttonDisabled: {
    backgroundColor: "#A9A9A9",
  },
  buttonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
  },
});
