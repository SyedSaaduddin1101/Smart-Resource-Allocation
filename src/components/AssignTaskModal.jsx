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
      const allUsers = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setVolunteers(allUsers);
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
      <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-gray-800 rounded-2xl p-6 w-96 z-50 shadow-2xl">
        <h3 className="text-xl font-bold text-white mb-4">Assign Volunteer</h3>
        {loading ? (
          <p className="text-white/80">Loading volunteers...</p>
        ) : (
          <>
            <select
              value={selectedVolunteer}
              onChange={e => setSelectedVolunteer(e.target.value)}
              className="w-full bg-gray-700 text-white border border-gray-600 rounded-xl p-2 mb-4 focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <option value="">Select a volunteer</option>
              {volunteers.map(v => (
                <option key={v.id} value={v.id}>
                  {v.name || v.email}
                </option>
              ))}
            </select>
            <div className="flex gap-2">
              <button onClick={assign} disabled={assigning || !selectedVolunteer} className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-xl flex-1 transition">Assign</button>
              <button onClick={onClose} className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-xl flex-1 transition">Cancel</button>
            </div>
          </>
        )}
      </div>
    </>
  );
}