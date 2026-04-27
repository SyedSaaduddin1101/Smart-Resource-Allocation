import { useState } from 'react';
import { db, storage } from '../firebase/firebase';
import { doc, updateDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

export default function CompleteTask({ taskId, onCompleted }) {
  const [photo, setPhoto] = useState(null);
  const [uploading, setUploading] = useState(false);

  const handlePhotoUpload = async () => {
    if (!photo) return;
    setUploading(true);
    const storageRef = ref(storage, `completions/${taskId}/${Date.now()}.jpg`);
    await uploadBytes(storageRef, photo);
    const photoURL = await getDownloadURL(storageRef);
    await updateDoc(doc(db, 'tasks', taskId), {
      status: 'completed',
      completionPhoto: photoURL,
      completedAt: new Date()
    });
    onCompleted();
    setUploading(false);
  };

  return (
    <div className="mt-3">
      <label className="block text-sm font-medium">📸 Upload completion photo</label>
      <input type="file" accept="image/*" onChange={(e) => setPhoto(e.target.files[0])} className="mt-1" />
      <button onClick={handlePhotoUpload} disabled={!photo || uploading} className="mt-2 bg-green-600 text-white px-3 py-1 rounded text-sm">
        {uploading ? 'Uploading...' : 'Mark as Completed'}
      </button>
    </div>
  );
}