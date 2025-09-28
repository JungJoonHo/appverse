import { firebase_database_service, CallRecord } from "./firebaseDatabase";

interface STTResponse {
  transcription: string;
  summary?: string;
  key_points?: string[];
}

class STTService {
  private readonly API_BASE_URL = "http://localhost:8000"; // ai-api 서버 주소

  async transcribe_audio(
    audio_file_path: string,
    call_record_id: string,
  ): Promise<STTResponse> {
    try {
      // AI-API 서버로 STT 요청
      const response = await fetch(`${this.API_BASE_URL}/stt/transcribe`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          audio_file_path: audio_file_path,
        }),
      });

      if (!response.ok) {
        throw new Error(`STT API 요청 실패: ${response.status}`);
      }

      const result: STTResponse = await response.json();

      // 통화 기록 업데이트
      await firebase_database_service.update_call_record(call_record_id, {
        transcription: result.transcription,
        is_transcribed: true,
      });

      return result;
    } catch (error) {
      console.error("STT 변환 실패:", error);
      throw error;
    }
  }

  async extract_key_points(transcription: string): Promise<string[]> {
    try {
      // AI-API 서버로 핵심 내용 추출 요청
      const response = await fetch(`${this.API_BASE_URL}/stt/extract`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          transcription: transcription,
        }),
      });

      if (!response.ok) {
        throw new Error(`핵심 내용 추출 API 요청 실패: ${response.status}`);
      }

      const result = await response.json();
      return result.key_points || [];
    } catch (error) {
      console.error("핵심 내용 추출 실패:", error);
      // API 실패 시 간단한 키워드 추출 로직
      return this.simple_keyword_extraction(transcription);
    }
  }

  private simple_keyword_extraction(transcription: string): string[] {
    // 간단한 키워드 추출 로직 (API 실패 시 대체)
    const keywords = transcription
      .split(/[.,!?]/)
      .map((sentence) => sentence.trim())
      .filter((sentence) => sentence.length > 10)
      .slice(0, 5);

    return keywords;
  }

  async save_as_memo(
    user_id: string,
    title: string,
    content: string,
  ): Promise<string> {
    try {
      return await firebase_database_service.create_memo({
        user_id,
        title,
        content,
      });
    } catch (error) {
      console.error("메모 저장 실패:", error);
      throw error;
    }
  }
}

export const stt_service = new STTService();
