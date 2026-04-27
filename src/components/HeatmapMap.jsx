import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet.heat';
import { db, auth } from '../firebase/firebase';
import { collection, onSnapshot, updateDoc, doc } from 'firebase/firestore';

function HeatmapLayer({ tasks }) {
  const map = useMap();
  useEffect(() => {
    if (!map || !tasks.length) return;
    const points = tasks
      .filter(task => task.location)
      .map(task => [
        task.location.latitude,
        task.location.longitude,
        task.urgency === 'high' ? 1.0 : task.urgency === 'medium' ? 0.6 : 0.3
      ]);
    const heat = L.heatLayer(points, {
      radius: 25,
      blur: 15,
      maxZoom: 17,
      minOpacity: 0.3,
      gradient: { 0.2: '#10b981', 0.5: '#f97316', 0.8: '#ef4444' }
    });
    heat.addTo(map);
    return () => map.removeLayer(heat);
  }, [map, tasks]);
  return null;
}

export default function HeatmapMap() {
  const [tasks, setTasks] = useState([]);
  const [center, setCenter] = useState([37.7749, -122.4194]);
  const [volunteerSkill, setVolunteerSkill] = useState('general');

  useEffect(() => {
    navigator.geolocation.getCurrentPosition(pos => setCenter([pos.coords.latitude, pos.coords.longitude]), () => {});
    const fetchSkill = async () => {
      const user = auth.currentUser;
      if (user) {
        const snap = await doc(db, 'users', user.uid).get();
        if (snap.exists()) setVolunteerSkill(snap.data().skill || 'general');
      }
    };
    fetchSkill();
    const unsub = onSnapshot(collection(db, 'tasks'), (snapshot) => {
      const all = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      const filtered = all.filter(t => t.status === 'open' && (t.requiredSkill === volunteerSkill || t.requiredSkill === 'general' || !t.requiredSkill));
      setTasks(filtered);
    });
    const handleSkillChange = (e) => setVolunteerSkill(e.detail.skill);
    window.addEventListener('skillChanged', handleSkillChange);
    return () => { unsub(); window.removeEventListener('skillChanged', handleSkillChange); };
  }, [volunteerSkill]);

  return (
    <div className="glass-card p-0 overflow-hidden">
      <div className="p-4 border-b border-white/20">
        <h2 className="text-xl font-bold text-white">Urgency Heatmap</h2>
        <p className="text-sm text-white/70">Red = high urgency/density, Orange = medium, Green = low</p>
        <p className="text-sm text-white/50 mt-1">Your skill: {volunteerSkill}</p>
      </div>
      <div style={{ height: '65vh' }}>
        <MapContainer center={center} zoom={12} style={{ height: '100%', width: '100%' }}>
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
          <HeatmapLayer tasks={tasks} />
        </MapContainer>
      </div>
    </div>
  );
}