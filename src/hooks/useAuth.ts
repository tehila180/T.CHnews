import { useEffect, useState } from "react";
import { onAuthStateChanged, signOut, User } from "firebase/auth";
import { doc, onSnapshot } from "firebase/firestore";
import { auth, db } from "../lib/firebase";

type Role = "ADMIN" | "USER";

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<Role>("USER");
  const [username, setUsername] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let unsubUserDoc: (() => void) | null = null;

    const unsubAuth = onAuthStateChanged(auth, (u) => {
      if (!u) {
        setUser(null);
        setRole("USER");
        setUsername(null);
        setLoading(false);
        return;
      }

      setUser(u);

      // 🔥 מאזין למסמך המשתמש בזמן אמת
      const ref = doc(db, "users", u.uid);

      unsubUserDoc = onSnapshot(ref, async (snap) => {
        if (!snap.exists()) {
          setUsername(null);
          setRole("USER");
          setLoading(false);
          return;
        }

        const data = snap.data();

        // 🚫 חסימה
        if (data.disabled === true) {
          await signOut(auth);
          setUser(null);
          setUsername(null);
          setRole("USER");
          setLoading(false);
          return;
        }

        // 👤 username
        setUsername(typeof data.username === "string" ? data.username : null);

        // 👑 role
        setRole(data.role === "ADMIN" ? "ADMIN" : "USER");

        setLoading(false);
      });
    });

    return () => {
      unsubAuth();
      if (unsubUserDoc) unsubUserDoc();
    };
  }, []);

  return { user, role, username, loading };
}