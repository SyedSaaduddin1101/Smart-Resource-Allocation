import { useEffect, useState } from 'react';
import { db } from '../firebase/firebase';
import { collection, getDocs, updateDoc, doc, deleteDoc } from 'firebase/firestore';
import { useNotification } from '../context/NotificationContext';
import AssignTaskModal from './AssignTaskModal';

export default function ManageTasks() {
  const { showNotification } = useNotification();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTaskId, setSelectedTaskId] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    const fetchTasks = async () => {
      try {
        const snap = await getDocs(collection(db, 'tasks'));
        setTasks(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      } catch (err) {
        showNotification('Failed to load tasks: ' + err.message, 'error');
      } finally {
        setLoading(false);
      }
    };
    fetchTasks();
  }, []);

  const updateStatus = async (taskId, newStatus) => {
    try {
      await updateDoc(doc(db, 'tasks', taskId), { status: newStatus });
      setTasks(tasks.map(t => t.id === taskId ? { ...t, status: newStatus } : t));
      showNotification('Task status updated', 'success');
    } catch (err) {
      showNotification('Error updating status: ' + err.message, 'error');
    }
  };

  const deleteTask = async (taskId) => {
    if (window.confirm('Delete this task? This action cannot be undone.')) {
      try {
        await deleteDoc(doc(db, 'tasks', taskId));
        setTasks(tasks.filter(t => t.id !== taskId));
        showNotification('Task deleted', 'success');
      } catch (err) {
        showNotification('Error deleting task: ' + err.message, 'error');
      }
    }
  };

  const openAssignModal = (taskId) => {
    setSelectedTaskId(taskId);
    setShowModal(true);
  };

  const handleAssigned = () => {
    const refresh = async () => {
      const snap = await getDocs(collection(db, 'tasks'));
      setTasks(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    };
    refresh();
  };

  const filteredTasks = tasks.filter(t => filter === 'all' ? true : t.status === filter);

  if (loading) return <div className="glass-card p-8 text-center"><div className="spinner mx-auto"></div><p className="text-white mt-4">Loading tasks...</p></div>;

  return (
    <div className="glass-card p-6">
      <h2 className="text-2xl font-bold text-white mb-4">Manage Tasks</h2>
      <div className="flex gap-2 mb-4 flex-wrap">
        {['all','open','assigned','completed'].map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1 rounded-full text-sm font-medium transition ${
              filter === f ? 'bg-purple-600 text-white' : 'bg-white/20 text-white/80 hover:bg-white/30'
            }`}
          >
            {f.toUpperCase()}
          </button>
        ))}
      </div>
      <div className="max-h-96 overflow-y-auto space-y-2 custom-scroll">
        {filteredTasks.map(task => (
          <div key={task.id} className="bg-white/10 p-3 rounded-lg">
            <p className="text-white font-medium">{task.description?.slice(0, 100)}</p>
            <div className="flex justify-between items-center mt-2 flex-wrap gap-2">
              <span className="text-xs text-white/60">Urgency: {task.urgency} | Need: {task.requiredSkill}</span>
              <div className="flex gap-2">
                <select
                  value={task.status}
                  onChange={e => updateStatus(task.id, e.target.value)}
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
                  <option value="open" style={{ backgroundColor: 'white', color: 'black' }}>Open</option>
                  <option value="assigned" style={{ backgroundColor: 'white', color: 'black' }}>Assigned</option>
                  <option value="completed" style={{ backgroundColor: 'white', color: 'black' }}>Completed</option>
                </select>
                <button onClick={() => openAssignModal(task.id)} className="bg-purple-600 hover:bg-purple-700 text-white px-2 py-1 rounded text-sm transition">Assign</button>
                <button onClick={() => deleteTask(task.id)} className="text-red-300 text-sm">🗑️</button>
              </div>
            </div>
          </div>
        ))}
      </div>
      {showModal && (
        <AssignTaskModal
          taskId={selectedTaskId}
          onClose={() => setShowModal(false)}
          onAssigned={handleAssigned}
        />
      )}
    </div>
  );
}