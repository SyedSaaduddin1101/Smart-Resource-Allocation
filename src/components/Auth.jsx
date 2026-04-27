import { useState, useEffect } from 'react';
import { auth, signInWithGoogle, logout, db } from '../firebase/firebase';
import { doc, setDoc, getDoc } from 'firebase/firestore';

export default function Auth({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [volunteerSkill, setVolunteerSkill] = useState('');

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (firebaseUser) => {
      console.log("Auth state changed:", firebaseUser?.email);
      if (firebaseUser) {
        const userRef = doc(db, 'volunteers', firebaseUser.uid);
        const userSnap = await getDoc(userRef);
        if (userSnap.exists()) {
          setVolunteerSkill(userSnap.data().skill);
        }
        setUser(firebaseUser);
      } else {
        setUser(null);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const updateSkill = async (skill) => {
    if (!user) return;
    await setDoc(doc(db, 'volunteers', user.uid), {
      email: user.email,
      name: user.displayName,
      skill: skill,
      createdAt: new Date()
    }, { merge: true });
    setVolunteerSkill(skill);
  };

  const handleSignIn = async () => {
    try {
      await signInWithGoogle();
    } catch (error) {
      console.error("Sign-in error:", error);
      alert("Sign-in failed: " + error.message);
    }
  };

  if (loading) return <div className="text-center p-8">Loading...</div>;

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-gray-100">
        <div className="bg-white p-8 rounded-lg shadow-md text-center">
          <h1 className="text-2xl font-bold mb-4">BridgeMapper</h1>
          <p className="mb-6">Sign in to volunteer or report issues</p>
          <button
            onClick={handleSignIn}
            className="bg-blue-600 text-white px-6 py-2 rounded flex items-center gap-2 mx-auto"
          >
            <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" className="w-5 h-5" />
            Sign in with Google
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="bg-green-100 p-2 text-sm flex justify-between items-center px-4">
        <span>👋 {user.displayName} ({volunteerSkill || 'No skill set'})</span>
        <div className="flex gap-2">
          {!volunteerSkill && (
            <select onChange={(e) => updateSkill(e.target.value)} defaultValue="" className="border rounded p-1">
              <option value="" disabled>Select your skill</option>
              <option value="medical">Medical</option>
              <option value="logistics">Logistics</option>
              <option value="food">Food Distribution</option>
              <option value="general">General Help</option>
            </select>
          )}
          <button onClick={logout} className="text-red-600">Sign out</button>
        </div>
      </div>
      {children}
    </div>
  );
}