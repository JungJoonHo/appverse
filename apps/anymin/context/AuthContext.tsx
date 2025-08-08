import React, { createContext, useContext, useState, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  User as FirebaseUser,
  updateProfile,
} from "firebase/auth";
import { doc, setDoc, getDoc } from "firebase/firestore";
import { auth, db } from "../firebase/config";
import {
  ENTITY_USERS,
  ENTITY_ADMIN_USERS,
  AdminUserFields,
} from "../constants/firebase";
import kakaoAuthService from "../services/kakaoAuth";

interface AdminUser extends AdminUserFields {
  uid: string;
  email?: string;
}

interface AuthContextType {
  user: AdminUser | null;
  is_loading: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  register: (
    user_data: Omit<AdminUser, "uid" | "created_at"> & { password: string },
  ) => Promise<boolean>;
  logout: () => Promise<void>;
  updateProfile: (name: string, phone: string) => Promise<boolean>;
  loginWithKakao: () => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, set_user] = useState<AdminUser | null>(null);
  const [is_loading, set_is_loading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebase_user) => {
      if (firebase_user) {
        // Firebase 사용자가 로그인된 경우, Firestore에서 추가 정보 가져오기
        try {
          const user_doc = await getDoc(
            doc(db, ENTITY_ADMIN_USERS.NAME, firebase_user.uid),
          );
          if (user_doc.exists()) {
            const user_data = user_doc.data();
            const user_info: AdminUser = {
              uid: firebase_user.uid,
              user_id: firebase_user.email || "",
              name: user_data[ENTITY_USERS.FIELDS.NAME],
              phone: user_data[ENTITY_USERS.FIELDS.PHONE],
              created_at:
                user_data[ENTITY_USERS.FIELDS.CREATED_AT]
                  ?.toDate?.()
                  ?.toISOString() || user_data[ENTITY_USERS.FIELDS.CREATED_AT],
            };
            set_user(user_info);
            await AsyncStorage.setItem("user", JSON.stringify(user_info));
          }
        } catch (error) {
          console.error("Failed to load user data from Firestore:", error);
        }
      } else {
        // 로그아웃된 경우
        set_user(null);
        await AsyncStorage.removeItem("user");
      }
      set_is_loading(false);
    });

    return unsubscribe;
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      await signInWithEmailAndPassword(auth, email, password);
      return true;
    } catch (error: any) {
      console.error("Login failed:", error);
      return false;
    }
  };

  const register = async (
    user_data: Omit<AdminUser, "uid" | "created_at"> & { password: string },
  ): Promise<boolean> => {
    try {
      // Firebase Auth로 사용자 생성
      const user_credential = await createUserWithEmailAndPassword(
        auth,
        user_data.user_id,
        user_data.password,
      );

      const firebase_user = user_credential.user;

      // Firestore에 사용자 정보 저장
      const user_info = {
        [ENTITY_ADMIN_USERS.FIELDS.NAME]: user_data.name,
        [ENTITY_ADMIN_USERS.FIELDS.USER_ID]: user_data.user_id,
        [ENTITY_ADMIN_USERS.FIELDS.PHONE]: user_data.phone,
        [ENTITY_ADMIN_USERS.FIELDS.CREATED_AT]: new Date(),
      };

      await setDoc(
        doc(db, ENTITY_ADMIN_USERS.NAME, firebase_user.uid),
        user_info,
      );

      // 프로필 이름 업데이트
      await updateProfile(firebase_user, {
        displayName: user_data.name,
      });

      return true;
    } catch (error: any) {
      console.error("Registration failed:", error);
      return false;
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  const updateUserProfile = async (
    name: string,
    phone: string,
  ): Promise<boolean> => {
    if (!user) return false;

    try {
      // Firestore에서 사용자 정보 업데이트
      const user_info = {
        [ENTITY_ADMIN_USERS.FIELDS.NAME]: name.trim(),
        [ENTITY_ADMIN_USERS.FIELDS.PHONE]: phone.trim(),
      };

      await setDoc(doc(db, ENTITY_ADMIN_USERS.NAME, user.uid), user_info, {
        merge: true,
      });

      // Firebase Auth 프로필 이름 업데이트
      const current_user = auth.currentUser;
      if (current_user) {
        await updateProfile(current_user, {
          displayName: name.trim(),
        });
      }

      // 로컬 상태 업데이트
      const updated_user: AdminUser = {
        ...user,
        name: name.trim(),
        phone: phone.trim(),
      };
      set_user(updated_user);
      await AsyncStorage.setItem("user", JSON.stringify(updated_user));

      return true;
    } catch (error) {
      console.error("Profile update failed:", error);
      return false;
    }
  };

  const loginWithKakao = async (): Promise<boolean> => {
    try {
      const success = await kakaoAuthService.login();
      return success;
    } catch (error) {
      console.error("Kakao login failed:", error);
      return false;
    }
  };

  const value: AuthContextType = {
    user,
    is_loading,
    login,
    register,
    logout,
    updateProfile: updateUserProfile,
    loginWithKakao,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
