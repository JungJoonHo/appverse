import { Alert } from "react-native";
import { auth, db } from "../firebase/config";
import {
  signInWithCredential,
  OAuthProvider,
  UserCredential,
} from "firebase/auth";
import { doc, setDoc, getDoc } from "firebase/firestore";
import { ENTITY_ADMIN_USERS } from "../constants/firebase";

// 네이버 로그인 설정
const NAVER_CLIENT_ID = "YlhVnauIzoYgoUQZLd5Gg"; // 네이버 개발자 센터에서 가져온 클라이언트 ID
const NAVER_CLIENT_SECRET = "mTX_ozP7kQ"; // 네이버 클라이언트 시크릿
const NAVER_REDIRECT_URI = "http://localhost:8081"; // 리다이렉트 URI

interface NaverUser {
  id: string;
  email: string;
  nickname: string;
  name: string;
  profile_image?: string;
}

interface NaverAuthResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in: number;
}

export class NaverAuthService {
  private static instance: NaverAuthService;
  private authCodeResolver: ((value: string) => void) | null = null;

  private constructor() {}

  public static getInstance(): NaverAuthService {
    if (!NaverAuthService.instance) {
      NaverAuthService.instance = new NaverAuthService();
    }
    return NaverAuthService.instance;
  }

  // 웹뷰에서 받은 인증 코드를 설정
  public setAuthCode(authCode: string): void {
    if (this.authCodeResolver) {
      this.authCodeResolver(authCode);
      this.authCodeResolver = null;
    }
  }

  // 네이버 로그인 시작
  public async login(): Promise<boolean> {
    try {
      // 1. 네이버 인증 코드 요청
      const authCode = await this.getNaverAuthCode();
      if (!authCode) {
        throw new Error("네이버 인증 코드를 받지 못했습니다.");
      }

      // 2. 액세스 토큰 요청
      const authResponse = await this.getNaverAccessToken(authCode);
      if (!authResponse) {
        throw new Error("네이버 액세스 토큰을 받지 못했습니다.");
      }

      // 3. 네이버 사용자 정보 요청
      const naverUser = await this.getNaverUserInfo(authResponse.access_token);
      if (!naverUser) {
        throw new Error("네이버 사용자 정보를 받지 못했습니다.");
      }

      // 4. Firebase Auth로 로그인
      const userCredential = await this.signInWithNaver(naverUser);
      if (!userCredential) {
        throw new Error("Firebase 로그인에 실패했습니다.");
      }

      // 5. Firestore에 사용자 정보 저장
      await this.saveUserToFirestore(userCredential.user, naverUser);

      return true;
    } catch (error) {
      console.error("Naver login failed:", error);
      Alert.alert("오류", "네이버 로그인에 실패했습니다.");
      return false;
    }
  }

  // 네이버 인증 코드 요청
  private async getNaverAuthCode(): Promise<string | null> {
    try {
      // 웹뷰를 통해 네이버 인증 코드를 받는 방식으로 구현
      return new Promise((resolve, reject) => {
        this.authCodeResolver = resolve;

        // 30초 후 타임아웃
        setTimeout(() => {
          if (this.authCodeResolver) {
            this.authCodeResolver = null;
            reject(new Error("네이버 인증 코드 요청이 타임아웃되었습니다."));
          }
        }, 30000);
      });
    } catch (error) {
      console.error("Failed to get Naver auth code:", error);
      return null;
    }
  }

  // 네이버 액세스 토큰 요청
  private async getNaverAccessToken(
    authCode: string,
  ): Promise<NaverAuthResponse | null> {
    try {
      const response = await fetch("https://nid.naver.com/oauth2.0/token", {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          grant_type: "authorization_code",
          client_id: NAVER_CLIENT_ID,
          client_secret: NAVER_CLIENT_SECRET,
          redirect_uri: NAVER_REDIRECT_URI,
          code: authCode,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to get access token");
      }

      return await response.json();
    } catch (error) {
      console.error("Failed to get Naver access token:", error);
      return null;
    }
  }

  // 네이버 사용자 정보 요청
  private async getNaverUserInfo(
    accessToken: string,
  ): Promise<NaverUser | null> {
    try {
      const response = await fetch("https://openapi.naver.com/v1/nid/me", {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to get user info");
      }

      const userData = await response.json();
      const responseData = userData.response;

      return {
        id: responseData.id,
        email: responseData.email || "",
        nickname: responseData.nickname || "",
        name: responseData.name || "",
        profile_image: responseData.profile_image,
      };
    } catch (error) {
      console.error("Failed to get Naver user info:", error);
      return null;
    }
  }

  // Firebase Auth로 네이버 로그인
  private async signInWithNaver(
    naverUser: NaverUser,
  ): Promise<UserCredential | null> {
    try {
      // Firebase Auth의 OAuth Provider를 사용하여 네이버 로그인
      const provider = new OAuthProvider("oidc.naver");

      // 네이버 사용자 정보를 Firebase Auth에 전달
      const credential = await signInWithCredential(
        auth,
        provider.credential({
          idToken: `naver_${naverUser.id}`, // 실제로는 네이버에서 받은 ID 토큰을 사용
          accessToken: `naver_access_${naverUser.id}`, // 실제로는 네이버 액세스 토큰을 사용
        }),
      );

      return credential;
    } catch (error) {
      console.error("Failed to sign in with Naver:", error);
      return null;
    }
  }

  // Firestore에 사용자 정보 저장
  private async saveUserToFirestore(
    firebaseUser: any,
    naverUser: NaverUser,
  ): Promise<void> {
    try {
      const userDocRef = doc(db, ENTITY_ADMIN_USERS.NAME, firebaseUser.uid);
      const userDoc = await getDoc(userDocRef);

      if (!userDoc.exists()) {
        // 새 사용자인 경우 Firestore에 저장
        const userInfo = {
          [ENTITY_ADMIN_USERS.FIELDS.NAME]:
            naverUser.name || naverUser.nickname,
          [ENTITY_ADMIN_USERS.FIELDS.USER_ID]: naverUser.email,
          [ENTITY_ADMIN_USERS.FIELDS.PHONE]: "", // 네이버에서는 전화번호를 제공하지 않음
          [ENTITY_ADMIN_USERS.FIELDS.CREATED_AT]: new Date(),
          naver_id: naverUser.id,
          profile_image_url: naverUser.profile_image,
        };

        await setDoc(userDocRef, userInfo);
      }
    } catch (error) {
      console.error("Failed to save user to Firestore:", error);
      throw error;
    }
  }

  // 네이버 로그아웃
  public async logout(): Promise<void> {
    try {
      // Firebase Auth 로그아웃
      await auth.signOut();

      // 네이버 토큰 삭제 (실제 구현에서는 네이버 SDK를 사용)
      console.log("Naver logout completed");
    } catch (error) {
      console.error("Naver logout failed:", error);
      throw error;
    }
  }
}

export default NaverAuthService.getInstance();
