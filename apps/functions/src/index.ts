import * as admin from "firebase-admin";

admin.initializeApp();

// 새로 만든 함수를 export 합니다.
export * from "./processEndedAuctions";

// 앞으로 여기에 Cloud Functions 코드를 추가합니다.
// 예: export * from './processEndedAuctions'; 