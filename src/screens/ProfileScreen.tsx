import { useEffect, useState } from "react";
import {
  View,
  Text,
  Image,
  TextInput,
  Pressable,
  StyleSheet,
  ActivityIndicator,
  FlatList,
} from "react-native";
import {
  doc,
  getDoc,
  updateDoc,
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
  Timestamp,
} from "firebase/firestore";
import { db } from "../lib/firebase";
import { User } from "firebase/auth";
import * as ImagePicker from "expo-image-picker";
import { uploadImage } from "../lib/upload";
import PostDetailsScreen from "./PostDetailsScreen";
import { Post } from "../types/Post";

type Props = {
  userId: string;
  currentUser: User | null;
  onBack: () => void;
};

export default function ProfileScreen({
  userId,
  currentUser,
  onBack,
}: Props) {
  const isMe = currentUser?.uid === userId;

  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);

  const [username, setUsername] = useState("");
  const [age, setAge] = useState("");
  const [bio, setBio] = useState("");
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [createdAt, setCreatedAt] = useState<Timestamp | null>(null);

  const [posts, setPosts] = useState<Post[]>([]);
  const [openPostId, setOpenPostId] = useState<string | null>(null);

  useEffect(() => {
    async function loadProfile() {
      const snap = await getDoc(doc(db, "users", userId));
      if (snap.exists()) {
        const d = snap.data();
        setUsername(d.username ?? "");
        setAge(d.age?.toString() ?? "");
        setBio(d.bio ?? "");
        setPhotoUrl(d.photoUrl ?? null);
        setCreatedAt(d.createdAt ?? null);
      }
      setLoading(false);
    }
    loadProfile();
  }, [userId]);

  useEffect(() => {
    const q = query(
      collection(db, "posts"),
      where("authorId", "==", userId),
      orderBy("createdAt", "desc")
    );

    return onSnapshot(q, (snap) => {
      setPosts(
        snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) }))
      );
    });
  }, [userId]);

  async function pickImage() {
    if (!isMe || !currentUser) return;
    const res = await ImagePicker.launchImageLibraryAsync({ quality: 0.7 });
    if (!res.canceled) {
      const url = await uploadImage(res.assets[0].uri, currentUser.uid);
      setPhotoUrl(url);
    }
  }

  async function save() {
    if (!isMe || !currentUser) return;
    await updateDoc(doc(db, "users", userId), {
      username,
      age: age ? Number(age) : null,
      bio,
      photoUrl,
    });
    setEditing(false);
  }

  function formatDate(ts?: Timestamp | null) {
    if (!ts) return "";
    return ts.toDate().toLocaleDateString("he-IL");
  }

  if (openPostId) {
    return (
      <PostDetailsScreen
        postId={openPostId}
        user={currentUser}
        role="USER"
        onBack={() => setOpenPostId(null)}
      />
    );
  }

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <FlatList
      data={posts}
      keyExtractor={(p) => p.id}
      contentContainerStyle={styles.page}
      ListHeaderComponent={
        <View style={styles.header}>
          <Pressable onPress={onBack}>
            <Text style={styles.back}>← חזרה</Text>
          </Pressable>

          <View style={styles.profileTop}>
            {photoUrl ? (
              <Image source={{ uri: photoUrl }} style={styles.avatar} />
            ) : (
              <View style={[styles.avatar, styles.avatarEmpty]}>
                <Text>אין תמונה👤</Text>
              </View>
            )}

            {editing && isMe && (
              <Pressable onPress={pickImage}>
                <Text style={styles.link}>החלף תמונה</Text>
              </Pressable>
            )}

            {editing && isMe ? (
              <>
                <TextInput
                  style={styles.input}
                  value={username}
                  onChangeText={setUsername}
                  placeholder="שם משתמש"
                />
                <TextInput
                  style={styles.input}
                  value={age}
                  onChangeText={setAge}
                  placeholder="גיל"
                  keyboardType="numeric"
                />
                <TextInput
                  style={[styles.input, styles.textArea]}
                  value={bio}
                  onChangeText={setBio}
                  placeholder="ביוגרפיה"
                  multiline
                />
                <Pressable style={styles.primaryButton} onPress={save}>
                  <Text style={styles.primaryText}>שמור</Text>
                </Pressable>
              </>
            ) : (
              <>
                <Text style={styles.name}>{username}</Text>
                {age ? <Text>גיל: {age}</Text> : null}
                {bio ? <Text style={styles.bio}>{bio}</Text> : null}
                <Text style={styles.date}>
                  הצטרף בתאריך: {formatDate(createdAt)}
                </Text>

                {isMe && (
                  <Pressable
                    style={styles.primaryButton}
                    onPress={() => setEditing(true)}
                  >
                    <Text style={styles.primaryText}>ערוך פרופיל</Text>
                  </Pressable>
                )}
              </>
            )}
          </View>

          <Text style={styles.sectionTitle}>פוסטים</Text>
        </View>
      }
      renderItem={({ item }) => (
        <View style={styles.post}>
          <Text style={styles.postTitle}>{item.title}</Text>
          <Pressable
            style={styles.openPostButton}
            onPress={() => setOpenPostId(item.id)}
          >
            <Text style={styles.openPostText}>כניסה לפוסט</Text>
          </Pressable>
        </View>
      )}
    />
  );
}

/* ---------- Styles ---------- */
const styles = StyleSheet.create({
  page: {
    padding: 16,
    backgroundColor: "#ffffff",
  },

  header: {
    marginBottom: 24,
  },

  back: {
    color: "#2563eb",
    marginBottom: 12,
    fontWeight: "600",
  },

  profileTop: {
    alignItems: "center",
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderColor: "#e5e7eb",
  },

  avatar: {
    width: 140,
    height: 140,
    borderRadius: 70,
    marginBottom: 10,
  },

  avatarEmpty: {
    backgroundColor: "#e5e7eb",
    justifyContent: "center",
    alignItems: "center",
  },

  link: {
    color: "#2563eb",
    marginBottom: 10,
  },

  name: {
    fontSize: 24,
    fontWeight: "700",
  },

  bio: {
    marginTop: 6,
    textAlign: "center",
  },

  date: {
    fontSize: 12,
    color: "#6b7280",
    marginTop: 6,
  },

  input: {
    width: "100%",
    borderWidth: 1,
    borderColor: "#d1d5db",
    padding: 12,
    marginTop: 10,
    borderRadius: 8,
  },

  textArea: {
    height: 90,
    textAlignVertical: "top",
  },

  primaryButton: {
    backgroundColor: "#2563eb",
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 10,
    marginTop: 16,
  },

  primaryText: {
    color: "white",
    fontWeight: "600",
  },

  sectionTitle: {
    fontSize: 20,
    fontWeight: "700",
    marginTop: 20,
  },

  post: {
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderColor: "#e5e7eb",
  },

  postTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 6,
  },

  openPostButton: {
    alignSelf: "flex-start",
    backgroundColor: "#2563eb",
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 8,
  },

  openPostText: {
    color: "white",
    fontWeight: "600",
  },

  center: {
    flex: 1,
    justifyContent: "center",
  },
});
