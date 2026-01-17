/* ---------- Types ---------- */
export type NewsArticle = {
  article_id: string;
  title: string;
  description?: string;
  link: string;
  image_url?: string;
  pubDate?: string;
  source_id?: string;
};

/* ---------- API ---------- */
const API_KEY = "pub_38338a8869394e4ebdeda73c393a0cc6"; // 🔴 לשים מפתח אמיתי
const BASE_URL = "https://newsdata.io/api/1/news";

export async function fetchNews(): Promise<NewsArticle[]> {
  const res = await fetch(
    `${BASE_URL}?apikey=${API_KEY}&language=he`
  );

  if (!res.ok) {
    throw new Error("Failed to fetch news");
  }

  const data = await res.json();
  return data.results ?? [];
}
