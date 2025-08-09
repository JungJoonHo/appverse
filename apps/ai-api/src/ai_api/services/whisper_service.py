"""Whisper STT 서비스"""
import whisper
import torch
import tempfile
import os
import logging
from typing import Optional, Dict, Any
from pathlib import Path
import asyncio
from concurrent.futures import ThreadPoolExecutor

logger = logging.getLogger(__name__)

class WhisperService:
    """Whisper STT 변환 서비스"""
    
    def __init__(self, model_name: str = "base"):
        """
        Whisper 서비스 초기화
        
        Args:
            model_name: 사용할 Whisper 모델 (tiny, base, small, medium, large)
        """
        self.model_name = model_name
        self.model: Optional[whisper.Whisper] = None
        self.device = "cuda" if torch.cuda.is_available() else "cpu"
        self._executor = ThreadPoolExecutor(max_workers=2)
        
        logger.info(f"Whisper 서비스 초기화 - 모델: {model_name}, 디바이스: {self.device}")
    
    async def load_model(self) -> None:
        """Whisper 모델을 비동기적으로 로드"""
        try:
            # CPU 집약적인 모델 로딩을 별도 스레드에서 실행
            loop = asyncio.get_event_loop()
            self.model = await loop.run_in_executor(
                self._executor, 
                self._load_model_sync
            )
            logger.info(f"Whisper 모델 '{self.model_name}' 로딩 완료")
        except Exception as e:
            logger.error(f"Whisper 모델 로딩 실패: {e}")
            raise
    
    def _load_model_sync(self) -> whisper.Whisper:
        """동기 방식으로 모델 로드"""
        return whisper.load_model(self.model_name, device=self.device)
    
    def is_ready(self) -> bool:
        """모델이 로드되어 사용 가능한지 확인"""
        return self.model is not None
    
    async def transcribe_audio(
        self, 
        audio_data: bytes, 
        language: Optional[str] = None,
        task: str = "transcribe"
    ) -> Dict[str, Any]:
        """
        오디오를 텍스트로 변환
        
        Args:
            audio_data: 오디오 파일 바이트 데이터
            language: 언어 코드 (예: 'ko', 'en'), None이면 자동 감지
            task: 'transcribe' 또는 'translate'
            
        Returns:
            변환 결과 딕셔너리
        """
        if not self.is_ready():
            raise RuntimeError("Whisper 모델이 로드되지 않았습니다")
        
        try:
            # 임시 파일 생성
            with tempfile.NamedTemporaryFile(suffix=".wav", delete=False) as temp_file:
                temp_file.write(audio_data)
                temp_file_path = temp_file.name
            
            try:
                # 비동기 변환 실행
                loop = asyncio.get_event_loop()
                result = await loop.run_in_executor(
                    self._executor,
                    self._transcribe_sync,
                    temp_file_path,
                    language,
                    task
                )
                
                return {
                    "text": result["text"].strip(),
                    "language": result["language"],
                    "segments": result.get("segments", []),
                    "duration": result.get("duration", 0),
                    "model": self.model_name,
                    "task": task
                }
                
            finally:
                # 임시 파일 삭제
                try:
                    os.unlink(temp_file_path)
                except OSError:
                    pass
                    
        except Exception as e:
            logger.error(f"오디오 변환 실패: {e}")
            raise
    
    def _transcribe_sync(
        self, 
        audio_path: str, 
        language: Optional[str], 
        task: str
    ) -> Dict[str, Any]:
        """동기 방식으로 오디오 변환"""
        options = {
            "task": task,
            "verbose": False
        }
        
        if language:
            options["language"] = language
            
        return self.model.transcribe(audio_path, **options)
    
    def get_supported_languages(self) -> Dict[str, str]:
        """지원되는 언어 목록 반환"""
        return {
            "ko": "Korean",
            "en": "English", 
            "ja": "Japanese",
            "zh": "Chinese",
            "es": "Spanish",
            "fr": "French",
            "de": "German",
            "it": "Italian",
            "pt": "Portuguese",
            "ru": "Russian"
        }
    
    def get_model_info(self) -> Dict[str, Any]:
        """모델 정보 반환"""
        return {
            "model_name": self.model_name,
            "device": self.device,
            "is_ready": self.is_ready(),
            "supported_languages": self.get_supported_languages()
        }
    
    def cleanup(self) -> None:
        """리소스 정리"""
        try:
            if self._executor:
                self._executor.shutdown(wait=True)
            
            # GPU 메모리 정리
            if torch.cuda.is_available():
                torch.cuda.empty_cache()
                
            logger.info("Whisper 서비스 리소스 정리 완료")
        except Exception as e:
            logger.error(f"리소스 정리 중 오류: {e}")
