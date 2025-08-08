import React, { useState, useMemo, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from "react-native";
import { Schedule } from "@/services/firebaseDatabase";

interface CalendarProps {
  schedules: Schedule[];
  on_date_select: (date: Date) => void;
  selected_date?: Date;
}

interface CalendarDay {
  date: Date;
  day: number;
  is_current_month: boolean;
  is_today: boolean;
  is_selected: boolean;
  has_schedule: boolean;
}

export default function Calendar({
  schedules,
  on_date_select,
  selected_date,
}: CalendarProps) {
  const [current_month, set_current_month] = useState(new Date());

  // 두 날짜가 같은 날인지 확인하는 함수를 useCallback으로 감싸기
  const is_same_date = useCallback((date1: Date, date2: Date): boolean => {
    return (
      date1.getFullYear() === date2.getFullYear() &&
      date1.getMonth() === date2.getMonth() &&
      date1.getDate() === date2.getDate()
    );
  }, []);

  // 날짜가 오늘인지 확인하는 함수를 useCallback으로 감싸기
  const is_today = useCallback(
    (date: Date): boolean => {
      const today = new Date();
      return is_same_date(date, today);
    },
    [is_same_date],
  );

  // 해당 날짜에 일정이 있는지 확인하는 함수를 useCallback으로 감싸기
  const has_schedule_on_date = useCallback(
    (date: Date): boolean => {
      return schedules.some((schedule) => {
        const schedule_date = new Date(schedule.start_time);
        return is_same_date(schedule_date, date);
      });
    },
    [schedules, is_same_date],
  );

  // 현재 월의 첫 번째 날과 마지막 날 계산
  const first_day_of_month = useMemo(() => {
    return new Date(current_month.getFullYear(), current_month.getMonth(), 1);
  }, [current_month]);

  const last_day_of_month = useMemo(() => {
    return new Date(
      current_month.getFullYear(),
      current_month.getMonth() + 1,
      0,
    );
  }, [current_month]);

  // 달력에 표시할 날짜들 생성
  const calendar_days = useMemo(() => {
    const days: CalendarDay[] = [];

    // 이전 달의 마지막 날들
    const first_day_weekday = first_day_of_month.getDay();
    for (let i = first_day_weekday - 1; i >= 0; i--) {
      const date = new Date(first_day_of_month);
      date.setDate(date.getDate() - (i + 1));
      days.push({
        date,
        day: date.getDate(),
        is_current_month: false,
        is_today: is_today(date),
        is_selected: selected_date ? is_same_date(date, selected_date) : false,
        has_schedule: has_schedule_on_date(date),
      });
    }

    // 현재 달의 날짜들
    for (let i = 1; i <= last_day_of_month.getDate(); i++) {
      const date = new Date(
        current_month.getFullYear(),
        current_month.getMonth(),
        i,
      );
      days.push({
        date,
        day: i,
        is_current_month: true,
        is_today: is_today(date),
        is_selected: selected_date ? is_same_date(date, selected_date) : false,
        has_schedule: has_schedule_on_date(date),
      });
    }

    // 다음 달의 첫 번째 날들 (7의 배수로 맞추기)
    const remaining_days = 42 - days.length; // 6주 x 7일 = 42
    for (let i = 1; i <= remaining_days; i++) {
      const date = new Date(last_day_of_month);
      date.setDate(date.getDate() + i);
      days.push({
        date,
        day: date.getDate(),
        is_current_month: false,
        is_today: is_today(date),
        is_selected: selected_date ? is_same_date(date, selected_date) : false,
        has_schedule: has_schedule_on_date(date),
      });
    }

    return days;
  }, [
    current_month,
    schedules,
    selected_date,
    is_today,
    is_same_date,
    has_schedule_on_date,
    first_day_of_month,
    last_day_of_month,
  ]);

  // 이전 달로 이동
  const go_to_previous_month = useCallback(() => {
    set_current_month(
      new Date(current_month.getFullYear(), current_month.getMonth() - 1, 1),
    );
  }, [current_month]);

  // 다음 달로 이동
  const go_to_next_month = useCallback(() => {
    set_current_month(
      new Date(current_month.getFullYear(), current_month.getMonth() + 1, 1),
    );
  }, [current_month]);

  // 날짜 선택
  const handle_date_select = useCallback(
    (day: CalendarDay) => {
      on_date_select(day.date);
    },
    [on_date_select],
  );

  const weekdays = ["일", "월", "화", "수", "목", "금", "토"];

  return (
    <View style={styles.container}>
      {/* 월 네비게이션 */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={go_to_previous_month}
          style={styles.nav_button}
        >
          <Text style={styles.nav_text}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.month_text}>
          {current_month.getFullYear()}년 {current_month.getMonth() + 1}월
        </Text>
        <TouchableOpacity onPress={go_to_next_month} style={styles.nav_button}>
          <Text style={styles.nav_text}>›</Text>
        </TouchableOpacity>
      </View>

      {/* 요일 헤더 */}
      <View style={styles.weekdays}>
        {weekdays.map((weekday, index) => (
          <View key={index} style={styles.weekday}>
            <Text
              style={[
                styles.weekday_text,
                index === 0 && styles.sunday,
                index === 6 && styles.saturday,
              ]}
            >
              {weekday}
            </Text>
          </View>
        ))}
      </View>

      {/* 달력 그리드 */}
      <View style={styles.calendar_grid}>
        {calendar_days.map((day, index) => (
          <TouchableOpacity
            key={index}
            style={[
              styles.day,
              day.is_selected && styles.selected_day,
              day.is_today && styles.today,
              !day.is_current_month && styles.other_month,
            ]}
            onPress={() => handle_date_select(day)}
          >
            <Text
              style={[
                styles.day_text,
                day.is_selected && styles.selected_day_text,
                day.is_today && styles.today_text,
                !day.is_current_month && styles.other_month_text,
              ]}
            >
              {day.day}
            </Text>
            {day.has_schedule && <View style={styles.schedule_dot} />}
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "white",
    borderRadius: 10,
    padding: 15,
    margin: 10,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  nav_button: {
    padding: 10,
  },
  nav_text: {
    fontSize: 24,
    color: "#007AFF",
    fontWeight: "bold",
  },
  month_text: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
  },
  weekdays: {
    flexDirection: "row",
    marginBottom: 10,
  },
  weekday: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 10,
  },
  weekday_text: {
    fontSize: 14,
    fontWeight: "600",
    color: "#666",
  },
  sunday: {
    color: "#FF3B30",
  },
  saturday: {
    color: "#007AFF",
  },
  calendar_grid: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  day: {
    width: "14.28%",
    aspectRatio: 1,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  day_text: {
    fontSize: 16,
    color: "#333",
  },
  selected_day: {
    backgroundColor: "#007AFF",
    borderRadius: 20,
  },
  selected_day_text: {
    color: "white",
    fontWeight: "bold",
  },
  today: {
    borderWidth: 2,
    borderColor: "#007AFF",
    borderRadius: 20,
  },
  today_text: {
    color: "#007AFF",
    fontWeight: "bold",
  },
  other_month: {
    opacity: 0.3,
  },
  other_month_text: {
    color: "#999",
  },
  schedule_dot: {
    position: "absolute",
    bottom: 4,
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#FF3B30",
  },
});
