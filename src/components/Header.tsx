import {
  View,
  Text,
  Pressable,
  StyleSheet,
  useWindowDimensions,
  SafeAreaView,
} from "react-native";
import { signOut, User } from "firebase/auth";
import { auth } from "../lib/firebase";
import { useState } from "react";

/* ---------- Types ---------- */
type Role = "ADMIN" | "USER";

type Screen =
  | "home"
  | "login"
  | "register"
  | "create"
  | "adminUsers"
  | "profile"
  | "news";

type Props = {
  user: User | null;
  role: Role;
  username?: string | null;
  onNavigate: (screen: Screen, userId?: string) => void;
};

export default function Header({
  user,
  role,
  username,
  onNavigate,
}: Props) {
  const { width } = useWindowDimensions();
  const isMobile = width < 768;

  const [menuOpen, setMenuOpen] = useState(false);

  async function logout() {
    await signOut(auth);
    setMenuOpen(false);
    onNavigate("home");
  }

  function nav(screen: Screen, userId?: string) {
    setMenuOpen(false);
    onNavigate(screen, userId);
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        {/* ---------- LEFT: CLICKABLE LOGO ---------- */}
        <Pressable
          onPress={() => nav("home")}
          hitSlop={10}
        >
          <Text style={styles.logo}>T.CH.news</Text>
        </Pressable>

        {/* ---------- RIGHT ---------- */}
        <View style={styles.right}>
          {user && (
            <Text style={styles.greeting}>
              שלום {username ?? "משתמש"} 👋
            </Text>
          )}

          {isMobile && (
            <Pressable onPress={() => setMenuOpen(!menuOpen)}>
              <Text style={styles.burger}>
                {menuOpen ? "✕" : "☰"}
              </Text>
            </Pressable>
          )}
        </View>
      </View>

      {/* ---------- MENU ---------- */}
      {(menuOpen || !isMobile) && (
        <View style={[styles.menu, !isMobile && styles.menuDesktop]}>
          <Pressable onPress={() => nav("home")}>
            <Text style={styles.link}>ראשי</Text>
          </Pressable>

          <Pressable onPress={() => nav("news")}>
            <Text style={styles.link}>חדשות</Text>
          </Pressable>

          {!user ? (
            <>
              <Pressable onPress={() => nav("login")}>
                <Text style={styles.link}>התחברות</Text>
              </Pressable>

              <Pressable onPress={() => nav("register")}>
                <Text style={[styles.link, styles.primary]}>
                  הרשמה
                </Text>
              </Pressable>
            </>
          ) : (
            <>
              <Pressable onPress={() => nav("profile", user.uid)}>
                <Text style={styles.link}>פרופיל</Text>
              </Pressable>

              <Pressable onPress={() => nav("create")}>
                <Text style={[styles.link, styles.primary]}>
                  פוסט חדש
                </Text>
              </Pressable>

              {role === "ADMIN" && (
                <Pressable onPress={() => nav("adminUsers")}>
                  <Text style={styles.link}>משתמשים</Text>
                </Pressable>
              )}

              <Pressable onPress={logout}>
                <Text style={[styles.link, styles.logout]}>
                  התנתקות
                </Text>
              </Pressable>
            </>
          )}
        </View>
      )}
    </SafeAreaView>
  );
}

/* ---------- Styles ---------- */
const styles = StyleSheet.create({
  safe: {
    backgroundColor: "#ffffff",
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
  },

  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",

    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingTop: 18, // רווח מה־status bar
  },

  logo: {
    fontSize: 20,
    fontWeight: "800",
    color: "#000000",
  },

  right: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },

  greeting: {
    fontSize: 14,
    fontWeight: "600",
    color: "#111827",
  },

  burger: {
    fontSize: 26,
    fontWeight: "700",
  },

  menu: {
    paddingHorizontal: 16,
    paddingBottom: 12,
    gap: 12,
  },

  menuDesktop: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 16,
  },

  link: {
    fontSize: 15,
    fontWeight: "600",
    color: "#2563eb",
  },

  primary: {
    backgroundColor: "#2563eb",
    color: "#ffffff",
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 12,
  },

  logout: {
    color: "#dc2626",
  },
});
