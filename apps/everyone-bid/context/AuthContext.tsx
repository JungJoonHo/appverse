import { auth, db } from "@/firebase";
import { User, onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { useRouter, useSegments } from "expo-router";
import {
  PropsWithChildren,
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";

type AuthState = {
  user: User | null;
  role: "buyer" | "seller" | null;
  loading: boolean;
};

const AuthContext = createContext<AuthState>({
  user: null,
  role: null,
  loading: true,
});

export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }: PropsWithChildren) {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    role: null,
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
          const role = docSnap.data().role;
          setAuthState({ user, role, loading: false });
        } else {
          // This case happens right after registration, before a role is selected.
          setAuthState({ user, role: null, loading: false });
        }
      } else {
        setAuthState({ user: null, role: null, loading: false });
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
    } else if (authState.user && !authState.role && currentPath !== "role-select") {
      router.replace("/role-select");
    } else if (authState.user && authState.role && inAuthFlow) {
       router.replace("/home");
    }
  }, [authState, segments]);

  return (
    <AuthContext.Provider value={authState}>{children}</AuthContext.Provider>
  );
} 