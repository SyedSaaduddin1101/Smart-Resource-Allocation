import { useState, useEffect } from 'react';
import { db, auth } from '../firebase/firebase';
import { collection, addDoc, query, orderBy, onSnapshot } from 'firebase/firestore';

export default function TaskChat({ taskId }) {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const user = auth.currentUser;

  useEffect(() => {
    const q = query(collection(db, `tasks/${taskId}/chat`), orderBy('timestamp', 'asc'));
    const unsub = onSnapshot(q, (snapshot) => {
      setMessages(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    return () => unsub();
  }, [taskId]);

  const send = async () => {
    if (!newMessage.trim()) return;
    await addDoc(collection(db, `tasks/${taskId}/chat`), {
      text: newMessage,
      userId: user.uid,
      userName: user.displayName || user.email,
      timestamp: new Date()
    });
    setNewMessage('');
  };

  return (
    <div className="mt-3 border-t border-white/20 pt-2">
      <h4 className="font-semibold text-sm text-white">💬 Task Chat</h4>
      <div className="h-32 overflow-y-auto bg-white/5 rounded p-2 text-sm my-2 custom-scroll">
        {messages.map(m => <div key={m.id} className="mb-1 text-white/80"><b>{m.userName}:</b> {m.text}</div>)}
      </div>
      <div className="flex gap-2">
        <input type="text" value={newMessage} onChange={e => setNewMessage(e.target.value)} className="flex-1 bg-white/10 border border-white/20 rounded p-1 text-sm text-white placeholder-white/50" placeholder="Type message..." />
        <button onClick={send} className="bg-purple-600 text-white px-3 py-1 rounded text-sm">Send</button>
      </div>
    </div>
  );
}