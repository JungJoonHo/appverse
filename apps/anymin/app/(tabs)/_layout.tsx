import { Tabs } from "expo-router";
import { useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { router } from "expo-router";

export default function TabLayout() {
  const { user, is_loading } = useAuth();

  useEffect(() => {
    if (!is_loading && !user) {
      router.replace("/auth/login");
    }
  }, [user, is_loading]);

  if (is_loading || !user) {
    return null;
  }

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: "#007AFF",
        tabBarInactiveTintColor: "#8E8E93",
        tabBarStyle: {
          backgroundColor: "#fff",
          borderTopWidth: 1,
          borderTopColor: "#E5E5EA",
        },
        headerStyle: {
          backgroundColor: "#fff",
        },
        headerTitleStyle: {
          fontWeight: "600",
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "홈",
          tabBarIcon: ({ color }) => <TabBarIcon name="home" color={color} />,
        }}
      />
      <Tabs.Screen
        name="schedule"
        options={{
          title: "일정",
          tabBarIcon: ({ color }) => (
            <TabBarIcon name="calendar" color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="memo"
        options={{
          title: "메모",
          tabBarIcon: ({ color }) => (
            <TabBarIcon name="document-text" color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "프로필",
          tabBarIcon: ({ color }) => <TabBarIcon name="person" color={color} />,
        }}
      />
      <Tabs.Screen
        name="users"
        options={{
          title: "회원 목록",
          tabBarIcon: ({ color }) => <TabBarIcon name="people" color={color} />,
        }}
      />
      <Tabs.Screen
        name="recordings"
        options={{
          title: "녹음본",
          tabBarIcon: ({ color }) => <TabBarIcon name="mic" color={color} />,
        }}
      />
    </Tabs>
  );
}

function TabBarIcon(props: {
  name: React.ComponentProps<
    typeof import("@expo/vector-icons").Ionicons
  >["name"];
  color: string;
}) {
  const { Ionicons } = require("@expo/vector-icons");
  return <Ionicons size={28} style={{ marginBottom: -3 }} {...props} />;
}
