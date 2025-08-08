import React, { useState, useEffect, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  Modal,
  TextInput,
  Switch,
  ScrollView,
} from "react-native";
import { useAuth } from "@/context/AuthContext";
import {
  firebase_database_service,
  Schedule,
} from "@/services/firebaseDatabase";
import DateTimePicker from "@react-native-community/datetimepicker";
import Calendar from "@/components/Calendar";

type ViewMode = "calendar" | "list";

export default function ScheduleScreen() {
  const { user } = useAuth();
  const [schedules, set_schedules] = useState<Schedule[]>([]);
  const [modal_visible, set_modal_visible] = useState(false);
  const [editing_schedule, set_editing_schedule] = useState<Schedule | null>(
    null,
  );
  const [view_mode, set_view_mode] = useState<ViewMode>("calendar");
  const [selected_date, set_selected_date] = useState<Date>(new Date());

  // 새 일정 폼 상태
  const [title, set_title] = useState("");
  const [description, set_description] = useState("");
  const [start_time, set_start_time] = useState(new Date());
  const [end_time, set_end_time] = useState(new Date());
  const [is_all_day, set_is_all_day] = useState(false);
  const [show_start_picker, set_show_start_picker] = useState(false);
  const [show_end_picker, set_show_end_picker] = useState(false);

  useEffect(() => {
    load_schedules();
  }, []);

  const load_schedules = async () => {
    if (!user) return;

    try {
      const user_schedules = await firebase_database_service.get_schedules(
        user.uid,
      );
      set_schedules(user_schedules);
    } catch (error) {
      console.error("Failed to load schedules:", error);
    }
  };

  // 선택된 날짜의 일정만 필터링
  const filtered_schedules = useMemo(() => {
    if (view_mode === "list") return schedules;

    return schedules.filter((schedule) => {
      const schedule_date = new Date(schedule.start_time);
      return (
        schedule_date.getFullYear() === selected_date.getFullYear() &&
        schedule_date.getMonth() === selected_date.getMonth() &&
        schedule_date.getDate() === selected_date.getDate()
      );
    });
  }, [schedules, selected_date, view_mode]);

  const handle_add_schedule = () => {
    set_editing_schedule(null);
    set_title("");
    set_description("");
    set_start_time(new Date());
    set_end_time(new Date());
    set_is_all_day(false);
    set_modal_visible(true);
  };

  const handle_edit_schedule = (schedule: Schedule) => {
    set_editing_schedule(schedule);
    set_title(schedule.title);
    set_description(schedule.description || "");
    set_start_time(new Date(schedule.start_time));
    set_end_time(schedule.end_time ? new Date(schedule.end_time) : new Date());
    set_is_all_day(schedule.is_all_day);
    set_modal_visible(true);
  };

  const handle_delete_schedule = (schedule: Schedule) => {
    Alert.alert("일정 삭제", "이 일정을 삭제하시겠습니까?", [
      { text: "취소", style: "cancel" },
      {
        text: "삭제",
        style: "destructive",
        onPress: async () => {
          try {
            await firebase_database_service.delete_schedule(schedule.id!);
            await load_schedules();
          } catch (error) {
            Alert.alert("오류", "일정 삭제에 실패했습니다.");
          }
        },
      },
    ]);
  };

  const handle_save_schedule = async () => {
    if (!title.trim()) {
      Alert.alert("오류", "일정 제목을 입력해주세요.");
      return;
    }

    if (!user) return;

    try {
      const now = new Date().toISOString();

      if (editing_schedule) {
        // 기존 일정 수정
        await firebase_database_service.update_schedule(editing_schedule.id!, {
          title: title.trim(),
          description: description.trim(),
          start_time: start_time.toISOString(),
          end_time: is_all_day ? undefined : end_time.toISOString(),
          is_all_day,
          updated_at: now,
        });
      } else {
        // 새 일정 생성
        await firebase_database_service.create_schedule({
          user_id: user.uid,
          title: title.trim(),
          description: description.trim(),
          start_time: start_time.toISOString(),
          end_time: is_all_day ? undefined : end_time.toISOString(),
          is_all_day,
          created_at: now,
          updated_at: now,
        });
      }

      set_modal_visible(false);
      await load_schedules();
    } catch (error) {
      Alert.alert("오류", "일정 저장에 실패했습니다.");
    }
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

  const handle_date_select = (date: Date) => {
    set_selected_date(date);
  };

  const render_schedule_item = ({ item }: { item: Schedule }) => (
    <View style={styles.schedule_item}>
      <View style={styles.schedule_header}>
        <Text style={styles.schedule_title}>{item.title}</Text>
        <View style={styles.schedule_actions}>
          <TouchableOpacity
            style={styles.action_button}
            onPress={() => handle_edit_schedule(item)}
          >
            <Text style={styles.action_text}>수정</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.action_button, styles.delete_button]}
            onPress={() => handle_delete_schedule(item)}
          >
            <Text style={styles.delete_text}>삭제</Text>
          </TouchableOpacity>
        </View>
      </View>

      {item.description && (
        <Text style={styles.schedule_description}>{item.description}</Text>
      )}

      <Text style={styles.schedule_time}>
        {item.is_all_day ? "하루 종일" : format_date(item.start_time)}
        {!item.is_all_day &&
          item.end_time &&
          ` - ${format_date(item.end_time)}`}
      </Text>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* 뷰 모드 전환 버튼 */}
      <View style={styles.view_controls}>
        <TouchableOpacity
          style={[
            styles.view_button,
            view_mode === "calendar" && styles.active_view_button,
          ]}
          onPress={() => set_view_mode("calendar")}
        >
          <Text
            style={[
              styles.view_button_text,
              view_mode === "calendar" && styles.active_view_button_text,
            ]}
          >
            달력
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.view_button,
            view_mode === "list" && styles.active_view_button,
          ]}
          onPress={() => set_view_mode("list")}
        >
          <Text
            style={[
              styles.view_button_text,
              view_mode === "list" && styles.active_view_button_text,
            ]}
          >
            목록
          </Text>
        </TouchableOpacity>
      </View>

      {view_mode === "calendar" ? (
        <ScrollView style={styles.calendar_container}>
          <Calendar
            schedules={schedules}
            on_date_select={handle_date_select}
            selected_date={selected_date}
          />

          {/* 선택된 날짜의 일정 목록 */}
          <View style={styles.selected_date_header}>
            <Text style={styles.selected_date_text}>
              {selected_date.toLocaleDateString("ko-KR", {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}{" "}
              일정
            </Text>
          </View>

          <FlatList
            data={filtered_schedules}
            renderItem={render_schedule_item}
            keyExtractor={(item) => item.id?.toString() || ""}
            scrollEnabled={false}
            ListEmptyComponent={
              <View style={styles.empty_state}>
                <Text style={styles.empty_text}>이 날의 일정이 없습니다</Text>
              </View>
            }
          />
        </ScrollView>
      ) : (
        <FlatList
          data={filtered_schedules}
          renderItem={render_schedule_item}
          keyExtractor={(item) => item.id?.toString() || ""}
          contentContainerStyle={styles.list_container}
          ListEmptyComponent={
            <View style={styles.empty_state}>
              <Text style={styles.empty_text}>등록된 일정이 없습니다</Text>
              <TouchableOpacity
                style={styles.add_button}
                onPress={handle_add_schedule}
              >
                <Text style={styles.add_button_text}>일정 추가하기</Text>
              </TouchableOpacity>
            </View>
          }
        />
      )}

      <TouchableOpacity style={styles.fab} onPress={handle_add_schedule}>
        <Text style={styles.fab_text}>+</Text>
      </TouchableOpacity>

      {/* 기존 Modal 코드는 그대로 유지 */}
      <Modal
        visible={modal_visible}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <View style={styles.modal_container}>
          <View style={styles.modal_header}>
            <Text style={styles.modal_title}>
              {editing_schedule ? "일정 수정" : "새 일정"}
            </Text>
            <TouchableOpacity onPress={() => set_modal_visible(false)}>
              <Text style={styles.close_button}>닫기</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.form}>
            <TextInput
              style={styles.input}
              placeholder="일정 제목"
              value={title}
              onChangeText={set_title}
            />

            <TextInput
              style={[styles.input, styles.text_area]}
              placeholder="일정 설명 (선택사항)"
              value={description}
              onChangeText={set_description}
              multiline
              numberOfLines={3}
            />

            <View style={styles.switch_container}>
              <Text style={styles.switch_label}>하루 종일</Text>
              <Switch value={is_all_day} onValueChange={set_is_all_day} />
            </View>

            <TouchableOpacity
              style={styles.date_button}
              onPress={() => set_show_start_picker(true)}
            >
              <Text style={styles.date_label}>시작 시간</Text>
              <Text style={styles.date_value}>
                {start_time.toLocaleString("ko-KR")}
              </Text>
            </TouchableOpacity>

            {!is_all_day && (
              <TouchableOpacity
                style={styles.date_button}
                onPress={() => set_show_end_picker(true)}
              >
                <Text style={styles.date_label}>종료 시간</Text>
                <Text style={styles.date_value}>
                  {end_time.toLocaleString("ko-KR")}
                </Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              style={styles.save_button}
              onPress={handle_save_schedule}
            >
              <Text style={styles.save_button_text}>
                {editing_schedule ? "수정" : "저장"}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {show_start_picker && (
          <DateTimePicker
            value={start_time}
            mode="datetime"
            display="default"
            onChange={(event, selected_date) => {
              set_show_start_picker(false);
              if (selected_date) {
                set_start_time(selected_date);
                if (selected_date > end_time) {
                  set_end_time(selected_date);
                }
              }
            }}
          />
        )}

        {show_end_picker && (
          <DateTimePicker
            value={end_time}
            mode="datetime"
            display="default"
            minimumDate={start_time}
            onChange={(event, selected_date) => {
              set_show_end_picker(false);
              if (selected_date) {
                set_end_time(selected_date);
              }
            }}
          />
        )}
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  view_controls: {
    flexDirection: "row",
    backgroundColor: "white",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E5EA",
  },
  view_button: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 20,
    marginHorizontal: 5,
    borderRadius: 20,
    backgroundColor: "#f0f0f0",
  },
  active_view_button: {
    backgroundColor: "#007AFF",
  },
  view_button_text: {
    textAlign: "center",
    fontSize: 16,
    fontWeight: "600",
    color: "#666",
  },
  active_view_button_text: {
    color: "white",
  },
  calendar_container: {
    flex: 1,
  },
  selected_date_header: {
    backgroundColor: "white",
    padding: 15,
    marginHorizontal: 10,
    marginTop: 10,
    borderRadius: 10,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 3,
  },
  selected_date_text: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
  },
  list_container: {
    padding: 20,
  },
  schedule_item: {
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
  schedule_header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  schedule_title: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
    flex: 1,
  },
  schedule_actions: {
    flexDirection: "row",
  },
  action_button: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    backgroundColor: "#007AFF",
    borderRadius: 5,
    marginLeft: 5,
  },
  action_text: {
    color: "white",
    fontSize: 12,
    fontWeight: "600",
  },
  delete_button: {
    backgroundColor: "#FF3B30",
  },
  delete_text: {
    color: "white",
    fontSize: 12,
    fontWeight: "600",
  },
  schedule_description: {
    fontSize: 14,
    color: "#666",
    marginBottom: 10,
  },
  schedule_time: {
    fontSize: 12,
    color: "#999",
  },
  empty_state: {
    alignItems: "center",
    paddingVertical: 40,
  },
  empty_text: {
    fontSize: 16,
    color: "#999",
    marginBottom: 20,
  },
  add_button: {
    backgroundColor: "#007AFF",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  add_button_text: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
  fab: {
    position: "absolute",
    bottom: 20,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#007AFF",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  fab_text: {
    color: "white",
    fontSize: 24,
    fontWeight: "bold",
  },
  modal_container: {
    flex: 1,
    backgroundColor: "white",
  },
  modal_header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E5EA",
  },
  modal_title: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
  },
  close_button: {
    fontSize: 16,
    color: "#007AFF",
  },
  form: {
    padding: 20,
  },
  input: {
    backgroundColor: "#f8f8f8",
    paddingHorizontal: 15,
    paddingVertical: 15,
    borderRadius: 10,
    marginBottom: 15,
    fontSize: 16,
    borderWidth: 1,
    borderColor: "#E5E5EA",
  },
  text_area: {
    height: 80,
    textAlignVertical: "top",
  },
  switch_container: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 15,
  },
  switch_label: {
    fontSize: 16,
    color: "#333",
  },
  date_button: {
    backgroundColor: "#f8f8f8",
    paddingHorizontal: 15,
    paddingVertical: 15,
    borderRadius: 10,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: "#E5E5EA",
  },
  date_label: {
    fontSize: 14,
    color: "#666",
    marginBottom: 5,
  },
  date_value: {
    fontSize: 16,
    color: "#333",
  },
  save_button: {
    backgroundColor: "#007AFF",
    paddingVertical: 15,
    borderRadius: 10,
    marginTop: 20,
  },
  save_button_text: {
    color: "white",
    textAlign: "center",
    fontSize: 16,
    fontWeight: "600",
  },
});
