import { useEffect, useState } from 'react';
import { db, auth } from '../firebase/firebase';
import { collection, onSnapshot, updateDoc, doc } from 'firebase/firestore';

export default function PriorityQueue() {
  const [tasks, setTasks] = useState([]);
  const [userSkill, setUserSkill] = useState('general');

  useEffect(() => {
    const fetchSkill = async () => {
      const user = auth.currentUser;
      if (user) {
        const snap = await doc(db, 'users', user.uid).get();
        if (snap.exists()) setUserSkill(snap.data().skill || 'general');
      }
    };
    fetchSkill();
    const unsub = onSnapshot(collection(db, 'tasks'), (snapshot) => {
      const all = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      const filtered = all.filter(t => t.status === 'open' && (t.requiredSkill === userSkill || t.requiredSkill === 'general' || !t.requiredSkill));
      const urgencyOrder = { high: 0, medium: 1, low: 2 };
      filtered.sort((a, b) => urgencyOrder[a.urgency] - urgencyOrder[b.urgency]);
      setTasks(filtered);
    });
    const handleSkillChange = (e) => setUserSkill(e.detail.skill);
    window.addEventListener('skillChanged', handleSkillChange);
    return () => { unsub(); window.removeEventListener('skillChanged', handleSkillChange); };
  }, [userSkill]);

  const acceptTask = async (taskId) => {
    await updateDoc(doc(db, 'tasks', taskId), { status: 'assigned', assignedTo: auth.currentUser?.uid, assignedAt: new Date() });
    alert('Task accepted!');
  };

  if (tasks.length === 0) {
    return (
      <div className="glass-card text-center py-12">
        <div className="text-4xl mb-2">✨</div>
        <p className="text-white/80">No open tasks matching your skill.</p>
        <p className="text-sm text-white/50">Check back later or adjust your skill.</p>
      </div>
    );
  }

  return (
    <div className="glass-card p-6">
      <h2 className="text-2xl font-bold text-white mb-4">📊 Priority Queue</h2>
      <p className="text-white/70 mb-4 text-sm">Your skill: <strong>{userSkill}</strong></p>
      <div className="space-y-3 max-h-[70vh] overflow-y-auto custom-scroll">
        {tasks.map((task, idx) => (
          <div key={task.id} className="bg-white/10 backdrop-blur rounded-xl p-4 hover:bg-white/20 transition flex justify-between items-center">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-sm font-bold text-white/60">#{idx+1}</span>
                <span className={`text-xs px-2 py-0.5 rounded-full ${task.urgency === 'high' ? 'bg-red-500/30 text-red-200' : task.urgency === 'medium' ? 'bg-orange-500/30 text-orange-200' : 'bg-green-500/30 text-green-200'}`}>
                  {task.urgency === 'high' ? '🔴 High' : task.urgency === 'medium' ? '🟡 Medium' : '🟢 Low'}
                </span>
              </div>
              <p className="text-white">{task.description?.slice(0, 100)}</p>
              <p className="text-xs text-white/60 mt-1">Needs: {task.requiredSkill || 'general'}</p>
            </div>
            <button onClick={() => acceptTask(task.id)} className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-full text-sm font-medium transition">Accept →</button>
          </div>
        ))}
      </div>
    </div>
  );
}