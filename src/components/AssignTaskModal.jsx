import React, { useState, useEffect } from 'react';
import { db } from '../firebase/firebase';
import { collection, getDocs, updateDoc, doc } from 'firebase/firestore';

export default function AssignTaskModal({ taskId, onClose, onAssigned }) {
  const [volunteers, setVolunteers] = useState([]);
  const [selectedVolunteer, setSelectedVolunteer] = useState('');
  const [loading, setLoading] = useState(true);
  const [assigning, setAssigning] = useState(false);

  useEffect(() => {
    const fetchVolunteers = async () => {
      const snap = await getDocs(collection(db, 'users'));
      setVolunteers(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      setLoading(false);
    };
    fetchVolunteers();
  }, []);

  const assign = async () => {
    if (!selectedVolunteer) return;
    setAssigning(true);
    await updateDoc(doc(db, 'tasks', taskId), {
      assignedTo: selectedVolunteer,
      status: 'assigned',
      assignedAt: new Date()
    });
    setAssigning(false);
    onAssigned();
    onClose();
  };

  return (
    <>
      <div className="fixed inset-0 bg-black/50 z-50" onClick={onClose}></div>
      <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white/10 backdrop-blur-md rounded-2xl p-6 w-96 z-50 glass-card">
        <h3 className="text-xl font-bold text-white mb-4">Assign Volunteer</h3>
        {loading ? (
          <p className="text-white/80">Loading volunteers...</p>
        ) : (
          <>
            <select value={selectedVolunteer} onChange={e => setSelectedVolunteer(e.target.value)} className="w-full bg-white/10 border border-white/20 rounded-xl p-2 text-white mb-4">
              <option value="">Select volunteer</option>
              {volunteers.map(v => (
                <option key={v.id} value={v.id}>{v.name || v.email}</option>
              ))}
            </select>
            <div className="flex gap-2">
              <button onClick={assign} disabled={assigning || !selectedVolunteer} className="btn-primary flex-1">Assign</button>
              <button onClick={onClose} className="btn-secondary flex-1">Cancel</button>
            </div>
          </>
        )}
      </div>
    </>
  );
}