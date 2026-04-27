import React, { useEffect, useState } from 'react';
import { db } from '../firebase/firebase';
import { collection, getDocs, updateDoc, doc, deleteDoc } from 'firebase/firestore';

export default function ManageTasks({ openAssignModal }) {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTasks = async () => {
      const snap = await getDocs(collection(db, 'tasks'));
      setTasks(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      setLoading(false);
    };
    fetchTasks();
  }, []);

  const updateStatus = async (taskId, newStatus) => {
    await updateDoc(doc(db, 'tasks', taskId), { status: newStatus });
    setTasks(tasks.map(t => t.id === taskId ? { ...t, status: newStatus } : t));
  };

  const deleteTask = async (taskId) => {
    if (confirm('Delete this task?')) {
      await deleteDoc(doc(db, 'tasks', taskId));
      setTasks(tasks.filter(t => t.id !== taskId));
    }
  };

  if (loading) return <div>Loading tasks...</div>;

  return (
    <div className="glass-card p-6">
      <h2 className="text-2xl font-bold text-white mb-4">Manage Tasks</h2>
      <div className="space-y-4 max-h-[70vh] overflow-y-auto">
        {tasks.map(task => (
          <div key={task.id} className="bg-white/10 p-4 rounded-lg">
            <p className="text-white font-medium">{task.description?.slice(0, 100)}</p>
            <div className="flex flex-wrap gap-3 mt-2 items-center">
              <select value={task.status} onChange={e => updateStatus(task.id, e.target.value)} className="bg-white/20 text-white rounded px-2 py-1 text-sm">
                <option value="open">Open</option>
                <option value="assigned">Assigned</option>
                <option value="completed">Completed</option>
              </select>
              <button onClick={() => openAssignModal(task.id)} className="bg-purple-600 text-white px-2 py-1 rounded text-sm">Assign Volunteer</button>
              <button onClick={() => deleteTask(task.id)} className="text-red-300 text-sm">Delete</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}