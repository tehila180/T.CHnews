import {
  ActivityIndicator,
  View,
  ImageBackground,
  StyleSheet,
  useWindowDimensions,
} from "react-native";
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
import PostDetailsScreen from "./src/screens/PostDetailsScreen";

type Screen =
  | "home"
  | "login"
  | "register"
  | "create"
  | "adminUsers"
  | "profile"
  | "news"
  | "post";

export default function App() {
  const { user, role, username, loading } = useAuth();
  const { width, height } = useWindowDimensions();

  const [screen, setScreen] = useState<Screen>("home");
  const [profileUserId, setProfileUserId] = useState<string | null>(null);
  const [selectedPostId, setSelectedPostId] = useState<string | null>(null);

  const [homeResetKey, setHomeResetKey] = useState(0);

  useEffect(() => {
    if (user) {
      setScreen("home");
      setHomeResetKey((k) => k + 1);
    }
  }, [user]);

  function handleNavigate(
    next: Screen,
    userId?: string,
    postId?: string
  ) {
    if (next === "home") {
      setHomeResetKey((k) => k + 1);
    }

    if (next === "profile" && userId) {
      setProfileUserId(userId);
    }

    if (next === "post" && postId) {
      setSelectedPostId(postId);
    }

    setScreen(next);
  }

  if (loading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <ImageBackground
      source={require("./assets/TCH.jpg")}
      style={[styles.background, { width, height }]}
      resizeMode="cover"
    >
      <View style={styles.overlay}>
        <Header
          user={user}
          role={role}
          username={username}
          onNavigate={handleNavigate}
        />

        {screen === "home" && (
          <HomeScreen
            key={homeResetKey}
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
            onBack={() => setScreen("home")}
            onOpenPost={(postId) => {
              setSelectedPostId(postId);
              setScreen("post");
            }}
          />
        )}

        {screen === "post" && selectedPostId && (
          <PostDetailsScreen
            postId={selectedPostId}
            user={user}
            role={role}
            onBack={() => setScreen("profile")}
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
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  background: {
    flex: 1,
  },
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.35)",
  },
  loading: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
});