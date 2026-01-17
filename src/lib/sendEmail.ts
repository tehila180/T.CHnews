// src/lib/sendEmail.ts
import { addDoc, collection } from "firebase/firestore";
import { db } from "./firebase";

export async function sendEmail({
  to,
  subject,
  html,
}: {
  to: string[];
  subject: string;
  html: string;
}) {
  await addDoc(collection(db, "mail"), {
    to,
    message: {
      subject,
      html,
    },
  });
}
