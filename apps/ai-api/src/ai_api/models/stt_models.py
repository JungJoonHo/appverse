"""STT 관련 데이터 모델"""
from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from enum import Enum

class TaskType(str, Enum):
    """변환 작업 타입"""
    TRANSCRIBE = "transcribe"  # 원본 언어로 텍스트 변환
    TRANSLATE = "translate"    # 영어로 번역하면서 텍스트 변환

class STTRequest(BaseModel):
    """STT 변환 요청 모델"""
    language: Optional[str] = Field(
        None, 
        description="언어 코드 (예: 'ko', 'en'). None이면 자동 감지",
        example="ko"
    )
    task: TaskType = Field(
        TaskType.TRANSCRIBE,
        description="변환 작업 타입"
    )
    return_segments: bool = Field(
        False,
        description="세그먼트 정보 포함 여부"
    )

class STTSegment(BaseModel):
    """오디오 세그먼트 정보"""
    id: int = Field(description="세그먼트 ID")
    start: float = Field(description="시작 시간(초)")
    end: float = Field(description="종료 시간(초)")
    text: str = Field(description="세그먼트 텍스트")

class STTResponse(BaseModel):
    """STT 변환 응답 모델"""
    success: bool = Field(description="변환 성공 여부")
    text: str = Field(description="변환된 텍스트")
    language: str = Field(description="감지된 언어")
    duration: float = Field(description="오디오 길이(초)")
    model: str = Field(description="사용된 모델명")
    task: str = Field(description="수행된 작업")
    segments: Optional[List[STTSegment]] = Field(
        None, 
        description="세그먼트 정보 (요청 시에만 포함)"
    )
    processing_time: Optional[float] = Field(
        None,
        description="처리 시간(초)"
    )

class ErrorResponse(BaseModel):
    """에러 응답 모델"""
    success: bool = Field(False, description="처리 성공 여부")
    error: str = Field(description="에러 메시지")
    error_code: Optional[str] = Field(None, description="에러 코드")

class ModelInfoResponse(BaseModel):
    """모델 정보 응답"""
    model_name: str = Field(description="모델명")
    device: str = Field(description="실행 디바이스")
    is_ready: bool = Field(description="모델 준비 상태")
    supported_languages: Dict[str, str] = Field(description="지원 언어 목록")

class HealthResponse(BaseModel):
    """헬스 체크 응답"""
    status: str = Field(description="서비스 상태")
    whisper_model_ready: bool = Field(description="Whisper 모델 준비 상태")
