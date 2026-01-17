import { ActivityIndicator, View } from "react-native";
import { useState, useEffect } from "react";

import { useAuth } from "./src/hooks/useAuth";
import Header from "./src/components/Header";

import HomeScreen from "./src/screens/HomeScreen";
import LoginScreen from "./src/screens/LoginScreen";
import RegisterScreen from "./src/screens/RegisterScreen";
import CreatePostScreen from "./src/screens/CreatePostScreen";
import AdminUsersScreen from "./src/screens/AdminUsersScreen";
import ProfileScreen from "./src/screens/ProfileScreen";
import NewsScreen from "./src/screens/NewsScreen";

/* ---------- Types ---------- */
type Screen =
  | "home"
  | "login"
  | "register"
  | "create"
  | "adminUsers"
  | "profile"
  | "news";

export default function App() {
  const { user, role, username, loading } = useAuth();

  const [screen, setScreen] = useState<Screen>("home");
  const [profileUserId, setProfileUserId] = useState<string | null>(null);

  // ✅ זה הטריגר שמאפס את HomeScreen
  const [homeResetKey, setHomeResetKey] = useState(0);

  useEffect(() => {
    if (user) {
      setScreen("home");
      setHomeResetKey((k) => k + 1);
    }
  }, [user]);

  function handleNavigate(next: Screen, userId?: string) {
    if (next === "home") {
      // 🔥 זה החלק שהיה חסר לך
      setHomeResetKey((k) => k + 1);
    }

    if (next === "profile" && userId) {
      setProfileUserId(userId);
    }

    setScreen(next);
  }

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: "center" }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <View style={{ flex: 1 }}>
      {/* ---------- Header ---------- */}
      <Header
        user={user}
        role={role}
        username={username}
        onNavigate={handleNavigate}
      />

      {/* ---------- Screens ---------- */}
      {screen === "home" && (
        <HomeScreen
          key={homeResetKey} // ✅ זה מה שסוגר פוסט פתוח
          user={user}
          role={role}
          onOpenProfile={(userId) => {
            setProfileUserId(userId);
            setScreen("profile");
          }}
          onOpenNews={() => setScreen("news")}
        />
      )}

      {screen === "news" && <NewsScreen />}

      {screen === "profile" && profileUserId && (
        <ProfileScreen
          userId={profileUserId}
          currentUser={user}
          onBack={() => {
            setHomeResetKey((k) => k + 1);
            setScreen("home");
          }}
        />
      )}

      {screen === "login" && (
        <LoginScreen onSwitch={() => setScreen("register")} />
      )}

      {screen === "register" && (
        <RegisterScreen onSwitch={() => setScreen("login")} />
      )}

      {screen === "create" && user && (
        <CreatePostScreen onDone={() => setScreen("home")} />
      )}

      {screen === "adminUsers" && user && role === "ADMIN" && (
        <AdminUsersScreen currentUser={user} />
      )}
    </View>
  );
}
