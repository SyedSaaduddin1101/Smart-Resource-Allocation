import { useEffect, useState } from 'react';
import { db } from '../firebase/firebase';
import { collection, getDocs, updateDoc, doc, deleteDoc } from 'firebase/firestore';

export default function AdminDashboard() {
  const [tasks, setTasks] = useState([]);
  const [volunteers, setVolunteers] = useState([]);
  const [stats, setStats] = useState({ total: 0, completed: 0, open: 0, assigned: 0 });
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('tasks');

  useEffect(() => {
    const fetchData = async () => {
      const tasksSnap = await getDocs(collection(db, 'tasks'));
      const allTasks = tasksSnap.docs.map(d => ({ id: d.id, ...d.data() }));
      setTasks(allTasks);
      setStats({
        total: allTasks.length,
        completed: allTasks.filter(t => t.status === 'completed').length,
        open: allTasks.filter(t => t.status === 'open').length,
        assigned: allTasks.filter(t => t.status === 'assigned').length,
      });
      const volunteersSnap = await getDocs(collection(db, 'users'));
      setVolunteers(volunteersSnap.docs.map(d => ({ id: d.id, ...d.data() })));
      setLoading(false);
    };
    fetchData();
  }, []);

  const updateTaskStatus = async (taskId, newStatus) => {
    await updateDoc(doc(db, 'tasks', taskId), { status: newStatus });
    const tasksSnap = await getDocs(collection(db, 'tasks'));
    const allTasks = tasksSnap.docs.map(d => ({ id: d.id, ...d.data() }));
    setTasks(allTasks);
    setStats({
      total: allTasks.length,
      completed: allTasks.filter(t => t.status === 'completed').length,
      open: allTasks.filter(t => t.status === 'open').length,
      assigned: allTasks.filter(t => t.status === 'assigned').length,
    });
  };

  const deleteTask = async (taskId) => {
    if (confirm('Delete this task?')) {
      await deleteDoc(doc(db, 'tasks', taskId));
      setTasks(tasks.filter(t => t.id !== taskId));
    }
  };

  const updateVolunteerSkill = async (volunteerId, newSkill) => {
    await updateDoc(doc(db, 'users', volunteerId), { skill: newSkill });
    setVolunteers(volunteers.map(v => v.id === volunteerId ? { ...v, skill: newSkill } : v));
  };

  if (loading) return <div className="glass-card p-8 text-center"><div className="spinner mx-auto"></div><p className="text-white mt-4">Loading admin data...</p></div>;

  const filteredTasks = tasks.filter(t => filter === 'all' ? true : t.status === filter);

  return (
    <div className="glass-card p-6">
      <h2 className="text-2xl font-bold text-white mb-4">🛡️ Admin Control Panel</h2>
      <div className="flex gap-2 mb-4 border-b border-white/20 pb-2">
        <button onClick={() => setActiveTab('tasks')} className={`px-4 py-2 rounded-lg ${activeTab === 'tasks' ? 'bg-purple-600 text-white' : 'text-white/80 hover:text-white'}`}>Tasks</button>
        <button onClick={() => setActiveTab('volunteers')} className={`px-4 py-2 rounded-lg ${activeTab === 'volunteers' ? 'bg-purple-600 text-white' : 'text-white/80 hover:text-white'}`}>Volunteers</button>
      </div>

      {activeTab === 'tasks' && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-white/10 p-3 rounded-lg text-center"><div className="text-2xl font-bold text-white">{stats.total}</div><div className="text-white/70">Total</div></div>
            <div className="bg-white/10 p-3 rounded-lg text-center"><div className="text-2xl font-bold text-green-300">{stats.completed}</div><div className="text-white/70">Completed</div></div>
            <div className="bg-white/10 p-3 rounded-lg text-center"><div className="text-2xl font-bold text-yellow-300">{stats.open}</div><div className="text-white/70">Open</div></div>
            <div className="bg-white/10 p-3 rounded-lg text-center"><div className="text-2xl font-bold text-blue-300">{stats.assigned}</div><div className="text-white/70">Assigned</div></div>
          </div>
          <div className="flex gap-2 mb-4 flex-wrap">
            {['all','open','assigned','completed'].map(f => <button key={f} onClick={() => setFilter(f)} className={`px-3 py-1 rounded-full ${filter === f ? 'bg-purple-600 text-white' : 'bg-white/20 text-white/80'}`}>{f.toUpperCase()}</button>)}
          </div>
          <div className="max-h-96 overflow-y-auto space-y-2 custom-scroll">
            {filteredTasks.map(task => (
              <div key={task.id} className="bg-white/10 p-3 rounded-lg">
                <p className="text-white font-medium">{task.description?.slice(0, 100)}</p>
                <div className="flex justify-between items-center mt-2 flex-wrap gap-2">
                  <span className="text-xs text-white/60">Urgency: {task.urgency} | Need: {task.requiredSkill}</span>
                  <div className="flex gap-2">
                    <select value={task.status} onChange={e => updateTaskStatus(task.id, e.target.value)} className="bg-white/20 text-white rounded px-2 py-1 text-sm">
                      <option value="open">Open</option>
                      <option value="assigned">Assigned</option>
                      <option value="completed">Completed</option>
                    </select>
                    <button onClick={() => deleteTask(task.id)} className="text-red-300 text-sm">🗑️</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {activeTab === 'volunteers' && (
        <div className="max-h-96 overflow-y-auto space-y-2 custom-scroll">
          {volunteers.map(vol => (
            <div key={vol.id} className="bg-white/10 p-3 rounded-lg">
              <p className="text-white font-medium">{vol.name} ({vol.email})</p>
              <div className="flex justify-between items-center mt-2">
                <span className="text-white/80">Points: ⭐ {vol.points || 0}</span>
                <select value={vol.skill || 'general'} onChange={e => updateVolunteerSkill(vol.id, e.target.value)} className="bg-white/20 text-white rounded px-2 py-1 text-sm">
                  <option value="general">General</option>
                  <option value="medical">Medical</option>
                  <option value="food">Food</option>
                  <option value="logistics">Logistics</option>
                </select>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}