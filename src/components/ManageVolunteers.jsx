import React, { useEffect, useState } from 'react';
import { db } from '../firebase/firebase';
import { collection, getDocs, updateDoc, doc } from 'firebase/firestore';

export default function ManageVolunteers() {
  const [volunteers, setVolunteers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchVolunteers = async () => {
      const snap = await getDocs(collection(db, 'users'));
      setVolunteers(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      setLoading(false);
    };
    fetchVolunteers();
  }, []);

  const updateSkill = async (volunteerId, skill) => {
    await updateDoc(doc(db, 'users', volunteerId), { skill });
    setVolunteers(volunteers.map(v => v.id === volunteerId ? { ...v, skill } : v));
  };

  if (loading) return <div>Loading volunteers...</div>;

  return (
    <div className="glass-card p-6">
      <h2 className="text-2xl font-bold text-white mb-4">Manage Volunteers</h2>
      <div className="space-y-4 max-h-[70vh] overflow-y-auto">
        {volunteers.map(vol => (
          <div key={vol.id} className="bg-white/10 p-4 rounded-lg">
            <p className="text-white font-medium">{vol.name || vol.email}</p>
            <div className="flex flex-wrap gap-3 mt-2 items-center">
              <select value={vol.skill || 'general'} onChange={e => updateSkill(vol.id, e.target.value)} className="bg-white/20 text-white rounded px-2 py-1 text-sm">
                <option value="general">General</option>
                <option value="medical">Medical</option>
                <option value="food">Food</option>
                <option value="logistics">Logistics</option>
              </select>
              <span className="text-white/50 text-sm">Points: {vol.points || 0}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}