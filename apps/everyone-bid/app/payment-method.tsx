import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/context/AuthContext';
import IMP from 'iamport-react-native';

// 래핑된 결제 관리 화면
export default function PaymentMethod() {
  const { user } = useAuth();
  const router = useRouter();

  // 아임포트 결제 요청
  const handleRegisterCard = () => {
    if (!user) {
      Alert.alert("오류", "로그인이 필요합니다.");
      return;
    }

    const params = {
      pg: 'html5_inicis', // 사용할 PG사. 테스트 시에는 'html5_inicis'를 사용합니다.
      pay_method: 'card',
      name: '결제 카드 등록',
      // 아임포트와 통신하기 위한 고유 주문번호. 매번 유니크해야 합니다.
      merchant_uid: `mid_${new Date().getTime()}`,
      // 이 customer_uid는 이후 비인증 결제(자동결제)에 사용될 카드(빌링키)와 1:1로 매칭됩니다.
      // Firebase user.uid를 사용하는 것이 좋습니다.
      customer_uid: user.uid,
      amount: 0, // 빌링키 발급만 하는 경우, 결제금액은 0원입니다.
      buyer_name: user.name,
      buyer_email: user.email,
      buyer_tel: user.phone,
    };
    
    // `IMP.Certification`을 사용할 수도 있지만, 0원 결제를 통한 빌링키 발급이 일반적입니다.
    router.push({
      pathname: "/payment-webview",
      params: { 
        userCode: "00ioxa0fM6NexooCvxVSaevB8U22cZjUIEeaB7vaBhKpArwSLfQ1vbfwr3Ba4lU1oO1IY9GDlGu5oFXr", // 아임포트 관리자 페이지에서 발급받은 가맹점 식별코드를 입력해야 합니다.
        params: JSON.stringify(params), 
      },
    });
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>결제 수단 등록</Text>
      <Text style={styles.subtitle}>
        경매 낙찰 시 자동으로 결제될 카드를 등록해주세요.
      </Text>
      <TouchableOpacity style={styles.saveButton} onPress={handleRegisterCard}>
        <Text style={styles.saveButtonText}>카드 등록하기</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 30,
  },
  saveButton: {
    backgroundColor: '#007BFF',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  }
}); 