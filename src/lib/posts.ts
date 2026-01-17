import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  updateDoc,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "./firebase";

/* ➕ יצירת פוסט */
export async function createPost(post: {
  title: string;              // חובה
  content?: string;           // אופציונלי
  authorId: string;
  authorName: string;
  imageUrl?: string;
  fileUrl?: string;
  fileName?: string;
}) {
  await addDoc(collection(db, "posts"), {
    ...post,
    createdAt: serverTimestamp(),
  });
}

/* 🗑️ מחיקת פוסט */
export async function deletePost(postId: string) {
  await deleteDoc(doc(db, "posts", postId));
}

/* ✏️ עדכון פוסט */
export async function updatePost(
  postId: string,
  data: {
    title: string;
    content?: string;
    imageUrl?: string;
    fileUrl?: string;
    fileName?: string;
  }
) {
  await updateDoc(doc(db, "posts", postId), data);
}
