import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { db } from "../firebase";
import { collection, doc, getDoc, setDoc, Timestamp } from "firebase/firestore";

function getTodayKey(uid: string) {
  const today = new Date();
  const y = today.getFullYear();
  const m = today.getMonth() + 1;
  const d = today.getDate();
  return `${uid}_${y}-${m}-${d}`;
}

export default function Draw() {
  const { user } = useAuth();
  const [result, setResult] = useState<string | null>(null);
  const [hasDrawn, setHasDrawn] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user) return;
    const check = async () => {
      const key = getTodayKey(user.uid);
      const ref = doc(db, "draws", key);
      const snap = await getDoc(ref);
      if (snap.exists()) {
        setHasDrawn(true);
        setResult(snap.data().result);
      }
    };
    check();
  }, [user]);

  const handleDraw = async () => {
    if (!user) return;
    setLoading(true);
    const key = getTodayKey(user.uid);
    const ref = doc(db, "draws", key);
    const snap = await getDoc(ref);
    if (snap.exists()) {
      setHasDrawn(true);
      setResult(snap.data().result);
      setLoading(false);
      return;
    }
    // 10% 확률 당첨
    const win = Math.random() < 0.1;
    const resultMsg = win
      ? "축하합니다! 당첨되었습니다!"
      : "아쉽지만, 다음 기회에!";
    await setDoc(ref, {
      uid: user.uid,
      email: user.email,
      date: Timestamp.now(),
      result: resultMsg,
      win,
    });
    setHasDrawn(true);
    setResult(resultMsg);
    setLoading(false);
  };

  if (!user) {
    return (
      <div style={{ marginTop: 40, textAlign: "center" }}>
        로그인 후 추첨에 참여할 수 있습니다.
      </div>
    );
  }

  return (
    <main
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        marginTop: 40,
      }}
    >
      <h2>오늘의 경품 추첨</h2>
      <button
        onClick={handleDraw}
        disabled={hasDrawn || loading}
        style={{ padding: "12px 24px", fontSize: 18, margin: "24px 0" }}
      >
        {hasDrawn
          ? "오늘은 이미 참여하셨습니다"
          : loading
            ? "추첨 중..."
            : "추첨 참여하기"}
      </button>
      {result && (
        <div style={{ marginTop: 20, fontWeight: "bold" }}>{result}</div>
      )}
    </main>
  );
}
