# Firebase 설정 가이드

## 1. Firebase 프로젝트 생성

1. [Firebase Console](https://console.firebase.google.com/)에 접속
2. "프로젝트 추가" 클릭
3. 프로젝트 이름을 "anymin"으로 설정
4. Google Analytics 설정 (선택사항)
5. 프로젝트 생성 완료

## 2. Authentication 설정

1. Firebase Console에서 "Authentication" 메뉴 클릭
2. "시작하기" 클릭
3. "로그인 방법" 탭에서 "이메일/비밀번호" 활성화
4. "사용 설정" 체크박스 선택
5. "저장" 클릭

## 3. Firestore Database 설정

1. Firebase Console에서 "Firestore Database" 메뉴 클릭
2. "데이터베이스 만들기" 클릭
3. "테스트 모드에서 시작" 선택 (개발용)
4. 위치 선택 (가까운 지역 선택)
5. "완료" 클릭

## 4. 보안 규칙 설정

Firestore Database > 규칙 탭에서 다음 규칙을 설정:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // 사용자 문서 규칙
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // 일정 문서 규칙
    match /schedules/{scheduleId} {
      allow read, write: if request.auth != null && 
        request.auth.uid == resource.data.user_id;
    }
    
    // 메모 문서 규칙
    match /memos/{memoId} {
      allow read, write: if request.auth != null && 
        request.auth.uid == resource.data.user_id;
    }
  }
}
```

## 5. 앱 설정

1. Firebase Console에서 "프로젝트 설정" 클릭
2. "일반" 탭에서 "내 앱" 섹션의 설정값 복사
3. 프로젝트 루트에 `.env` 파일 생성:

```env
EXPO_PUBLIC_FIREBASE_API_KEY=your-api-key
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
EXPO_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
EXPO_PUBLIC_FIREBASE_APP_ID=your-app-id
```

## 6. 앱 실행

```bash
cd apps/anymin
pnpm start
```

## 주의사항

- `.env` 파일은 `.gitignore`에 추가하여 Git에 커밋하지 마세요
- 프로덕션 환경에서는 적절한 보안 규칙을 설정하세요
- Firebase 무료 플랜의 사용량 제한을 확인하세요 