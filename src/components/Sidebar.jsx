import React from 'react';

export default function Sidebar({ isOpen, onClose, isAdmin, user, setActiveTab }) {
  if (!isOpen) return null;
  return (
    <>
      <div className="fixed inset-0 bg-black/50 z-40" onClick={onClose}></div>
      <div className="fixed top-0 left-0 w-64 h-full glass-card rounded-none z-50 p-4 flex flex-col">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-white font-bold">Menu</h2>
          <button onClick={onClose} className="text-white text-xl">×</button>
        </div>
        <div className="flex-1 space-y-2">
          <button onClick={() => { setActiveTab('ingest'); onClose(); }} className="w-full text-left text-white/80 hover:text-white py-2 px-3 rounded-lg hover:bg-white/10">Create Task</button>
          <button onClick={() => { setActiveTab('heatmap'); onClose(); }} className="w-full text-left text-white/80 hover:text-white py-2 px-3 rounded-lg hover:bg-white/10">Heatmap</button>
          <button onClick={() => { setActiveTab('priority'); onClose(); }} className="w-full text-left text-white/80 hover:text-white py-2 px-3 rounded-lg hover:bg-white/10">Priority Queue</button>
          <button onClick={() => { setActiveTab('impact'); onClose(); }} className="w-full text-left text-white/80 hover:text-white py-2 px-3 rounded-lg hover:bg-white/10">Impact Dashboard</button>
          {isAdmin && (
            <>
              <hr className="border-white/20 my-2" />
              <button onClick={() => { setActiveTab('admin'); onClose(); }} className="w-full text-left text-white/80 hover:text-white py-2 px-3 rounded-lg hover:bg-white/10">Admin Panel</button>
              <button onClick={() => { setActiveTab('settings'); onClose(); }} className="w-full text-left text-white/80 hover:text-white py-2 px-3 rounded-lg hover:bg-white/10">Settings</button>
              <button onClick={() => { setActiveTab('account'); onClose(); }} className="w-full text-left text-white/80 hover:text-white py-2 px-3 rounded-lg hover:bg-white/10">Account Info</button>
            </>
          )}
        </div>
        <div className="mt-auto pt-4 text-white/50 text-xs text-center">BridgeMapper v1.0</div>
      </div>
    </>
  );
}