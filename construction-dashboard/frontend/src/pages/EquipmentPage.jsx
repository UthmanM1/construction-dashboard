import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Plus, Wrench } from 'lucide-react';

const statusColor = {
  available:   'bg-green-900/40 text-green-400 border-green-800',
  in_use:      'bg-yellow-900/40 text-yellow-400 border-yellow-800',
  maintenance: 'bg-red-900/40 text-red-400 border-red-800',
  retired:     'bg-gray-800 text-gray-500 border-gray-700',
};

export default function EquipmentPage() {
  const [equipment, setEquipment] = useState([]);
  const [projects, setProjects] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [usage, setUsage] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ equipment_id: '', project_id: '', operator_id: '', usage_date: new Date().toISOString().slice(0,10), hours_used: '', fuel_used: '', condition_notes: '' });

  useEffect(() => {
    Promise.all([
      axios.get('/api/equipment'),
      axios.get('/api/projects'),
      axios.get('/api/employees'),
      axios.get('/api/equipment/usage'),
    ]).then(([eq, p, em, u]) => {
      setEquipment(eq.data); setProjects(p.data); setEmployees(em.data); setUsage(u.data);
    });
  }, []);

  const submit = async (e) => {
    e.preventDefault();
    await axios.post('/api/equipment/usage', form);
    const u = await axios.get('/api/equipment/usage');
    setUsage(u.data);
    setShowForm(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="display-font text-3xl font-bold text-white tracking-wide">EQUIPMENT</h1>
          <p className="text-gray-500 text-sm mt-1">{equipment.length} registered items</p>
        </div>
        <button onClick={() => setShowForm(s => !s)}
          className="flex items-center gap-2 bg-brand-600 hover:bg-brand-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
          <Plus size={16} />Log Usage
        </button>
      </div>

      {/* Equipment grid */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {equipment.map(eq => (
          <div key={eq.id} className="bg-gray-900 border border-gray-800 rounded-xl p-4">
            <div className="flex items-start gap-3">
              <div className="bg-gray-800 rounded-lg p-2 flex-shrink-0">
                <Wrench size={18} className="text-brand-500" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white font-medium truncate">{eq.name}</p>
                <p className="text-gray-500 text-xs">{eq.category || 'Uncategorized'}</p>
                <div className="flex items-center justify-between mt-2">
                  <span className={`text-xs px-2 py-0.5 rounded border ${statusColor[eq.status]}`}>
                    {eq.status?.replace('_', ' ')}
                  </span>
                  {eq.serial_number && <span className="text-gray-600 text-xs">#{eq.serial_number}</span>}
                </div>
              </div>
            </div>
          </div>
        ))}
        {equipment.length === 0 && <p className="col-span-3 text-center text-gray-600 py-8">No equipment registered</p>}
      </div>

      {showForm && (
        <form onSubmit={submit} className="bg-gray-900 border border-gray-700 rounded-xl p-6 space-y-4">
          <h2 className="text-white font-semibold">Log Equipment Usage</h2>
          <div className="grid sm:grid-cols-2 gap-4">
            {[
              { key: 'equipment_id', label: 'Equipment', type: 'select', options: equipment.map(e => ({ v: e.id, l: e.name })), req: true },
              { key: 'project_id',   label: 'Project',   type: 'select', options: projects.map(p => ({ v: p.id, l: p.name }))   },
              { key: 'operator_id',  label: 'Operator',  type: 'select', options: employees.map(e => ({ v: e.id, l: e.name }))  },
              { key: 'usage_date',   label: 'Date',      type: 'date',   req: true },
              { key: 'hours_used',   label: 'Hours Used',type: 'number'  },
              { key: 'fuel_used',    label: 'Fuel Used (L)', type: 'number' },
            ].map(({ key, label, type, options, req }) => (
              <div key={key}>
                <label className="text-xs text-gray-400 block mb-1">{label}</label>
                {type === 'select'
                  ? <select required={req} value={form[key]} onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                      className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-brand-500">
                      <option value="">— Select —</option>
                      {options?.map(o => <option key={o.v} value={o.v}>{o.l}</option>)}
                    </select>
                  : <input type={type} required={req} step="0.5" min="0" value={form[key]} onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                      className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-brand-500" />
                }
              </div>
            ))}
            <div className="sm:col-span-2">
              <label className="text-xs text-gray-400 block mb-1">Condition Notes</label>
              <input type="text" value={form.condition_notes} onChange={e => setForm(f => ({ ...f, condition_notes: e.target.value }))}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-brand-500" />
            </div>
          </div>
          <div className="flex gap-3">
            <button type="submit" className="bg-brand-600 hover:bg-brand-700 text-white px-5 py-2 rounded-lg text-sm font-medium transition-colors">Log</button>
            <button type="button" onClick={() => setShowForm(false)} className="text-gray-400 hover:text-white px-4 py-2 rounded-lg text-sm">Cancel</button>
          </div>
        </form>
      )}

      {/* Usage log */}
      <div>
        <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">Recent Usage Log</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-gray-500 uppercase tracking-wider border-b border-gray-800">
                {['Equipment','Date','Hours','Fuel','Project','Operator'].map(h => (
                  <th key={h} className="pb-2 pr-4 font-medium">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {usage.length === 0
                ? <tr><td colSpan={6} className="py-8 text-center text-gray-600">No usage records yet</td></tr>
                : usage.slice(0, 50).map(u => (
                  <tr key={u.id} className="hover:bg-gray-900 transition-colors">
                    <td className="py-3 pr-4 text-white">{u.equipment_name}</td>
                    <td className="py-3 pr-4 text-gray-400">{new Date(u.usage_date).toLocaleDateString()}</td>
                    <td className="py-3 pr-4 text-gray-400">{u.hours_used || '—'}</td>
                    <td className="py-3 pr-4 text-gray-400">{u.fuel_used ? `${u.fuel_used}L` : '—'}</td>
                    <td className="py-3 pr-4 text-gray-400 truncate max-w-[140px]">{u.project_name || '—'}</td>
                    <td className="py-3 pr-4 text-gray-400">{u.operator_name || '—'}</td>
                  </tr>
                ))
              }
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
