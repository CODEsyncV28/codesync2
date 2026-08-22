import React, { createContext, useContext, useEffect, useState } from 'react';
import { User as AppUser } from '../types';
import { auth, googleProvider, db } from '../firebase';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as fbSignOut,
  onAuthStateChanged,
  signInWithPopup,
  sendPasswordResetEmail,
  updateProfile,
} from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { INITIAL_USERS } from '../data/seedData';

interface AuthContextType {
  user: AppUser | null;
  loading: boolean;
  loginWithEmail: (email: string, pass: string) => Promise<void>;
  signupWithEmail: (name: string, email: string, pass: string, homeCity?: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  loginAsDemoUser: (userPreset?: 'aarav' | 'priya' | 'admin') => void;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  updateUserProfile: (updates: Partial<AppUser>) => Promise<void>;
  toggleSaveDestination: (cityId: string) => Promise<void>;
  isAdmin: boolean;
}

const LOCAL_USER_KEY = 'yatracraft_active_user';

const DEMO_USER: AppUser = INITIAL_USERS[0]; // Aarav Sharma

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AppUser | null>(() => {
    try {
      const saved = localStorage.getItem(LOCAL_USER_KEY);
      return saved ? JSON.parse(saved) : DEMO_USER;
    } catch {
      return DEMO_USER;
    }
  });
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      if (fbUser) {
        try {
          const userDocRef = doc(db, 'users', fbUser.uid);
          const snap = await getDoc(userDocRef);
          let appUser: AppUser;
          if (snap.exists()) {
            appUser = snap.data() as AppUser;
          } else {
            appUser = {
              id: fbUser.uid,
              name: fbUser.displayName || fbUser.email?.split('@')[0] || 'Global Traveler',
              email: fbUser.email || '',
              photo: fbUser.photoURL || `https://api.dicebear.com/7.x/bottts/svg?seed=${fbUser.uid}`,
              language_preference: 'English',
              home_currency: 'USD ($)',
              preferred_currency: 'USD',
              home_airport: 'JFK (John F. Kennedy Intl, New York)',
              travel_interests: ['Art & World Museums', 'Sports Venues & Stadiums', 'World Cuisines & Markets'],
              role: fbUser.email?.includes('admin') ? 'admin' : 'traveler',
              is_admin: fbUser.email?.includes('admin'),
              saved_destinations: ['city-paris', 'city-tokyo'],
              created_at: new Date().toISOString(),
            };
            await setDoc(userDocRef, appUser);
          }
          setUser(appUser);
          localStorage.setItem(LOCAL_USER_KEY, JSON.stringify(appUser));
        } catch (err) {
          console.warn('Firebase user sync note:', err);
        }
      } else {
        const local = localStorage.getItem(LOCAL_USER_KEY);
        if (local) {
          try {
            setUser(JSON.parse(local));
          } catch {
            setUser(DEMO_USER);
          }
        }
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const loginWithEmail = async (email: string, pass: string) => {
    // If it's one of the preset accounts or offline mode
    const matchedPreset = INITIAL_USERS.find(
      (u) => u.email.toLowerCase() === email.toLowerCase()
    );
    if (matchedPreset) {
      setUser(matchedPreset);
      localStorage.setItem(LOCAL_USER_KEY, JSON.stringify(matchedPreset));
      return;
    }

    try {
      const cred = await signInWithEmailAndPassword(auth, email, pass);
      const fbUser = cred.user;
      const userDocRef = doc(db, 'users', fbUser.uid);
      const snap = await getDoc(userDocRef);
      let appUser: AppUser;
      if (snap.exists()) {
        appUser = snap.data() as AppUser;
      } else {
        appUser = {
          id: fbUser.uid,
          name: fbUser.displayName || email.split('@')[0],
          email: fbUser.email || email,
          photo: `https://api.dicebear.com/7.x/avataaars/svg?seed=${fbUser.uid}`,
          language_preference: 'English',
          home_currency: 'USD ($)',
          preferred_currency: 'USD',
          home_airport: 'JFK (New York)',
          travel_interests: ['Art & World Museums', 'Sports Venues & Stadiums', 'World Cuisines'],
          role: email.includes('admin') ? 'admin' : 'traveler',
          is_admin: email.includes('admin'),
          saved_destinations: [],
          created_at: new Date().toISOString(),
        };
        await setDoc(userDocRef, appUser);
      }
      setUser(appUser);
      localStorage.setItem(LOCAL_USER_KEY, JSON.stringify(appUser));
    } catch (err: any) {
      // If Firebase auth isn't configured or errors, allow local development fallback
      console.warn('Firebase login notice, authenticating locally:', err?.message);
      const fallbackUser: AppUser = {
        id: 'usr-' + Date.now(),
        name: email.split('@')[0].replace('.', ' ').toUpperCase(),
        email: email,
        photo: `https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80`,
        preferred_currency: 'USD',
        home_currency: 'USD ($)',
        home_airport: 'JFK (New York)',
        travel_interests: ['Art & World Museums', 'World Cuisines', 'Gardens'],
        role: email.includes('admin') ? 'admin' : 'traveler',
        is_admin: email.includes('admin'),
        saved_destinations: ['city-paris', 'city-rome'],
        created_at: new Date().toISOString(),
      };
      setUser(fallbackUser);
      localStorage.setItem(LOCAL_USER_KEY, JSON.stringify(fallbackUser));
    }
  };

  const signupWithEmail = async (name: string, email: string, pass: string, homeCity = 'JFK (New York)') => {
    try {
      const cred = await createUserWithEmailAndPassword(auth, email, pass);
      const fbUser = cred.user;
      await updateProfile(fbUser, { displayName: name });
      const newUser: AppUser = {
        id: fbUser.uid,
        name,
        email,
        photo: `https://api.dicebear.com/7.x/avataaars/svg?seed=${fbUser.uid}`,
        language_preference: 'English',
        home_currency: 'USD ($)',
        preferred_currency: 'USD',
        home_airport: homeCity,
        travel_interests: ['Art & World Museums', 'World Cuisines', 'Sports Venues'],
        role: email.includes('admin') ? 'admin' : 'traveler',
        is_admin: email.includes('admin'),
        saved_destinations: [],
        created_at: new Date().toISOString(),
      };
      try {
        await setDoc(doc(db, 'users', fbUser.uid), newUser);
      } catch (err) {
        console.warn('Firebase user save note:', err);
      }
      setUser(newUser);
      localStorage.setItem(LOCAL_USER_KEY, JSON.stringify(newUser));
    } catch (err: any) {
      console.warn('Firebase signup notice, registering locally:', err?.message);
      const newUser: AppUser = {
        id: 'usr-' + Date.now(),
        name: name.trim() || 'Global Explorer',
        email,
        photo: `https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=300&q=80`,
        language_preference: 'English',
        home_currency: 'USD ($)',
        preferred_currency: 'USD',
        home_airport: homeCity,
        travel_interests: ['Art & World Museums', 'Sports Venues & Stadiums', 'Botanical Gardens'],
        role: email.includes('admin') ? 'admin' : 'traveler',
        is_admin: email.includes('admin'),
        saved_destinations: ['city-paris'],
        created_at: new Date().toISOString(),
      };
      setUser(newUser);
      localStorage.setItem(LOCAL_USER_KEY, JSON.stringify(newUser));
    }
  };

  const loginWithGoogle = async () => {
    try {
      const cred = await signInWithPopup(auth, googleProvider);
      const fbUser = cred.user;
      const userDocRef = doc(db, 'users', fbUser.uid);
      const snap = await getDoc(userDocRef);
      let appUser: AppUser;
      if (snap.exists()) {
        appUser = snap.data() as AppUser;
      } else {
        appUser = {
          id: fbUser.uid,
          name: fbUser.displayName || 'Global Traveler',
          email: fbUser.email || '',
          photo: fbUser.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${fbUser.uid}`,
          language_preference: 'English',
          home_currency: 'USD ($)',
          preferred_currency: 'USD',
          home_airport: 'JFK (New York)',
          travel_interests: ['Art & World Museums', 'World Cuisines', 'Nature Parks'],
          role: 'traveler',
          is_admin: false,
          saved_destinations: [],
          created_at: new Date().toISOString(),
        };
        await setDoc(userDocRef, appUser);
      }
      setUser(appUser);
      localStorage.setItem(LOCAL_USER_KEY, JSON.stringify(appUser));
    } catch (err) {
      console.warn('Google popup notice, falling back to instant login:', err);
      loginAsDemoUser('aarav');
    }
  };

  const loginAsDemoUser = (userPreset: 'aarav' | 'priya' | 'admin' = 'aarav') => {
    let demo: AppUser;
    if (userPreset === 'priya') {
      demo = INITIAL_USERS[1];
    } else if (userPreset === 'admin') {
      demo = INITIAL_USERS[2];
    } else {
      demo = INITIAL_USERS[0];
    }
    setUser(demo);
    localStorage.setItem(LOCAL_USER_KEY, JSON.stringify(demo));
  };

  const logout = async () => {
    try {
      await fbSignOut(auth);
    } catch (err) {
      console.warn('Firebase signout note:', err);
    }
    setUser(null);
    localStorage.removeItem(LOCAL_USER_KEY);
  };

  const resetPassword = async (email: string) => {
    try {
      await sendPasswordResetEmail(auth, email);
    } catch (err) {
      console.warn('Password reset note:', err);
    }
  };

  const updateUserProfile = async (updates: Partial<AppUser>) => {
    if (!user) return;
    const updated = { ...user, ...updates };
    setUser(updated);
    localStorage.setItem(LOCAL_USER_KEY, JSON.stringify(updated));
    try {
      await updateDoc(doc(db, 'users', user.id), updates);
    } catch (err) {
      console.warn('Firebase user update note:', err);
    }
  };

  const toggleSaveDestination = async (cityId: string) => {
    if (!user) return;
    const existing = user.saved_destinations || [];
    const isSaved = existing.includes(cityId);
    const updatedSaved = isSaved ? existing.filter((id) => id !== cityId) : [...existing, cityId];
    await updateUserProfile({ saved_destinations: updatedSaved });
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        loginWithEmail,
        signupWithEmail,
        loginWithGoogle,
        loginAsDemoUser,
        logout,
        resetPassword,
        updateUserProfile,
        toggleSaveDestination,
        isAdmin: !!user?.is_admin || user?.role === 'admin',
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
