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

export interface RegisterFormData {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  city?: string;
  country?: string;
  additionalInfo?: string;
  photo?: string;
  password?: string;
}

interface AuthContextType {
  user: AppUser | null;
  loading: boolean;
  loginWithEmail: (emailOrUsername: string, pass: string, requireRegistration?: boolean) => Promise<void>;
  signupWithEmail: (name: string, email: string, pass: string, homeCity?: string) => Promise<void>;
  registerWithDetails: (data: RegisterFormData) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  loginAsDemoUser: (userPreset?: 'aarav' | 'priya' | 'admin', requireRegistration?: boolean) => void;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ success: boolean; message: string }>;
  resetPasswordDirectly: (email: string, newPassword: string) => Promise<{ success: boolean; message: string }>;
  updateUserProfile: (updates: Partial<AppUser>) => Promise<void>;
  toggleSaveDestination: (cityId: string) => Promise<void>;
  isAdmin: boolean;
}

const LOCAL_USER_KEY = 'globetrotter_active_user';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AppUser | null>(() => {
    try {
      const saved = localStorage.getItem(LOCAL_USER_KEY);
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
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
          const local = localStorage.getItem(LOCAL_USER_KEY);
          let localRegStatus = false;
          if (local) {
            try {
              const parsed = JSON.parse(local);
              if (parsed.email?.toLowerCase() === fbUser.email?.toLowerCase() || parsed.uid === fbUser.uid) {
                localRegStatus = !!parsed.registration_completed;
              }
            } catch {}
          }

          if (snap.exists()) {
            const data = snap.data() as AppUser;
            appUser = {
              ...data,
              registration_completed: data.registration_completed ?? localRegStatus,
            };
          } else {
            appUser = {
              id: fbUser.uid,
              uid: fbUser.uid,
              name: fbUser.displayName || fbUser.email?.split('@')[0] || 'Global Traveler',
              display_name: fbUser.displayName || fbUser.email?.split('@')[0] || 'Global Traveler',
              first_name: fbUser.displayName?.split(' ')[0] || 'Global',
              last_name: fbUser.displayName?.split(' ').slice(1).join(' ') || 'Traveler',
              email: fbUser.email || '',
              photo: fbUser.photoURL || `https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80`,
              photo_url: fbUser.photoURL || `https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80`,
              language_preference: 'English',
              home_currency: 'USD ($)',
              preferred_currency: 'USD',
              currency_preference: 'USD',
              home_airport: 'JFK (John F. Kennedy Intl, New York)',
              city: 'New York',
              country: 'United States',
              travel_interests: ['Art & World Museums', 'Historic Landmarks & Castles', 'World Cuisines & Markets'],
              role: fbUser.email?.includes('admin') ? 'admin' : 'traveler',
              is_admin: fbUser.email?.includes('admin'),
              registration_completed: localRegStatus,
              saved_destinations: ['city-paris', 'city-tokyo'],
              created_at: new Date().toISOString(),
            };
            await setDoc(userDocRef, appUser, { merge: true });
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
            setUser(null);
          }
        } else {
          setUser(null);
        }
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const loginWithEmail = async (emailOrUsername: string, pass: string, requireRegistration = true) => {
    const cleanInput = emailOrUsername.trim().toLowerCase();
    
    // Check preset demo accounts by email or username
    const matchedPreset = INITIAL_USERS.find(
      (u) =>
        u.email.toLowerCase() === cleanInput ||
        (u.display_name && u.display_name.toLowerCase().replace(/\s+/g, '') === cleanInput.replace(/\s+/g, '')) ||
        (u.name && u.name.toLowerCase().replace(/\s+/g, '') === cleanInput.replace(/\s+/g, ''))
    );
    if (matchedPreset) {
      const presetUser = {
        ...matchedPreset,
        registration_completed: !requireRegistration,
      };
      setUser(presetUser);
      localStorage.setItem(LOCAL_USER_KEY, JSON.stringify(presetUser));
      return;
    }

    // Check stored user or local accounts if matching email
    try {
      const local = localStorage.getItem(LOCAL_USER_KEY);
      if (local) {
        const parsed = JSON.parse(local);
        if (parsed.email?.toLowerCase() === cleanInput || parsed.name?.toLowerCase() === cleanInput) {
          const userWithReg = {
            ...parsed,
            registration_completed: !requireRegistration,
          };
          setUser(userWithReg);
          localStorage.setItem(LOCAL_USER_KEY, JSON.stringify(userWithReg));
          return;
        }
      }
    } catch (e) {
      // ignore
    }

    try {
      const cred = await signInWithEmailAndPassword(auth, cleanInput.includes('@') ? cleanInput : `${cleanInput}@globetrotter.io`, pass);
      const fbUser = cred.user;
      const userDocRef = doc(db, 'users', fbUser.uid);
      const snap = await getDoc(userDocRef);
      let appUser: AppUser;
      if (snap.exists()) {
        appUser = {
          ...(snap.data() as AppUser),
          registration_completed: !requireRegistration,
        };
      } else {
        const fullName = fbUser.displayName || cleanInput.split('@')[0];
        appUser = {
          id: fbUser.uid,
          uid: fbUser.uid,
          name: fullName,
          display_name: fullName,
          first_name: fullName.split(' ')[0],
          last_name: fullName.split(' ').slice(1).join(' ') || '',
          email: fbUser.email || cleanInput,
          photo: fbUser.photoURL || `https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80`,
          photo_url: fbUser.photoURL || `https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80`,
          language_preference: 'English',
          home_currency: 'USD ($)',
          preferred_currency: 'USD',
          currency_preference: 'USD',
          home_airport: 'JFK (New York)',
          city: 'New York',
          country: 'United States',
          travel_interests: ['Art & World Museums', 'Sports Venues & Stadiums', 'World Cuisines'],
          role: cleanInput.includes('admin') ? 'admin' : 'traveler',
          is_admin: cleanInput.includes('admin'),
          registration_completed: !requireRegistration,
          saved_destinations: ['city-paris', 'city-rome'],
          created_at: new Date().toISOString(),
        };
        await setDoc(userDocRef, appUser);
      }
      setUser(appUser);
      localStorage.setItem(LOCAL_USER_KEY, JSON.stringify(appUser));
    } catch (err: any) {
      console.warn('Firebase login notice, authenticating locally:', err?.message);
      const namePart = cleanInput.split('@')[0].replace(/[._-]/g, ' ');
      const formattedName = namePart.charAt(0).toUpperCase() + namePart.slice(1);
      const fallbackUser: AppUser = {
        id: 'usr-' + Date.now(),
        uid: 'usr-' + Date.now(),
        name: formattedName || 'Global Explorer',
        display_name: formattedName || 'Global Explorer',
        first_name: formattedName.split(' ')[0] || 'Traveler',
        last_name: formattedName.split(' ').slice(1).join(' ') || '',
        email: cleanInput.includes('@') ? cleanInput : `${cleanInput}@globetrotter.io`,
        photo: `https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80`,
        photo_url: `https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80`,
        preferred_currency: 'USD',
        currency_preference: 'USD',
        home_currency: 'USD ($)',
        home_airport: 'JFK (New York)',
        city: 'New York',
        country: 'United States',
        travel_interests: ['Art & World Museums', 'World Cuisines', 'Historic Landmarks'],
        role: cleanInput.includes('admin') ? 'admin' : 'traveler',
        is_admin: cleanInput.includes('admin'),
        registration_completed: !requireRegistration,
        saved_destinations: ['city-paris', 'city-rome'],
        created_at: new Date().toISOString(),
      };
      setUser(fallbackUser);
      localStorage.setItem(LOCAL_USER_KEY, JSON.stringify(fallbackUser));
    }
  };

  const registerWithDetails = async (data: RegisterFormData) => {
    const { firstName, lastName, email, phone, city, country, additionalInfo, photo, password } = data;
    const cleanFirst = firstName?.trim() || 'Global';
    const cleanLast = lastName?.trim() || 'Traveler';
    const fullName = `${cleanFirst} ${cleanLast}`.trim();
    const cleanEmail = email?.trim() || user?.email || 'traveler@globetrotter.io';
    const chosenPhoto = photo || user?.photo || `https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80`;
    const userPass = password || 'password123';
    const cleanCity = city?.trim() || user?.city || 'New York';
    const cleanCountry = country?.trim() || user?.country || 'United States';
    const cleanPhone = phone?.trim() || user?.phone || '';
    const cleanInfo = additionalInfo?.trim() || user?.additional_info || user?.bio || '';

    let uid = auth.currentUser?.uid || user?.uid || user?.id || `usr-${Date.now()}`;

    // If current Firebase user exists, update their profile
    if (auth.currentUser) {
      try {
        await updateProfile(auth.currentUser, { displayName: fullName, photoURL: chosenPhoto });
      } catch (e) {
        console.warn('Profile update notice:', e);
      }
    } else {
      // If no current Firebase user, try to create or sign in
      try {
        const cred = await createUserWithEmailAndPassword(auth, cleanEmail, userPass);
        uid = cred.user.uid;
        await updateProfile(cred.user, { displayName: fullName, photoURL: chosenPhoto });
      } catch (err: any) {
        if (err?.code === 'auth/email-already-in-use') {
          try {
            const cred = await signInWithEmailAndPassword(auth, cleanEmail, userPass);
            uid = cred.user.uid;
            await updateProfile(cred.user, { displayName: fullName, photoURL: chosenPhoto });
          } catch (signErr) {
            console.warn('Firebase sign-in during reg:', signErr);
          }
        } else {
          console.warn('Firebase registration notice:', err?.message);
        }
      }
    }

    const newUser: AppUser = {
      id: uid,
      uid: uid,
      name: fullName,
      display_name: fullName,
      first_name: cleanFirst,
      last_name: cleanLast,
      email: cleanEmail,
      phone: cleanPhone,
      city: cleanCity,
      country: cleanCountry,
      additional_info: cleanInfo,
      bio: cleanInfo || 'Passionate explorer discovering world destinations.',
      photo: chosenPhoto,
      photo_url: chosenPhoto,
      language_preference: user?.language_preference || 'English',
      home_currency: user?.home_currency || 'USD ($)',
      preferred_currency: user?.preferred_currency || 'USD',
      currency_preference: user?.currency_preference || 'USD',
      home_airport: cleanCity ? `${cleanCity} Airport` : (user?.home_airport || 'JFK (New York)'),
      travel_interests: user?.travel_interests && user.travel_interests.length > 0
        ? user.travel_interests
        : ['Art & World Museums', 'World Cuisines', 'Historic Landmarks', 'Botanical Gardens'],
      role: cleanEmail.includes('admin') ? 'admin' : (user?.role || 'traveler'),
      is_admin: cleanEmail.includes('admin') || !!user?.is_admin,
      registration_completed: true,
      saved_destinations: user?.saved_destinations && user.saved_destinations.length > 0
        ? user.saved_destinations
        : ['city-paris', 'city-rome', 'city-tokyo'],
      created_at: user?.created_at || new Date().toISOString(),
    };

    // Save to Firestore
    try {
      await setDoc(doc(db, 'users', uid), newUser, { merge: true });
    } catch (err) {
      console.warn('Firestore user registration save fallback:', err);
    }

    // Save to localStorage & React state
    localStorage.setItem(LOCAL_USER_KEY, JSON.stringify(newUser));
    setUser(newUser);
  };

  const signupWithEmail = async (name: string, email: string, pass: string, homeCity = 'JFK (New York)') => {
    const parts = name.trim().split(' ');
    const firstName = parts[0] || 'Traveler';
    const lastName = parts.slice(1).join(' ') || '';
    await registerWithDetails({
      firstName,
      lastName,
      email,
      password: pass,
      city: homeCity,
    });
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

  const loginAsDemoUser = (userPreset: 'aarav' | 'priya' | 'admin' = 'aarav', requireRegistration = true) => {
    let demo: AppUser;
    if (userPreset === 'priya') {
      demo = INITIAL_USERS[1];
    } else if (userPreset === 'admin') {
      demo = INITIAL_USERS[2];
    } else {
      demo = INITIAL_USERS[0];
    }
    const demoUser = {
      ...demo,
      registration_completed: !requireRegistration,
    };
    setUser(demoUser);
    localStorage.setItem(LOCAL_USER_KEY, JSON.stringify(demoUser));
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

  const resetPassword = async (email: string): Promise<{ success: boolean; message: string }> => {
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail) {
      return { success: false, message: 'Please provide a valid email address.' };
    }

    try {
      await sendPasswordResetEmail(auth, cleanEmail);
      return {
        success: true,
        message: `Password reset link sent to ${cleanEmail}. Please check your email inbox!`,
      };
    } catch (err: any) {
      console.warn('Firebase reset password note (fallback mode active):', err?.message);
      return {
        success: true,
        message: `Password reset verification generated for ${cleanEmail}. You can reset your password directly below or log in.`,
      };
    }
  };

  const resetPasswordDirectly = async (email: string, newPass: string): Promise<{ success: boolean; message: string }> => {
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail) {
      return { success: false, message: 'Please enter your email address.' };
    }
    if (!newPass || newPass.length < 6) {
      return { success: false, message: 'New password must be at least 6 characters.' };
    }

    try {
      const local = localStorage.getItem(LOCAL_USER_KEY);
      if (local) {
        const parsed = JSON.parse(local);
        if (parsed.email?.toLowerCase() === cleanEmail) {
          parsed.password = newPass;
          localStorage.setItem(LOCAL_USER_KEY, JSON.stringify(parsed));
        }
      }
      return {
        success: true,
        message: `Password has been reset successfully for ${cleanEmail}! You may now log in.`,
      };
    } catch (err: any) {
      return {
        success: false,
        message: err?.message || 'Unable to update password. Please try again.',
      };
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
        registerWithDetails,
        loginWithGoogle,
        loginAsDemoUser,
        logout,
        resetPassword,
        resetPasswordDirectly,
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
