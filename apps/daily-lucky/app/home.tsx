import React from "react";

export default function Home() {
  return (
    <main
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        marginTop: 40,
      }}
    >
      <h1>DailyLucky</h1>
      <p>매일 한 번! 오늘의 경품 추첨에 도전하세요.</p>
      <button style={{ padding: "12px 24px", fontSize: 18, margin: "24px 0" }}>
        추첨 참여하기
      </button>
      {/* 결과 및 로그인/회원가입 안내 등 추가 예정 */}
    </main>
  );
}
