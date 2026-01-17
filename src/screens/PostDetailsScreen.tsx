import { useEffect, useState } from "react";
import {
  View,
  Text,
  Pressable,
  TextInput,
  FlatList,
  Image,
  Linking,
  StyleSheet,
  ScrollView,
  Platform,
} from "react-native";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  Timestamp,
  where,
} from "firebase/firestore";
import { db } from "../lib/firebase";
import { User } from "firebase/auth";
import { Post } from "../types/Post";

/* ---------- Types ---------- */
type Role = "ADMIN" | "USER";

type Comment = {
  id: string;
  postId: string;
  text: string;
  authorId: string;
  authorName: string;
  createdAt?: Timestamp;
};

type Props = {
  postId: string;
  user: User | null;
  role: Role;
  onBack: () => void;
  onOpenProfile?: (userId: string) => void;
};

export default function PostDetailsScreen({
  postId,
  user,
  role,
  onBack,
  onOpenProfile,
}: Props) {
  const [post, setPost] = useState<Post | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [text, setText] = useState("");

  useEffect(() => {
    async function loadPost() {
      const snap = await getDoc(doc(db, "posts", postId));
      if (snap.exists()) {
        setPost({ id: snap.id, ...(snap.data() as any) });
      }
    }
    loadPost();
  }, [postId]);

  useEffect(() => {
    const q = query(
      collection(db, "comments"),
      where("postId", "==", postId),
      orderBy("createdAt", "asc")
    );

    return onSnapshot(q, (snap) => {
      setComments(
        snap.docs.map((d) => ({
          id: d.id,
          ...(d.data() as any),
        }))
      );
    });
  }, [postId]);

  function formatDate(ts?: Timestamp) {
    if (!ts) return "";
    return ts.toDate().toLocaleString("he-IL", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  function canDelete(c: Comment) {
    return !!user && (c.authorId === user.uid || role === "ADMIN");
  }

  async function addComment() {
    if (!user || !text.trim()) return;

    const userSnap = await getDoc(doc(db, "users", user.uid));
    const authorName =
      userSnap.exists() && userSnap.data().username
        ? userSnap.data().username
        : user.displayName ?? "User";

    await addDoc(collection(db, "comments"), {
      postId,
      text: text.trim(),
      authorId: user.uid,
      authorName,
      createdAt: serverTimestamp(),
    });

    setText("");
  }

  async function deleteComment(id: string) {
    await deleteDoc(doc(db, "comments", id));
  }

  if (!post) {
    return (
      <View style={styles.center}>
        <Text>טוען פוסט…</Text>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.page}>
      <View style={styles.card}>
        <Pressable onPress={onBack}>
          <Text style={styles.back}>← חזרה</Text>
        </Pressable>

        <Text style={styles.title}>{post.title}</Text>

        {/* Author */}
        {onOpenProfile ? (
          <Pressable onPress={() => onOpenProfile(post.authorId)}>
            <Text style={styles.author}>{post.authorName}</Text>
          </Pressable>
        ) : (
          <Text style={styles.author}>{post.authorName}</Text>
        )}

        {/* Content */}
        {!!post.content && (
          <Text style={styles.content}>{post.content}</Text>
        )}

        {/* Image */}
        {!!post.imageUrl && (
          <Image
            source={{ uri: post.imageUrl }}
            style={styles.image}
          />
        )}

        {/* File */}
        {!!post.fileUrl && (
          <Pressable onPress={() => Linking.openURL(post.fileUrl!)}>
            <Text style={styles.file}>📎 {post.fileName}</Text>
          </Pressable>
        )}
      </View>

      {/* Comments */}
      <View style={styles.commentsSection}>
        <Text style={styles.commentsTitle}>
          💬 תגובות ({comments.length})
        </Text>

        <FlatList
          data={comments}
          keyExtractor={(c) => c.id}
          scrollEnabled={false}
          renderItem={({ item }) => (
            <View style={styles.commentCard}>
              <Pressable
                onPress={() =>
                  onOpenProfile && onOpenProfile(item.authorId)
                }
              >
                <Text style={styles.commentAuthor}>
                  {item.authorName}
                </Text>
              </Pressable>

              <Text style={styles.commentDate}>
                {formatDate(item.createdAt)}
              </Text>

              <Text style={styles.commentText}>
                {item.text}
              </Text>

              {canDelete(item) && (
                <Pressable onPress={() => deleteComment(item.id)}>
                  <Text style={styles.delete}>מחיקה</Text>
                </Pressable>
              )}
            </View>
          )}
        />
      </View>

      {/* Add comment */}
      {user && (
        <View style={styles.addComment}>
          <TextInput
            style={styles.input}
            placeholder="כתוב תגובה…"
            value={text}
            onChangeText={setText}
            multiline
          />
          <Pressable style={styles.button} onPress={addComment}>
            <Text style={styles.buttonText}>שלח תגובה</Text>
          </Pressable>
        </View>
      )}
    </ScrollView>
  );
}

/* ---------- Styles ---------- */
const styles = StyleSheet.create({
  page: {
    padding: 16,
    backgroundColor: "#f9fafb",
    alignItems: "center",
  },

  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },

  card: {
    width: "100%",
    maxWidth: 800,
    backgroundColor: "#ffffff",
    borderRadius: 22,
    padding: 20,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOpacity: Platform.OS === "web" ? 0.05 : 0.2,
    shadowRadius: 12,
    elevation: 4,
  },

  back: {
    color: "#2563eb",
    marginBottom: 10,
    fontWeight: "600",
  },

  title: {
    fontSize: 26,
    fontWeight: "800",
    marginBottom: 8,
  },

  author: {
    color: "#2563eb",
    fontWeight: "700",
    marginBottom: 16,
  },

  content: {
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 16,
    color: "#111827",
  },

  image: {
    width: "100%",
    height: 320,
    borderRadius: 18,
    marginBottom: 14,
    backgroundColor: "#e5e7eb",
  },

  file: {
    color: "#2563eb",
    fontWeight: "600",
    marginTop: 6,
  },

  commentsSection: {
    width: "100%",
    maxWidth: 800,
  },

  commentsTitle: {
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 12,
  },

  commentCard: {
    backgroundColor: "#ffffff",
    borderRadius: 16,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },

  commentAuthor: {
    fontWeight: "700",
    color: "#2563eb",
  },

  commentDate: {
    fontSize: 12,
    color: "#6b7280",
    marginBottom: 6,
  },

  commentText: {
    fontSize: 14,
    lineHeight: 20,
  },

  delete: {
    color: "#dc2626",
    marginTop: 6,
    fontWeight: "600",
  },

  addComment: {
    width: "100%",
    maxWidth: 800,
    marginTop: 16,
  },

  input: {
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 14,
    padding: 12,
    minHeight: 80,
    marginBottom: 10,
    backgroundColor: "#ffffff",
  },

  button: {
    backgroundColor: "#2563eb",
    paddingVertical: 14,
    borderRadius: 14,
  },

  buttonText: {
    color: "white",
    fontWeight: "700",
    textAlign: "center",
    fontSize: 15,
  },
});
