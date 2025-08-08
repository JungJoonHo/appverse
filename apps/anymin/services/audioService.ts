import { Alert, Platform } from "react-native";
import * as FileSystem from "expo-file-system";
import * as DocumentPicker from "expo-document-picker";
import * as MediaLibrary from "expo-media-library";

export interface AudioFile {
  name: string;
  path: string;
  size: number;
  duration?: number;
  created_at: Date;
}

export class AudioService {
  private static instance: AudioService;

  private constructor() {}

  public static getInstance(): AudioService {
    if (!AudioService.instance) {
      AudioService.instance = new AudioService();
    }
    return AudioService.instance;
  }

  // 권한 확인 및 요청
  public async checkAndRequestPermissions(): Promise<boolean> {
    try {
      // 미디어 라이브러리 권한 요청
      const { status } = await MediaLibrary.requestPermissionsAsync();
      return status === "granted";
    } catch (error) {
      console.error("Permission check failed:", error);
      Alert.alert("권한 필요", "미디어 라이브러리 접근 권한이 필요합니다.");
      return false;
    }
  }

  // 통화 녹음본 파일 목록 가져오기
  public async getCallRecordings(): Promise<AudioFile[]> {
    try {
      const hasPermission = await this.checkAndRequestPermissions();
      if (!hasPermission) {
        return [];
      }

      const recordings: AudioFile[] = [];

      // 미디어 라이브러리에서 오디오 파일 가져오기
      const media = await MediaLibrary.getAssetsAsync({
        mediaType: MediaLibrary.MediaType.audio,
        first: 100, // 최근 100개 파일
      });

      for (const asset of media.assets) {
        if (this.isAudioFile(asset.filename)) {
          recordings.push({
            name: asset.filename,
            path: asset.uri,
            size: 0, // MediaLibrary Asset에는 fileSize가 없음
            created_at: new Date(asset.creationTime * 1000),
          });
        }
      }

      // 생성일 기준으로 정렬 (최신순)
      return recordings.sort(
        (a, b) => b.created_at.getTime() - a.created_at.getTime(),
      );
    } catch (error) {
      console.error("Failed to get call recordings:", error);
      Alert.alert("오류", "통화 녹음본을 불러오는데 실패했습니다.");
      return [];
    }
  }

  // 오디오 파일인지 확인
  private isAudioFile(filename: string): boolean {
    const audioExtensions = [
      ".mp3",
      ".wav",
      ".m4a",
      ".aac",
      ".ogg",
      ".flac",
      ".amr",
    ];
    const lowerFilename = filename.toLowerCase();
    return audioExtensions.some((ext) => lowerFilename.endsWith(ext));
  }

  // 파일 선택을 통한 오디오 파일 가져오기
  public async pickAudioFile(): Promise<AudioFile | null> {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: "audio/*",
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const file = result.assets[0];
        return {
          name: file.name || "Unknown",
          path: file.uri,
          size: file.size || 0,
          created_at: new Date(),
        };
      }
      return null;
    } catch (error) {
      console.error("Failed to pick audio file:", error);
      Alert.alert("오류", "오디오 파일을 선택하는데 실패했습니다.");
      return null;
    }
  }

  // 오디오 파일 삭제
  public async deleteAudioFile(filePath: string): Promise<boolean> {
    try {
      // 미디어 라이브러리에서 에셋 찾기
      const assets = await MediaLibrary.getAssetsAsync({
        mediaType: MediaLibrary.MediaType.audio,
      });

      const asset = assets.assets.find((a) => a.uri === filePath);
      if (asset) {
        await MediaLibrary.deleteAssetsAsync([asset]);
        return true;
      }

      // 캐시 파일인 경우 FileSystem으로 삭제
      if (filePath.startsWith(FileSystem.cacheDirectory)) {
        await FileSystem.deleteAsync(filePath);
        return true;
      }

      return false;
    } catch (error) {
      console.error("Failed to delete audio file:", error);
      return false;
    }
  }

  // 오디오 파일 정보 가져오기
  public async getAudioFileInfo(filePath: string): Promise<AudioFile | null> {
    try {
      const fileInfo = await FileSystem.getInfoAsync(filePath);
      if (!fileInfo.exists) {
        return null;
      }

      const filename = filePath.split("/").pop() || "Unknown";

      return {
        name: filename,
        path: filePath,
        size: fileInfo.size || 0,
        created_at: new Date(),
      };
    } catch (error) {
      console.error("Failed to get audio file info:", error);
      return null;
    }
  }

  // 오디오 파일 복사
  public async copyAudioFile(
    sourcePath: string,
    destinationPath: string,
  ): Promise<boolean> {
    try {
      await FileSystem.copyAsync({
        from: sourcePath,
        to: destinationPath,
      });
      return true;
    } catch (error) {
      console.error("Failed to copy audio file:", error);
      return false;
    }
  }

  // 오디오 파일 이동
  public async moveAudioFile(
    sourcePath: string,
    destinationPath: string,
  ): Promise<boolean> {
    try {
      await FileSystem.moveAsync({
        from: sourcePath,
        to: destinationPath,
      });
      return true;
    } catch (error) {
      console.error("Failed to move audio file:", error);
      return false;
    }
  }

  // 앱 문서 디렉토리에 파일 저장
  public async saveToDocuments(
    sourcePath: string,
    filename: string,
  ): Promise<string | null> {
    try {
      const documentsDir = FileSystem.documentDirectory;
      if (!documentsDir) {
        throw new Error("Documents directory not available");
      }

      const destinationPath = `${documentsDir}${filename}`;
      await FileSystem.copyAsync({
        from: sourcePath,
        to: destinationPath,
      });

      return destinationPath;
    } catch (error) {
      console.error("Failed to save to documents:", error);
      return null;
    }
  }

  // 앱 문서 디렉토리에서 파일 목록 가져오기
  public async getDocumentsFiles(): Promise<AudioFile[]> {
    try {
      const documentsDir = FileSystem.documentDirectory;
      if (!documentsDir) {
        return [];
      }

      const files = await FileSystem.readDirectoryAsync(documentsDir);
      const audioFiles: AudioFile[] = [];

      for (const filename of files) {
        if (this.isAudioFile(filename)) {
          const filePath = `${documentsDir}${filename}`;
          const fileInfo = await FileSystem.getInfoAsync(filePath);

          if (fileInfo.exists) {
            audioFiles.push({
              name: filename,
              path: filePath,
              size: fileInfo.size || 0,
              created_at: new Date(),
            });
          }
        }
      }

      return audioFiles.sort(
        (a, b) => b.created_at.getTime() - a.created_at.getTime(),
      );
    } catch (error) {
      console.error("Failed to get documents files:", error);
      return [];
    }
  }
}

export default AudioService.getInstance();
