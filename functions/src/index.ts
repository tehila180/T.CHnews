import { onDocumentCreated } from "firebase-functions/v2/firestore";
import { initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { defineSecret } from "firebase-functions/params";
import sgMail from "@sendgrid/mail";

initializeApp();

const db = getFirestore();
const SENDGRID_API_KEY = defineSecret("SENDGRID_API_KEY");

export const sendEmailOnNewPost = onDocumentCreated(
  {
    document: "posts/{postId}",
    region: "us-central1",
    secrets: [SENDGRID_API_KEY],
  },
  async (event) => {
    const snap = event.data;
    if (!snap) {
      return;
    }

    const post = snap.data() as {
      title: string;
      content?: string;
      imageUrl?: string;
      authorName?: string;
    };

    sgMail.setApiKey(SENDGRID_API_KEY.value());

    const usersSnap = await db.collection("users").get();

    const emails = usersSnap.docs
      .map((doc) => doc.data().email)
      .filter((email): email is string => Boolean(email));

    if (emails.length === 0) {
      return;
    }

    const htmlParts: string[] = [];

    htmlParts.push(`<h2>${post.title}</h2>`);

    if (post.authorName) {
      htmlParts.push(
        `<p><strong>נכתב ע״י:</strong> ${post.authorName}</p>`
      );
    }

    if (post.content) {
      htmlParts.push(`<p>${post.content}</p>`);
    }

    if (post.imageUrl) {
      htmlParts.push(
        `<img src="${post.imageUrl}" style="max-width:100%;margin-top:10px" />`
      );
    }

    const msg = {
      to: emails,
      from: {
        email: "tehila.ch12@gmail.com",
        name: "CodeShareForum",
      },
      subject: `📢 פוסט חדש: ${post.title}`,
      html: htmlParts.join(""),
    };

    await sgMail.sendMultiple(msg);
  }
);
