"use client";

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Edit2, Trash2, Link as LinkIcon, Image as ImageIcon, Upload } from 'lucide-react';

type Candidate = {
  id: string;
  name: string;
  tagline: string | null;
  vision: string;
  mission: string | null;
  major: string | null;
  photo: string | null;
  draftLink: string | null;
  isHidden: boolean;
};

export default function CandidateClient({ initialCandidates }: { initialCandidates: Candidate[] }) {
  const [candidates, setCandidates] = useState<Candidate[]>(initialCandidates);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCandidate, setEditingCandidate] = useState<Candidate | null>(null);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    name: '',
    tagline: '',
    vision: '',
    mission: '',
    major: '',
    photo: '',
    draftLink: '',
    isHidden: false
  });

  const handleOpenModal = (candidate?: Candidate) => {
    if (candidate) {
      setEditingCandidate(candidate);
      setFormData({
        name: candidate.name,
        tagline: candidate.tagline || '',
        vision: candidate.vision,
        mission: candidate.mission || '',
        major: candidate.major || '',
        photo: candidate.photo || '',
        draftLink: candidate.draftLink || '',
        isHidden: candidate.isHidden || false
      });
    } else {
      setEditingCandidate(null);
      setFormData({ name: '', tagline: '', vision: '', mission: '', major: '', photo: '', draftLink: '', isHidden: false });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingCandidate(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const url = editingCandidate ? `/api/candidates/${editingCandidate.id}` : '/api/candidates';
      const method = editingCandidate ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      if (!res.ok) {
        throw new Error('Gagal menyimpan kandidat');
      }

      // Refresh the page data
      router.refresh();

      // Update local state for immediate feedback
      const updatedCandidate = await res.json();
      if (editingCandidate) {
        setCandidates(candidates.map(c => c.id === updatedCandidate.id ? updatedCandidate : c));
      } else {
        setCandidates([...candidates, updatedCandidate]);
      }

      handleCloseModal();
    } catch (error) {
      console.error(error);
      alert('Terjadi kesalahan saat menyimpan data');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Apakah anda yakin ingin menghapus kandidat ini?')) return;

    try {
      const res = await fetch(`/api/candidates/${id}`, {
        method: 'DELETE'
      });

      if (!res.ok) throw new Error('Gagal menghapus');

      setCandidates(candidates.filter(c => c.id !== id));
      router.refresh();
    } catch (error) {
      console.error(error);
      alert('Terjadi kesalahan saat menghapus data');
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('File harus berupa gambar');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('Ukuran file maksimal 5MB');
      return;
    }

    setUploading(true);
    try {
      // Convert to base64
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64String = reader.result as string;
        
        // Upload to Cloudinary via API
        const response = await fetch('/api/upload', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ file: base64String }),
        });

        if (!response.ok) {
          throw new Error('Gagal upload ke Cloudinary');
        }

        const data = await response.json();
        setFormData({ ...formData, photo: data.url });
        setUploading(false);
      };
      reader.onerror = () => {
        alert('Gagal membaca file');
        setUploading(false);
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error('Error uploading file:', error);
      alert('Gagal upload foto');
      setUploading(false);
    }
  };

  return (
    <div>
      <div className="mb-8 flex justify-between items-end">
        <div>
          <h2 className="text-2xl font-bold text-neutral-800 dark:text-neutral-100">Kandidat</h2>
          <p className="text-neutral-500 dark:text-neutral-400 dark:text-neutral-500">Daftar kandidat Pemilihan General Manager 8EH Radio ITB 2026/2027</p>
        </div>
        <button
          onClick={() => handleOpenModal()}
          className="bg-red-500 hover:bg-red-600 text-white px-6 py-2.5 rounded-xl font-medium transition-colors shadow-sm shadow-red-500/30 flex items-center gap-2"
        >
          <Plus size={20} /> Tambah Kandidat
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {candidates.map((candidate, i) => (
          <div key={candidate.id} className="bg-white dark:bg-neutral-900 rounded-2xl shadow-sm border border-neutral-100 dark:border-neutral-700 flex flex-col h-full overflow-hidden">
            {candidate.photo ? (
              <div className="h-48 w-full bg-neutral-100 dark:bg-neutral-900 relative">
                <img src={candidate.photo} alt={candidate.name} className="w-full h-full object-cover" draggable="false" onDragStart={(e) => e.preventDefault()} />
              </div>
            ) : (
              <div className="h-48 w-full bg-red-50 dark:bg-red-900/30 flex items-center justify-center">
                <ImageIcon size={48} className="text-red-200" />
              </div>
            )}

            <div className="p-6 flex-1 flex flex-col">
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center text-red-600 font-bold text-lg">
                    {i + 1}
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-neutral-800 dark:text-neutral-100">{candidate.name}</h3>
                    {candidate.major && <p className="text-sm text-neutral-500 dark:text-neutral-400">{candidate.major}</p>}
                  </div>
                </div>
              </div>

              <div className="flex-1 mt-2">
                <div className="mb-4">
                  <h4 className="text-xs font-bold text-neutral-900 dark:text-neutral-100 mb-1 uppercase tracking-wider">Visi</h4>
                  <p className="text-neutral-600 dark:text-neutral-400 dark:text-neutral-500 text-sm leading-relaxed line-clamp-3">{candidate.vision}</p>
                </div>
                {candidate.draftLink && (
                  <div className="mb-4">
                    <a href={candidate.draftLink} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 text-sm text-blue-600 hover:text-blue-800 font-medium">
                      <LinkIcon size={14} /> Baca Draf Lengkap
                    </a>
                  </div>
                )}
              </div>

              <div className="mt-6 pt-4 border-t border-neutral-100 dark:border-neutral-700 flex gap-3">
                <button
                  onClick={() => handleOpenModal(candidate)}
                  className="flex-1 bg-neutral-50 dark:bg-neutral-800 hover:bg-neutral-100 dark:hover:bg-neutral-700 dark:bg-neutral-800 flex justify-center items-center gap-2 text-neutral-700 dark:text-neutral-300 py-2 rounded-lg font-medium text-sm transition-colors"
                >
                  <Edit2 size={16} /> Edit
                </button>
                <button
                  onClick={() => handleDelete(candidate.id)}
                  className="flex-1 bg-red-50 dark:bg-red-900/30 hover:bg-red-100 dark:hover:bg-red-900/50 flex justify-center items-center gap-2 text-red-600 dark:text-red-400 py-2 rounded-lg font-medium text-sm transition-colors"
                >
                  <Trash2 size={16} /> Hapus
                </button>
              </div>
            </div>
          </div>
        ))}

        {candidates.length === 0 && (
          <div className="col-span-full bg-white dark:bg-neutral-800 p-12 rounded-2xl shadow-sm border border-neutral-100 dark:border-neutral-700 text-center">
            <div className="w-16 h-16 bg-neutral-50 dark:bg-neutral-800 rounded-full flex items-center justify-center mx-auto mb-4 text-neutral-400 dark:text-neutral-500">
              <Plus size={32} />
            </div>
            <h3 className="text-lg font-bold text-neutral-800 dark:text-neutral-100 mb-2">Belum ada kandidat</h3>
            <p className="text-neutral-500 dark:text-neutral-400 dark:text-neutral-500 mb-6">Silakan tambah kandidat baru untuk memulai pemilihan.</p>
            <button
              onClick={() => handleOpenModal()}
              className="bg-red-500 hover:bg-red-600 text-white px-6 py-2.5 rounded-xl font-medium transition-colors"
            >
              Tambah Kandidat Pertama
            </button>
          </div>
        )}
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-900/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-neutral-900 rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-neutral-100 dark:border-neutral-700 flex justify-between items-center sticky top-0 bg-white dark:bg-neutral-800">
              <h3 className="text-xl font-bold text-neutral-800 dark:text-neutral-100">
                {editingCandidate ? 'Edit Kandidat' : 'Tambah Kandidat Baru'}
              </h3>
              <button onClick={handleCloseModal} className="text-neutral-400 hover:text-neutral-600 dark:text-neutral-400 dark:text-neutral-500">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              <div>
                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">Nama Lengkap</label>
                <input
                  type="text" required
                  value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-2 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none transition-all"
                  placeholder="Contoh: Budi Santoso"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">Tagline (Opsional)</label>
                <input
                  type="text"
                  value={formData.tagline} onChange={e => setFormData({ ...formData, tagline: e.target.value })}
                  className="w-full px-4 py-2 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none transition-all"
                  placeholder="Contoh: Inovasi untuk Perubahan"
                />
                <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">Tagline ini akan ditampilkan di bawah foto kandidat</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">Foto Profil (Opsional)</label>
                
                {formData.photo && (
                  <div className="mb-3 relative">
                    <img
                      src={formData.photo}
                      draggable="false"
                      onDragStart={(e) => e.preventDefault()}
                      alt="Preview"
                      className="w-full h-48 object-cover rounded-lg border border-neutral-200 dark:border-neutral-700"
                    />
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, photo: '' })}
                      className="absolute top-2 right-2 bg-red-500 hover:bg-red-600 text-white p-2 rounded-lg"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                )}

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                    className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    <Upload size={18} />
                    {uploading ? 'Uploading...' : 'Upload Foto'}
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </div>
                
                <div className="mt-2">
                  <label className="block text-xs text-neutral-500 dark:text-neutral-400 dark:text-neutral-500 mb-1">Atau masukkan URL foto:</label>
                  <input
                    type="url"
                    value={formData.photo.startsWith('data:') ? '' : formData.photo}
                    onChange={e => setFormData({ ...formData, photo: e.target.value })}
                    className="w-full px-3 py-2 text-sm bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none transition-all"
                    placeholder="https://example.com/photo.jpg"
                    disabled={formData.photo.startsWith('data:')}
                  />
                </div>
                <p className="text-xs text-neutral-500 dark:text-neutral-400 dark:text-neutral-500 mt-1">Max 5MB. Format: JPG, PNG, GIF, WebP</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">Link Draf Dokumen (Opsional)</label>
                <input
                  type="url"
                  value={formData.draftLink} onChange={e => setFormData({ ...formData, draftLink: e.target.value })}
                  className="w-full px-4 py-2 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none transition-all"
                  placeholder="https://docs.google.com/..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">Visi</label>
                <textarea
                  required rows={3}
                  value={formData.vision} onChange={e => setFormData({ ...formData, vision: e.target.value })}
                  className="w-full px-4 py-2 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none transition-all"
                  placeholder="Tuliskan visi kandidat..."
                ></textarea>
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">Jurusan</label>
                <input
                  type="text"
                  value={formData.major} onChange={e => setFormData({ ...formData, major: e.target.value })}
                  className="w-full px-4 py-2 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none transition-all"
                  placeholder="Contoh: Teknik Informatika"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">Misi</label>
                <textarea
                  rows={4}
                  value={formData.mission} onChange={e => setFormData({ ...formData, mission: e.target.value })}
                  className="w-full px-4 py-2 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none transition-all"
                  placeholder="Tuliskan misi kandidat..."
                ></textarea>
              </div>

              <div className="flex items-center gap-2 p-4 bg-neutral-50 dark:bg-neutral-800 rounded-lg border border-neutral-200 dark:border-neutral-700">
                <input
                  type="checkbox"
                  id="isHidden"
                  checked={formData.isHidden}
                  onChange={e => setFormData({ ...formData, isHidden: e.target.checked })}
                  className="w-4 h-4 text-red-600 border-neutral-300 dark:border-neutral-600 rounded focus:ring-red-500"
                />
                <label htmlFor="isHidden" className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
                  Sembunyikan dari landing page (Kotak Kosong)
                </label>
              </div>

              <div className="pt-4 border-t border-neutral-100 dark:border-neutral-700 flex justify-end gap-3">
                <button type="button" onClick={handleCloseModal} className="px-5 py-2.5 text-neutral-600 dark:text-neutral-400 font-medium hover:bg-neutral-50 dark:hover:bg-neutral-700 rounded-lg transition-colors">
                  Batal
                </button>
                <button type="submit" disabled={loading} className="px-5 py-2.5 bg-red-500 hover:bg-red-600 text-white font-medium rounded-lg transition-colors disabled:opacity-50">
                  {loading ? 'Menyimpan...' : 'Simpan Kandidat'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
