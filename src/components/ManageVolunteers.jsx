import { useEffect, useState } from 'react';
import { db } from '../firebase/firebase';
import { collection, getDocs, updateDoc, doc } from 'firebase/firestore';
import { useNotification } from '../context/NotificationContext';

export default function ManageVolunteers() {
  const { showNotification } = useNotification();
  const [volunteers, setVolunteers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchVolunteers = async () => {
      try {
        const snap = await getDocs(collection(db, 'users'));
        setVolunteers(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      } catch (err) {
        showNotification('Failed to load volunteers: ' + err.message, 'error');
      } finally {
        setLoading(false);
      }
    };
    fetchVolunteers();
  }, []);

  const updateSkill = async (volunteerId, newSkill) => {
    try {
      await updateDoc(doc(db, 'users', volunteerId), { skill: newSkill });
      setVolunteers(volunteers.map(v => v.id === volunteerId ? { ...v, skill: newSkill } : v));
      showNotification('Volunteer skill updated', 'success');
    } catch (err) {
      showNotification('Error updating skill: ' + err.message, 'error');
    }
  };

  if (loading) return <div className="glass-card p-8 text-center"><div className="spinner mx-auto"></div><p className="text-white mt-4">Loading volunteers...</p></div>;

  return (
    <div className="glass-card p-6">
      <h2 className="text-2xl font-bold text-white mb-4">Manage Volunteers</h2>
      <div className="max-h-96 overflow-y-auto space-y-2 custom-scroll">
        {volunteers.map(vol => (
          <div key={vol.id} className="bg-white/10 p-3 rounded-lg">
            <p className="text-white font-medium">{vol.name} ({vol.email})</p>
            <div className="flex justify-between items-center mt-2">
              <span className="text-white/80">Points: ⭐ {vol.points || 0}</span>
              <select
                value={vol.skill || 'general'}
                onChange={e => updateSkill(vol.id, e.target.value)}
                style={{
                  backgroundColor: 'white',
                  color: 'black',
                  border: '1px solid #ccc',
                  borderRadius: '0.5rem',
                  padding: '0.25rem 0.5rem',
                  fontSize: '0.875rem',
                  fontWeight: '500',
                  outline: 'none'
                }}
              >
                <option value="general" style={{ backgroundColor: 'white', color: 'black' }}>General</option>
                <option value="medical" style={{ backgroundColor: 'white', color: 'black' }}>Medical</option>
                <option value="food" style={{ backgroundColor: 'white', color: 'black' }}>Food</option>
                <option value="logistics" style={{ backgroundColor: 'white', color: 'black' }}>Logistics</option>
              </select>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}