import { useState, useRef } from 'react';
import { createWorker } from 'tesseract.js';
import { db } from '../firebase/firebase';
import { collection, addDoc, GeoPoint } from 'firebase/firestore';
import { PhotoIcon, ArrowPathIcon, MapPinIcon, CheckBadgeIcon } from '@heroicons/react/24/outline';

export default function ScanForm() {
  const [image, setImage] = useState(null);
  const [extractedText, setExtractedText] = useState('');
  const [loading, setLoading] = useState(false);
  const [urgency, setUrgency] = useState('medium');
  const [location, setLocation] = useState({ lat: 37.7749, lng: -122.4194 });
  const [saving, setSaving] = useState(false);
  const fileInputRef = useRef();

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setImage(reader.result);
      reader.readAsDataURL(file);
    }
  };

  const runOCR = async () => {
    if (!image) return;
    setLoading(true);
    try {
      const worker = await createWorker('eng');
      const { data: { text } } = await worker.recognize(image);
      await worker.terminate();
      setExtractedText(text);
      const lower = text.toLowerCase();
      if (lower.includes('urgent') || lower.includes('emergency') || lower.includes('critical'))
        setUrgency('high');
      else if (lower.includes('low') || lower.includes('minor'))
        setUrgency('low');
      else
        setUrgency('medium');
    } catch (err) {
      console.error(err);
      alert('OCR failed. Try a clearer image.');
    }
    setLoading(false);
  };

  const detectSkill = (text) => {
    const lower = text.toLowerCase();
    if (lower.includes('medical') || lower.includes('injury') || lower.includes('doctor') || lower.includes('health')) return 'medical';
    if (lower.includes('food') || lower.includes('meal') || lower.includes('hunger') || lower.includes('kitchen')) return 'food';
    if (lower.includes('transport') || lower.includes('delivery') || lower.includes('logistics') || lower.includes('vehicle')) return 'logistics';
    return 'general';
  };

  const saveToFirestore = async () => {
    if (!extractedText) {
      alert('Please run OCR first');
      return;
    }
    setSaving(true);
    try {
      const skill = detectSkill(extractedText);
      await addDoc(collection(db, 'tasks'), {
        description: extractedText.slice(0, 500),
        urgency: urgency,
        requiredSkill: skill,
        location: new GeoPoint(location.lat, location.lng),
        status: 'open',
        createdAt: new Date(),
        source: 'web_scan'
      });
      alert('✅ Task saved successfully!');
      setImage(null);
      setExtractedText('');
      if (fileInputRef.current) fileInputRef.current.value = '';
    } catch (err) {
      console.error(err);
      alert('Error saving: ' + err.message);
    }
    setSaving(false);
  };

  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        () => alert('Could not get location.')
      );
    } else {
      alert('Geolocation not supported');
    }
  };

  return (
    <div className="max-w-3xl mx-auto">
      <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
        <div className="bg-gradient-to-r from-green-600 to-emerald-700 px-6 py-4">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <PhotoIcon className="h-6 w-6" />
            Scan a Paper Survey
          </h2>
          <p className="text-green-100 text-sm mt-1">Upload a photo – we'll extract text and create a task</p>
        </div>

        <div className="p-6 space-y-6">
          <div className="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center hover:border-green-400 transition">
            <input type="file" accept="image/*" capture="environment" ref={fileInputRef} onChange={handleImageUpload} className="hidden" id="photoInput" />
            <label htmlFor="photoInput" className="cursor-pointer block">
              {!image ? (
                <>
                  <PhotoIcon className="h-12 w-12 mx-auto text-gray-400" />
                  <p className="mt-2 text-gray-500">Click to take a photo or upload</p>
                </>
              ) : (
                <img src={image} alt="preview" className="max-h-64 mx-auto rounded-lg shadow" />
              )}
            </label>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              onClick={runOCR}
              disabled={!image || loading}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-4 py-2 rounded-lg transition"
            >
              {loading ? <ArrowPathIcon className="h-5 w-5 animate-spin" /> : <span>📄</span>}
              {loading ? 'Reading...' : 'Extract Text'}
            </button>
            <button
              onClick={getCurrentLocation}
              className="flex items-center gap-2 bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg transition"
            >
              <MapPinIcon className="h-5 w-5" />
              Use My Location
            </button>
          </div>

          {extractedText && (
            <div className="space-y-4 border-t pt-4">
              <div>
                <label className="block font-medium text-gray-700 mb-1">Extracted Text</label>
                <textarea value={extractedText} readOnly rows={4} className="w-full border rounded-lg p-3 bg-gray-50 text-gray-700" />
              </div>
              <div>
                <label className="block font-medium text-gray-700 mb-1">Urgency</label>
                <select value={urgency} onChange={(e) => setUrgency(e.target.value)} className="border rounded-lg p-2 bg-white">
                  <option value="high">🔴 High</option>
                  <option value="medium">🟡 Medium</option>
                  <option value="low">🟢 Low</option>
                </select>
              </div>
              <div className="text-sm text-gray-500">
                📍 Location: {location.lat.toFixed(4)}, {location.lng.toFixed(4)}
              </div>
              <button
                onClick={saveToFirestore}
                disabled={saving}
                className="w-full flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white font-semibold py-3 rounded-xl transition"
              >
                {saving ? <ArrowPathIcon className="h-5 w-5 animate-spin" /> : <CheckBadgeIcon className="h-5 w-5" />}
                {saving ? 'Saving...' : 'Create Task & Publish'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}