import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import { Iamport } from "iamport-rest-client-nodejs";

// 아임포트 API 키 설정 (Firebase 환경 변수에서 가져옵니다)
const iamport = new Iamport({
  apiKey: functions.config().iamport.key,
  apiSecret: functions.config().iamport.secret,
});

const db = admin.firestore();

// 1분마다 실행되는 스케줄링 함수
export const processEndedAuctions = functions
  .region("asia-northeast3") // 서울 리전
  .pubsub.schedule("every 1 minutes")
  .onRun(async (context) => {
    const now = admin.firestore.Timestamp.now();

    // 1. 종료되었지만 아직 처리되지 않은 경매 조회
    const query = db
      .collection("products")
      .where("endAt", "<=", now)
      .where("status", "==", "active"); // 'active' 상태인 경매만 처리

    const snapshot = await query.get();

    if (snapshot.empty) {
      console.log("처리할 종료된 경매가 없습니다.");
      return null;
    }

    // 2. 각 경매에 대해 결제 처리
    const promises = snapshot.docs.map(async (doc) => {
      const product = doc.data();
      const productId = doc.id;

      try {
        // 3. 입찰 목록을 금액이 높은 순으로 조회
        const bidsSnapshot = await db
          .collection("products")
          .doc(productId)
          .collection("bids")
          .orderBy("amount", "desc")
          .get();

        if (bidsSnapshot.empty) {
          console.log(`[${productId}] 입찰자가 없어 경매를 종료합니다.`);
          return doc.ref.update({ status: "ended" });
        }

        let paymentSuccess = false;

        // 4. 낙찰자부터 순서대로 결제 시도
        for (const bidDoc of bidsSnapshot.docs) {
          const bid = bidDoc.data();
          const userRef = await db.collection("users").doc(bid.userId).get();
          const user = userRef.data();

          if (!user) continue;

          console.log(`[${productId}] 상품에 대해 [${user.email}] 유저의 결제를 시도합니다. 금액: ${bid.amount}`);

          try {
            // 5. 아임포트 비인증(자동) 결제 요청
            const paymentData = await iamport.payment.again({
              customer_uid: user.uid,
              merchant_uid: `buy_${productId}_${new Date().getTime()}`,
              amount: bid.amount,
              name: product.title,
            });

            // 6. 결제 성공 시
            if (paymentData.status === "paid") {
              console.log(`[${productId}] 상품 결제 성공! 낙찰자: ${user.email}`);
              await doc.ref.update({
                status: "completed", // 경매 상태 '완료'로 변경
                winnerId: user.uid,
                winnerEmail: user.email,
                finalPrice: bid.amount,
              });
              paymentSuccess = true;
              break; // 결제 성공 시 루프 중단
            }
          } catch (error) {
            console.error(`[${productId}] 상품 [${user.email}] 유저 결제 실패:`, error);
            // 결제 실패 로그를 기록할 수 있습니다.
          }
        }

        // 모든 입찰자의 결제가 실패한 경우
        if (!paymentSuccess) {
          console.log(`[${productId}] 모든 입찰자의 결제가 실패하여 경매가 유찰되었습니다.`);
          return doc.ref.update({ status: "failed" });
        }

      } catch (error) {
        console.error(`[${productId}] 경매 처리 중 오류 발생:`, error);
        return doc.ref.update({ status: "error" });
      }
    });

    return Promise.all(promises);
  }); 