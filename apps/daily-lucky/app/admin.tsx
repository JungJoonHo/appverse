import React, { useEffect, useState } from "react";
import { db } from "../firebase";
import {
  collection,
  getDocs,
  addDoc,
  deleteDoc,
  doc,
  query,
  where,
} from "firebase/firestore";
import { useAuth } from "../context/AuthContext";
import { ADMIN_EMAIL } from "../constants/admin";

interface Prize {
  id?: string;
  name: string;
  description: string;
  winners: number;
}

interface Winner {
  uid: string;
  email: string;
  date: any;
  prizeId?: string;
}

export default function Admin() {
  const { user } = useAuth();
  const [prizes, setPrizes] = useState<Prize[]>([]);
  const [winners, setWinners] = useState<Winner[]>([]);
  const [newPrize, setNewPrize] = useState({
    name: "",
    description: "",
    winners: 1,
  });
  const [loading, setLoading] = useState(false);

  // 관리자 권한 체크
  if (!user || user.email !== ADMIN_EMAIL) {
    return (
      <div style={{ marginTop: 40, textAlign: "center" }}>
        관리자만 접근 가능합니다.
      </div>
    );
  }

  // 경품 목록 불러오기
  const fetchPrizes = async () => {
    const snap = await getDocs(collection(db, "prizes"));
    setPrizes(snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }) as Prize));
  };

  // 당첨자 목록 불러오기 (win: true)
  const fetchWinners = async () => {
    const q = query(collection(db, "draws"), where("win", "==", true));
    const snap = await getDocs(q);
    setWinners(snap.docs.map((doc) => doc.data() as Winner));
  };

  useEffect(() => {
    fetchPrizes();
    fetchWinners();
  }, []);

  // 경품 추가
  const handleAddPrize = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    await addDoc(collection(db, "prizes"), newPrize);
    setNewPrize({ name: "", description: "", winners: 1 });
    await fetchPrizes();
    setLoading(false);
  };

  // 경품 삭제
  const handleDeletePrize = async (id: string) => {
    setLoading(true);
    await deleteDoc(doc(db, "prizes", id));
    await fetchPrizes();
    setLoading(false);
  };

  return (
    <main
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        marginTop: 40,
        maxWidth: 600,
        marginLeft: "auto",
        marginRight: "auto",
      }}
    >
      <h2>관리자 페이지</h2>
      <section style={{ marginBottom: 32, width: "100%" }}>
        <h3>경품 관리</h3>
        <form
          onSubmit={handleAddPrize}
          style={{ display: "flex", gap: 8, marginBottom: 16 }}
        >
          <input
            type="text"
            placeholder="경품명"
            required
            value={newPrize.name}
            onChange={(e) => setNewPrize({ ...newPrize, name: e.target.value })}
          />
          <input
            type="text"
            placeholder="설명"
            required
            value={newPrize.description}
            onChange={(e) =>
              setNewPrize({ ...newPrize, description: e.target.value })
            }
          />
          <input
            type="number"
            min={1}
            placeholder="당첨자 수"
            required
            value={newPrize.winners}
            onChange={(e) =>
              setNewPrize({ ...newPrize, winners: Number(e.target.value) })
            }
            style={{ width: 80 }}
          />
          <button type="submit" disabled={loading}>
            경품 추가
          </button>
        </form>
        <ul style={{ padding: 0, listStyle: "none" }}>
          {prizes.map((prize) => (
            <li
              key={prize.id}
              style={{
                marginBottom: 8,
                border: "1px solid #eee",
                padding: 8,
                borderRadius: 4,
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <span>
                <b>{prize.name}</b> ({prize.description}) - 당첨자{" "}
                {prize.winners}명
              </span>
              <button
                onClick={() => prize.id && handleDeletePrize(prize.id)}
                disabled={loading}
              >
                삭제
              </button>
            </li>
          ))}
        </ul>
      </section>
      <section style={{ width: "100%" }}>
        <h3>당첨자 목록</h3>
        <ul style={{ padding: 0, listStyle: "none" }}>
          {winners.map((winner, idx) => (
            <li
              key={idx}
              style={{
                marginBottom: 8,
                border: "1px solid #eee",
                padding: 8,
                borderRadius: 4,
              }}
            >
              <span>
                {winner.email} -{" "}
                {winner.date &&
                  winner.date.toDate &&
                  winner.date.toDate().toLocaleString()}
              </span>
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}
