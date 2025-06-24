import { auth, db } from "@/firebase";
import { User as FirebaseUser, onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { useRouter, useSegments } from "expo-router";
import {
  PropsWithChildren,
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";

// Firestore 데이터를 포함하도록 Firebase User 타입 확장
export type User = FirebaseUser & {
  name?: string;
  phone?: string;
  role?: "buyer" | "seller";
};

type AuthState = {
  user: User | null;
  loading: boolean;
};

const AuthContext = createContext<AuthState>({
  user: null,
  loading: true,
});

export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }: PropsWithChildren) {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    loading: true,
  });
  const router = useRouter();
  const segments = useSegments();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        const docRef = doc(db, "users", user.uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const { role, name, phone } = docSnap.data();
          // Firestore 데이터와 Auth 데이터를 병합
          const fullUser: User = {
            ...user,
            role,
            name,
            phone,
          };
          setAuthState({ user: fullUser, loading: false });
        } else {
          // This case happens right after registration, before a role is selected.
          setAuthState({ user: user as User, loading: false });
        }
      } else {
        setAuthState({ user: null, loading: false });
      }
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (authState.loading) return;

    const currentPath = segments.join("/") || "home";
    const inAuthFlow = ["login", "register", "role-select"].includes(
      currentPath,
    );

    if (!authState.user && !inAuthFlow) {
      router.replace("/login");
    } else if (authState.user && !authState.user.role && currentPath !== "role-select") {
      router.replace("/role-select");
    } else if (authState.user && authState.user.role && inAuthFlow) {
       router.replace("/home");
    }
  }, [authState, segments]);

  return (
    <AuthContext.Provider value={authState}>{children}</AuthContext.Provider>
  );
} 