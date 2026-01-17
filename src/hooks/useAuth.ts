import { useEffect, useState } from "react";
import { onAuthStateChanged, signOut, User } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "../lib/firebase";

type Role = "ADMIN" | "USER";

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<Role>("USER");
  const [username, setUsername] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      if (!u) {
        setUser(null);
        setRole("USER");
        setUsername(null);
        setLoading(false);
        return;
      }

      try {
        const snap = await getDoc(doc(db, "users", u.uid));

        if (snap.exists()) {
          const data = snap.data();

          // 🚫 משתמש חסום
          if (data.disabled === true) {
            await signOut(auth);
            setUser(null);
            setRole("USER");
            setUsername(null);
            setLoading(false);
            return;
          }

          // 👤 username
          if (typeof data.username === "string") {
            setUsername(data.username);
          } else {
            setUsername(null);
          }

          // 👑 role
          if (data.role === "ADMIN") {
            setRole("ADMIN");
          } else {
            setRole("USER");
          }
        }

        setUser(u);
      } catch (err) {
        console.error("useAuth error:", err);
        setUser(u);
        setRole("USER");
        setUsername(null);
      } finally {
        setLoading(false);
      }
    });

    return unsub;
  }, []);

  return { user, role, username, loading };
}
