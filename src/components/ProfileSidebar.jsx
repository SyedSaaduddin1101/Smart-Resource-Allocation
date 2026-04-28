import React, { useState, useEffect } from 'react';
import { updateProfile, updatePassword, reauthenticateWithCredential, EmailAuthProvider } from 'firebase/auth';
import { auth, db } from '../firebase/firebase';
import { doc, setDoc, collection, query, where, onSnapshot } from 'firebase/firestore';
import { useNotification } from '../context/NotificationContext';
import { 
  XMarkIcon, 
  PencilSquareIcon, 
  KeyIcon, 
  ArrowRightOnRectangleIcon,
  ChartBarIcon,
  MapIcon,
  QueueListIcon,
  ClipboardDocumentListIcon,
  ShieldCheckIcon,
  UserGroupIcon,
  FireIcon
} from '@heroicons/react/24/outline';

export default function ProfileSidebar({ isOpen, onClose, user, isAdmin, setActiveTab }) {
  const { showNotification } = useNotification();
  const [displayName, setDisplayName] = useState(user.displayName || '');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [makingAdmin, setMakingAdmin] = useState(false);
  const [urgencyStats, setUrgencyStats] = useState({ high: 0, medium: 0, low: 0 });

  // Fetch urgency stats in real time
  useEffect(() => {
    const q = query(collection(db, 'tasks'), where('status', '==', 'open'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      let high = 0, medium = 0, low = 0;
      snapshot.forEach(doc => {
        const urgency = doc.data().urgency;
        if (urgency === 'high') high++;
        else if (urgency === 'medium') medium++;
        else if (urgency === 'low') low++;
      });
      setUrgencyStats({ high, medium, low });
    });
    return () => unsubscribe();
  }, []);

  const updateName = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    try {
      await updateProfile(auth.currentUser, { displayName });
      setMessage('Name updated successfully');
      setTimeout(() => setMessage(''), 3000);
    } catch (err) {
      setError(err.message);
    }
  };

  const changePassword = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
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

  const makeMeAdmin = async () => {
    setMakingAdmin(true);
    try {
      const userRef = doc(db, 'users', user.uid);
      await setDoc(userRef, { isAdmin: true }, { merge: true });
      showNotification('You are now an admin! Refresh the page to see admin sections.', 'success');
      window.location.reload();
    } catch (err) {
      showNotification('Error: ' + err.message, 'error');
    }
    setMakingAdmin(false);
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 transition-opacity" onClick={onClose}></div>
      
      <div className="fixed top-0 right-0 w-full sm:w-96 h-full bg-gradient-to-b from-gray-900 to-gray-800 shadow-2xl z-50 flex flex-col animate-slide-in-right">
        {/* Header */}
        <div className="relative bg-gradient-to-r from-purple-600 to-pink-600 p-6">
          <button onClick={onClose} className="absolute top-4 right-4 text-white/80 hover:text-white transition">
            <XMarkIcon className="w-6 h-6" />
          </button>
          <div className="flex flex-col items-center mt-2">
            {user.photoURL ? (
              <img src={user.photoURL} alt="Profile" className="w-24 h-24 rounded-full border-4 border-white/30 shadow-lg mb-3" />
            ) : (
              <div className="w-24 h-24 rounded-full bg-white/20 flex items-center justify-center text-4xl text-white mb-3">
                {user.displayName?.[0] || user.email?.[0] || 'U'}
              </div>
            )}
            <h3 className="text-xl font-bold text-white">{user.displayName || user.email}</h3>
            <p className="text-white/70 text-sm mt-1">{user.email}</p>
          </div>
        </div>

        {/* Menu Items */}
        <div className="flex-1 overflow-y-auto py-4 px-4 space-y-6">
          {/* Urgency Overview – new section */}
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3">
            <div className="flex items-center gap-2 text-white/80 text-sm font-semibold mb-2">
              <FireIcon className="w-4 h-4 text-orange-400" />
              <span>Urgency Overview (Open Tasks)</span>
            </div>
            <div className="grid grid-cols-3 gap-2 text-center">
              <div>
                <div className="text-red-400 font-bold text-lg">{urgencyStats.high}</div>
                <div className="text-white/60 text-xs">High</div>
              </div>
              <div>
                <div className="text-orange-400 font-bold text-lg">{urgencyStats.medium}</div>
                <div className="text-white/60 text-xs">Medium</div>
              </div>
              <div>
                <div className="text-green-400 font-bold text-lg">{urgencyStats.low}</div>
                <div className="text-white/60 text-xs">Low</div>
              </div>
            </div>
          </div>

          {/* Main Navigation */}
          <div>
            <p className="text-xs font-semibold text-white/40 uppercase tracking-wider mb-2">Main</p>
            <div className="space-y-1">
              <SidebarItem icon={<ClipboardDocumentListIcon className="w-5 h-5" />} label="Create Task" onClick={() => handleNav('ingest')} />
              <SidebarItem icon={<MapIcon className="w-5 h-5" />} label="Heatmap" onClick={() => handleNav('heatmap')} />
              <SidebarItem icon={<QueueListIcon className="w-5 h-5" />} label="Priority Queue" onClick={() => handleNav('priority')} />
              <SidebarItem icon={<ChartBarIcon className="w-5 h-5" />} label="Impact Dashboard" onClick={() => handleNav('impact')} />
              <SidebarItem icon={<ClipboardDocumentListIcon className="w-5 h-5" />} label="Data Organizer" onClick={() => handleNav('organizer')} />
            </div>
          </div>

          {/* Administration (always visible) */}
          <div>
            <p className="text-xs font-semibold text-white/40 uppercase tracking-wider mb-2">Administration</p>
            <div className="space-y-1">
              <SidebarItem icon={<ShieldCheckIcon className="w-5 h-5" />} label="Admin Dashboard" onClick={() => handleNav('admin')} />
              <SidebarItem icon={<ClipboardDocumentListIcon className="w-5 h-5" />} label="Manage Tasks" onClick={() => handleNav('manageTasks')} />
              <SidebarItem icon={<UserGroupIcon className="w-5 h-5" />} label="Manage Volunteers" onClick={() => handleNav('manageVolunteers')} />
            </div>
          </div>

          {/* "Make me Admin" button – only if not already admin */}
          {!isAdmin && (
            <div className="mt-4 p-3 bg-yellow-600/30 rounded-xl border border-yellow-500/50">
              <button
                onClick={makeMeAdmin}
                disabled={makingAdmin}
                className="w-full bg-yellow-600 hover:bg-yellow-700 text-white font-semibold py-2 rounded-lg transition"
              >
                {makingAdmin ? 'Making you admin...' : '👑 Make me Admin'}
              </button>
              <p className="text-xs text-white/50 text-center mt-2">Click this to get full admin access.</p>
            </div>
          )}

          {/* Account Settings */}
          <div>
            <p className="text-xs font-semibold text-white/40 uppercase tracking-wider mb-2">Account</p>
            <div className="space-y-4">
              <div className="bg-white/5 rounded-xl p-3">
                <label className="text-white/70 text-sm flex items-center gap-2 mb-2">
                  <PencilSquareIcon className="w-4 h-4" />
                  Display Name
                </label>
                <form onSubmit={updateName} className="flex gap-2">
                  <input
                    type="text"
                    value={displayName}
                    onChange={e => setDisplayName(e.target.value)}
                    className="flex-1 bg-white/10 border border-white/20 rounded-lg px-3 py-1.5 text-white text-sm"
                  />
                  <button type="submit" className="bg-purple-600 hover:bg-purple-700 text-white px-3 py-1.5 rounded-lg text-sm transition">
                    Save
                  </button>
                </form>
              </div>

              <div className="bg-white/5 rounded-xl p-3">
                <button
                  onClick={() => setShowPassword(!showPassword)}
                  className="text-white/70 text-sm flex items-center gap-2 w-full text-left"
                >
                  <KeyIcon className="w-4 h-4" />
                  Change Password
                </button>
                {showPassword && (
                  <form onSubmit={changePassword} className="mt-3 space-y-2">
                    <input
                      type="password"
                      placeholder="Current Password"
                      value={currentPassword}
                      onChange={e => setCurrentPassword(e.target.value)}
                      className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-1.5 text-white text-sm"
                      required
                    />
                    <input
                      type="password"
                      placeholder="New Password"
                      value={newPassword}
                      onChange={e => setNewPassword(e.target.value)}
                      className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-1.5 text-white text-sm"
                      required
                    />
                    <input
                      type="password"
                      placeholder="Confirm New Password"
                      value={confirmPassword}
                      onChange={e => setConfirmPassword(e.target.value)}
                      className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-1.5 text-white text-sm"
                      required
                    />
                    <button type="submit" className="w-full bg-purple-600 hover:bg-purple-700 text-white py-1.5 rounded-lg text-sm transition">
                      Update Password
                    </button>
                  </form>
                )}
              </div>
            </div>
          </div>

          {message && <div className="bg-green-500/20 text-green-300 p-2 rounded text-sm text-center">{message}</div>}
          {error && <div className="bg-red-500/20 text-red-300 p-2 rounded text-sm text-center">{error}</div>}
        </div>

        {/* Footer */}
        <div className="border-t border-white/10 p-4">
          <button
            onClick={async () => { await auth.signOut(); }}
            className="w-full bg-red-500/80 hover:bg-red-600 text-white py-2 rounded-xl flex items-center justify-center gap-2 transition"
          >
            <ArrowRightOnRectangleIcon className="w-5 h-5" />
            Sign Out
          </button>
          <p className="text-white/30 text-xs text-center mt-3">BridgeMapper v1.0</p>
        </div>
      </div>

      <style>{`
        @keyframes slideInRight {
          from { transform: translateX(100%); }
          to { transform: translateX(0); }
        }
        .animate-slide-in-right {
          animation: slideInRight 0.3s ease-out;
        }
      `}</style>
    </>
  );
}

function SidebarItem({ icon, label, onClick }) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition-all duration-200 group"
    >
      <span className="text-purple-400 group-hover:scale-110 transition-transform">{icon}</span>
      <span className="text-sm font-medium">{label}</span>
    </button>
  );
}