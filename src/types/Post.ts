import { Timestamp } from "firebase/firestore";

export type Post = {
  id: string;
  title: string;
  content?: string;   // ✅ אופציונלי
  authorId: string;
  authorName: string;
  imageUrl?: string;
  fileUrl?: string;
  fileName?: string;
  createdAt?: Timestamp;
};
