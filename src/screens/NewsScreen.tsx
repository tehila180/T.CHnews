import { useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  Image,
  Pressable,
  Linking,
  StyleSheet,
  ActivityIndicator,
  useWindowDimensions,
} from "react-native";
import { fetchNews, NewsArticle } from "../lib/newsApi";

export default function NewsScreen() {
  const { width } = useWindowDimensions();
  const isMobile = width < 768;

  const [news, setNews] = useState<NewsArticle[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const data = await fetchNews();

        const now = Date.now();
        const LIMIT = 48 * 60 * 60 * 1000;

        const filtered = data
          .filter((item) => {
            if (!item.pubDate) return false;
            const time = new Date(item.pubDate).getTime();
            return now - time <= LIMIT;
          })
          .sort((a, b) => {
            return (
              new Date(b.pubDate!).getTime() -
              new Date(a.pubDate!).getTime()
            );
          });

        setNews(filtered);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }

    load();
  }, []);

  function formatDate(dateStr?: string) {
    if (!dateStr) return "";
    return new Date(dateStr).toLocaleString("he-IL", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
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
      key={isMobile ? "mobile" : "web"}   
      data={news}
      keyExtractor={(item) => item.article_id}
      numColumns={isMobile ? 1 : 2}
      columnWrapperStyle={!isMobile ? styles.row : undefined}
      contentContainerStyle={styles.list}
      renderItem={({ item }) => (
        <View style={[styles.card, !isMobile && styles.cardWeb]}>
          {item.image_url ? (
            <Image source={{ uri: item.image_url }} style={styles.image} />
          ) : (
            <View style={styles.noImage}>
              <Text style={styles.noImageText}>No Image</Text>
            </View>
          )}

          <Text style={styles.title}>{item.title}</Text>

          <Text style={styles.date}>
            {formatDate(item.pubDate)}
          </Text>

          {item.description ? (
            <Text style={styles.desc} numberOfLines={4}>
              {item.description}
            </Text>
          ) : null}

          <Pressable onPress={() => Linking.openURL(item.link)}>
            <Text style={styles.link}>Read full article</Text>
          </Pressable>
        </View>
      )}
      ListEmptyComponent={
        <View style={styles.center}>
          <Text>אין חדשות ב־48 השעות האחרונות</Text>
        </View>
      }
    />
  );
}

/* ---------- Styles ---------- */
const styles = StyleSheet.create({
  list: {
    padding: 16,
  },
  row: {
    justifyContent: "space-between",
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  card: {
    flex: 1,
    marginBottom: 20,
    borderWidth: 1,
    borderRadius: 10,
    overflow: "hidden",
    backgroundColor: "#fff",
  },
  cardWeb: {
    marginHorizontal: 8,
  },
  image: {
    width: "100%",
    height: 200,
  },
  noImage: {
    width: "100%",
    height: 200,
    backgroundColor: "#e5e7eb",
    justifyContent: "center",
    alignItems: "center",
  },
  noImageText: {
    color: "#555",
  },
  title: {
    fontSize: 18,
    fontWeight: "bold",
    padding: 12,
    paddingBottom: 4,
  },
  date: {
    fontSize: 12,
    color: "#666",
    paddingHorizontal: 12,
    marginBottom: 6,
  },
  desc: {
    paddingHorizontal: 12,
    color: "#444",
  },
  link: {
    padding: 12,
    color: "#2563eb",
    fontWeight: "600",
  },
});
