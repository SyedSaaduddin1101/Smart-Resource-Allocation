import React, { useEffect, useState } from 'react';
import { db, auth } from '../firebase/firebase';
import { collection, query, where, getDocs, deleteDoc, doc, updateDoc } from 'firebase/firestore';

export default function DataOrganizer() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const user = auth.currentUser;

  useEffect(() => {
    const fetchMyTasks = async () => {
      const q = query(collection(db, 'tasks'), where('createdBy', '==', user.uid));
      const snap = await getDocs(q);
      setTasks(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      setLoading(false);
    };
    fetchMyTasks();
  }, [user]);

  const deleteTask = async (id) => {
    if (confirm('Delete this task?')) {
      await deleteDoc(doc(db, 'tasks', id));
      setTasks(tasks.filter(t => t.id !== id));
    }
  };

  const updateUrgency = async (id, newUrgency) => {
    await updateDoc(doc(db, 'tasks', id), { urgency: newUrgency });
    setTasks(tasks.map(t => t.id === id ? { ...t, urgency: newUrgency } : t));
  };

  if (loading) return <div className="text-center text-white p-10">Loading your submissions...</div>;

  return (
    <div className="glass-card p-6">
      <h2 className="text-2xl font-bold text-white mb-4">Data Organizer</h2>
      <p className="text-white/70 mb-4">Review, edit, and organize your submitted data</p>
      {tasks.length === 0 && <p className="text-white/50">You haven't submitted any tasks yet.</p>}
      <div className="space-y-4 max-h-[70vh] overflow-y-auto custom-scroll">
        {tasks.map(task => (
          <div key={task.id} className="bg-white/10 p-4 rounded-lg">
            <p className="text-white font-medium">{task.description}</p>
            <div className="flex flex-wrap gap-3 mt-2 items-center">
              <label className="text-white/70 text-sm">Urgency:</label>
              <select value={task.urgency} onChange={e => updateUrgency(task.id, e.target.value)} className="bg-white/20 text-white rounded px-2 py-1 text-sm">
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
              <span className="text-white/50 text-xs">Created: {task.createdAt?.toDate().toLocaleString()}</span>
              <button onClick={() => deleteTask(task.id)} className="ml-auto text-red-300 text-sm">Delete</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}