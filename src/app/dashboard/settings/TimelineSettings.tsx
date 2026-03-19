'use client';

import { useState, useEffect } from 'react';

interface TimelineEvent {
  date: string;
  title: string;
}

export default function TimelineSettings() {
  const [events, setEvents] = useState<TimelineEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    fetchTimeline();
  }, []);

  const fetchTimeline = async () => {
    try {
      const res = await fetch('/api/settings/timeline');
      const data = await res.json();
      setEvents(data.timelineEvents || []);
    } catch (error) {
      console.error('Error fetching timeline:', error);
      setMessage({ type: 'error', text: 'Gagal memuat timeline' });
    } finally {
      setLoading(false);
    }
  };

  const handleAddEvent = () => {
    setEvents([...events, { date: '', title: '' }]);
  };

  const handleRemoveEvent = (index: number) => {
    setEvents(events.filter((_, i) => i !== index));
  };

  const handleEventChange = (index: number, field: 'date' | 'title', value: string) => {
    const newEvents = [...events];
    newEvents[index][field] = value;
    setEvents(newEvents);
  };

  const handleSave = async () => {
    // Validate
    const hasEmpty = events.some(e => !e.date.trim() || !e.title.trim());
    if (hasEmpty) {
      setMessage({ type: 'error', text: 'Semua field harus diisi' });
      return;
    }

    setSaving(true);
    setMessage(null);

    try {
      const res = await fetch('/api/settings/timeline', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ timelineEvents: events }),
      });

      const data = await res.json();

      if (res.ok) {
        setMessage({ type: 'success', text: 'Timeline berhasil diperbarui' });
        setEvents(data.timelineEvents);
      } else {
        setMessage({ type: 'error', text: data.error || 'Gagal menyimpan timeline' });
      }
    } catch (error) {
      console.error('Error saving timeline:', error);
      setMessage({ type: 'error', text: 'Terjadi kesalahan saat menyimpan' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="text-gray-600">Memuat...</div>;
  }

  return (
    <div className="space-y-4">
      {message && (
        <div
          className={`p-4 rounded-lg ${
            message.type === 'success'
              ? 'bg-green-50 text-green-800 border border-green-200'
              : 'bg-red-50 text-red-800 border border-red-200'
          }`}
        >
          {message.text}
        </div>
      )}

      <div className="space-y-3">
        {events.map((event, index) => (
          <div key={index} className="flex gap-3 items-start">
            <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-3">
              <input
                type="text"
                placeholder="Tanggal (e.g., 12 Okt 2026)"
                value={event.date}
                onChange={(e) => handleEventChange(index, 'date', e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <input
                type="text"
                placeholder="Judul Event"
                value={event.title}
                onChange={(e) => handleEventChange(index, 'title', e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <button
              onClick={() => handleRemoveEvent(index)}
              className="px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              title="Hapus event"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        ))}
      </div>

      <div className="flex gap-3 pt-2">
        <button
          onClick={handleAddEvent}
          className="px-4 py-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors border border-blue-200"
        >
          + Tambah Event
        </button>
        <button
          onClick={handleSave}
          disabled={saving}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {saving ? 'Menyimpan...' : 'Simpan Timeline'}
        </button>
      </div>
    </div>
  );
}
