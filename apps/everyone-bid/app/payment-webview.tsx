import { Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import IMP from 'iamport-react-native';

// 로딩 화면 컴포넌트
function Loading() {
  return (
    <IMP.Loading />
  );
}

export default function PaymentWebView() {
  const router = useRouter();
  const { userCode, params } = useLocalSearchParams<{ userCode: string; params: string; }>();

  // 결제/등록 완료 후 콜백
  const handleCallback = (response: any) => {
    // Expo Router는 현재 스택에서 뒤로가기할 때 결과를 전달하는 명확한 방법이 부족합니다.
    // 대신, 성공/실패 여부를 Alert로 알리고, 상세 로직은 부모 스크린에서 상태 관리 라이브러리나
    // Context API를 통해 처리하는 것이 좋습니다.
    if (response.imp_success === 'true' || response.success === 'true') {
      Alert.alert('성공', '카드가 성공적으로 등록되었습니다.');
      // Firestore에 빌링키 등록 완료 상태를 저장하는 로직을 여기에 추가할 수 있습니다.
    } else {
      Alert.alert('실패', `카드 등록에 실패했습니다: ${response.error_msg}`);
    }
    // 결제 화면 닫기
    router.back();
  }

  if (!userCode || !params) {
    Alert.alert("오류", "결제 정보가 올바르지 않습니다.");
    router.back();
    return null;
  }
  
  const parsedParams = JSON.parse(params);

  return (
    <IMP.Payment
      userCode={userCode}
      loading={<Loading />}
      data={{
        ...parsedParams
      }}
      callback={handleCallback}
    />
  );
} 