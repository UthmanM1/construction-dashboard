import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Upload, Search, Download, FileText, File, FileImage } from 'lucide-react';

const fileIcon = (mime) => {
  if (!mime) return <File size={16} />;
  if (mime.includes('image')) return <FileImage size={16} className="text-blue-400" />;
  if (mime.includes('pdf')) return <FileText size={16} className="text-red-400" />;
  return <File size={16} className="text-gray-400" />;
};

const formatSize = (bytes) => {
  if (!bytes) return '—';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1048576) return `${(bytes/1024).toFixed(1)} KB`;
  return `${(bytes/1048576).toFixed(1)} MB`;
};

export default function DocumentsPage() {
  const [documents, setDocuments] = useState([]);
  const [projects, setProjects] = useState([]);
  const [search, setSearch] = useState({ q: '', project_id: '', category: '' });
  const [showUpload, setShowUpload] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [form, setForm] = useState({ project_id: '', category: '', description: '', tags: '' });
  const [file, setFile] = useState(null);

  useEffect(() => {
    axios.get('/api/projects').then(r => setProjects(r.data));
    loadDocs();
  }, []);

  const loadDocs = async (s = {}) => {
    const params = new URLSearchParams();
    if (s.q) params.append('q', s.q);
    if (s.project_id) params.append('project_id', s.project_id);
    if (s.category) params.append('category', s.category);
    const { data } = await axios.get(`/api/documents?${params}`);
    setDocuments(data);
  };

  const upload = async (e) => {
    e.preventDefault();
    if (!file) return;
    setUploading(true);
    const fd = new FormData();
    fd.append('file', file);
    Object.entries(form).forEach(([k, v]) => { if (v) fd.append(k, v); });
    try {
      await axios.post('/api/documents/upload', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      setShowUpload(false);
      setFile(null);
      setForm({ project_id: '', category: '', description: '', tags: '' });
      loadDocs(search);
    } catch (e) {
      alert('Upload failed');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="display-font text-3xl font-bold text-white tracking-wide">DOCUMENT ARCHIVE</h1>
          <p className="text-gray-500 text-sm mt-1">{documents.length} files stored</p>
        </div>
        <button onClick={() => setShowUpload(s => !s)}
          className="flex items-center gap-2 bg-brand-600 hover:bg-brand-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
          <Upload size={16} />Upload File
        </button>
      </div>

      {showUpload && (
        <form onSubmit={upload} className="bg-gray-900 border border-gray-700 rounded-xl p-6 space-y-4">
          <h2 className="text-white font-semibold">Upload Document</h2>
          <div>
            <label className="text-xs text-gray-400 block mb-1">File</label>
            <input type="file" required onChange={e => setFile(e.target.files[0])}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-gray-300 text-sm file:mr-3 file:py-1 file:px-3 file:rounded file:border-0 file:bg-brand-600 file:text-white file:text-sm file:cursor-pointer" />
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-gray-400 block mb-1">Project</label>
              <select value={form.project_id} onChange={e => setForm(f => ({ ...f, project_id: e.target.value }))}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-brand-500">
                <option value="">No project</option>
                {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs text-gray-400 block mb-1">Category</label>
              <input type="text" value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
                placeholder="e.g. Plans, Invoices, Photos"
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-brand-500" />
            </div>
            <div>
              <label className="text-xs text-gray-400 block mb-1">Description</label>
              <input type="text" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-brand-500" />
            </div>
            <div>
              <label className="text-xs text-gray-400 block mb-1">Tags (comma-separated)</label>
              <input type="text" value={form.tags} onChange={e => setForm(f => ({ ...f, tags: e.target.value }))}
                placeholder="permit, phase-1, urgent"
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-brand-500" />
            </div>
          </div>
          <div className="flex gap-3">
            <button type="submit" disabled={uploading} className="bg-brand-600 hover:bg-brand-700 disabled:opacity-50 text-white px-5 py-2 rounded-lg text-sm font-medium transition-colors">
              {uploading ? 'Uploading...' : 'Upload'}
            </button>
            <button type="button" onClick={() => setShowUpload(false)} className="text-gray-400 hover:text-white px-4 py-2 rounded-lg text-sm">Cancel</button>
          </div>
        </form>
      )}

      {/* Search */}
      <div className="flex flex-wrap items-end gap-3 bg-gray-900 border border-gray-800 rounded-xl p-4">
        <Search size={16} className="text-gray-500 mb-2" />
        <div>
          <label className="text-xs text-gray-500 block mb-1">Search</label>
          <input type="text" value={search.q} onChange={e => setSearch(s => ({ ...s, q: e.target.value }))}
            placeholder="filename, description, tag..."
            className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-1.5 text-white text-sm focus:outline-none focus:border-brand-500 w-52" />
        </div>
        <div>
          <label className="text-xs text-gray-500 block mb-1">Project</label>
          <select value={search.project_id} onChange={e => setSearch(s => ({ ...s, project_id: e.target.value }))}
            className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-1.5 text-white text-sm focus:outline-none focus:border-brand-500 w-40">
            <option value="">All projects</option>
            {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        </div>
        <button onClick={() => loadDocs(search)} className="bg-gray-700 hover:bg-gray-600 text-white px-4 py-1.5 rounded-lg text-sm transition-colors mb-0.5">
          Search
        </button>
      </div>

      {/* Documents table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs text-gray-500 uppercase tracking-wider border-b border-gray-800">
              {['File','Category','Project','Size','Uploaded By','Date',''].map(h => (
                <th key={h} className="pb-2 pr-4 font-medium">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800">
            {documents.length === 0
              ? <tr><td colSpan={7} className="py-8 text-center text-gray-600">No documents found</td></tr>
              : documents.map(d => (
                <tr key={d.id} className="hover:bg-gray-900 transition-colors">
                  <td className="py-3 pr-4">
                    <div className="flex items-center gap-2">
                      {fileIcon(d.mime_type)}
                      <div>
                        <p className="text-white font-medium truncate max-w-[200px]">{d.original_name}</p>
                        {d.tags?.length > 0 && (
                          <div className="flex gap-1 mt-0.5">
                            {d.tags.slice(0,3).map(t => (
                              <span key={t} className="text-xs bg-gray-800 text-gray-400 px-1.5 py-0.5 rounded">{t}</span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="py-3 pr-4 text-gray-400">{d.category || '—'}</td>
                  <td className="py-3 pr-4 text-gray-400 truncate max-w-[130px]">{d.project_name || '—'}</td>
                  <td className="py-3 pr-4 text-gray-400">{formatSize(d.file_size)}</td>
                  <td className="py-3 pr-4 text-gray-400">{d.uploaded_by_name}</td>
                  <td className="py-3 pr-4 text-gray-500">{new Date(d.created_at).toLocaleDateString()}</td>
                  <td className="py-3">
                    <a href={`/api/documents/${d.id}/download`}
                      className="flex items-center gap-1 text-brand-500 hover:text-brand-400 text-xs transition-colors">
                      <Download size={13} />
                      Download
                    </a>
                  </td>
                </tr>
              ))
            }
          </tbody>
        </table>
      </div>
    </div>
  );
}
