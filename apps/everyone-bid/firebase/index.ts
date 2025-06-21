import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyCTqe0pjVhWG6fH7evHgpmmPbN16Venwjs",
  authDomain: "everyone-bid.firebaseapp.com",
  projectId: "everyone-bid",
  storageBucket: "everyone-bid.firebasestorage.app",
  messagingSenderId: "1062028894118",
  appId: "1:1062028894118:web:1ce2c95edcfad27cc63967",
  measurementId: "G-JB6W15LRGJ"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
