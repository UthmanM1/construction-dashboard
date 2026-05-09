import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Plus, Filter } from 'lucide-react';

const activityTypes = ['on_site', 'off_site', 'sick', 'leave', 'training'];
const activityColor = { on_site: 'badge-ok', off_site: 'badge-info', sick: 'badge-critical', leave: 'badge-warning', training: 'badge-info' };

export default function EmployeesPage() {
  const [employees, setEmployees] = useState([]);
  const [projects, setProjects] = useState([]);
  const [activity, setActivity] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [filters, setFilters] = useState({ from: '', to: '', crew: '' });
  const [form, setForm] = useState({ employee_id: '', project_id: '', activity_date: new Date().toISOString().slice(0,10), activity_type: 'on_site', hours_worked: '', notes: '' });

  useEffect(() => {
    Promise.all([axios.get('/api/employees'), axios.get('/api/projects')]).then(([e, p]) => {
      setEmployees(e.data); setProjects(p.data);
    });
    loadActivity();
  }, []);

  const loadActivity = async (f = {}) => {
    const params = new URLSearchParams();
    if (f.from) params.append('from', f.from);
    if (f.to) params.append('to', f.to);
    if (f.crew) params.append('crew', f.crew);
    const { data } = await axios.get(`/api/employees/activity?${params}`);
    setActivity(data);
  };

  const submit = async (e) => {
    e.preventDefault();
    await axios.post('/api/employees/activity', form);
    setShowForm(false);
    loadActivity(filters);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="display-font text-3xl font-bold text-white tracking-wide">EMPLOYEES</h1>
          <p className="text-gray-500 text-sm mt-1">{employees.length} active staff</p>
        </div>
        <button onClick={() => setShowForm(s => !s)}
          className="flex items-center gap-2 bg-brand-600 hover:bg-brand-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
          <Plus size={16} />Log Activity
        </button>
      </div>

      {showForm && (
        <form onSubmit={submit} className="bg-gray-900 border border-gray-700 rounded-xl p-6 space-y-4">
          <h2 className="text-white font-semibold">Log Employee Activity</h2>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-gray-400 block mb-1">Employee</label>
              <select required value={form.employee_id} onChange={e => setForm(f => ({ ...f, employee_id: e.target.value }))}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-brand-500">
                <option value="">Select employee</option>
                {employees.map(e => <option key={e.id} value={e.id}>{e.name} ({e.crew})</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs text-gray-400 block mb-1">Project</label>
              <select value={form.project_id} onChange={e => setForm(f => ({ ...f, project_id: e.target.value }))}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-brand-500">
                <option value="">No project</option>
                {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs text-gray-400 block mb-1">Date</label>
              <input type="date" required value={form.activity_date} onChange={e => setForm(f => ({ ...f, activity_date: e.target.value }))}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-brand-500" />
            </div>
            <div>
              <label className="text-xs text-gray-400 block mb-1">Activity Type</label>
              <select required value={form.activity_type} onChange={e => setForm(f => ({ ...f, activity_type: e.target.value }))}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-brand-500">
                {activityTypes.map(t => <option key={t} value={t}>{t.replace('_', ' ')}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs text-gray-400 block mb-1">Hours Worked</label>
              <input type="number" step="0.5" min="0" max="24" value={form.hours_worked} onChange={e => setForm(f => ({ ...f, hours_worked: e.target.value }))}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-brand-500" />
            </div>
            <div>
              <label className="text-xs text-gray-400 block mb-1">Notes</label>
              <input type="text" value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-brand-500" />
            </div>
          </div>
          <div className="flex gap-3">
            <button type="submit" className="bg-brand-600 hover:bg-brand-700 text-white px-5 py-2 rounded-lg text-sm font-medium transition-colors">Log</button>
            <button type="button" onClick={() => setShowForm(false)} className="text-gray-400 hover:text-white px-4 py-2 rounded-lg text-sm">Cancel</button>
          </div>
        </form>
      )}

      {/* Filters */}
      <div className="flex flex-wrap items-end gap-3 bg-gray-900 border border-gray-800 rounded-xl p-4">
        <Filter size={16} className="text-gray-500 mb-2" />
        {[['from','From','date'],['to','To','date'],['crew','Crew','text']].map(([key, label, type]) => (
          <div key={key}>
            <label className="text-xs text-gray-500 block mb-1">{label}</label>
            <input type={type} value={filters[key]} onChange={e => setFilters(f => ({ ...f, [key]: e.target.value }))}
              className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-1.5 text-white text-sm focus:outline-none focus:border-brand-500 w-36" />
          </div>
        ))}
        <button onClick={() => loadActivity(filters)} className="bg-gray-700 hover:bg-gray-600 text-white px-4 py-1.5 rounded-lg text-sm transition-colors mb-0.5">
          Apply
        </button>
      </div>

      {/* Activity log */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs text-gray-500 uppercase tracking-wider border-b border-gray-800">
              {['Employee','Crew','Date','Type','Hours','Project','Logged By'].map(h => (
                <th key={h} className="pb-2 pr-4 font-medium">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800">
            {activity.length === 0
              ? <tr><td colSpan={7} className="py-8 text-center text-gray-600">No activity records found</td></tr>
              : activity.map(a => (
                <tr key={a.id} className="hover:bg-gray-900 transition-colors">
                  <td className="py-3 pr-4 text-white font-medium">{a.employee_name}</td>
                  <td className="py-3 pr-4 text-gray-400">{a.crew || '—'}</td>
                  <td className="py-3 pr-4 text-gray-400">{new Date(a.activity_date).toLocaleDateString()}</td>
                  <td className="py-3 pr-4">
                    <span className={`text-xs px-2 py-0.5 rounded border ${activityColor[a.activity_type] || 'badge-info'}`}>
                      {a.activity_type?.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="py-3 pr-4 text-gray-400">{a.hours_worked || '—'}</td>
                  <td className="py-3 pr-4 text-gray-400 truncate max-w-[140px]">{a.project_name || '—'}</td>
                  <td className="py-3 pr-4 text-gray-500">{a.logged_by_name}</td>
                </tr>
              ))
            }
          </tbody>
        </table>
      </div>
    </div>
  );
}
