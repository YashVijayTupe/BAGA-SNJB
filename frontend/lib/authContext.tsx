"use client";
import { createContext, useContext, useEffect, useState } from "react";
import { auth, db } from "./firebase";
import { User, onAuthStateChanged, signOut } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";

export interface UserProfile {
  uid: string;
  name: string;
  email: string;
  role: "citizen" | "officer";
  // Location fields
  state: string;
  district: string;
  city: string;
  // Officer-specific
  department?: string;
  employee_id?: string;
  // Verification: 'pending' | 'approved' | 'rejected'
  verification_status?: "pending" | "approved" | "rejected";
}

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({ user: null, profile: null, loading: true, logout: async () => { } });

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      console.log("DEBUG: Auth State Changed:", currentUser?.email);
      setUser(currentUser);
      
      if (currentUser) {
        // Fetch custom user profile from Firestore with a 10s safety timeout
        const fetchProfile = async () => {
          try {
            const docRef = doc(db, "users", currentUser.uid);
            const docSnap = await getDoc(docRef);
            if (docSnap.exists()) {
              console.log("DEBUG: Profile loaded:", docSnap.data().role);
              setProfile(docSnap.data() as UserProfile);
            } else {
              console.warn("DEBUG: No profile found for UID:", currentUser.uid);
              setProfile(null);
            }
          } catch (e) {
            console.error("Error fetching user profile:", e);
            setProfile(null);
          } finally {
            setLoading(false);
          }
        };

        // Fallback timeout: if Firestore takes > 10s, stop the loading spinner
        const timeoutId = setTimeout(() => {
          setLoading(false);
          console.error("DEBUG: Profile fetch timed out");
        }, 10000);

        await fetchProfile();
        clearTimeout(timeoutId);
      } else {
        setProfile(null);
        setLoading(false);
      }
    });
    return unsubscribe;
  }, []);

  const logout = async () => {
    await signOut(auth);
  };

  return <AuthContext.Provider value={{ user, profile, loading, logout }}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
