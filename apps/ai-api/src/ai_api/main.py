"""FastAPI 메인 애플리케이션"""
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import logging

from .routers import stt
from .services.whisper_service import WhisperService

# 로깅 설정
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger(__name__)

# 전역 Whisper 서비스 인스턴스
whisper_service = None

@asynccontextmanager
async def lifespan(app: FastAPI):
    """앱 생명주기 관리"""
    global whisper_service
    
    # 앱 시작 시 - Whisper 모델 로드
    logger.info("Whisper 모델 로딩 중...")
    try:
        whisper_service = WhisperService()
        await whisper_service.load_model()
        logger.info("Whisper 모델 로딩 완료")
    except Exception as e:
        logger.error(f"Whisper 모델 로딩 실패: {e}")
        raise
    
    yield
    
    # 앱 종료 시 - 리소스 정리
    logger.info("리소스 정리 중...")
    if whisper_service:
        whisper_service.cleanup()

# FastAPI 앱 생성
app = FastAPI(
    title="AI API",
    description="Whisper STT 변환 API",
    version="0.1.0",
    lifespan=lifespan
)

# CORS 설정
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # 프로덕션에서는 특정 도메인만 허용
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 라우터 등록
app.include_router(stt.router, prefix="/api/v1/stt", tags=["STT"])

@app.get("/")
async def root():
    """루트 엔드포인트"""
    return {
        "message": "AI API 서버가 실행 중입니다",
        "version": "0.1.0",
        "endpoints": {
            "stt": "/api/v1/stt/convert",
            "health": "/health",
            "docs": "/docs"
        }
    }

@app.get("/health")
async def health_check():
    """헬스 체크 엔드포인트"""
    global whisper_service
    
    is_healthy = whisper_service is not None and whisper_service.is_ready()
    
    return {
        "status": "healthy" if is_healthy else "unhealthy",
        "whisper_model_ready": is_healthy
    }

def get_whisper_service() -> WhisperService:
    """Whisper 서비스 인스턴스 반환"""
    global whisper_service
    if not whisper_service:
        raise HTTPException(status_code=503, detail="Whisper 서비스를 사용할 수 없습니다")
    return whisper_service
