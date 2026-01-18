import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  ActivityIndicator,
  Platform,
} from "react-native";
import { signInWithEmailAndPassword, signOut } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "../lib/firebase";

type Props = {
  onSwitch: () => void;
};

export default function LoginScreen({ onSwitch }: Props) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function login() {
    setError(null);

    if (!email || !password) {
      setError("נא למלא אימייל וסיסמה");
      return;
    }

    try {
      setLoading(true);

      // 🔐 התחברות Firebase
      const cred = await signInWithEmailAndPassword(
        auth,
        email.trim(),
        password
      );

      // 🔍 בדיקה מול Firestore
      const snap = await getDoc(doc(db, "users", cred.user.uid));

      // ❌ משתמש נמחק (אין מסמך / או מסומן)
      if (!snap.exists() || snap.data()?.deleted === true) {
        await signOut(auth); // 🔥 קריטי
        setError(
          "החשבון נמחק.\nלא ניתן להירשם שוב עם אימייל זה בהתאם לחוקי ניהול האתר."
        );
        return;
      }

      const data = snap.data();

      // 🚫 משתמש חסום
      if (data.disabled === true) {
        await signOut(auth); // 🔥 קריטי
        setError(
          " החשבון שלך נחסם .\n   לפרטים נוספים יש לפנות למנהל האתר באימייל זה tehila.ch12@gmail.com "
        );
        return;
      }

      // ✅ הכול תקין – App.tsx ינתב לבד
    } catch (e: any) {
      if (e.code === "auth/user-not-found") {
        setError(
          "החשבון אינו קיים.\nלא ניתן להירשם שוב עם אימייל זה בהתאם לחוקי ניהול האתר."
        );
      } else if (e.code === "auth/wrong-password") {
        setError("סיסמה שגויה");
      } else if (e.code === "auth/invalid-email") {
        setError("אימייל לא תקין");
      } else {
        setError("שגיאה בהתחברות, נסה שוב/אימייל או סיסמה שגויים");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={styles.page}>
      <View style={styles.card}>
        <Text style={styles.title}>ברוך שובך 👋</Text>
        <Text style={styles.subtitle}>התחבר לחשבון שלך</Text>

        {error && <Text style={styles.error}>{error}</Text>}

        <TextInput
          style={styles.input}
          placeholder="אימייל"
          autoCapitalize="none"
          keyboardType="email-address"
          value={email}
          onChangeText={setEmail}
        />

        <TextInput
          style={styles.input}
          placeholder="סיסמה"
          secureTextEntry
          value={password}
          onChangeText={setPassword}
        />

        <Pressable
          style={[styles.button, loading && { opacity: 0.6 }]}
          onPress={login}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text style={styles.buttonText}>התחברות</Text>
          )}
        </Pressable>

        <Pressable onPress={onSwitch}>
          <Text style={styles.link}>אין לך חשבון? הרשמה</Text>
        </Pressable>
      </View>
    </View>
  );
}

/* ---------- Styles ---------- */
const styles = StyleSheet.create({
  page: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
    backgroundColor: "#f3f4f6", 
  },

  card: {
    width: "100%",
    maxWidth: Platform.OS === "web" ? 560 : 420, 
    backgroundColor: "#ffffff",
    borderRadius: 28,
    paddingVertical: Platform.OS === "web" ? 36 : 24,
    paddingHorizontal: Platform.OS === "web" ? 40 : 24,
    shadowColor: "#000",
    shadowOpacity: Platform.OS === "web" ? 0.08 : 0.2,
    shadowRadius: 18,
    elevation: 6,
  },

  title: {
    fontSize: Platform.OS === "web" ? 28 : 24,
    fontWeight: "800",
    textAlign: "center",
    marginBottom: 6,
  },

  subtitle: {
    fontSize: Platform.OS === "web" ? 16 : 14,
    textAlign: "center",
    color: "#6b7280",
    marginBottom: 26,
  },

  error: {
    backgroundColor: "#fee2e2",
    color: "#991b1b",
    padding: 14,
    borderRadius: 14,
    marginBottom: 16,
    textAlign: "center",
    fontSize: 14,
    lineHeight: 20,
  },

  input: {
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 16,
    marginBottom: 14,
    backgroundColor: "#ffffff",
    fontSize: 15,
  },

  button: {
    backgroundColor: "#2563eb",
    paddingVertical: 16,
    borderRadius: 18,
    marginTop: 10,
  },

  buttonText: {
    color: "white",
    textAlign: "center",
    fontWeight: "700",
    fontSize: 16,
  },

  link: {
    marginTop: 20,
    textAlign: "center",
    color: "#2563eb",
    fontWeight: "600",
    fontSize: 14,
  },
});
