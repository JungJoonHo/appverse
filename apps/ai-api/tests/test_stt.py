"""STT 엔드포인트 테스트"""
import pytest
from fastapi.testclient import TestClient
from unittest.mock import AsyncMock, MagicMock
import io

from ai_api.main import app

client = TestClient(app)

@pytest.fixture
def mock_whisper_service():
    """Whisper 서비스 모킹"""
    service = MagicMock()
    service.is_ready.return_value = True
    service.transcribe_audio = AsyncMock(return_value={
        "text": "테스트 음성입니다.",
        "language": "ko",
        "duration": 2.5,
        "model": "base",
        "task": "transcribe",
        "segments": [
            {
                "id": 0,
                "start": 0.0,
                "end": 2.5,
                "text": "테스트 음성입니다."
            }
        ]
    })
    service.get_model_info.return_value = {
        "model_name": "base",
        "device": "cpu", 
        "is_ready": True,
        "supported_languages": {"ko": "Korean", "en": "English"}
    }
    service.get_supported_languages.return_value = {
        "ko": "Korean", 
        "en": "English"
    }
    return service

def test_health_endpoint():
    """헬스 체크 엔드포인트 테스트"""
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert "status" in data
    assert "whisper_model_ready" in data

def test_root_endpoint():
    """루트 엔드포인트 테스트"""
    response = client.get("/")
    assert response.status_code == 200
    data = response.json()
    assert data["message"] == "AI API 서버가 실행 중입니다"
    assert "endpoints" in data

def test_model_info_endpoint(mock_whisper_service, monkeypatch):
    """모델 정보 엔드포인트 테스트"""
    # Whisper 서비스 의존성 모킹
    def mock_get_whisper_service():
        return mock_whisper_service
    
    from ai_api import main
    monkeypatch.setattr(main, "get_whisper_service", mock_get_whisper_service)
    
    response = client.get("/api/v1/stt/model-info")
    assert response.status_code == 200
    data = response.json()
    assert data["model_name"] == "base"
    assert data["is_ready"] is True

def test_supported_languages_endpoint(mock_whisper_service, monkeypatch):
    """지원 언어 목록 엔드포인트 테스트"""
    def mock_get_whisper_service():
        return mock_whisper_service
    
    from ai_api import main
    monkeypatch.setattr(main, "get_whisper_service", mock_get_whisper_service)
    
    response = client.get("/api/v1/stt/supported-languages")
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert "languages" in data
    assert data["total_count"] == 2

def test_stt_convert_endpoint(mock_whisper_service, monkeypatch):
    """STT 변환 엔드포인트 테스트"""
    def mock_get_whisper_service():
        return mock_whisper_service
    
    from ai_api import main
    monkeypatch.setattr(main, "get_whisper_service", mock_get_whisper_service)
    
    # 가짜 오디오 파일 생성
    audio_data = b"fake audio data"
    files = {
        "file": ("test.wav", io.BytesIO(audio_data), "audio/wav")
    }
    data = {
        "language": "ko",
        "task": "transcribe",
        "return_segments": True
    }
    
    response = client.post("/api/v1/stt/convert", files=files, data=data)
    assert response.status_code == 200
    
    result = response.json()
    assert result["success"] is True
    assert result["text"] == "테스트 음성입니다."
    assert result["language"] == "ko"
    assert "processing_time" in result

def test_stt_convert_no_file():
    """파일 없이 STT 요청 시 오류 테스트"""
    response = client.post("/api/v1/stt/convert")
    assert response.status_code == 422  # Validation error

def test_stt_convert_invalid_file_type(mock_whisper_service, monkeypatch):
    """잘못된 파일 타입 테스트"""
    def mock_get_whisper_service():
        return mock_whisper_service
    
    from ai_api import main
    monkeypatch.setattr(main, "get_whisper_service", mock_get_whisper_service)
    
    # 텍스트 파일로 요청
    files = {
        "file": ("test.txt", io.BytesIO(b"text content"), "text/plain")
    }
    
    response = client.post("/api/v1/stt/convert", files=files)
    assert response.status_code == 400
    assert "지원되지 않는 파일 형식" in response.json()["detail"]
