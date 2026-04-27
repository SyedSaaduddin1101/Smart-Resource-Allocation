import { useEffect, useState } from 'react';
import { db } from '../firebase/firebase';
import { collection, onSnapshot } from 'firebase/firestore';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement } from 'chart.js';
import { Pie, Bar } from 'react-chartjs-2';

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement);

export default function ImpactDashboard() {
  const [stats, setStats] = useState({ total: 0, completed: 0, byUrgency: { high: 0, medium: 0, low: 0 } });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'tasks'), (snapshot) => {
      const tasks = snapshot.docs.map(d => d.data());
      const total = tasks.length;
      const completed = tasks.filter(t => t.status === 'completed').length;
      const byUrgency = {
        high: tasks.filter(t => t.urgency === 'high').length,
        medium: tasks.filter(t => t.urgency === 'medium').length,
        low: tasks.filter(t => t.urgency === 'low').length,
      };
      setStats({ total, completed, byUrgency });
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const pieData = { labels: ['High', 'Medium', 'Low'], datasets: [{ data: [stats.byUrgency.high, stats.byUrgency.medium, stats.byUrgency.low], backgroundColor: ['#ef4444', '#f97316', '#10b981'] }] };
  const barData = { labels: ['Total Tasks', 'Completed'], datasets: [{ label: 'Tasks', data: [stats.total, stats.completed], backgroundColor: '#8b5cf6' }] };

  if (loading) return <div className="glass-card p-8 text-center"><div className="spinner mx-auto"></div><p className="text-white mt-4">Loading impact data...</p></div>;

  return (
    <div className="glass-card p-6">
      <h2 className="text-2xl font-bold text-white mb-4">🌍 Live Impact Dashboard</h2>
      <div className="grid md:grid-cols-2 gap-6">
        <div><h3 className="text-white font-semibold mb-2">Tasks by Urgency</h3><Pie data={pieData} /></div>
        <div><h3 className="text-white font-semibold mb-2">Completion Overview</h3><Bar data={barData} /></div>
      </div>
      <div className="mt-6 text-center text-white">
        <p>🎯 {stats.completed} completed out of {stats.total}</p>
        <p>📈 Completion rate: {stats.total ? ((stats.completed / stats.total) * 100).toFixed(1) : 0}%</p>
      </div>
    </div>
  );
}