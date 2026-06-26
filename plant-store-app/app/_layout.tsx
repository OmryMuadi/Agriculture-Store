import { Ionicons } from "@expo/vector-icons";
import { Tabs } from "expo-router";
import { useEffect } from "react";

export default function RootLayout() {
  useEffect(() => {
    // Initialize Supabase anonymous auth session on app start
    ;
  }, []);

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: "#2e7d32",
        tabBarInactiveTintColor: "#666",
        tabBarStyle: {
          borderTopWidth: 1,
          borderTopColor: "#e0e0e0",
          height: 60,
          paddingBottom: 8,
          paddingTop: 8,
        },
        headerStyle: {
          backgroundColor: "#2e7d32",
        },
        headerTintColor: "#fff",
        headerTitleStyle: {
          fontWeight: "bold",
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Dashboard",
          tabBarLabel: "טיפול חדש",
          headerTitle: "טיפול חדש",
          tabBarIcon: ({ color, focused }) => (
            <Ionicons 
              name={focused ? "leaf" : "leaf-outline"} 
              size={24} 
              color={color} 
            />
          ),
        }}
      />
      <Tabs.Screen
        name="cases"
        options={{
          title: "Cases",
          tabBarLabel: "היסטוריית טיפולים",
          headerTitle: "היסטוריית טיפולים",
          tabBarIcon: ({ color, focused }) => (
            <Ionicons 
              name={focused ? "journal" : "journal-outline"} 
              size={24} 
              color={color} 
            />
          ),
        }}
      />
      <Tabs.Screen
        name="directory"
        options={{
          title: "Directory",
          tabBarLabel: "מאגר נתונים",
          headerTitle: "רשימה",
          tabBarIcon: ({ color, focused }) => (
            <Ionicons 
              name={focused ? "folder" : "folder-outline"} 
              size={24} 
              color={color} 
            />
          ),
        }}
      />
    </Tabs>
  );
}
