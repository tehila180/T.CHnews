import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  Alert,
  Image,
  ScrollView,
  Platform,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import * as DocumentPicker from "expo-document-picker";
import { uploadImage, uploadFile } from "../lib/upload";
import { updatePost } from "../lib/posts";
import { User } from "firebase/auth";
import { Post } from "../types/Post";

type Props = {
  post: Post;
  user: User;
  onDone: () => void;
};

export default function EditPostScreen({ post, user, onDone }: Props) {
  const [title, setTitle] = useState(post.title);
  const [content, setContent] = useState(post.content ?? "");
  const [image, setImage] = useState<string | null>(null);
  const [file, setFile] = useState<{ uri: string; name: string } | null>(null);
  const [saving, setSaving] = useState(false);

  async function pickImage() {
    const res = await ImagePicker.launchImageLibraryAsync({ quality: 0.7 });
    if (!res.canceled) setImage(res.assets[0].uri);
  }

  async function pickFile() {
    const res = await DocumentPicker.getDocumentAsync({});
    if (!res.canceled)
      setFile({ uri: res.assets[0].uri, name: res.assets[0].name });
  }

  async function submit() {
    if (!title.trim()) {
      Alert.alert("שגיאה", "חובה לכתוב כותרת לפוסט");
      return;
    }

    if (saving) return;

    try {
      setSaving(true);

      const data: any = {
        title: title.trim(),
        content: content.trim(),
      };

      if (image) {
        data.imageUrl = await uploadImage(image, user.uid);
      }

      if (file) {
        data.fileUrl = await uploadFile(file.uri, file.name, user.uid);
        data.fileName = file.name;
      }

      await updatePost(post.id, data);
      onDone();
    } catch (err: any) {
      Alert.alert("Update failed", err?.message || "Unknown error");
    } finally {
      setSaving(false);
    }
  }

  return (
    <ScrollView
      contentContainerStyle={styles.page}
      keyboardShouldPersistTaps="handled"
    >
      <View style={styles.card}>
        <Text style={styles.title}>✏️ עריכת פוסט</Text>

        {/* Title */}
        <Text style={styles.label}>כותרת</Text>
        <TextInput
          style={styles.input}
          value={title}
          onChangeText={setTitle}
          placeholder="כותרת הפוסט"
        />

        {/* Content */}
        <Text style={styles.label}>תוכן</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          multiline
          value={content}
          onChangeText={setContent}
          placeholder="כתוב כאן את תוכן הפוסט…"
        />

        {/* Image preview */}
        {(image || post.imageUrl) && (
          <Image
            source={{ uri: image ?? post.imageUrl }}
            style={styles.imagePreview}
          />
        )}

        <Pressable style={styles.secondaryButton} onPress={pickImage}>
          <Text style={styles.secondaryText}>🖼️ החלף תמונה</Text>
        </Pressable>

        {/* File */}
        {file && (
          <Text style={styles.fileText}>📎 קובץ נבחר: {file.name}</Text>
        )}

        <Pressable style={styles.secondaryButton} onPress={pickFile}>
          <Text style={styles.secondaryText}>📎 החלף קובץ</Text>
        </Pressable>

        {/* Save */}
        <Pressable
          style={[styles.primaryButton, saving && { opacity: 0.6 }]}
          onPress={submit}
          disabled={saving}
        >
          <Text style={styles.primaryText}>
            {saving ? "שומר…" : "שמירת שינויים"}
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

  input: {
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 12,
    padding: 12,
    marginBottom: 14,
    backgroundColor: "#ffffff",
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
    backgroundColor: "#2563eb",
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
