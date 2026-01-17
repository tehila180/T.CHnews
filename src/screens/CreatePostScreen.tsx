import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  Image,
  ScrollView,
  Platform,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import * as DocumentPicker from "expo-document-picker";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "../lib/firebase";
import { createPost } from "../lib/posts";
import { uploadImage, uploadFile } from "../lib/upload";

export default function CreatePostScreen({ onDone }: { onDone: () => void }) {
  const user = auth.currentUser!;

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [image, setImage] = useState<string | null>(null);
  const [file, setFile] = useState<{ uri: string; name: string } | null>(null);

  const [titleError, setTitleError] = useState(false);
  const [loading, setLoading] = useState(false);

  async function pickImage() {
    const res = await ImagePicker.launchImageLibraryAsync({ quality: 0.7 });
    if (!res.canceled) setImage(res.assets[0].uri);
  }

  async function pickFile() {
    const res = await DocumentPicker.getDocumentAsync({});
    if (!res.canceled) {
      setFile({ uri: res.assets[0].uri, name: res.assets[0].name });
    }
  }

  async function submit() {
    if (!title.trim()) {
      setTitleError(true);
      return;
    }

    setTitleError(false);
    setLoading(true);

    try {
      let imageUrl = "";
      let fileUrl = "";
      let fileName = "";

      if (image) {
        imageUrl = await uploadImage(image, user.uid);
      }

      if (file) {
        fileUrl = await uploadFile(file.uri, file.name, user.uid);
        fileName = file.name;
      }

      const userSnap = await getDoc(doc(db, "users", user.uid));
      const authorName =
        userSnap.exists() && userSnap.data().username
          ? userSnap.data().username
          : "User";

      await createPost({
        title: title.trim(),
        content,
        authorId: user.uid,
        authorName,
        imageUrl,
        fileUrl,
        fileName,
      });

      onDone();
    } catch (err) {
      console.error("Create post failed", err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <ScrollView
      contentContainerStyle={styles.page}
      keyboardShouldPersistTaps="handled"
    >
      <View style={styles.card}>
        <Text style={styles.title}>📝 יצירת פוסט חדש</Text>

        {/* כותרת */}
        <Text style={styles.label}>כותרת *</Text>
        {titleError && (
          <Text style={styles.errorText}>חובה לכתוב כותרת לפוסט</Text>
        )}

        <TextInput
          style={[
            styles.input,
            titleError ? styles.inputError : null,
          ]}
          placeholder="כותרת לפוסט"
          value={title}
          onChangeText={(text) => {
            setTitle(text);
            if (text.trim()) setTitleError(false);
          }}
        />

        {/* תוכן */}
        <Text style={styles.label}>תוכן</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          placeholder="כתוב כאן את תוכן הפוסט (לא חובה)…"
          multiline
          value={content}
          onChangeText={setContent}
        />

        {/* תמונה */}
        {image && (
          <Image source={{ uri: image }} style={styles.imagePreview} />
        )}

        <Pressable style={styles.secondaryButton} onPress={pickImage}>
          <Text style={styles.secondaryText}>🖼️ הוסף / החלף תמונה</Text>
        </Pressable>

        {/* קובץ */}
        {file && (
          <Text style={styles.fileText}>📎 קובץ מצורף: {file.name}</Text>
        )}

        <Pressable style={styles.secondaryButton} onPress={pickFile}>
          <Text style={styles.secondaryText}>📎 צרף קובץ</Text>
        </Pressable>

        {/* שליחה */}
        <Pressable
          style={[styles.primaryButton, loading && { opacity: 0.6 }]}
          onPress={submit}
          disabled={loading}
        >
          <Text style={styles.primaryText}>
            {loading ? "שולח…" : "צור פוסט"}
          </Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}

/* ---------- Styles ---------- */
const styles = StyleSheet.create({
  page: {
    padding: 20,
    alignItems: "center",
    backgroundColor: "#f9fafb",
  },

  card: {
    width: "100%",
    maxWidth: 640,
    backgroundColor: "#ffffff",
    borderRadius: 22,
    padding: 20,
    shadowColor: "#000",
    shadowOpacity: Platform.OS === "web" ? 0.05 : 0.2,
    shadowRadius: 10,
    elevation: 4,
  },

  title: {
    fontSize: 22,
    fontWeight: "700",
    marginBottom: 16,
    textAlign: "center",
  },

  label: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 6,
    color: "#374151",
  },

  errorText: {
    color: "#dc2626",
    marginBottom: 6,
    fontSize: 13,
  },

  input: {
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 12,
    padding: 12,
    marginBottom: 14,
    backgroundColor: "#ffffff",
  },

  inputError: {
    borderColor: "#dc2626",
  },

  textArea: {
    height: 120,
    textAlignVertical: "top",
  },

  imagePreview: {
    width: "100%",
    height: 220,
    borderRadius: 16,
    marginBottom: 14,
    backgroundColor: "#e5e7eb",
  },

  secondaryButton: {
    borderWidth: 1,
    borderColor: "#e5e7eb",
    paddingVertical: 10,
    borderRadius: 12,
    alignItems: "center",
    marginBottom: 12,
  },

  secondaryText: {
    fontWeight: "600",
    color: "#2563eb",
  },

  fileText: {
    fontSize: 13,
    marginBottom: 10,
    color: "#374151",
  },

  primaryButton: {
    backgroundColor: "#16a34a",
    paddingVertical: 14,
    borderRadius: 14,
    marginTop: 8,
  },

  primaryText: {
    color: "#ffffff",
    fontWeight: "700",
    textAlign: "center",
    fontSize: 15,
  },
});
