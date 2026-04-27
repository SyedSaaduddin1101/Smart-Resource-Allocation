import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { db, auth, storage } from '../firebase/firebase';
import { collection, onSnapshot, updateDoc, doc, addDoc, query, orderBy } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { MapIcon } from '@heroicons/react/24/outline';

// Fix Leaflet marker icons
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

function ChangeMapView({ center }) {
  const map = useMap();
  useEffect(() => { if (center) map.setView(center, 13); }, [center, map]);
  return null;
}

// Helper: real-time chat for a task
function TaskChat({ taskId }) {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const user = auth.currentUser;

  useEffect(() => {
    const q = query(collection(db, `tasks/${taskId}/chat`), orderBy('timestamp', 'asc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setMessages(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    return () => unsubscribe();
  }, [taskId]);

  const sendMessage = async () => {
    if (!newMessage.trim()) return;
    await addDoc(collection(db, `tasks/${taskId}/chat`), {
      text: newMessage,
      userId: user.uid,
      userName: user.displayName,
      timestamp: new Date()
    });
    setNewMessage('');
  };

  return (
    <div className="mt-3 border-t pt-2">
      <h4 className="font-semibold text-sm">💬 Task Chat</h4>
      <div className="h-32 overflow-y-auto bg-gray-50 p-2 rounded text-xs my-2">
        {messages.map(msg => (
          <div key={msg.id} className="mb-1"><b>{msg.userName}:</b> {msg.text}</div>
        ))}
      </div>
      <div className="flex gap-1">
        <input type="text" value={newMessage} onChange={(e) => setNewMessage(e.target.value)} className="flex-1 border rounded p-1 text-xs" placeholder="Ask volunteer..." />
        <button onClick={sendMessage} className="bg-blue-500 text-white px-2 py-1 rounded text-xs">Send</button>
      </div>
    </div>
  );
}

// Helper: complete task with photo proof
function CompleteTask({ taskId, onCompleted }) {
  const [photo, setPhoto] = useState(null);
  const [uploading, setUploading] = useState(false);

  const handleComplete = async () => {
    if (!photo) return alert('Please take a photo');
    setUploading(true);
    try {
      const storageRef = ref(storage, `completions/${taskId}/${Date.now()}.jpg`);
      await uploadBytes(storageRef, photo);
      const photoURL = await getDownloadURL(storageRef);
      await updateDoc(doc(db, 'tasks', taskId), {
        status: 'completed',
        completionPhoto: photoURL,
        completedAt: new Date()
      });
      alert('Task marked as completed!');
      onCompleted();
    } catch (err) {
      alert('Error: ' + err.message);
    }
    setUploading(false);
  };

  return (
    <div className="mt-3">
      <label className="block text-xs font-medium">📸 Upload completion photo</label>
      <input type="file" accept="image/*" onChange={(e) => setPhoto(e.target.files[0])} className="mt-1 text-xs" />
      <button onClick={handleComplete} disabled={!photo || uploading} className="mt-2 bg-green-600 text-white px-2 py-1 rounded text-xs w-full">
        {uploading ? 'Uploading...' : 'Mark as Completed'}
      </button>
    </div>
  );
}

export default function VolunteerMap() {
  const [userLocation, setUserLocation] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [volunteerSkill, setVolunteerSkill] = useState('');

  useEffect(() => {
    // Get volunteer's skill from Firestore
    const fetchSkill = async () => {
      const user = auth.currentUser;
      if (user) {
        const userRef = doc(db, 'volunteers', user.uid);
        const userSnap = await userRef.get();
        if (userSnap.exists()) setVolunteerSkill(userSnap.data().skill);
      }
    };
    fetchSkill();

    // Get user location
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setUserLocation([pos.coords.latitude, pos.coords.longitude]),
        () => setUserLocation([37.7749, -122.4194])
      );
    } else {
      setUserLocation([37.7749, -122.4194]);
    }

    // Listen to tasks and filter by skill
    const unsubscribe = onSnapshot(collection(db, 'tasks'), (snapshot) => {
      const allTasks = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      const filtered = allTasks.filter(task =>
        task.status === 'open' &&
        (task.requiredSkill === volunteerSkill || task.requiredSkill === 'general' || !task.requiredSkill)
      );
      setTasks(filtered);
    });
    return () => unsubscribe();
  }, [volunteerSkill]);

  const acceptTask = async (taskId) => {
    try {
      await updateDoc(doc(db, 'tasks', taskId), {
        status: 'assigned',
        assignedTo: auth.currentUser?.uid,
        assignedAt: new Date()
      });
      alert('Task accepted! You can now chat and upload completion photo.');
    } catch (err) {
      alert('Error: ' + err.message);
    }
  };

  if (!userLocation) return <div className="text-center p-8">Loading map...</div>;

  return (
    <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
      <div className="bg-gradient-to-r from-green-600 to-emerald-700 px-6 py-4">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <MapIcon className="h-6 w-6" />
          Volunteer Map
        </h2>
        <p className="text-green-100 text-sm">Real-time tasks matching your skill: {volunteerSkill || 'Not set'}</p>
      </div>
      <div style={{ height: '65vh', width: '100%' }}>
        <MapContainer center={userLocation} zoom={13} style={{ height: '100%', width: '100%' }}>
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>' />
          <ChangeMapView center={userLocation} />
          {tasks.map(task => {
            const coords = task.location && [task.location.latitude, task.location.longitude];
            if (!coords) return null;
            return (
              <Marker key={task.id} position={coords}>
                <Popup>
                  <div className="p-2 max-w-xs">
                    <h3 className="font-bold">Task #{task.id.slice(0,6)}</h3>
                    <p className="text-sm mt-1">{task.description?.slice(0, 100)}...</p>
                    <p className="text-xs mt-1">Urgency: <span className={`font-semibold ${task.urgency === 'high' ? 'text-red-600' : task.urgency === 'medium' ? 'text-orange-500' : 'text-green-600'}`}>{task.urgency}</span></p>
                    <p className="text-xs">Needs: {task.requiredSkill || 'general'}</p>
                    {task.status === 'open' && (
                      <button onClick={() => acceptTask(task.id)} className="mt-2 bg-green-600 text-white px-3 py-1 rounded text-sm w-full">Accept Mission</button>
                    )}
                    {task.status === 'assigned' && task.assignedTo === auth.currentUser?.uid && (
                      <>
                        <TaskChat taskId={task.id} />
                        <CompleteTask taskId={task.id} onCompleted={() => window.location.reload()} />
                      </>
                    )}
                    {task.status === 'completed' && (
                      <p className="text-green-600 text-xs mt-2">✅ Completed</p>
                    )}
                  </div>
                </Popup>
              </Marker>
            );
          })}
        </MapContainer>
      </div>
    </div>
  );
}