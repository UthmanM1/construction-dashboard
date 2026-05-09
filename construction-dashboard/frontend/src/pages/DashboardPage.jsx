import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { FolderKanban, Users, Wrench, AlertTriangle, ClipboardList, CheckCircle2, XCircle } from 'lucide-react';

const statusColor = { planning: '#6366f1', active: '#22c55e', on_hold: '#f59e0b', completed: '#3b82f6', archived: '#6b7280' };
const severityClass = { critical: 'badge-critical', warning: 'badge-warning', info: 'badge-info' };

export default function DashboardPage() {
  const [summary, setSummary] = useState(null);
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    try {
      const [s, a] = await Promise.all([
        axios.get('/api/dashboard/summary'),
        axios.get('/api/dashboard/alerts'),
      ]);
      setSummary(s.data);
      setAlerts(a.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const resolveAlert = async (id) => {
    await axios.put(`/api/dashboard/alerts/${id}/resolve`);
    setAlerts(a => a.filter(x => x.id !== id));
  };

  if (loading) return <div className="text-gray-500 text-sm">Loading dashboard...</div>;

  const activeProjects = summary?.projects?.find(p => p.status === 'active')?.count || 0;
  const totalProjects = summary?.projects?.reduce((s, p) => s + parseInt(p.count), 0) || 0;
  const availableEquip = summary?.equipment?.find(e => e.status === 'available')?.count || 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="display-font text-3xl font-bold text-white tracking-wide">COMMAND CENTER</h1>
        <p className="text-gray-500 text-sm mt-1">{new Date().toLocaleDateString('en-GB', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Active Projects', value: activeProjects, sub: `${totalProjects} total`, icon: FolderKanban, color: 'text-green-400' },
          { label: 'Active Employees', value: summary?.totalActiveEmployees || 0, sub: 'on payroll', icon: Users, color: 'text-blue-400' },
          { label: 'Equipment Available', value: availableEquip, sub: 'ready to deploy', icon: Wrench, color: 'text-yellow-400' },
          { label: "Today's Logs", value: summary?.todayActivityLogs || 0, sub: 'activity entries', icon: ClipboardList, color: 'text-purple-400' },
        ].map(({ label, value, sub, icon: Icon, color }) => (
          <div key={label} className="stat-card">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-gray-500 text-xs uppercase tracking-wider">{label}</p>
                <p className="display-font text-4xl font-bold text-white mt-1">{value}</p>
                <p className="text-gray-600 text-xs mt-1">{sub}</p>
              </div>
              <Icon size={22} className={color} />
            </div>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Project status chart */}
        <div className="stat-card">
          <h2 className="text-sm font-semibold text-gray-300 uppercase tracking-wider mb-4">Project Status Breakdown</h2>
          {summary?.projects?.length > 0 ? (
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={summary.projects.map(p => ({ name: p.status, count: parseInt(p.count) }))} barSize={32}>
                <XAxis dataKey="name" tick={{ fill: '#9ca3af', fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#9ca3af', fontSize: 12 }} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip contentStyle={{ background: '#111827', border: '1px solid #374151', borderRadius: 8, color: '#e5e7eb' }} />
                <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                  {summary.projects.map(p => (
                    <Cell key={p.status} fill={statusColor[p.status] || '#6b7280'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-gray-600 text-sm py-8 text-center">No project data yet</p>
          )}
        </div>

        {/* Alerts */}
        <div className="stat-card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-gray-300 uppercase tracking-wider">Active Alerts</h2>
            {alerts.length > 0 && (
              <span className="bg-red-900/40 text-red-400 text-xs px-2 py-0.5 rounded-full border border-red-800">
                {alerts.length}
              </span>
            )}
          </div>
          {alerts.length === 0 ? (
            <div className="flex items-center gap-2 text-green-400 py-8 justify-center">
              <CheckCircle2 size={18} />
              <span className="text-sm">All clear — no active alerts</span>
            </div>
          ) : (
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {alerts.map(a => (
                <div key={a.id} className="flex items-start gap-3 bg-gray-800 rounded-lg p-3">
                  <AlertTriangle size={16} className={a.severity === 'critical' ? 'text-red-400' : a.severity === 'warning' ? 'text-yellow-400' : 'text-blue-400'} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-white font-medium">{a.title}</p>
                    {a.message && <p className="text-xs text-gray-500 mt-0.5 truncate">{a.message}</p>}
                    <span className={`text-xs px-1.5 py-0.5 rounded mt-1 inline-block ${severityClass[a.severity]}`}>{a.severity}</span>
                  </div>
                  <button onClick={() => resolveAlert(a.id)} className="text-gray-600 hover:text-green-400 transition-colors flex-shrink-0">
                    <XCircle size={16} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
