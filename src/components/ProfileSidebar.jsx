import React, { useState } from 'react';
import { updateProfile, updatePassword, reauthenticateWithCredential, EmailAuthProvider } from 'firebase/auth';
import { auth } from '../firebase/firebase';

export default function ProfileSidebar({ isOpen, onClose, user, isAdmin, setActiveTab }) {
  const [displayName, setDisplayName] = useState(user.displayName || '');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const updateName = async (e) => {
    e.preventDefault();
    try {
      await updateProfile(auth.currentUser, { displayName });
      setMessage('Name updated!');
      setTimeout(() => setMessage(''), 3000);
    } catch (err) {
      setError(err.message);
    }
  };

  const changePassword = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setError('New passwords do not match');
      return;
    }
    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }
    try {
      const credential = EmailAuthProvider.credential(user.email, currentPassword);
      await reauthenticateWithCredential(user, credential);
      await updatePassword(auth.currentUser, newPassword);
      setMessage('Password changed successfully!');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setShowPassword(false);
      setTimeout(() => setMessage(''), 3000);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleNav = (tab) => {
    setActiveTab(tab);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black/50 z-40" onClick={onClose}></div>
      <div className="fixed top-0 right-0 w-96 h-full glass-card rounded-none z-50 p-6 flex flex-col overflow-y-auto custom-scroll">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-white">Menu</h2>
          <button onClick={onClose} className="text-white text-2xl">×</button>
        </div>

        <div className="flex flex-col items-center mb-6">
          {user.photoURL ? (
            <img src={user.photoURL} alt="Profile" className="w-24 h-24 rounded-full border-2 border-white/30 mb-2" />
          ) : (
            <div className="w-24 h-24 rounded-full bg-white/20 flex items-center justify-center text-4xl mb-2">
              {user.displayName?.[0] || user.email?.[0] || 'U'}
            </div>
          )}
          <p className="text-white font-semibold text-lg">{user.displayName || user.email}</p>
          <p className="text-white/60 text-sm">{user.email}</p>
        </div>

        <div className="flex-1 space-y-5">
          {/* Navigation links for all users */}
          <div className="border-b border-white/20 pb-3">
            <h3 className="text-white font-semibold mb-2">Main</h3>
            <button onClick={() => handleNav('ingest')} className="block w-full text-left text-white/80 hover:text-white py-1">📝 Create Task</button>
            <button onClick={() => handleNav('heatmap')} className="block w-full text-left text-white/80 hover:text-white py-1">📍 Heatmap</button>
            <button onClick={() => handleNav('priority')} className="block w-full text-left text-white/80 hover:text-white py-1">📊 Priority Queue</button>
            <button onClick={() => handleNav('impact')} className="block w-full text-left text-white/80 hover:text-white py-1">📈 Impact Dashboard</button>
            <button onClick={() => handleNav('organizer')} className="block w-full text-left text-white/80 hover:text-white py-1">📂 Data Organizer</button>
          </div>

          {/* Admin links */}
          {isAdmin && (
            <div className="border-b border-white/20 pb-3">
              <h3 className="text-white font-semibold mb-2">Admin</h3>
              <button onClick={() => handleNav('admin')} className="block w-full text-left text-white/80 hover:text-white py-1">🛡️ Admin Dashboard</button>
              <button onClick={() => handleNav('manageTasks')} className="block w-full text-left text-white/80 hover:text-white py-1">📋 Manage Tasks</button>
              <button onClick={() => handleNav('manageVolunteers')} className="block w-full text-left text-white/80 hover:text-white py-1">👥 Manage Volunteers</button>
              <button onClick={() => handleNav('assignTask')} className="block w-full text-left text-white/80 hover:text-white py-1">🔗 Assign Volunteer to Task</button>
            </div>
          )}

          {/* Profile settings */}
          <div className="border-b border-white/20 pb-3">
            <h3 className="text-white font-semibold mb-2">Account</h3>
            <form onSubmit={updateName} className="space-y-2 mb-3">
              <label className="text-white/80 text-sm">Display Name</label>
              <input type="text" value={displayName} onChange={e => setDisplayName(e.target.value)} className="w-full bg-white/10 border border-white/20 rounded-xl p-2 text-white" />
              <button type="submit" className="btn-primary w-full text-sm py-2">Update Name</button>
            </form>
            <button onClick={() => setShowPassword(!showPassword)} className="btn-secondary w-full text-sm py-2">Change Password</button>
            {showPassword && (
              <form onSubmit={changePassword} className="mt-3 space-y-3">
                <input type="password" placeholder="Current Password" value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} className="w-full bg-white/10 border border-white/20 rounded-xl p-2 text-white text-sm" required />
                <input type="password" placeholder="New Password" value={newPassword} onChange={e => setNewPassword(e.target.value)} className="w-full bg-white/10 border border-white/20 rounded-xl p-2 text-white text-sm" required />
                <input type="password" placeholder="Confirm New Password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} className="w-full bg-white/10 border border-white/20 rounded-xl p-2 text-white text-sm" required />
                <button type="submit" className="btn-primary w-full text-sm py-2">Save New Password</button>
              </form>
            )}
          </div>

          {message && <div className="bg-green-500/20 text-green-300 p-2 rounded text-sm">{message}</div>}
          {error && <div className="bg-red-500/20 text-red-300 p-2 rounded text-sm">{error}</div>}
        </div>

        <div className="mt-auto pt-4 border-t border-white/20">
          <button onClick={async () => { await auth.signOut(); }} className="w-full bg-red-500/80 hover:bg-red-600 text-white py-2 rounded-full">Sign Out</button>
          <p className="text-white/30 text-xs text-center mt-3">BridgeMapper v1.0</p>
        </div>
      </div>
    </>
  );
}