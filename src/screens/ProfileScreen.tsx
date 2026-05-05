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
  onOpenPost: (postId: string) => void;
};

export default function ProfileScreen({
  userId,
  currentUser,
  onBack,
  onOpenPost,
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
              <View style={styles.avatarEmpty}>
                <Text>אין תמונה👤</Text>
              </View>
            )}

            <Text style={styles.name}>{username}</Text>

            {age ? <Text style={{ color: "#fff" }}>גיל: {age}</Text> : null}
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
          </View>

          <Text style={styles.sectionTitle}>פוסטים</Text>
        </View>
      }
      renderItem={({ item }) => (
        <View style={styles.post}>
          <Text style={styles.postTitle}>{item.title}</Text>

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
    backgroundColor: "transparent",
  },

  header: {
    marginBottom: 24,
  },

  back: {
    color: "#60a5fa",
    marginBottom: 12,
    fontWeight: "600",
    fontSize: 14,
  },

  profileTop: {
    alignItems: "center",
    padding: 20,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.15)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
  },

  avatar: {
    width: 140,
    height: 140,
    borderRadius: 70,
    marginBottom: 10,
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.3)",
  },

  avatarEmpty: {
    backgroundColor: "rgba(255,255,255,0.2)",
    justifyContent: "center",
    alignItems: "center",
  },

  link: {
    color: "#60a5fa",
    marginBottom: 10,
    fontWeight: "500",
  },

  name: {
    fontSize: 26,
    fontWeight: "800",
    color: "#fff",
    marginTop: 6,
  },

  bio: {
    marginTop: 6,
    textAlign: "center",
    color: "#fcfcfc",
  },

 date: {
  fontSize: 15,
  color: "#000000", 
  marginTop: 6,
},

  input: {
    width: "100%",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.3)",
    padding: 12,
    marginTop: 10,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.1)",
    color: "#fff",
  },

  textArea: {
    height: 90,
    textAlignVertical: "top",
  },

  primaryButton: {
    backgroundColor: "#3b82f6",
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 14,
    marginTop: 16,

    // shadow (מראה כפתור מודרני)
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 4,
  },

  primaryText: {
    color: "white",
    fontWeight: "700",
    textAlign: "center",
  },

  sectionTitle: {
    fontSize: 20,
    fontWeight: "800",
    marginTop: 20,
    marginBottom: 10,
    color: "#fff",
  },

  post: {
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,

    backgroundColor: "rgba(255,255,255,0.12)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.15)",

    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 3,
  },

  postTitle: {
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 8,
    color: "#fff",
  },

  openPostButton: {
    alignSelf: "flex-start",
    backgroundColor: "#2563eb",
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 10,
  },

  openPostText: {
    color: "white",
    fontWeight: "600",
  },

  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
});