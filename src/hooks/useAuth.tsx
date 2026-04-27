import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { onAuthStateChangedListener, firebaseSignOut } from "@/integrations/firebase/authHelper";
import type { User as SupabaseUser, Session } from "@supabase/supabase-js";
import type { User as FirebaseUser } from "firebase/auth";

interface AuthContextType {
  user: (SupabaseUser | FirebaseUser) | null;
  session: Session | null;
  loading: boolean;
  signOut: () => Promise<void>;
  isFirebaseUser: boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  loading: true,
  signOut: async () => {},
  isFirebaseUser: false,
});

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<(SupabaseUser | FirebaseUser) | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [isFirebaseUser, setIsFirebaseUser] = useState(false);

  useEffect(() => {
    console.log('🚀 AuthProvider: Initializing auth listeners...');
    
    // Listen to Firebase auth state changes
    const unsubscribeFirebase = onAuthStateChangedListener((firebaseUser) => {
      console.log('📱 Firebase auth state changed:', firebaseUser ? firebaseUser.email : 'null');
      
      if (firebaseUser) {
        // User signed in with Firebase (Google)
        console.log('✅ Firebase user signed in:', firebaseUser.email);
        setUser(firebaseUser);
        setSession(null); // No Supabase session for Firebase users
        setIsFirebaseUser(true);
        setLoading(false);
      } else {
        // No Firebase user, check Supabase
        console.log('❌ No Firebase user, checking Supabase...');
        supabase.auth.getSession().then(({ data: { session } }) => {
          if (session?.user) {
            console.log('✅ Supabase session found:', session.user.email);
          } else {
            console.log('❌ No Supabase session');
          }
          setSession(session);
          setUser(session?.user ?? null);
          setIsFirebaseUser(false);
          setLoading(false);
        });
      }
    });

    // Also listen to Supabase auth state changes (for email/password auth)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, supabaseSession) => {
        console.log('📧 Supabase auth state changed:', supabaseSession?.user?.email || 'null');
        
        if (supabaseSession?.user) {
          // User signed in with Supabase (email/password)
          console.log('✅ Supabase user signed in:', supabaseSession.user.email);
          setSession(supabaseSession);
          setUser(supabaseSession.user);
          setIsFirebaseUser(false);
          setLoading(false);
        }
      }
    );

    return () => {
      console.log('🛑 AuthProvider: Cleaning up listeners...');
      unsubscribeFirebase();
      subscription.unsubscribe();
    };
  }, []);

  const signOut = async () => {
    try {
      if (isFirebaseUser) {
        await firebaseSignOut();
      } else {
        await supabase.auth.signOut();
      }
      setUser(null);
      setSession(null);
      setIsFirebaseUser(false);
    } catch (error) {
      console.error("Sign out error:", error);
    }
  };

  return (
    <AuthContext.Provider value={{ user, session, loading, signOut, isFirebaseUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
