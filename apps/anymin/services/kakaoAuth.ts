import { Alert } from "react-native";
import { auth, db } from "../firebase/config";
import {
  signInWithCredential,
  OAuthProvider,
  UserCredential,
} from "firebase/auth";
import { doc, setDoc, getDoc } from "firebase/firestore";
import { ENTITY_ADMIN_USERS } from "../constants/firebase";

// 카카오 로그인 설정
const KAKAO_CLIENT_ID = "YOUR_KAKAO_CLIENT_ID"; // 카카오 개발자 콘솔에서 가져온 클라이언트 ID
const KAKAO_REDIRECT_URI = "YOUR_REDIRECT_URI"; // 리다이렉트 URI

interface KakaoUser {
  id: string;
  email: string;
  nickname: string;
  profile_image_url?: string;
}

interface KakaoAuthResponse {
  access_token: string;
  token_type: string;
  refresh_token: string;
  expires_in: number;
  scope: string;
  refresh_token_expires_in: number;
}

export class KakaoAuthService {
  private static instance: KakaoAuthService;
  private authCodeResolver: ((value: string) => void) | null = null;

  private constructor() {}

  public static getInstance(): KakaoAuthService {
    if (!KakaoAuthService.instance) {
      KakaoAuthService.instance = new KakaoAuthService();
    }
    return KakaoAuthService.instance;
  }

  // 웹뷰에서 받은 인증 코드를 설정
  public setAuthCode(authCode: string): void {
    if (this.authCodeResolver) {
      this.authCodeResolver(authCode);
      this.authCodeResolver = null;
    }
  }

  // 카카오 로그인 시작
  public async login(): Promise<boolean> {
    try {
      // 1. 카카오 인증 코드 요청
      const authCode = await this.getKakaoAuthCode();
      if (!authCode) {
        throw new Error("카카오 인증 코드를 받지 못했습니다.");
      }

      // 2. 액세스 토큰 요청
      const authResponse = await this.getKakaoAccessToken(authCode);
      if (!authResponse) {
        throw new Error("카카오 액세스 토큰을 받지 못했습니다.");
      }

      // 3. 카카오 사용자 정보 요청
      const kakaoUser = await this.getKakaoUserInfo(authResponse.access_token);
      if (!kakaoUser) {
        throw new Error("카카오 사용자 정보를 받지 못했습니다.");
      }

      // 4. Firebase Auth로 로그인
      const userCredential = await this.signInWithKakao(kakaoUser);
      if (!userCredential) {
        throw new Error("Firebase 로그인에 실패했습니다.");
      }

      // 5. Firestore에 사용자 정보 저장
      await this.saveUserToFirestore(userCredential.user, kakaoUser);

      return true;
    } catch (error) {
      console.error("Kakao login failed:", error);
      Alert.alert("오류", "카카오 로그인에 실패했습니다.");
      return false;
    }
  }

  // 카카오 인증 코드 요청
  private async getKakaoAuthCode(): Promise<string | null> {
    try {
      // 웹뷰를 통해 카카오 인증 코드를 받는 방식으로 구현
      return new Promise((resolve, reject) => {
        this.authCodeResolver = resolve;

        // 30초 후 타임아웃
        setTimeout(() => {
          if (this.authCodeResolver) {
            this.authCodeResolver = null;
            reject(new Error("카카오 인증 코드 요청이 타임아웃되었습니다."));
          }
        }, 30000);
      });
    } catch (error) {
      console.error("Failed to get Kakao auth code:", error);
      return null;
    }
  }

  // 카카오 액세스 토큰 요청
  private async getKakaoAccessToken(
    authCode: string,
  ): Promise<KakaoAuthResponse | null> {
    try {
      const response = await fetch("https://kauth.kakao.com/oauth/token", {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          grant_type: "authorization_code",
          client_id: KAKAO_CLIENT_ID,
          redirect_uri: KAKAO_REDIRECT_URI,
          code: authCode,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to get access token");
      }

      return await response.json();
    } catch (error) {
      console.error("Failed to get Kakao access token:", error);
      return null;
    }
  }

  // 카카오 사용자 정보 요청
  private async getKakaoUserInfo(
    accessToken: string,
  ): Promise<KakaoUser | null> {
    try {
      const response = await fetch("https://kapi.kakao.com/v2/user/me", {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to get user info");
      }

      const userData = await response.json();
      return {
        id: userData.id.toString(),
        email: userData.kakao_account?.email || "",
        nickname: userData.properties?.nickname || "",
        profile_image_url: userData.properties?.profile_image,
      };
    } catch (error) {
      console.error("Failed to get Kakao user info:", error);
      return null;
    }
  }

  // Firebase Auth로 카카오 로그인
  private async signInWithKakao(
    kakaoUser: KakaoUser,
  ): Promise<UserCredential | null> {
    try {
      // Firebase Auth의 OAuth Provider를 사용하여 카카오 로그인
      const provider = new OAuthProvider("oidc.kakao");

      // 카카오 사용자 정보를 Firebase Auth에 전달
      const credential = await signInWithCredential(
        auth,
        provider.credential({
          idToken: `kakao_${kakaoUser.id}`, // 실제로는 카카오에서 받은 ID 토큰을 사용
          accessToken: `kakao_access_${kakaoUser.id}`, // 실제로는 카카오 액세스 토큰을 사용
        }),
      );

      return credential;
    } catch (error) {
      console.error("Failed to sign in with Kakao:", error);
      return null;
    }
  }

  // Firestore에 사용자 정보 저장
  private async saveUserToFirestore(
    firebaseUser: any,
    kakaoUser: KakaoUser,
  ): Promise<void> {
    try {
      const userDocRef = doc(db, ENTITY_ADMIN_USERS.NAME, firebaseUser.uid);
      const userDoc = await getDoc(userDocRef);

      if (!userDoc.exists()) {
        // 새 사용자인 경우 Firestore에 저장
        const userInfo = {
          [ENTITY_ADMIN_USERS.FIELDS.NAME]: kakaoUser.nickname,
          [ENTITY_ADMIN_USERS.FIELDS.USER_ID]: kakaoUser.email,
          [ENTITY_ADMIN_USERS.FIELDS.PHONE]: "", // 카카오에서는 전화번호를 제공하지 않음
          [ENTITY_ADMIN_USERS.FIELDS.CREATED_AT]: new Date(),
          kakao_id: kakaoUser.id,
          profile_image_url: kakaoUser.profile_image_url,
        };

        await setDoc(userDocRef, userInfo);
      }
    } catch (error) {
      console.error("Failed to save user to Firestore:", error);
      throw error;
    }
  }

  // 카카오 로그아웃
  public async logout(): Promise<void> {
    try {
      // Firebase Auth 로그아웃
      await auth.signOut();

      // 카카오 토큰 삭제 (실제 구현에서는 카카오 SDK를 사용)
      console.log("Kakao logout completed");
    } catch (error) {
      console.error("Kakao logout failed:", error);
      throw error;
    }
  }
}

export default KakaoAuthService.getInstance();
