import { useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  Pressable,
  FlatList,
  Image,
  Linking,
  StyleSheet,
  ScrollView,
  Platform,
} from "react-native";
import {
  collection,
  onSnapshot,
  orderBy,
  query,
  Timestamp,
} from "firebase/firestore";
import { db } from "../lib/firebase";
import { deletePost } from "../lib/posts";
import { User } from "firebase/auth";

import EditPostScreen from "./EditPostScreen";
import PostDetailsScreen from "./PostDetailsScreen";
import { Post } from "../types/Post";
import { fetchNews, NewsArticle } from "../lib/newsApi";

/* ---------- Types ---------- */
type Role = "ADMIN" | "USER";

type Comment = {
  id: string;
  postId: string;
  text: string;
  createdAt?: Timestamp;
};

type Props = {
  user: User | null;
  role: Role;
  onOpenProfile: (userId: string) => void;
  onOpenNews: () => void;
};

export default function HomeScreen({
  user,
  role,
  onOpenProfile,
  onOpenNews,
}: Props) {
  const [posts, setPosts] = useState<Post[]>([]);
  const [comments, setComments] = useState<Comment[]>([]);
  const [news, setNews] = useState<NewsArticle[]>([]);

  const [editingPost, setEditingPost] = useState<Post | null>(null);
  const [openPostId, setOpenPostId] = useState<string | null>(null);

  /* ---------- Data ---------- */
  useEffect(() => {
    const q = query(collection(db, "posts"), orderBy("createdAt", "desc"));
    return onSnapshot(q, (snap) =>
      setPosts(snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) })))
    );
  }, []);

  useEffect(() => {
    const q = query(collection(db, "comments"), orderBy("createdAt", "desc"));
    return onSnapshot(q, (snap) =>
      setComments(snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) })))
    );
  }, []);

  useEffect(() => {
    fetchNews().then((d) => setNews(d.slice(0, 3))).catch(console.error);
  }, []);

  /* ---------- Helpers ---------- */
  const formatDateTime = (ts?: Timestamp) =>
    ts
      ? ts.toDate().toLocaleString("he-IL", {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        })
      : "";

  const formatTime = (ts?: Timestamp) =>
    ts
      ? ts.toDate().toLocaleTimeString("he-IL", {
          hour: "2-digit",
          minute: "2-digit",
        })
      : "";

  const canEdit = (p: Post) => !!user && p.authorId === user.uid;
  const canDelete = (p: Post) =>
    !!user && (p.authorId === user.uid || role === "ADMIN");

  /* ---------- Hot discussions ---------- */
  const hotDiscussions = useMemo(() => {
    const limit = Date.now() - 24 * 60 * 60 * 1000;

    return comments
      .filter((c) => c.createdAt && c.createdAt.toMillis() >= limit)
      .map((c) => {
        const post = posts.find((p) => p.id === c.postId);
        return post
          ? {
              id: c.id,
              postId: post.id,
              title: post.title,
              text: c.text,
              time: c.createdAt,
            }
          : null;
      })
      .filter(Boolean)
      .slice(0, 8);
  }, [comments, posts]);

  /* ---------- Screens ---------- */
  if (editingPost && user) {
    return (
      <EditPostScreen
        post={editingPost}
        user={user}
        onDone={() => setEditingPost(null)}
      />
    );
  }

  if (openPostId) {
    return (
      <PostDetailsScreen
        postId={openPostId}
        user={user}
        role={role}
        onBack={() => setOpenPostId(null)}
        onOpenProfile={onOpenProfile}
      />
    );
  }

  /* ---------- Header ---------- */
  const header = (
    <View>
      {/* 🔥 Hot Discussions */}
      {!!hotDiscussions.length && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🔥 דיונים חמים (24h)</Text>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={Platform.OS === "web"}
            contentContainerStyle={styles.hotScroll}
          >
            {hotDiscussions.map((h) => (
              <Pressable
                key={h!.id}
                style={styles.hotCard}
                onPress={() => setOpenPostId(h!.postId)}
              >
                <Text style={styles.title}>{h!.title}</Text>
                <Text numberOfLines={2}>{h!.text}</Text>
                <Text style={styles.time}>⏰ {formatTime(h!.time)}</Text>
              </Pressable>
            ))}
          </ScrollView>
        </View>
      )}

      {/* 📰 Breaking News */}
      {!!news.length && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📰 חדשות מתפרצות</Text>

          {news.map((n) => (
            <Pressable
              key={n.article_id}
              style={styles.card}
              onPress={() => Linking.openURL(n.link!)}
            >
              {n.image_url && (
                <Image
                  source={{ uri: n.image_url }}
                  style={styles.postImage}
                />
              )}
              <Text style={styles.title}>{n.title}</Text>
            </Pressable>
          ))}

          <Pressable onPress={onOpenNews}>
            <Text style={styles.link}>לכל החדשות בזמן אמת →</Text>
          </Pressable>
        </View>
      )}

      {/* 🏘️ Community */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>🏘️ חדשות בקהילה</Text>
      </View>
    </View>
  );

  /* ---------- Posts ---------- */
  return (
    <FlatList
      data={posts}
      keyExtractor={(p) => p.id}
      ListHeaderComponent={header}
      renderItem={({ item }) => (
        <View style={styles.card}>
<Pressable onPress={() => onOpenProfile(item.authorId)}>
  <Text style={styles.author}>{item.authorName}</Text>
</Pressable>
          <Text style={styles.date}>{formatDateTime(item.createdAt)}</Text>

          <Text style={styles.title}>{item.title}</Text>
          {!!item.content && <Text>{item.content}</Text>}

          {!!item.imageUrl && (
            <Image source={{ uri: item.imageUrl }} style={styles.postImage} />
          )}

          {!!item.fileUrl && (
            <Pressable onPress={() => Linking.openURL(item.fileUrl!)}>
              <Text style={styles.link}>📎 {item.fileName}</Text>
            </Pressable>
          )}

          <Pressable
            style={styles.openPostButton}
            onPress={() => setOpenPostId(item.id)}
          >
            <Text style={styles.openPostText}>כניסה לפוסט →</Text>
          </Pressable>

          {(canEdit(item) || canDelete(item)) && (
            <View style={styles.actionsRow}>
              {canEdit(item) && (
                <Pressable
                  style={[styles.actionButton, styles.editButton]}
                  onPress={() => setEditingPost(item)}
                >
                  <Text style={styles.actionText}>✏️ עריכה</Text>
                </Pressable>
              )}
              {canDelete(item) && (
                <Pressable
                  style={[styles.actionButton, styles.deleteButton]}
                  onPress={() => deletePost(item.id)}
                >
                  <Text style={styles.actionText}>🗑️ מחיקה</Text>
                </Pressable>
              )}
            </View>
          )}
        </View>
      )}
    />
  );
}

/* ---------- Styles ---------- */
const styles = StyleSheet.create({
  section: {
    paddingVertical: 20,
    backgroundColor: "#ffffff",
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 14,
    paddingHorizontal: 20,
  },

  hotScroll: {
    paddingHorizontal: 20,
  },
  hotCard: {
    width: 260,
    marginRight: 14,
    padding: 16,
    borderRadius: 18,
    backgroundColor: "#f9fafb",
  },

  card: {
    width: "100%",
    maxWidth: 720,
    alignSelf: "center",
    marginVertical: 10,
    padding: 20,
    borderRadius: 22,
    backgroundColor: "#ffffff",
    elevation: 4,
  },

  author: {
    fontWeight: "700",
    color: "#2563eb",
  },
  date: {
    fontSize: 12,
    color: "#6b7280",
    marginBottom: 6,
  },
  title: {
    fontSize: 17,
    fontWeight: "700",
    marginBottom: 6,
  },
  postImage: {
    width: "100%",
    height: 260,
    borderRadius: 16,
    marginVertical: 12,
    backgroundColor: "#e5e7eb",
  },
  time: {
    fontSize: 12,
    color: "#6b7280",
    marginTop: 6,
  },

  link: {
    color: "#2563eb",
    marginTop: 8,
    fontWeight: "600",
    paddingHorizontal: 20,
  },

  openPostButton: {
    alignSelf: "flex-start",
    backgroundColor: "#2563eb",
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 14,
    marginTop: 12,
  },
  openPostText: {
    color: "#ffffff",
    fontWeight: "700",
  },

  actionsRow: {
    flexDirection: "row",
    gap: 12,
    marginTop: 14,
  },
  actionButton: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 12,
  },
  editButton: {
    backgroundColor: "#e0f2fe",
  },
  deleteButton: {
    backgroundColor: "#fee2e2",
  },
  actionText: {
    fontWeight: "600",
    fontSize: 13,
  },
});
