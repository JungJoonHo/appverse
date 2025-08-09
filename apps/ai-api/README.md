# AI API - Whisper STT 서비스

OpenAI Whisper 모델을 사용한 음성 인식(STT) API 서비스입니다.

## 🚀 주요 기능

- **음성을 텍스트로 변환**: 다양한 오디오 포맷 지원 (wav, mp3, m4a, flac 등)
- **다국어 지원**: 한국어, 영어, 일본어, 중국어 등 다양한 언어 자동 감지
- **번역 기능**: 원본 언어에서 영어로 번역하면서 텍스트 변환
- **세그먼트 정보**: 시간별 세그먼트 정보 제공
- **비동기 처리**: 대용량 파일도 효율적으로 처리

## 📋 요구사항

- Python 3.13+
- Poetry (의존성 관리)
- GPU 사용 시: CUDA 지원 PyTorch

## 🛠 설치 및 실행

### 1. 의존성 설치

```bash
cd apps/ai-api
poetry install
```

### 2. 환경변수 설정

```bash
cp .env.example .env
# .env 파일을 편집하여 필요한 설정 변경
```

### 3. 서버 실행

```bash
# Poetry 환경에서 실행
poetry run python run.py

# 또는 가상환경 활성화 후 실행
poetry shell
python run.py
```

서버가 시작되면 http://localhost:8000 에서 접근 가능합니다.

## 📚 API 문서

서버 실행 후 다음 URL에서 API 문서를 확인할 수 있습니다:

- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc

## 🔌 API 엔드포인트

### STT 변환

```http
POST /api/v1/stt/convert
Content-Type: multipart/form-data

file: [오디오 파일]
language: ko (선택사항, 자동감지)
task: transcribe (transcribe | translate)
return_segments: false (세그먼트 정보 포함 여부)
```

### 응답 예시

```json
{
  "success": true,
  "text": "안녕하세요. 음성 인식 테스트입니다.",
  "language": "ko",
  "duration": 3.5,
  "model": "base",
  "task": "transcribe",
  "processing_time": 1.2,
  "segments": [
    {
      "id": 0,
      "start": 0.0,
      "end": 3.5,
      "text": "안녕하세요. 음성 인식 테스트입니다."
    }
  ]
}
```

### 기타 엔드포인트

- `GET /health` - 헬스 체크
- `GET /api/v1/stt/model-info` - 모델 정보
- `GET /api/v1/stt/supported-languages` - 지원 언어 목록

## 🧪 테스트

```bash
# 단위 테스트 실행
poetry run pytest

# 커버리지 포함 테스트
poetry run pytest --cov=ai_api
```

## 🚀 프로덕션 배포

### Docker 사용

```bash
# Dockerfile 생성 후
docker build -t ai-api .
docker run -p 8000:8000 ai-api
```

### 성능 최적화

- GPU 사용 권장 (CUDA 환경)
- 더 큰 모델 사용 시 충분한 메모리 필요
- 동시 요청 처리를 위한 워커 프로세스 증가

## 🔧 개발

### 프로젝트 구조

```
apps/ai-api/
├── src/ai_api/
│   ├── main.py              # FastAPI 애플리케이션
│   ├── models/              # 데이터 모델
│   ├── routers/             # API 라우터
│   └── services/            # 비즈니스 로직
├── tests/                   # 테스트 코드
├── run.py                   # 실행 스크립트
└── pyproject.toml          # 프로젝트 설정
```

### 코드 스타일

- Black: 코드 포매팅
- isort: Import 정렬
- flake8: 린팅

```bash
poetry run black .
poetry run isort .
poetry run flake8 .
```

## 📄 라이선스

MIT License
