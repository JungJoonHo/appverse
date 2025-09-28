import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Alert,
  Modal,
} from "react-native";
import { useAuth } from "@/context/AuthContext";
import {
  firebase_database_service,
  Schedule,
  Memo,
  CallRecord,
} from "@/services/firebaseDatabase";
import { stt_service } from "@/services/sttService";
import { router } from "expo-router";

export default function HomeScreen() {
  const { user, logout } = useAuth();
  const [recent_schedules, set_recent_schedules] = useState<Schedule[]>([]);
  const [recent_memos, set_recent_memos] = useState<Memo[]>([]);
  const [recent_calls, set_recent_calls] = useState<CallRecord[]>([]);
  const [refreshing, set_refreshing] = useState(false);
  const [selected_call, set_selected_call] = useState<CallRecord | null>(null);
  const [key_points_modal_visible, set_key_points_modal_visible] =
    useState(false);
  const [key_points, set_key_points] = useState<string[]>([]);
  const [is_processing, setIs_processing] = useState(false);

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
      let calls = await firebase_database_service.get_call_records(user.uid);

      // 테스트용 샘플 통화 기록 생성 (데이터가 없을 때)
      if (calls.length === 0) {
        await create_sample_call_records();
        calls = await firebase_database_service.get_call_records(user.uid);
      }

      set_recent_schedules(schedules.slice(0, 3)); // 최근 3개
      set_recent_memos(memos.slice(0, 3)); // 최근 3개
      set_recent_calls(calls.slice(0, 5)); // 최근 5개
    } catch (error) {
      console.error("Failed to load dashboard data:", error);
    }
  };

  const create_sample_call_records = async () => {
    if (!user) return;

    const sample_calls = [
      {
        user_id: user.uid,
        phone_number: "010-1234-5678",
        caller_name: "김철수",
        call_type: "incoming" as const,
        duration: 180,
        call_date: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2시간 전
        audio_file_path: "/sample/audio1.wav",
        is_transcribed: false,
      },
      {
        user_id: user.uid,
        phone_number: "010-9876-5432",
        caller_name: "이영희",
        call_type: "outgoing" as const,
        duration: 300,
        call_date: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(), // 5시간 전
        audio_file_path: "/sample/audio2.wav",
        is_transcribed: false,
      },
      {
        user_id: user.uid,
        phone_number: "010-5555-1234",
        caller_name: "박민수",
        call_type: "missed" as const,
        duration: 0,
        call_date: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(), // 8시간 전
        audio_file_path: "",
        is_transcribed: false,
      },
    ];

    for (const call of sample_calls) {
      try {
        await firebase_database_service.create_call_record(call);
      } catch (error) {
        console.error("샘플 통화 기록 생성 실패:", error);
      }
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

  const format_duration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remaining_seconds = seconds % 60;
    return `${minutes}:${remaining_seconds.toString().padStart(2, "0")}`;
  };

  const get_call_type_icon = (call_type: string) => {
    switch (call_type) {
      case "incoming":
        return "📥";
      case "outgoing":
        return "📤";
      case "missed":
        return "❌";
      default:
        return "📞";
    }
  };

  const handle_stt_transcription = async (call: CallRecord) => {
    if (!call.audio_file_path) {
      Alert.alert("오류", "오디오 파일이 없습니다.");
      return;
    }

    setIs_processing(true);
    try {
      const result = await stt_service.transcribe_audio(
        call.audio_file_path,
        call.id!,
      );

      // 핵심 내용 추출
      const extracted_points = await stt_service.extract_key_points(
        result.transcription,
      );
      set_key_points(extracted_points);
      set_selected_call(call);
      set_key_points_modal_visible(true);

      // 데이터 새로고침
      await load_dashboard_data();
    } catch (error) {
      Alert.alert("오류", "STT 변환에 실패했습니다.");
      console.error("STT 변환 실패:", error);
    } finally {
      setIs_processing(false);
    }
  };

  const handle_save_as_memo = async (key_point: string) => {
    if (!selected_call || !user) return;

    try {
      await stt_service.save_as_memo(
        user.uid,
        `${selected_call.caller_name} 통화 - ${key_point.substring(0, 20)}...`,
        `통화 상대: ${selected_call.caller_name}\n통화 시간: ${format_date(selected_call.call_date)}\n\n${key_point}`,
      );

      Alert.alert("성공", "메모로 저장되었습니다.");
      set_key_points_modal_visible(false);
      set_selected_call(null);
      set_key_points([]);

      // 데이터 새로고침
      await load_dashboard_data();
    } catch (error) {
      Alert.alert("오류", "메모 저장에 실패했습니다.");
      console.error("메모 저장 실패:", error);
    }
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
          <Text style={styles.section_title}>최근 통화</Text>
          <TouchableOpacity onPress={() => router.push("/(tabs)/recordings")}>
            <Text style={styles.see_all_text}>전체보기</Text>
          </TouchableOpacity>
        </View>

        {recent_calls.length > 0 ? (
          recent_calls.map((call) => (
            <View key={call.id} style={styles.call_card}>
              <View style={styles.call_header}>
                <Text style={styles.call_icon}>
                  {get_call_type_icon(call.call_type)}
                </Text>
                <View style={styles.call_info}>
                  <Text style={styles.caller_name}>{call.caller_name}</Text>
                  <Text style={styles.phone_number}>{call.phone_number}</Text>
                  <Text style={styles.call_time}>
                    {format_date(call.call_date)} •{" "}
                    {format_duration(call.duration)}
                  </Text>
                </View>
              </View>

              {call.is_transcribed ? (
                <View style={styles.transcription_status}>
                  <Text style={styles.transcribed_text}>✓ 변환 완료</Text>
                  {call.transcription && (
                    <TouchableOpacity
                      style={styles.view_transcription_button}
                      onPress={() => {
                        set_selected_call(call);
                        set_key_points([call.transcription!]);
                        set_key_points_modal_visible(true);
                      }}
                    >
                      <Text style={styles.view_transcription_text}>
                        내용 보기
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>
              ) : (
                <TouchableOpacity
                  style={[
                    styles.stt_button,
                    is_processing && styles.stt_button_disabled,
                  ]}
                  onPress={() => handle_stt_transcription(call)}
                  disabled={is_processing}
                >
                  <Text style={styles.stt_button_text}>
                    {is_processing ? "변환 중..." : "STT 변환"}
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          ))
        ) : (
          <View style={styles.empty_state}>
            <Text style={styles.empty_text}>통화 기록이 없습니다</Text>
          </View>
        )}
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

      {/* 핵심 내용 선택 모달 */}
      <Modal
        visible={key_points_modal_visible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => set_key_points_modal_visible(false)}
      >
        <View style={styles.modal_overlay}>
          <View style={styles.modal_content}>
            <View style={styles.modal_header}>
              <Text style={styles.modal_title}>통화 내용</Text>
              <TouchableOpacity
                onPress={() => set_key_points_modal_visible(false)}
                style={styles.close_button}
              >
                <Text style={styles.close_button_text}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.key_points_list}>
              {key_points.map((point, index) => (
                <TouchableOpacity
                  key={index}
                  style={styles.key_point_item}
                  onPress={() => handle_save_as_memo(point)}
                >
                  <Text style={styles.key_point_text}>{point}</Text>
                  <Text style={styles.save_hint}>터치하여 메모로 저장</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>
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
  call_card: {
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
  call_header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  call_icon: {
    fontSize: 24,
    marginRight: 10,
  },
  call_info: {
    flex: 1,
  },
  caller_name: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
  },
  phone_number: {
    fontSize: 14,
    color: "#666",
    marginTop: 2,
  },
  call_time: {
    fontSize: 12,
    color: "#666",
    marginTop: 2,
  },
  transcription_status: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 10,
  },
  transcribed_text: {
    fontSize: 14,
    color: "#007AFF",
    fontWeight: "600",
  },
  view_transcription_button: {
    backgroundColor: "#E0E0E0",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 5,
  },
  view_transcription_text: {
    fontSize: 13,
    color: "#007AFF",
    fontWeight: "600",
  },
  stt_button: {
    backgroundColor: "#007AFF",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    marginTop: 10,
  },
  stt_button_text: {
    color: "white",
    fontSize: 14,
    fontWeight: "600",
    textAlign: "center",
  },
  stt_button_disabled: {
    backgroundColor: "#A0A0A0",
  },
  modal_overlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  modal_content: {
    backgroundColor: "white",
    borderRadius: 10,
    padding: 20,
    width: "80%",
    maxHeight: "70%",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  modal_header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 15,
  },
  modal_title: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
  },
  close_button: {
    padding: 5,
  },
  close_button_text: {
    fontSize: 20,
    color: "#666",
  },
  key_points_list: {
    maxHeight: 200,
  },
  key_point_item: {
    backgroundColor: "#F0F0F0",
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#E0E0E0",
  },
  key_point_text: {
    fontSize: 15,
    fontWeight: "600",
    color: "#333",
    marginBottom: 5,
  },
  save_hint: {
    fontSize: 12,
    color: "#666",
    textAlign: "right",
  },
});
