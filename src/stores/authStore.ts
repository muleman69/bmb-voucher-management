import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { 
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  User as FirebaseUser 
} from 'firebase/auth';
import { auth } from '../lib/firebase/config';
import toast from 'react-hot-toast';

interface AuthState {
  isAuthenticated: boolean;
  user: FirebaseUser | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  initialize: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      isAuthenticated: false,
      user: null,
      isLoading: true,

      initialize: () => {
        // Set up auth state listener
        onAuthStateChanged(auth, (user) => {
          set({ 
            user, 
            isAuthenticated: !!user,
            isLoading: false
          });
        });
      },

      login: async (email: string, password: string) => {
        try {
          const userCredential = await signInWithEmailAndPassword(auth, email, password);
          set({ 
            isAuthenticated: true, 
            user: userCredential.user 
          });
          toast.success('Successfully logged in');
        } catch (error) {
          console.error('Login error:', error);
          toast.error('Invalid email or password');
          throw error;
        }
      },

      logout: async () => {
        try {
          await signOut(auth);
          set({ isAuthenticated: false, user: null });
          toast.success('Successfully logged out');
        } catch (error) {
          console.error('Logout error:', error);
          toast.error('Error logging out');
          throw error;
        }
      }
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({ isAuthenticated: state.isAuthenticated })
    }
  )
);
