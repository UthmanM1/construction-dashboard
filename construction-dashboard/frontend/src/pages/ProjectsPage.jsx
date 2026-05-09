import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Plus, History, ChevronRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const statusColor = {
  planning: 'bg-indigo-900/40 text-indigo-400 border-indigo-800',
  active: 'bg-green-900/40 text-green-400 border-green-800',
  on_hold: 'bg-yellow-900/40 text-yellow-400 border-yellow-800',
  completed: 'bg-blue-900/40 text-blue-400 border-blue-800',
  archived: 'bg-gray-800 text-gray-500 border-gray-700',
};

export default function ProjectsPage() {
  const { user } = useAuth();
  const [projects, setProjects] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [history, setHistory] = useState({ id: null, data: [] });
  const [form, setForm] = useState({ name: '', site_location: '', start_date: '', expected_end_date: '', budget: '', description: '' });

  useEffect(() => { axios.get('/api/projects').then(r => setProjects(r.data)); }, []);

  const submit = async (e) => {
    e.preventDefault();
    const { data } = await axios.post('/api/projects', form);
    setProjects(p => [data, ...p]);
    setShowForm(false);
    setForm({ name: '', site_location: '', start_date: '', expected_end_date: '', budget: '', description: '' });
  };

  const loadHistory = async (id) => {
    if (history.id === id) return setHistory({ id: null, data: [] });
    const { data } = await axios.get(`/api/projects/${id}/history`);
    setHistory({ id, data });
  };

  const canCreate = ['manager', 'admin'].includes(user?.role);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="display-font text-3xl font-bold text-white tracking-wide">PROJECTS</h1>
          <p className="text-gray-500 text-sm mt-1">{projects.length} total projects</p>
        </div>
        {canCreate && (
          <button onClick={() => setShowForm(s => !s)}
            className="flex items-center gap-2 bg-brand-600 hover:bg-brand-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
            <Plus size={16} />
            New Project
          </button>
        )}
      </div>

      {showForm && (
        <form onSubmit={submit} className="bg-gray-900 border border-gray-700 rounded-xl p-6 space-y-4">
          <h2 className="text-white font-semibold">Create Project</h2>
          <div className="grid sm:grid-cols-2 gap-4">
            {[['name','Project Name','text',true],['site_location','Site Location','text',false],
              ['start_date','Start Date','date',false],['expected_end_date','End Date','date',false],
              ['budget','Budget ($)','number',false]].map(([key, label, type, req]) => (
              <div key={key}>
                <label className="text-xs text-gray-400 block mb-1">{label}</label>
                <input type={type} required={req} value={form[key]}
                  onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-brand-500" />
              </div>
            ))}
            <div className="sm:col-span-2">
              <label className="text-xs text-gray-400 block mb-1">Description</label>
              <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={2}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-brand-500 resize-none" />
            </div>
          </div>
          <div className="flex gap-3">
            <button type="submit" className="bg-brand-600 hover:bg-brand-700 text-white px-5 py-2 rounded-lg text-sm font-medium transition-colors">Create</button>
            <button type="button" onClick={() => setShowForm(false)} className="text-gray-400 hover:text-white px-4 py-2 rounded-lg text-sm transition-colors">Cancel</button>
          </div>
        </form>
      )}

      <div className="space-y-3">
        {projects.length === 0 && <p className="text-gray-600 text-sm py-8 text-center">No projects yet</p>}
        {projects.map(p => (
          <div key={p.id} className="bg-gray-900 border border-gray-800 rounded-xl p-5">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 flex-wrap">
                  <h3 className="text-white font-semibold">{p.name}</h3>
                  <span className={`text-xs px-2 py-0.5 rounded border capitalize ${statusColor[p.status]}`}>{p.status?.replace('_', ' ')}</span>
                </div>
                <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-xs text-gray-500">
                  {p.site_location && <span>📍 {p.site_location}</span>}
                  {p.start_date && <span>Start: {new Date(p.start_date).toLocaleDateString()}</span>}
                  {p.budget && <span>Budget: ${Number(p.budget).toLocaleString()}</span>}
                  <span>{p.activity_count} activities</span>
                  <span>{p.document_count} docs</span>
                </div>
              </div>
              <button onClick={() => loadHistory(p.id)}
                className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-brand-500 transition-colors flex-shrink-0">
                <History size={14} />
                History
                <ChevronRight size={12} className={`transition-transform ${history.id === p.id ? 'rotate-90' : ''}`} />
              </button>
            </div>

            {history.id === p.id && (
              <div className="mt-4 border-t border-gray-800 pt-4">
                <p className="text-xs text-gray-500 uppercase tracking-wider mb-2">Change History</p>
                {history.data.length === 0
                  ? <p className="text-gray-600 text-xs">No changes recorded yet</p>
                  : history.data.map(h => (
                    <div key={h.id} className="text-xs text-gray-400 py-1 border-b border-gray-800 last:border-0">
                      <span className="text-gray-300">{h.changed_by_name}</span> changed <span className="text-brand-500">{h.field_changed}</span> from "{h.old_value}" → "{h.new_value}"
                      <span className="text-gray-600 ml-2">{new Date(h.changed_at).toLocaleString()}</span>
                    </div>
                  ))
                }
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
