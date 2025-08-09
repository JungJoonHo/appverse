"""AI API 서버 실행 스크립트"""
import uvicorn
import os
from pathlib import Path

def main():
    """메인 실행 함수"""
    # 환경 변수 설정
    os.environ.setdefault("PYTHONPATH", str(Path(__file__).parent / "src"))
    
    # 서버 실행
    uvicorn.run(
        "ai_api.main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,  # 개발모드에서 자동 리로드
        reload_dirs=["src"],
        log_level="info"
    )

if __name__ == "__main__":
    main()
