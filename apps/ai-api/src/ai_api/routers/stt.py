"""STT 변환 라우터"""
from fastapi import APIRouter, UploadFile, File, Form, HTTPException, Depends
from fastapi.responses import JSONResponse
import time
import logging
from typing import Optional

from ..main import get_whisper_service
from ..services.whisper_service import WhisperService
from ..models.stt_models import (
    STTResponse, 
    STTSegment, 
    ErrorResponse, 
    ModelInfoResponse,
    TaskType
)

logger = logging.getLogger(__name__)

router = APIRouter()

@router.post(
    "/convert",
    response_model=STTResponse,
    responses={
        400: {"model": ErrorResponse, "description": "잘못된 요청"},
        413: {"model": ErrorResponse, "description": "파일 크기 초과"},
        500: {"model": ErrorResponse, "description": "서버 오류"}
    },
    summary="오디오를 텍스트로 변환",
    description="업로드된 오디오 파일을 Whisper 모델을 사용해 텍스트로 변환합니다."
)
async def convert_audio_to_text(
    file: UploadFile = File(
        ...,
        description="변환할 오디오 파일 (wav, mp3, m4a, flac 등)"
    ),
    language: Optional[str] = Form(
        None,
        description="언어 코드 (예: 'ko', 'en'). 생략하면 자동 감지"
    ),
    task: TaskType = Form(
        TaskType.TRANSCRIBE,
        description="변환 작업: transcribe(원본언어) 또는 translate(영어번역)"
    ),
    return_segments: bool = Form(
        False,
        description="세그먼트별 상세 정보 포함 여부"
    ),
    whisper_service: WhisperService = Depends(get_whisper_service)
):
    """오디오 파일을 텍스트로 변환하는 엔드포인트"""
    
    start_time = time.time()
    
    try:
        # 파일 크기 검증 (50MB 제한)
        max_size = 50 * 1024 * 1024  # 50MB
        if file.size and file.size > max_size:
            raise HTTPException(
                status_code=413,
                detail=f"파일 크기가 너무 큽니다. 최대 {max_size // (1024*1024)}MB까지 지원됩니다."
            )
        
        # 파일 타입 검증
        allowed_types = {
            "audio/wav", "audio/wave", "audio/x-wav",
            "audio/mpeg", "audio/mp3",
            "audio/mp4", "audio/m4a",
            "audio/flac", "audio/x-flac",
            "audio/ogg", "audio/webm"
        }
        
        if file.content_type and file.content_type not in allowed_types:
            raise HTTPException(
                status_code=400,
                detail=f"지원되지 않는 파일 형식입니다. 지원 형식: {', '.join(allowed_types)}"
            )
        
        # 파일 읽기
        logger.info(f"오디오 변환 시작 - 파일: {file.filename}, 크기: {file.size}bytes")
        audio_data = await file.read()
        
        if not audio_data:
            raise HTTPException(status_code=400, detail="빈 파일입니다.")
        
        # STT 변환 실행
        result = await whisper_service.transcribe_audio(
            audio_data=audio_data,
            language=language,
            task=task.value
        )
        
        processing_time = time.time() - start_time
        
        # 응답 데이터 구성
        response_data = {
            "success": True,
            "text": result["text"],
            "language": result["language"],
            "duration": result.get("duration", 0),
            "model": result["model"],
            "task": result["task"],
            "processing_time": round(processing_time, 2)
        }
        
        # 세그먼트 정보 포함 (요청된 경우)
        if return_segments and "segments" in result:
            segments = []
            for seg in result["segments"]:
                segments.append(STTSegment(
                    id=seg.get("id", 0),
                    start=seg.get("start", 0),
                    end=seg.get("end", 0),
                    text=seg.get("text", "")
                ))
            response_data["segments"] = segments
        
        logger.info(
            f"오디오 변환 완료 - 처리시간: {processing_time:.2f}초, "
            f"텍스트 길이: {len(result['text'])}자"
        )
        
        return STTResponse(**response_data)
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"STT 변환 오류: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"오디오 변환 중 오류가 발생했습니다: {str(e)}"
        )

@router.get(
    "/model-info",
    response_model=ModelInfoResponse,
    summary="모델 정보 조회",
    description="현재 로드된 Whisper 모델의 정보를 반환합니다."
)
async def get_model_info(
    whisper_service: WhisperService = Depends(get_whisper_service)
):
    """모델 정보 조회 엔드포인트"""
    try:
        model_info = whisper_service.get_model_info()
        return ModelInfoResponse(**model_info)
    except Exception as e:
        logger.error(f"모델 정보 조회 오류: {e}")
        raise HTTPException(
            status_code=500,
            detail="모델 정보를 가져올 수 없습니다."
        )

@router.get(
    "/supported-languages",
    summary="지원 언어 목록",
    description="STT 변환에서 지원되는 언어 목록을 반환합니다."
)
async def get_supported_languages(
    whisper_service: WhisperService = Depends(get_whisper_service)
):
    """지원 언어 목록 조회"""
    try:
        languages = whisper_service.get_supported_languages()
        return {
            "success": True,
            "languages": languages,
            "total_count": len(languages)
        }
    except Exception as e:
        logger.error(f"언어 목록 조회 오류: {e}")
        raise HTTPException(
            status_code=500,
            detail="언어 목록을 가져올 수 없습니다."
        )
