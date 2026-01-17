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
import {
  createUserWithEmailAndPassword,
  updateProfile,
  sendEmailVerification,
} from "firebase/auth";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { auth, db } from "../lib/firebase";

type Props = {
  onSwitch: () => void;
};

export default function RegisterScreen({ onSwitch }: Props) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [emailError, setEmailError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  function isValidEmail(value: string) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
  }

  async function register() {
    setEmailError(null);
    setPasswordError(null);

    if (!name || !email || !password) return;

    if (!isValidEmail(email)) {
      setEmailError("אימייל שגוי");
      return;
    }

    if (password.length < 6) {
      setPasswordError("הסיסמה חייבת להכיל לפחות 6 תווים");
      return;
    }

    try {
      setLoading(true);

      const cred = await createUserWithEmailAndPassword(
        auth,
        email.trim(),
        password
      );

      await updateProfile(cred.user, {
        displayName: name.trim(),
      });

      await sendEmailVerification(cred.user);

      await setDoc(doc(db, "users", cred.user.uid), {
        username: name.trim(),
        email: email.trim(),
        role: "USER",
        createdAt: serverTimestamp(),
        disabled: false,
        needsProfileSetup: true,
      });
    } catch (e: any) {
      if (e.code === "auth/email-already-in-use") {
        setEmailError("האימייל כבר רשום במערכת");
      } else if (e.code === "auth/invalid-email") {
        setEmailError("אימייל שגוי");
      } else if (e.code === "auth/weak-password") {
        setPasswordError("הסיסמה חלשה מדי");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={styles.page}>
      <View style={styles.card}>
        <Text style={styles.title}>ברוך הבא</Text>
        <Text style={styles.subtitle}>יצירת חשבון חדש</Text>

        <TextInput
          style={styles.input}
          placeholder="שם מלא"
          value={name}
          onChangeText={setName}
        />

        {emailError && <Text style={styles.error}>{emailError}</Text>}
        <TextInput
          style={[styles.input, emailError && styles.inputError]}
          placeholder="אימייל"
          autoCapitalize="none"
          keyboardType="email-address"
          value={email}
          onChangeText={(v) => {
            setEmail(v);
            setEmailError(null);
          }}
        />

        {passwordError && (
          <Text style={styles.error}>{passwordError}</Text>
        )}
        <TextInput
          style={[styles.input, passwordError && styles.inputError]}
          placeholder="סיסמה"
          secureTextEntry
          value={password}
          onChangeText={(v) => {
            setPassword(v);
            setPasswordError(null);
          }}
        />

        <Pressable
          style={[styles.button, loading && { opacity: 0.6 }]}
          onPress={register}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text style={styles.buttonText}>הרשמה</Text>
          )}
        </Pressable>

        <Pressable onPress={onSwitch}>
          <Text style={styles.link}>כבר יש חשבון? התחברות</Text>
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
    padding: 12,
    borderRadius: 14,
    marginBottom: 10,
    textAlign: "center",
    fontSize: 13,
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

  inputError: {
    borderColor: "#dc2626",
  },

  button: {
    backgroundColor: "#2563eb",
    paddingVertical: 16,
    borderRadius: 18,
    marginTop: 8,
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
