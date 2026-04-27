import { useEffect, useState } from 'react';
import { db } from '../firebase/firebase';
import { collection, getDocs } from 'firebase/firestore';

export default function Leaderboard() {
  const [leaders, setLeaders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        const tasksSnap = await getDocs(collection(db, 'tasks'));
        const volunteerMap = new Map();
        tasksSnap.forEach(doc => {
          const task = doc.data();
          if (task.status === 'completed' && task.assignedTo) {
            volunteerMap.set(task.assignedTo, (volunteerMap.get(task.assignedTo) || 0) + 1);
          }
        });
        const sorted = Array.from(volunteerMap.entries())
          .map(([uid, count]) => ({ uid, count }))
          .sort((a,b) => b.count - a.count)
          .slice(0, 5);
        // Fetch names
        for (let leader of sorted) {
          const volunteersSnap = await getDocs(collection(db, 'volunteers'));
          const volunteer = volunteersSnap.docs.find(d => d.id === leader.uid);
          leader.name = volunteer ? volunteer.data().name || leader.uid.slice(0,8) : leader.uid.slice(0,8);
        }
        setLeaders(sorted);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchLeaderboard();
  }, []);

  if (loading) return <div className="spinner" style={{ margin: '20px auto' }}></div>;
  if (leaders.length === 0) return null;

  return (
    <div className="glass-card fade-in" style={{ marginTop: '24px' }}>
      <h3 style={{ color: 'white' }}>🏆 Top Volunteers</h3>
      {leaders.map((l, idx) => (
        <div key={l.uid} style={{ display: 'flex', justifyContent: 'space-between', marginTop: '12px', color: '#eee' }}>
          <span>{idx+1}. {l.name}</span>
          <span>{l.count} {l.count === 1 ? 'task' : 'tasks'} completed</span>
        </div>
      ))}
    </div>
  );
}