import { useState, useRef } from 'react';
import { createWorker } from 'tesseract.js';
import { db, auth } from '../firebase/firebase';
import { collection, addDoc, GeoPoint } from 'firebase/firestore';
import Papa from 'papaparse';

export default function IngestionCenter() {
  const [activeTab, setActiveTab] = useState('manual');
  const [description, setDescription] = useState('');
  const [image, setImage] = useState(null);
  const [extractedText, setExtractedText] = useState('');
  const [loadingOCR, setLoadingOCR] = useState(false);
  const [voiceText, setVoiceText] = useState('');
  const [csvData, setCsvData] = useState([]);
  const [urgency, setUrgency] = useState('medium');
  const [location, setLocation] = useState({ lat: null, lng: null, error: null, loading: false });
  const [saving, setSaving] = useState(false);
  const fileInputRef = useRef();

  const startVoice = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) return alert('Speech not supported');
    const rec = new SpeechRecognition();
    rec.lang = 'en-US';
    rec.onresult = (e) => {
      setVoiceText(e.results[0][0].transcript);
      detectUrgency(e.results[0][0].transcript);
    };
    rec.start();
  };

  const detectUrgency = (text) => {
    const lower = text.toLowerCase();
    if (lower.includes('urgent') || lower.includes('emergency')) setUrgency('high');
    else if (lower.includes('low') || lower.includes('minor')) setUrgency('low');
    else setUrgency('medium');
  };

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
    setLoadingOCR(true);
    try {
      const worker = await createWorker('eng');
      const { data: { text } } = await worker.recognize(image);
      await worker.terminate();
      setExtractedText(text);
      detectUrgency(text);
    } catch (err) { alert('OCR failed'); }
    setLoadingOCR(false);
  };

  const handleCSV = (e) => {
    const file = e.target.files[0];
    Papa.parse(file, { header: true, complete: (res) => setCsvData(res.data) });
  };

  const handleDocument = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setLoadingOCR(true);
    let text = '';
    try {
      if (file.type === 'text/plain') {
        text = await file.text();
      } else if (file.type === 'application/pdf') {
        // Dynamically import pdf-parse to avoid bundling issues
        const pdfParse = (await import('pdf-parse')).default;
        const arrayBuffer = await file.arrayBuffer();
        const pdfData = await pdfParse(arrayBuffer);
        text = pdfData.text;
      } else if (file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
        const mammoth = (await import('mammoth')).default;
        const arrayBuffer = await file.arrayBuffer();
        const result = await mammoth.extractRawText({ arrayBuffer });
        text = result.value;
      } else {
        alert('Unsupported file. Use PDF, DOCX, or TXT.');
        setLoadingOCR(false);
        return;
      }
      if (text.trim()) {
        setExtractedText(text.slice(0, 5000));
        detectUrgency(text);
      } else {
        alert('No text found in file');
      }
    } catch (err) {
      console.error(err);
      alert('Error reading file');
    }
    setLoadingOCR(false);
  };

  const detectSkill = (text) => {
    const lower = text.toLowerCase();
    if (lower.includes('medical')) return 'medical';
    if (lower.includes('food')) return 'food';
    if (lower.includes('transport')) return 'logistics';
    return 'general';
  };

  const getLocation = () => {
    setLocation(prev => ({ ...prev, loading: true, error: null }));
    if (!navigator.geolocation) {
      setLocation(prev => ({ ...prev, error: 'Geolocation not supported', loading: false }));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude, error: null, loading: false }),
      (err) => {
        let msg = 'Location failed: ';
        if (err.code === 1) msg += 'Permission denied';
        else if (err.code === 2) msg += 'Position unavailable';
        else msg += err.message;
        setLocation(prev => ({ ...prev, error: msg, loading: false }));
        alert(msg);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const saveTask = async () => {
    let finalText = '';
    if (activeTab === 'manual') finalText = description;
    else if (activeTab === 'photo') finalText = extractedText;
    else if (activeTab === 'voice') finalText = voiceText;
    else if (activeTab === 'csv' && csvData.length) finalText = `CSV Import: ${csvData.length} records`;
    else if (activeTab === 'document') finalText = extractedText;
    if (!finalText) return alert('No data to save');

    const useLat = location.lat ?? 37.7749;
    const useLng = location.lng ?? -122.4194;

    setSaving(true);
    const skill = detectSkill(finalText);
    await addDoc(collection(db, 'tasks'), {
      description: finalText.slice(0, 500),
      urgency,
      requiredSkill: skill,
      location: new GeoPoint(useLat, useLng),
      status: 'open',
      createdAt: new Date(),
      createdBy: auth.currentUser?.uid,
    });
    alert('Task saved!');
    setDescription('');
    setImage(null);
    setExtractedText('');
    setVoiceText('');
    setCsvData([]);
    if (fileInputRef.current) fileInputRef.current.value = '';
    setSaving(false);
  };

  return (
    <div className="glass-card p-6">
      <h2 className="text-2xl font-bold text-white mb-4">Create New Task</h2>
      <div className="flex gap-1 border-b border-white/20 mb-6 flex-wrap">
        {['manual', 'photo', 'voice', 'csv', 'document'].map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)} className={`px-4 py-2 rounded-t-lg font-medium transition ${activeTab === tab ? 'bg-white/20 text-white border-b-2 border-purple-400' : 'text-white/60 hover:text-white'}`}>
            {tab === 'manual' && '✏️ Manual'}
            {tab === 'photo' && '📸 Paper'}
            {tab === 'voice' && '🎤 Voice'}
            {tab === 'csv' && '📊 CSV'}
            {tab === 'document' && '📄 Document'}
          </button>
        ))}
      </div>

      <div className="space-y-4">
        {activeTab === 'manual' && (
          <textarea rows={4} placeholder="Describe the community need..." value={description} onChange={e => { setDescription(e.target.value); detectUrgency(e.target.value); }} className="w-full bg-white/10 border border-white/20 rounded-xl p-3 text-white placeholder-white/50" />
        )}

        {activeTab === 'photo' && (
          <>
            <input type="file" accept="image/*" capture="environment" onChange={handleImageUpload} ref={fileInputRef} className="text-white/80" />
            {image && <img src={image} className="max-h-48 rounded-lg mt-2" alt="preview" />}
            <button onClick={runOCR} disabled={!image || loadingOCR} className="btn-secondary">{loadingOCR ? 'Extracting...' : 'Extract Text'}</button>
            {extractedText && <textarea value={extractedText} readOnly rows={3} className="w-full bg-white/10 border border-white/20 rounded-xl p-3 text-white" />}
          </>
        )}

        {activeTab === 'voice' && (
          <>
            <button onClick={startVoice} className="btn-primary">🎙️ Start Speaking</button>
            {voiceText && <textarea value={voiceText} readOnly rows={3} className="w-full bg-white/10 border border-white/20 rounded-xl p-3 text-white mt-2" />}
          </>
        )}

        {activeTab === 'csv' && (
          <>
            <input type="file" accept=".csv" onChange={handleCSV} className="text-white/80" />
            {csvData.length > 0 && <p className="text-green-300">✅ Loaded {csvData.length} records</p>}
          </>
        )}

        {activeTab === 'document' && (
          <>
            <input type="file" accept=".pdf,.docx,.txt" onChange={handleDocument} className="text-white/80" />
            {loadingOCR && <p className="text-white/70">Parsing file...</p>}
            {extractedText && <textarea value={extractedText} readOnly rows={4} className="w-full bg-white/10 border border-white/20 rounded-xl p-3 text-white mt-2" />}
          </>
        )}

        <div className="flex flex-wrap gap-4 items-center pt-2">
          <button onClick={getLocation} className="btn-secondary" disabled={location.loading}>{location.loading ? "📍 Getting location..." : "📍 Use My Location"}</button>
          {location.error ? <span className="text-sm text-red-300">{location.error}</span> : location.lat && location.lng ? <span className="text-sm text-white/80">📍 {location.lat.toFixed(4)}, {location.lng.toFixed(4)}</span> : <span className="text-sm text-white/50">No location yet</span>}
        </div>

        <div className="flex items-center gap-3">
          <span className="text-white font-medium">Urgency:</span>
          <select value={urgency} onChange={e => setUrgency(e.target.value)} className="bg-white/10 border border-white/20 rounded-lg p-2 text-white">
            <option value="high" className="text-black">High</option>
            <option value="medium" className="text-black">Medium</option>
            <option value="low" className="text-black">Low</option>
          </select>
        </div>

        <button onClick={saveTask} disabled={saving} className="btn-primary w-full py-3">{saving ? 'Saving...' : 'Publish Task'}</button>
      </div>
    </div>
  );
}