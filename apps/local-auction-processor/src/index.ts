import * as admin from "firebase-admin";
import * as cron from "node-cron";

// =================================================================
// Firebase Admin SDK 초기화
// 중요: 이 코드가 작동하려면 서비스 계정 키 파일이 필요합니다.
// =================================================================
try {
  admin.initializeApp({
    credential: admin.credential.applicationDefault(),
  });
  console.log("Firebase Admin SDK가 성공적으로 초기화되었습니다.");
} catch (error) {
  console.error("Firebase Admin SDK 초기화 실패:", error);
  console.error("서비스 계정 키(GOOGLE_APPLICATION_CREDENTIALS)가 올바르게 설정되었는지 확인하세요.");
  process.exit(1);
}

const db = admin.firestore();

async function processAuctions() {
  console.log("-----------------------------------------");
  console.log("⏰ 종료된 경매가 있는지 확인합니다...");
  const now = admin.firestore.Timestamp.now();

  const query = db
    .collection("products")
    .where("endAt", "<=", now)
    .where("status", "==", "active");

  const snapshot = await query.get();

  if (snapshot.empty) {
    console.log("✅ 처리할 종료된 경매가 없습니다.");
    return;
  }

  console.log(`🔥 ${snapshot.size}개의 종료된 경매를 처리합니다.`);
  const promises = snapshot.docs.map(async (doc) => {
    const product = doc.data();
    const productId = doc.id;

    try {
      const bidsSnapshot = await db
        .collection("products")
        .doc(productId)
        .collection("bids")
        .orderBy("amount", "desc")
        .get();

      if (bidsSnapshot.empty) {
        console.log(`[${productId}] 입찰자가 없어 경매를 'ended' 상태로 변경합니다.`);
        return doc.ref.update({ status: "ended" });
      }

      let paymentSuccess = false;
      for (const bidDoc of bidsSnapshot.docs) {
        const bid = bidDoc.data();
        const userRef = await db.collection("users").doc(bid.userId).get();
        const user = userRef.data();

        if (!user) continue;

        console.log(`[${productId}] 상품에 대해 [${user.email}] 유저의 결제를 시도합니다. (금액: ${bid.amount})`);

        // 로컬 개발 환경에서는 실제 결제를 호출하는 대신 성공했다고 가정합니다.
        const isPaymentSuccessful = true; 

        if (isPaymentSuccessful) {
          console.log(`[${productId}] 💳 결제 시뮬레이션 성공! 낙찰자: ${user.email}`);
          await doc.ref.update({
            status: "completed",
            winnerId: user.uid,
            winnerEmail: user.email,
            finalPrice: bid.amount,
          });
          paymentSuccess = true;
          break; 
        } else {
           console.log(`[${productId}] 💳 결제 시뮬레이션 실패. 다음 입찰자로 넘어갑니다.`);
        }
      }

      if (!paymentSuccess) {
        console.log(`[${productId}] 모든 입찰자의 결제가 실패하여 'failed' 상태로 변경합니다.`);
        return doc.ref.update({ status: "failed" });
      }

    } catch (error) {
      console.error(`[${productId}] 경매 처리 중 오류 발생:`, error);
      return doc.ref.update({ status: "error" });
    }
  });

  await Promise.all(promises);
  console.log("✨ 모든 경매 처리가 완료되었습니다.");
}

// 1분마다 `processAuctions` 함수를 실행하도록 cron 작업을 설정합니다.
cron.schedule("*/1 * * * *", processAuctions);

console.log("🚀 로컬 경매 처리기가 시작되었습니다. 1분마다 경매를 확인합니다."); 