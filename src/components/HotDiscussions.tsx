import { View, Text, Pressable, FlatList, StyleSheet, Platform } from "react-native";
import { Timestamp } from "firebase/firestore";
import { Post } from "../types/Post";

type Props = {
  posts: Post[];
  onOpenPost: (postId: string) => void;
};

export default function HotDiscussions({ posts, onOpenPost }: Props) {
  const last24h = Date.now() - 24 * 60 * 60 * 1000;

  const hotPosts = posts.filter(
    (p) =>
      p.createdAt &&
      p.createdAt.toMillis() >= last24h
  );

  if (hotPosts.length === 0) return null;

  return (
    <View style={styles.wrapper}>
      <Text style={styles.title}>🔥 דיונים חמים (24 שעות)</Text>

      <FlatList
        data={hotPosts}
        keyExtractor={(p) => p.id}
        horizontal={Platform.OS !== "web"}
        showsHorizontalScrollIndicator={false}
        renderItem={({ item }) => (
          <Pressable
            style={styles.card}
            onPress={() => onOpenPost(item.id)}
          >
            <Text style={styles.postTitle} numberOfLines={2}>
              {item.title}
            </Text>

            {item.content ? (
              <Text style={styles.preview} numberOfLines={3}>
                {item.content}
              </Text>
            ) : null}
          </Pressable>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    padding: 12,
    borderBottomWidth: 1,
    backgroundColor: "#f9fafb",
  },
  title: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 8,
  },
  card: {
    backgroundColor: "white",
    padding: 12,
    marginRight: 12,
    width: 260,
    borderRadius: 8,
    borderWidth: 1,
  },
  postTitle: {
    fontWeight: "bold",
    marginBottom: 4,
  },
  preview: {
    fontSize: 13,
    color: "#555",
  },
});
