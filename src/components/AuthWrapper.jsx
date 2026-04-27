import React, { useState, useEffect, createContext, useContext } from 'react';
import { 
  auth, 
  signInWithGoogle, 
  signInWithEmail, 
  signUpWithEmail, 
  resetPassword, 
  resendVerificationEmail,
  logout, 
  db 
} from '../firebase/firebase';
import { doc, setDoc, getDoc } from 'firebase/firestore';

const AppContext = createContext();
export const useApp = () => useContext(AppContext);

const getFriendlyErrorMessage = (errorCode) => {
  const errors = {
    'auth/invalid-credential': 'Invalid credentials. Please check your email and password.',
    'auth/wrong-password': 'Invalid credentials. Please check your email and password.',
    'auth/user-not-found': 'Invalid credentials. Please check your email and password.',
    'auth/email-already-in-use': 'This email is already registered. Please sign in instead.',
    'auth/weak-password': 'Password should be at least 6 characters.',
    'auth/too-many-requests': 'Too many failed attempts. Please try again later.',
    'auth/network-request-failed': 'Network error. Check your connection.',
    'auth/internal-error': 'Something went wrong. Please try again.',
  };
  return errors[errorCode] || 'An error occurred. Please try again.';
};

export default function AuthWrapper({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [resetSent, setResetSent] = useState(false);
  const [authLoading, setAuthLoading] = useState(false);
  const [needsVerification, setNeedsVerification] = useState(false);
  const [pendingUser, setPendingUser] = useState(null);
  const [verificationMsg, setVerificationMsg] = useState('');
  const [isAdmin, setIsAdmin] = useState(false);
  const [points, setPoints] = useState(0);
  const [badges, setBadges] = useState([]);
  const [userSkill, setUserSkill] = useState('general');
  const [profileSidebarOpen, setProfileSidebarOpen] = useState(false);

  useEffect(() => {
    const unsub = auth.onAuthStateChanged(async (firebaseUser) => {
      if (firebaseUser) {
        const isEmailProvider = firebaseUser.providerData.some(p => p.providerId === 'password');
        if (isEmailProvider && !firebaseUser.emailVerified) {
          setPendingUser(firebaseUser);
          setNeedsVerification(true);
          setUser(null);
          setLoading(false);
          return;
        }
        const adminEmails = ['admin@bridgemapper.com', 'your-email@gmail.com'];
        setIsAdmin(adminEmails.includes(firebaseUser.email));
        
        const userRef = doc(db, 'users', firebaseUser.uid);
        const snap = await getDoc(userRef);
        if (snap.exists()) {
          setPoints(snap.data().points || 0);
          setBadges(snap.data().badges || []);
          setUserSkill(snap.data().skill || 'general');
        } else {
          await setDoc(userRef, {
            email: firebaseUser.email,
            name: firebaseUser.displayName,
            photoURL: firebaseUser.photoURL,
            points: 0,
            badges: [],
            skill: 'general',
            createdAt: new Date()
          });
        }
        setUser(firebaseUser);
        setNeedsVerification(false);
      } else {
        setUser(null);
        setIsAdmin(false);
      }
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const updateSkill = async (skill) => {
    if (!user) return;
    setUserSkill(skill);
    await setDoc(doc(db, 'users', user.uid), { skill }, { merge: true });
    window.dispatchEvent(new CustomEvent('skillChanged', { detail: { skill } }));
  };

  const handleEmailAuth = async (e) => {
    e.preventDefault();
    setError('');
    setAuthLoading(true);
    setVerificationMsg('');
    try {
      if (isLogin) {
        const cred = await signInWithEmail(email, password);
        if (!cred.user.emailVerified) {
          setPendingUser(cred.user);
          setNeedsVerification(true);
          setError('Please verify your email first.');
          await auth.signOut();
        }
      } else {
        if (!name.trim()) throw new Error('Please enter your name');
        const cred = await signUpWithEmail(email, password, name);
        setPendingUser(cred.user);
        setNeedsVerification(true);
        setError('Verification email sent! Please check your inbox.');
      }
    } catch (err) {
      setError(getFriendlyErrorMessage(err.code));
    }
    setAuthLoading(false);
  };

  const handleReset = async () => {
    if (!email) { setError('Enter email'); return; }
    setAuthLoading(true);
    try {
      await resetPassword(email);
      setResetSent(true);
      setError('');
    } catch (err) {
      setError(getFriendlyErrorMessage(err.code));
    }
    setAuthLoading(false);
  };

  const resendVerif = async () => {
    if (!pendingUser) return;
    setAuthLoading(true);
    try {
      await resendVerificationEmail(pendingUser);
      setVerificationMsg('Verification email resent!');
    } catch (err) {
      setError(getFriendlyErrorMessage(err.code));
    }
    setAuthLoading(false);
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center"><div className="spinner"></div></div>;

  if (needsVerification && pendingUser) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="glass-card p-8 max-w-md text-center">
          <h2 className="text-2xl font-bold text-white">Verify Your Email</h2>
          <p className="text-white/80 mt-2">We sent a verification link to <strong>{pendingUser.email}</strong>.</p>
          {verificationMsg && <p className="text-green-300 mt-2">{verificationMsg}</p>}
          <button onClick={resendVerif} disabled={authLoading} className="btn-primary mt-4">Resend Email</button>
          <button onClick={() => { setNeedsVerification(false); auth.signOut(); }} className="text-white/70 underline block w-full mt-3">Back to Sign In</button>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="glass-card p-8 max-w-md w-full">
          <h1 className="text-3xl font-bold text-white text-center mb-6">BridgeMapper</h1>
          {!resetSent ? (
            <form onSubmit={handleEmailAuth} className="space-y-4">
              {!isLogin && (
                <input type="text" placeholder="Full Name" value={name} onChange={e => setName(e.target.value)} className="w-full bg-white/10 border border-white/20 rounded-xl p-3 text-white placeholder-white/50" required />
              )}
              <input type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} className="w-full bg-white/10 border border-white/20 rounded-xl p-3 text-white placeholder-white/50" required />
              <input type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} className="w-full bg-white/10 border border-white/20 rounded-xl p-3 text-white placeholder-white/50" required />
              {error && <p className="text-red-300 text-sm">{error}</p>}
              <button type="submit" disabled={authLoading} className="btn-primary w-full">{authLoading ? 'Please wait...' : (isLogin ? 'Sign In' : 'Create Account')}</button>
            </form>
          ) : (
            <p className="text-green-300 text-center">Password reset email sent.</p>
          )}
          <div className="mt-4 text-center">
            {!resetSent && <button onClick={() => setIsLogin(!isLogin)} className="text-white/80 underline">{isLogin ? 'Create account' : 'Sign in'}</button>}
            {isLogin && !resetSent && <button onClick={handleReset} className="block mt-2 text-white/60 text-sm">Forgot password?</button>}
            {resetSent && <button onClick={() => setResetSent(false)} className="text-white/80 underline mt-2">Back to sign in</button>}
          </div>
          <div className="relative my-6"><div className="absolute inset-0 flex items-center"><div className="w-full border-t border-white/30"></div></div><div className="relative flex justify-center text-sm"><span className="px-3 bg-transparent text-white/70">OR</span></div></div>
          <button onClick={signInWithGoogle} className="w-full bg-white/10 border border-white/30 hover:bg-white/20 text-white font-medium py-3 rounded-xl flex items-center justify-center gap-3 transition-all">
            <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" className="w-5 h-5" />
            Sign in with Google
          </button>
        </div>
      </div>
    );
  }

  const appContextValue = {
    isAdmin,
    profileSidebarOpen,
    setProfileSidebarOpen,
    user,
    points,
    badges,
    userSkill,
    updateSkill
  };

  return (
    <AppContext.Provider value={appContextValue}>
      <div className="min-h-screen">
        <div className="glass-card rounded-none sticky top-0 z-50 px-6 py-3 flex justify-between items-center flex-wrap gap-3">
          <div className="flex items-center gap-2">
            <button onClick={() => setProfileSidebarOpen(!profileSidebarOpen)} className="text-white text-2xl focus:outline-none">☰</button>
            <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center"><span className="text-white text-sm">BM</span></div>
            <span className="font-bold text-xl text-white">BridgeMapper</span>
            <div className="flex items-center gap-2 ml-4 bg-white/10 rounded-full px-3 py-1">
              <span className="text-white text-sm">⭐ {points}</span>
              {badges.map(b => <span key={b} title={b} className="text-sm">🏅</span>)}
            </div>
          </div>
          <div className="flex items-center gap-3">
            <select value={userSkill} onChange={e => updateSkill(e.target.value)} className="bg-white/20 text-white rounded-full px-3 py-1 text-sm">
              <option value="general" className="bg-gray-800 text-white">General</option>
              <option value="medical" className="bg-gray-800 text-white">Medical</option>
              <option value="food" className="bg-gray-800 text-white">Food</option>
              <option value="logistics" className="bg-gray-800 text-white">Logistics</option>
            </select>
            {user.photoURL && <img src={user.photoURL} alt="profile" className="w-8 h-8 rounded-full border border-white/30" onError={(e) => e.target.style.display = 'none'} />}
            <span className="text-sm text-white/80 hidden sm:inline">{user.displayName || user.email}</span>
            <button onClick={logout} className="bg-red-500/80 hover:bg-red-600 text-white text-sm px-3 py-1.5 rounded-full transition">Sign out</button>
          </div>
        </div>
        {children}
      </div>
    </AppContext.Provider>
  );
}