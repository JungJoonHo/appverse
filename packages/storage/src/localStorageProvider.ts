import { StorageProvider } from "./index";
import fs from "fs/promises";
import path from "path";

const LOCAL_STORAGE_DIR = path.resolve(process.cwd(), "local_uploads");

export class LocalStorageProvider implements StorageProvider {
  async uploadFile(localPath: string, destPath: string): Promise<string> {
    await fs.mkdir(LOCAL_STORAGE_DIR, { recursive: true });
    const targetPath = path.join(LOCAL_STORAGE_DIR, destPath);
    await fs.copyFile(localPath, targetPath);
    return targetPath;
  }

  async getDownloadUrl(destPath: string): Promise<string> {
    // 개발 환경에서는 파일 경로 반환
    return path.join(LOCAL_STORAGE_DIR, destPath);
  }
}