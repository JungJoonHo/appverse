import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// Firebase 설정
// 실제 프로젝트에서는 환경변수나 별도 설정 파일에서 관리해야 합니다
// Firebase Console에서 프로젝트를 생성하고 설정값을 가져와서 사용하세요
const firebase_config = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY || "your-api-key",
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN || "your-project.firebaseapp.com",
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID || "your-project-id",
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET || "your-project.appspot.com",
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "your-sender-id",
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID || "your-app-id",
  measurementId: process.env.EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID || "your-measurement-id"
};

// Firebase 앱 초기화
const app = initializeApp(firebase_config);

// Firebase 서비스 초기화
export const auth = getAuth(app);
export const db = getFirestore(app);

export default app; 