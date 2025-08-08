import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  RefreshControl,
  ActivityIndicator,
} from "react-native";
import AudioService, { AudioFile } from "@/services/audioService";

export default function RecordingsScreen() {
  const [recordings, set_recordings] = useState<AudioFile[]>([]);
  const [is_loading, set_is_loading] = useState(false);
  const [refreshing, set_refreshing] = useState(false);

  useEffect(() => {
    load_recordings();
  }, []);

  const load_recordings = async () => {
    set_is_loading(true);
    try {
      // 미디어 라이브러리에서 오디오 파일 가져오기
      const audio_files = await AudioService.getCallRecordings();

      // 앱 문서 디렉토리에서도 파일 가져오기
      const documents_files = await AudioService.getDocumentsFiles();

      // 중복 제거하고 합치기
      const all_files = [...audio_files, ...documents_files];
      const unique_files = all_files.filter(
        (file, index, self) =>
          index === self.findIndex((f) => f.path === file.path),
      );

      set_recordings(unique_files);
    } catch (error) {
      console.error("Failed to load recordings:", error);
      Alert.alert("오류", "녹음본을 불러오는데 실패했습니다.");
    } finally {
      set_is_loading(false);
    }
  };

  const on_refresh = async () => {
    set_refreshing(true);
    await load_recordings();
    set_refreshing(false);
  };

  const handle_pick_audio = async () => {
    try {
      const audio_file = await AudioService.pickAudioFile();
      if (audio_file) {
        set_recordings((prev) => [audio_file, ...prev]);
        Alert.alert("성공", "오디오 파일이 추가되었습니다.");
      }
    } catch (error) {
      console.error("Failed to pick audio file:", error);
    }
  };

  const handle_delete_recording = (recording: AudioFile) => {
    Alert.alert(
      "녹음본 삭제",
      `"${recording.name}" 녹음본을 삭제하시겠습니까?`,
      [
        { text: "취소", style: "cancel" },
        {
          text: "삭제",
          style: "destructive",
          onPress: async () => {
            try {
              const success = await AudioService.deleteAudioFile(
                recording.path,
              );
              if (success) {
                set_recordings((prev) =>
                  prev.filter((r) => r.path !== recording.path),
                );
                Alert.alert("성공", "녹음본이 삭제되었습니다.");
              } else {
                Alert.alert("오류", "녹음본 삭제에 실패했습니다.");
              }
            } catch (error) {
              console.error("Failed to delete recording:", error);
              Alert.alert("오류", "녹음본 삭제에 실패했습니다.");
            }
          },
        },
      ],
    );
  };

  const format_file_size = (bytes: number): string => {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const format_date = (date: Date): string => {
    return date.toLocaleDateString("ko-KR", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const render_recording_item = ({ item }: { item: AudioFile }) => (
    <View style={styles.recording_item}>
      <View style={styles.recording_info}>
        <Text style={styles.recording_name}>{item.name}</Text>
        <Text style={styles.recording_details}>
          {format_file_size(item.size)} • {format_date(item.created_at)}
        </Text>
      </View>

      <View style={styles.recording_actions}>
        <TouchableOpacity
          style={styles.play_button}
          onPress={() => {
            // TODO: 오디오 재생 기능 구현
            Alert.alert("알림", "오디오 재생 기능은 추후 구현 예정입니다.");
          }}
        >
          <Text style={styles.play_button_text}>재생</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.delete_button}
          onPress={() => handle_delete_recording(item)}
        >
          <Text style={styles.delete_button_text}>삭제</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  if (is_loading) {
    return (
      <View style={styles.loading_container}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loading_text}>녹음본을 불러오는 중...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.header_content}>
          <View>
            <Text style={styles.title}>통화 녹음본</Text>
            <Text style={styles.subtitle}>
              총 {recordings.length}개의 녹음본
            </Text>
          </View>
          <TouchableOpacity
            style={styles.add_button}
            onPress={handle_pick_audio}
          >
            <Text style={styles.add_button_text}>+ 추가</Text>
          </TouchableOpacity>
        </View>
      </View>

      <FlatList
        data={recordings}
        renderItem={render_recording_item}
        keyExtractor={(item) => item.path}
        contentContainerStyle={styles.list_container}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={on_refresh} />
        }
        ListEmptyComponent={
          <View style={styles.empty_state}>
            <Text style={styles.empty_text}>녹음본이 없습니다</Text>
            <TouchableOpacity
              style={styles.empty_add_button}
              onPress={handle_pick_audio}
            >
              <Text style={styles.empty_add_text}>첫 번째 녹음본 추가하기</Text>
            </TouchableOpacity>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  loading_container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f5f5f5",
  },
  loading_text: {
    marginTop: 10,
    fontSize: 16,
    color: "#666",
  },
  header: {
    backgroundColor: "white",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E5EA",
  },
  header_content: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 14,
    color: "#666",
  },
  add_button: {
    backgroundColor: "#007AFF",
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 8,
  },
  add_button_text: {
    color: "white",
    fontSize: 14,
    fontWeight: "600",
  },
  list_container: {
    padding: 20,
  },
  recording_item: {
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
  recording_info: {
    marginBottom: 10,
  },
  recording_name: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 5,
  },
  recording_details: {
    fontSize: 12,
    color: "#666",
  },
  recording_actions: {
    flexDirection: "row",
    gap: 10,
  },
  play_button: {
    backgroundColor: "#007AFF",
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 5,
    flex: 1,
  },
  play_button_text: {
    color: "white",
    fontSize: 12,
    textAlign: "center",
    fontWeight: "600",
  },
  delete_button: {
    backgroundColor: "#FF3B30",
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 5,
    flex: 1,
  },
  delete_button_text: {
    color: "white",
    fontSize: 12,
    textAlign: "center",
    fontWeight: "600",
  },
  empty_state: {
    alignItems: "center",
    paddingVertical: 50,
  },
  empty_text: {
    fontSize: 16,
    color: "#666",
    marginBottom: 20,
  },
  empty_add_button: {
    backgroundColor: "#007AFF",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  empty_add_text: {
    color: "white",
    fontSize: 14,
    fontWeight: "600",
  },
});
