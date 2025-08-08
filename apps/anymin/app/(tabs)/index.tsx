import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
} from "react-native";
import { useAuth } from "@/context/AuthContext";
import {
  firebase_database_service,
  Schedule,
  Memo,
} from "@/services/firebaseDatabase";
import { router } from "expo-router";

export default function HomeScreen() {
  const { user, logout } = useAuth();
  const [recent_schedules, set_recent_schedules] = useState<Schedule[]>([]);
  const [recent_memos, set_recent_memos] = useState<Memo[]>([]);
  const [refreshing, set_refreshing] = useState(false);

  useEffect(() => {
    load_dashboard_data();
  }, []);

  const load_dashboard_data = async () => {
    if (!user) return;

    try {
      // 오늘부터 7일 후까지의 일정 가져오기
      const today = new Date();
      const next_week = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);

      const schedules = await firebase_database_service.get_schedules(
        user.uid,
        today.toISOString(),
        next_week.toISOString(),
      );

      const memos = await firebase_database_service.get_memos(user.uid);

      set_recent_schedules(schedules.slice(0, 3)); // 최근 3개
      set_recent_memos(memos.slice(0, 3)); // 최근 3개
    } catch (error) {
      console.error("Failed to load dashboard data:", error);
    }
  };

  const on_refresh = async () => {
    set_refreshing(true);
    await load_dashboard_data();
    set_refreshing(false);
  };

  const handle_logout = async () => {
    await logout();
    router.replace("/auth/login");
  };

  const format_date = (date_string: string) => {
    const date = new Date(date_string);
    return date.toLocaleDateString("ko-KR", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={on_refresh} />
      }
    >
      <View style={styles.header}>
        <Text style={styles.greeting}>안녕하세요, {user?.name}님!</Text>
        <TouchableOpacity style={styles.logout_button} onPress={handle_logout}>
          <Text style={styles.logout_text}>로그아웃</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <View style={styles.section_header}>
          <Text style={styles.section_title}>다가오는 일정</Text>
          <TouchableOpacity onPress={() => router.push("/(tabs)/schedule")}>
            <Text style={styles.see_all_text}>전체보기</Text>
          </TouchableOpacity>
        </View>

        {recent_schedules.length > 0 ? (
          recent_schedules.map((schedule) => (
            <View key={schedule.id} style={styles.item_card}>
              <Text style={styles.item_title}>{schedule.title}</Text>
              <Text style={styles.item_time}>
                {format_date(schedule.start_time)}
              </Text>
              {schedule.description && (
                <Text style={styles.item_description} numberOfLines={2}>
                  {schedule.description}
                </Text>
              )}
            </View>
          ))
        ) : (
          <View style={styles.empty_state}>
            <Text style={styles.empty_text}>다가오는 일정이 없습니다</Text>
            <TouchableOpacity
              style={styles.add_button}
              onPress={() => router.push("/(tabs)/schedule")}
            >
              <Text style={styles.add_button_text}>일정 추가하기</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      <View style={styles.section}>
        <View style={styles.section_header}>
          <Text style={styles.section_title}>최근 메모</Text>
          <TouchableOpacity onPress={() => router.push("/(tabs)/memo")}>
            <Text style={styles.see_all_text}>전체보기</Text>
          </TouchableOpacity>
        </View>

        {recent_memos.length > 0 ? (
          recent_memos.map((memo) => (
            <View key={memo.id} style={styles.item_card}>
              <Text style={styles.item_title}>{memo.title}</Text>
              <Text style={styles.item_description} numberOfLines={3}>
                {memo.content}
              </Text>
              <Text style={styles.item_time}>
                {format_date(memo.updated_at)}
              </Text>
            </View>
          ))
        ) : (
          <View style={styles.empty_state}>
            <Text style={styles.empty_text}>저장된 메모가 없습니다</Text>
            <TouchableOpacity
              style={styles.add_button}
              onPress={() => router.push("/(tabs)/memo")}
            >
              <Text style={styles.add_button_text}>메모 작성하기</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    backgroundColor: "white",
    borderBottomWidth: 1,
    borderBottomColor: "#E5E5EA",
  },
  greeting: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#333",
  },
  logout_button: {
    paddingHorizontal: 15,
    paddingVertical: 8,
    backgroundColor: "#FF3B30",
    borderRadius: 8,
  },
  logout_text: {
    color: "white",
    fontSize: 14,
    fontWeight: "600",
  },
  section: {
    margin: 20,
  },
  section_header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 15,
  },
  section_title: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
  },
  see_all_text: {
    color: "#007AFF",
    fontSize: 14,
  },
  item_card: {
    backgroundColor: "white",
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  item_title: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 5,
  },
  item_time: {
    fontSize: 12,
    color: "#666",
    marginBottom: 5,
  },
  item_description: {
    fontSize: 14,
    color: "#666",
    lineHeight: 20,
  },
  empty_state: {
    backgroundColor: "white",
    padding: 30,
    borderRadius: 10,
    alignItems: "center",
  },
  empty_text: {
    fontSize: 16,
    color: "#666",
    marginBottom: 15,
  },
  add_button: {
    backgroundColor: "#007AFF",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  add_button_text: {
    color: "white",
    fontSize: 14,
    fontWeight: "600",
  },
});
