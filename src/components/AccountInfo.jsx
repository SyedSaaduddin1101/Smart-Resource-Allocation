import React from 'react';

export default function AccountInfo({ user }) {
  return (
    <div className="glass-card p-6 max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold text-white mb-4">Account Information</h2>
      <div className="space-y-3">
        <div><span className="text-white/70">Email:</span> <span className="text-white">{user.email}</span></div>
        <div><span className="text-white/70">Display Name:</span> <span className="text-white">{user.displayName || 'Not set'}</span></div>
        <div><span className="text-white/70">User ID:</span> <span className="text-white text-sm break-all">{user.uid}</span></div>
        <div><span className="text-white/70">Email Verified:</span> <span className="text-white">{user.emailVerified ? 'Yes' : 'No'}</span></div>
        <div><span className="text-white/70">Provider:</span> <span className="text-white">{user.providerData[0]?.providerId || 'unknown'}</span></div>
      </div>
    </div>
  );
}