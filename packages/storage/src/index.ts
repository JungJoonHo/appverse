import { LocalStorageProvider } from "./localStorageProvider";
import { FirebaseStorageProvider } from "./firebaseStorageProvider";

export interface StorageProvider {
    uploadFile(localPath: string, destPath: string): Promise<string>; // returns download URL or local path
    getDownloadUrl(destPath: string): Promise<string>;
}


let provider: StorageProvider;

if (process.env.NODE_ENV === "development") {
  provider = new LocalStorageProvider();
} else {
  provider = new FirebaseStorageProvider();
}

export default provider;