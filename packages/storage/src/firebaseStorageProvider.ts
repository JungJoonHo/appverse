import { StorageProvider } from "./index";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { initializeApp } from "firebase/app";
import fs from "fs/promises";

// Firebase config는 환경변수 등에서 받아오세요
const firebaseConfig = {
  // ...your config
};

const app = initializeApp(firebaseConfig);
const storage = getStorage(app);

export class FirebaseStorageProvider implements StorageProvider {
  async uploadFile(localPath: string, destPath: string): Promise<string> {
    const fileBuffer = await fs.readFile(localPath);
    const storageRef = ref(storage, destPath);
    await uploadBytes(storageRef, fileBuffer);
    return await getDownloadURL(storageRef);
  }

  async getDownloadUrl(destPath: string): Promise<string> {
    const storageRef = ref(storage, destPath);
    return await getDownloadURL(storageRef);
  }
}