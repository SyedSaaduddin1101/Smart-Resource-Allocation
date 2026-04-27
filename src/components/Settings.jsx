import React, { useState } from 'react';
import { auth } from '../firebase/firebase';
import { sendPasswordResetEmail, updateProfile } from 'firebase/auth';

export default function Settings({ user }) {
  const [displayName, setDisplayName] = useState(user.displayName || '');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const updateName = async (e) => {
    e.preventDefault();
    try {
      await updateProfile(auth.currentUser, { displayName });
      setMessage('Display name updated successfully');
      setError('');
    } catch (err) {
      setError(err.message);
    }
  };

  const sendResetEmail = async () => {
    try {
      await sendPasswordResetEmail(auth, user.email);
      setMessage('Password reset email sent!');
      setError('');
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="glass-card p-6 max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold text-white mb-4">Settings</h2>
      {message && <div className="bg-green-500/20 text-green-300 p-3 rounded mb-4">{message}</div>}
      {error && <div className="bg-red-500/20 text-red-300 p-3 rounded mb-4">{error}</div>}
      <form onSubmit={updateName} className="space-y-4">
        <div>
          <label className="block text-white mb-1">Display Name</label>
          <input type="text" value={displayName} onChange={e => setDisplayName(e.target.value)} className="w-full bg-white/10 border border-white/20 rounded-xl p-3 text-white" />
        </div>
        <button type="submit" className="btn-primary">Update Name</button>
      </form>
      <div className="mt-6">
        <button onClick={sendResetEmail} className="btn-secondary">Send Password Reset Email</button>
      </div>
    </div>
  );
}