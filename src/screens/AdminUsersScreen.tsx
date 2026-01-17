import { useEffect, useState } from "react";
import {
  View,
  Text,
  Pressable,
  FlatList,
  StyleSheet,
} from "react-native";
import {
  collection,
  getDocs,
  doc,
  deleteDoc,
  updateDoc,
  Timestamp,
} from "firebase/firestore";
import { db } from "../lib/firebase";
import { User } from "firebase/auth";

type UserDoc = {
  id: string;
  email: string;
  username?: string;
  role: "ADMIN" | "USER";
  createdAt?: Timestamp;
  disabled?: boolean;
};

type Props = {
  currentUser: User;
};

export default function AdminUsersScreen({ currentUser }: Props) {
  const [users, setUsers] = useState<UserDoc[]>([]);

  useEffect(() => {
    async function loadUsers() {
      const snap = await getDocs(collection(db, "users"));
      setUsers(
        snap.docs.map((d) => ({
          id: d.id,
          ...(d.data() as any),
        }))
      );
    }
    loadUsers();
  }, []);

  async function blockUser(userId: string) {
    await updateDoc(doc(db, "users", userId), { disabled: true });
    setUsers((prev) =>
      prev.map((u) =>
        u.id === userId ? { ...u, disabled: true } : u
      )
    );
  }

  async function unblockUser(userId: string) {
    await updateDoc(doc(db, "users", userId), { disabled: false });
    setUsers((prev) =>
      prev.map((u) =>
        u.id === userId ? { ...u, disabled: false } : u
      )
    );
  }

  async function deleteUser(userId: string) {
    await deleteDoc(doc(db, "users", userId));
    setUsers((prev) => prev.filter((u) => u.id !== userId));
  }

  function formatDate(ts?: Timestamp) {
    if (!ts) return "—";
    return ts.toDate().toLocaleDateString("he-IL");
  }

  return (
    <FlatList
      data={users}
      keyExtractor={(u) => u.id}
      contentContainerStyle={styles.page}
      ListHeaderComponent={
        <Text style={styles.title}>ניהול משתמשים</Text>
      }
      renderItem={({ item }) => {
        const isBlocked = item.disabled === true;
        const isMe = item.id === currentUser.uid;

        return (
          <View
            style={[
              styles.userRow,
              isBlocked && styles.userBlocked,
            ]}
          >
            {/* User info */}
            <View style={styles.userInfo}>
              <View style={styles.nameRow}>
                <Text style={styles.username}>
                  {item.username || "משתמש ללא שם"}
                </Text>

                <View
                  style={[
                    styles.roleBadge,
                    item.role === "ADMIN"
                      ? styles.adminBadge
                      : styles.userBadge,
                  ]}
                >
                  <Text style={styles.roleText}>
                    {item.role}
                  </Text>
                </View>
              </View>

              <Text style={styles.meta}>📧 {item.email}</Text>
              <Text style={styles.meta}>
                הצטרף: {formatDate(item.createdAt)}
              </Text>

              {isBlocked && (
                <Text style={styles.blockedLabel}>
                  ⛔ משתמש חסום
                </Text>
              )}
            </View>

            {/* Actions */}
            {!isMe && (
              <View style={styles.actions}>
                {!isBlocked ? (
                  <Pressable
                    style={styles.blockButton}
                    onPress={() => blockUser(item.id)}
                  >
                    <Text style={styles.actionText}>
                      חסימה
                    </Text>
                  </Pressable>
                ) : (
                  <Pressable
                    style={styles.unblockButton}
                    onPress={() => unblockUser(item.id)}
                  >
                    <Text style={styles.actionText}>
                      ביטול חסימה
                    </Text>
                  </Pressable>
                )}

                <Pressable
                  style={styles.deleteButton}
                  onPress={() => deleteUser(item.id)}
                >
                  <Text style={styles.actionText}>
                    מחיקה
                  </Text>
                </Pressable>
              </View>
            )}
          </View>
        );
      }}
    />
  );
}

/* ---------- Styles ---------- */
const styles = StyleSheet.create({
  page: {
    padding: 16,
    backgroundColor: "#ffffff",
  },

  title: {
    fontSize: 22,
    fontWeight: "700",
    marginBottom: 16,
  },

  userRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    marginBottom: 12,
    backgroundColor: "#f9fafb",
  },

  userBlocked: {
    opacity: 0.6,
  },

  userInfo: {
    flex: 1,
    paddingRight: 12,
  },

  nameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 4,
  },

  username: {
    fontSize: 16,
    fontWeight: "700",
  },

  roleBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 999,
  },

  adminBadge: {
    backgroundColor: "#2563eb",
  },

  userBadge: {
    backgroundColor: "#6b7280",
  },

  roleText: {
    color: "white",
    fontSize: 11,
    fontWeight: "700",
  },

  meta: {
    fontSize: 13,
    color: "#374151",
  },

  blockedLabel: {
    marginTop: 6,
    color: "#dc2626",
    fontWeight: "600",
  },

  actions: {
    justifyContent: "center",
    gap: 8,
  },

  blockButton: {
    backgroundColor: "#f97316",
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 10,
  },

  unblockButton: {
    backgroundColor: "#16a34a",
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 10,
  },

  deleteButton: {
    backgroundColor: "#dc2626",
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 10,
  },

  actionText: {
    color: "white",
    fontWeight: "600",
    textAlign: "center",
    fontSize: 13,
  },
});
