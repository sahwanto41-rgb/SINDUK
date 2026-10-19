import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, onAuthStateChanged } from 'firebase/auth';
import { auth, loginWithGoogle, logoutUser, testConnection } from '../firebase';
import { UserProfile, UserRole } from '../types';
import { getUserProfile, setUserProfile, initializeDatabaseIfEmpty } from '../services/firestoreService';

interface AuthContextType {
  user: User | null;
  userProfile: UserProfile | null;
  loading: boolean;
  connectionStatus: 'checking' | 'connected' | 'offline' | 'error';
  connectionMessage: string;
  login: () => Promise<void>;
  logout: () => Promise<void>;
  switchRoleForDemo: (role: UserRole) => void;
  checkConnectionNow: () => Promise<void>;
  isDemoMode: boolean;
  setDemoUser: (role: UserRole) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const ADMIN_EMAIL = 'sahwanto41@admin.sd.belajar.id';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfileState] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isDemoMode, setIsDemoMode] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'checking' | 'connected' | 'offline' | 'error'>('checking');
  const [connectionMessage, setConnectionMessage] = useState('Menguji koneksi ke Cloud Firestore...');

  const checkConnectionNow = async () => {
    setConnectionStatus('checking');
    setConnectionMessage('Menguji koneksi...');
    try {
      const res = await testConnection();
      if (res.success) {
        setConnectionStatus('connected');
        setConnectionMessage(res.message);
      } else {
        setConnectionStatus('offline');
        setConnectionMessage(res.message);
      }
    } catch {
      setConnectionStatus('error');
      setConnectionMessage('Gagal menghubungi Firestore');
    }
  };

  useEffect(() => {
    // 1. Uji koneksi Firestore
    checkConnectionNow();

    // 2. Listener auth Firebase
    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      setUser(fbUser);
      if (fbUser) {
        setIsDemoMode(false);
        try {
          const profile = await getUserProfile(fbUser.uid);
          if (profile) {
            setUserProfileState(profile);
          } else {
            // Tentukan peran awal berdasarkan email
            const initialRole: UserRole =
              fbUser.email?.toLowerCase() === ADMIN_EMAIL.toLowerCase()
                ? 'admin'
                : 'operator';

            const newProfile: UserProfile = {
              uid: fbUser.uid,
              email: fbUser.email || '',
              displayName: fbUser.displayName || fbUser.email?.split('@')[0] || 'Pengguna',
              role: initialRole,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            };
            await setUserProfile(newProfile);
            setUserProfileState(newProfile);
          }

          // Inisialisasi database dasar jika masih kosong (hanya saat terautentikasi)
          await initializeDatabaseIfEmpty();
        } catch (err) {
          console.warn('Error fetching/setting user profile:', err);
          setUserProfileState({
            uid: fbUser.uid,
            email: fbUser.email || '',
            displayName: fbUser.displayName || 'Pengguna',
            role: fbUser.email?.toLowerCase() === ADMIN_EMAIL.toLowerCase() ? 'admin' : 'operator',
          });
        }
      } else {
        setUser(null);
        setUserProfileState(null);
        setIsDemoMode(false);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const setDemoUser = (role: UserRole) => {
    setIsDemoMode(true);
    let displayName = 'Sahwanto, S.Pd. (Kepala Sekolah)';
    let email = ADMIN_EMAIL;

    if (role === 'operator') {
      displayName = 'Operator Kepegawaian (Rudi Hartono)';
      email = 'operator.sdnlanas1@gmail.com';
    } else if (role === 'kepala_sekolah') {
      displayName = 'Sahwanto, S.Pd. (Kepala Sekolah)';
      email = 'kepala.sdnlanas1@gmail.com';
    } else if (role === 'auditor') {
      displayName = 'Pengawas / Auditor Dinas Pendidikan';
      email = 'auditor.disdik.bondowoso@gmail.com';
    }

    setUserProfileState({
      uid: `demo-${role}`,
      email,
      displayName,
      role,
      createdAt: new Date().toISOString(),
    });
  };

  const handleLogin = async () => {
    try {
      setLoading(true);
      await loginWithGoogle();
    } catch (err) {
      console.error('Login failed:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      setLoading(true);
      if (!isDemoMode && auth.currentUser) {
        await logoutUser();
      }
      // Set to read-only auditor on logout
      setDemoUser('auditor');
    } finally {
      setLoading(false);
    }
  };

  const switchRoleForDemo = (role: UserRole) => {
    if (userProfile) {
      setUserProfileState({
        ...userProfile,
        role,
      });
    } else {
      setDemoUser(role);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        userProfile,
        loading,
        connectionStatus,
        connectionMessage,
        login: handleLogin,
        logout: handleLogout,
        switchRoleForDemo,
        checkConnectionNow,
        isDemoMode,
        setDemoUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
};
