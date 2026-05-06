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
import { Post } from "../types/Post";

type Props = {
  userId: string;
  currentUser: User | null;
  onBack: () => void;

  // ✅ FIX חדש - מעבר לפוסט דרך App
  onOpenPost: (postId: string) => void;
};

export default function ProfileScreen({
  userId,
  currentUser,
  onBack,
  onOpenPost, // 👈 חדש
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
      setPosts(snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) })));
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
                {age ? <Text style={styles.ageText}>גיל: {age}</Text> : null}
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

          {/* ✅ שינוי חשוב כאן */}
          <Pressable
            style={styles.openPostButton}
            onPress={() => onOpenPost(item.id)}
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
  },

  header: {
    marginBottom: 24,
  },

  back: {
    color: "#60a5fa",
    marginBottom: 12,
    fontWeight: "700",
    fontSize: 14,
  },
  ageText: {
  color: "#ffffff",
},

  profileTop: {
    alignItems: "center",
    padding: 22,
    borderRadius: 22,

    backgroundColor: "rgba(255,255,255,0.08)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",

    shadowColor: "#000",
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 6,
  },

  avatar: {
    width: 140,
    height: 140,
    borderRadius: 70,
    marginBottom: 12,

    borderWidth: 2,
    borderColor: "rgba(96,165,250,0.4)",
  },

  avatarEmpty: {
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: "rgba(255,255,255,0.12)",
    justifyContent: "center",
    alignItems: "center",
  },

  link: {
    color: "#60a5fa",
    marginBottom: 10,
    fontWeight: "600",
  },

  name: {
    fontSize: 26,
    fontWeight: "900",
    color: "#ffffff",
    marginTop: 8,
  },

  bio: {
    marginTop: 8,
    textAlign: "center",
    color: "#ffffff",
    lineHeight: 20,
  },

  date: {
    fontSize: 17,
    color: "#000000",
    marginTop: 6,
  },

  input: {
    width: "100%",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.15)",
    padding: 12,
    marginTop: 10,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.06)",
    color: "#fff",
  },

  textArea: {
    height: 90,
    textAlignVertical: "top",
  },

  primaryButton: {
    backgroundColor: "#2563eb",
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 14,
    marginTop: 16,

    shadowColor: "#2563eb",
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 4,
  },

  primaryText: {
    color: "white",
    fontWeight: "800",
    textAlign: "center",
  },

  sectionTitle: {
    fontSize: 20,
    fontWeight: "900",
    marginTop: 22,
    marginBottom: 10,
    color: "#ffffff",
  },

  post: {
    padding: 16,
    borderRadius: 18,
    marginBottom: 12,

    backgroundColor: "rgba(255,255,255,0.08)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",

    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 4,
  },

  postTitle: {
    fontSize: 16,
    fontWeight: "800",
    marginBottom: 10,
    color: "#ffffff",
  },

  openPostButton: {
    alignSelf: "flex-start",
    backgroundColor: "#3b82f6",
    paddingVertical: 9,
    paddingHorizontal: 14,
    borderRadius: 12,
  },

  openPostText: {
    color: "white",
    fontWeight: "700",
  },

  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
});