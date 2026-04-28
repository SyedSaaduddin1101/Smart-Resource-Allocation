import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { db, auth } from '../firebase/firebase';
import { collection, onSnapshot, updateDoc, doc, addDoc, GeoPoint } from 'firebase/firestore';
import { useNotification } from '../context/NotificationContext';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

function UrgencyCircles({ tasks }) {
  const map = useMap();
  useEffect(() => {
    if (!map) return;
    const circles = [];
    tasks.forEach(task => {
      if (!task.location || typeof task.location.latitude !== 'number') return;
      const center = [task.location.latitude, task.location.longitude];
      let radius = 300, color = '#10b981';
      if (task.urgency === 'high') {
        radius = 600;
        color = '#ef4444';
      } else if (task.urgency === 'medium') {
        radius = 450;
        color = '#f97316';
      }
      const circle = L.circle(center, { radius, color, fillColor: color, fillOpacity: 0.3, weight: 2 }).addTo(map);
      circles.push(circle);
    });
    return () => circles.forEach(c => map.removeLayer(c));
  }, [map, tasks]);
  return null;
}

export default function HeatmapMap() {
  const { showNotification } = useNotification();
  const [tasks, setTasks] = useState([]);
  const [center, setCenter] = useState([37.7749, -122.4194]);
  const [volunteerSkill, setVolunteerSkill] = useState('general');
  const [loading, setLoading] = useState(true);
  const [demoGenerating, setDemoGenerating] = useState(false);

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => setCenter([position.coords.latitude, position.coords.longitude]),
        () => {}
      );
    }
  }, []);

  useEffect(() => {
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
      setLoading(false);
    });
    const handleSkillChange = (e) => setVolunteerSkill(e.detail.skill);
    window.addEventListener('skillChanged', handleSkillChange);
    return () => { unsub(); window.removeEventListener('skillChanged', handleSkillChange); };
  }, [volunteerSkill]);

  const acceptTask = async (taskId) => {
    try {
      await updateDoc(doc(db, 'tasks', taskId), { status: 'assigned', assignedTo: auth.currentUser?.uid, assignedAt: new Date() });
      showNotification('Task accepted! You can now help.', 'success');
    } catch (err) {
      showNotification('Error: ' + err.message, 'error');
    }
  };

  const generateDemoTasks = async () => {
    setDemoGenerating(true);
    const demoLocations = [
      { lat: 37.7749, lng: -122.4194, urgency: 'high', desc: '🔥 Critical: Water shortage in downtown' },
      { lat: 37.7694, lng: -122.4862, urgency: 'medium', desc: 'Food distribution needed in Sunset' },
      { lat: 37.8044, lng: -122.2712, urgency: 'low', desc: 'Clothing drive in Fruitvale' },
      { lat: 37.7510, lng: -122.4413, urgency: 'high', desc: 'Urgent medical supplies in Mission' },
      { lat: 37.7123, lng: -122.4169, urgency: 'medium', desc: 'Shelter support needed' },
      { lat: 37.7900, lng: -122.3960, urgency: 'high', desc: 'Emergency response needed in North Beach' }
    ];
    try {
      for (const loc of demoLocations) {
        await addDoc(collection(db, 'tasks'), {
          description: loc.desc,
          urgency: loc.urgency,
          requiredSkill: loc.urgency === 'high' ? 'medical' : 'general',
          location: new GeoPoint(loc.lat, loc.lng),
          status: 'open',
          createdAt: new Date(),
          createdBy: auth.currentUser?.uid,
        });
      }
      showNotification('6 demo tasks created! Red/orange/green circles will appear.', 'success');
    } catch (err) {
      showNotification('Error generating tasks: ' + err.message, 'error');
    }
    setDemoGenerating(false);
  };

  if (loading) return <div className="glass-card p-8 text-center"><div className="spinner mx-auto"></div><p className="text-white mt-4">Loading map...</p></div>;

  return (
    <div className="glass-card p-0 overflow-hidden">
      <div className="p-4 border-b border-white/20 bg-white/5">
        <div className="flex justify-between items-center flex-wrap gap-2">
          <div>
            <h2 className="text-xl font-bold text-white">📍 Urgent Needs Map</h2>
            <div className="flex items-center gap-4 mt-1 text-xs">
              <span className="flex items-center gap-1"><span className="w-3 h-3 bg-red-500 rounded-full"></span> High urgency</span>
              <span className="flex items-center gap-1"><span className="w-3 h-3 bg-orange-500 rounded-full"></span> Medium</span>
              <span className="flex items-center gap-1"><span className="w-3 h-3 bg-green-500 rounded-full"></span> Low</span>
            </div>
            <p className="text-xs text-white/50 mt-1">Showing {tasks.length} open task(s) for your skill: <strong>{volunteerSkill}</strong></p>
          </div>
          <button
            onClick={generateDemoTasks}
            disabled={demoGenerating}
            className="px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white text-sm rounded-full transition disabled:opacity-50"
          >
            {demoGenerating ? 'Creating...' : '✨ Demo: Add Sample Tasks'}
          </button>
        </div>
      </div>
      <div style={{ height: '65vh' }}>
        <MapContainer center={center} zoom={12} style={{ height: '100%', width: '100%' }}>
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
          <UrgencyCircles tasks={tasks} />
          {tasks.map(task => task.location && (
            <Marker key={task.id} position={[task.location.latitude, task.location.longitude]}>
              <Popup>
                <div className="p-2 max-w-xs">
                  <p className="font-bold">{task.description?.slice(0, 80)}</p>
                  <p>Urgency: <span className={`font-semibold ${task.urgency === 'high' ? 'text-red-500' : task.urgency === 'medium' ? 'text-orange-500' : 'text-green-500'}`}>{task.urgency}</span></p>
                  <p>Needs: {task.requiredSkill}</p>
                  <button onClick={() => acceptTask(task.id)} className="mt-2 bg-purple-600 text-white px-3 py-1 rounded w-full">Accept</button>
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>
      {tasks.length === 0 && (
        <div className="p-4 text-center text-white/60 text-sm border-t border-white/10">
          No tasks yet. Click "Demo: Add Sample Tasks" to see urgency circles.
        </div>
      )}
    </div>
  );
}