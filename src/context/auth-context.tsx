
"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { auth, db } from "@/lib/firebase";
import type { User as FirebaseUser } from "firebase/auth";
import { onAuthStateChanged, signOut, deleteUser } from "firebase/auth";
import { doc, getDoc, onSnapshot, deleteDoc } from "firebase/firestore";

interface UserProfile {
  name: string;
  email: string;
  phone?: string;
  gender?: string;
  bloodType?: string;
  lastDonationDate?: Date;
  city?: string;
  mobileVisibility?: boolean;
  geolocation?: string;
}

interface AuthContextType {
  user: FirebaseUser | null;
  userProfile: UserProfile | null;
  isLoading: boolean;
  logout: () => void;
  deleteUserAccount: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
      setUser(user);
      if (user) {
        const userDocRef = doc(db, "users", user.uid);
        const unsubscribeSnapshot = onSnapshot(userDocRef, (doc) => {
          if (doc.exists()) {
            const data = doc.data();
            setUserProfile({
              name: data.name,
              email: data.email,
              phone: data.phone,
              gender: data.gender,
              bloodType: data.bloodType,
              lastDonationDate: data.lastDonationDate?.toDate(),
              city: data.city,
              mobileVisibility: data.mobileVisibility,
              geolocation: data.geolocation
            });
          } else {
            setUserProfile(null);
          }
          setIsLoading(false);
        });
        return () => unsubscribeSnapshot();
      } else {
        setUserProfile(null);
        setIsLoading(false);
      }
    });

    return () => unsubscribeAuth();
  }, []);

  const logout = () => {
    signOut(auth);
  };

  const deleteUserAccount = async () => {
    if (!user) {
      throw new Error("No user is currently signed in.");
    }

    const userToDelete = auth.currentUser;
    if (!userToDelete) {
       throw new Error("Could not verify current user.");
    }
    
    try {
      // Delete user data from Firestore first
      const userDocRef = doc(db, "users", userToDelete.uid);
      await deleteDoc(userDocRef);

      // Then delete the user from Firebase Authentication
      await deleteUser(userToDelete);
      
      // State will be cleared by onAuthStateChanged listener
    } catch (error) {
      console.error("Error deleting user account:", error);
      // This might fail if the user needs to re-authenticate.
      // The error message will be shown to the user.
      throw error;
    }
  };


  return (
    <AuthContext.Provider value={{ user, userProfile, isLoading, logout, deleteUserAccount }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
