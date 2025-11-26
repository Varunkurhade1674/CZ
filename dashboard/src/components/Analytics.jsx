import React from 'react';
import { TrendingUp, TrendingDown, Activity, Clock, AlertTriangle, Users, Car, FileWarning, Shield } from 'lucide-react';
import { motion } from 'framer-motion';
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, AreaChart, Area } from 'recharts';

const Analytics = () => {
  // Operational KPIs (mock data)
  const kpis = {
    activeDrivers: 128,
    vehiclesAvailable: 54,
    pendingVerifications: 17,
    expiringDocs30d: 23,
  };

  // Assignment status (today)
  const assignmentStatus = [
    { name: 'Scheduled', value: 62, color: '#3b82f6' },
    { name: 'Active', value: 31, color: '#10b981' },
    { name: 'Completed', value: 188, color: '#8b5cf6' },
    { name: 'Cancelled', value: 9, color: '#ef4444' },
  ];

  // Compliance expiring in next 30 days by type
  const complianceData = [
    { type: 'Driver License', count: 7, color: '#f59e0b' },
    { type: 'Vehicle Insurance', count: 9, color: '#06b6d4' },
    { type: 'Pollution (PUC)', count: 4, color: '#10b981' },
    { type: 'Permit/RC', count: 3, color: '#a78bfa' },
  ];

  // Maintenance due (vehicles)
  const maintenanceDueData = [
    { bucket: 'Overdue', vehicles: 5 },
    { bucket: 'Due this week', vehicles: 12 },
    { bucket: 'Due this month', vehicles: 27 },
  ];

  // Vehicle availability trend (last 7 days)
  const availabilityData = [
    { day: 'Mon', available: 48 },
    { day: 'Tue', available: 52 },
    { day: 'Wed', available: 50 },
    { day: 'Thu', available: 55 },
    { day: 'Fri', available: 53 },
    { day: 'Sat', available: 57 },
    { day: 'Sun', available: 54 },
  ];

  const COLORS = ['#10b981', '#f59e0b', '#ef4444'];

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card p-6"
      >
        <h1 className="text-3xl font-bold gradient-text mb-2">Operations Dashboard</h1>
        <p className="text-gray-400">Admin-focused insights for drivers, vehicles, assignments, and compliance</p>
      </motion.div>
      
      {/* Key Operational Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="glass-card p-6"
        >
          <div className="flex items-start justify-between mb-4">
            <div>
              <p className="text-gray-400 text-sm mb-1">Active Drivers</p>
              <h3 className="text-3xl font-bold">{kpis.activeDrivers}</h3>
              <p className="text-green-400 text-sm flex items-center gap-1 mt-2">
                <TrendingUp size={16} />
                +4 this week
              </p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center">
              <Users size={24} />
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="glass-card p-6"
        >
          <div className="flex items-start justify-between mb-4">
            <div>
              <p className="text-gray-400 text-sm mb-1">Vehicles Available</p>
              <h3 className="text-3xl font-bold">{kpis.vehiclesAvailable}</h3>
              <p className="text-green-400 text-sm flex items-center gap-1 mt-2">
                <Activity size={16} />
                Peak-ready now
              </p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
              <Car size={24} />
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="glass-card p-6"
        >
          <div className="flex items-start justify-between mb-4">
            <div>
              <p className="text-gray-400 text-sm mb-1">Pending Verifications</p>
              <h3 className="text-3xl font-bold">{kpis.pendingVerifications}</h3>
              <p className="text-orange-400 text-sm flex items-center gap-1 mt-2">
                <Clock size={16} />
                Documents awaiting approval
              </p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center">
              <FileWarning size={24} />
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="glass-card p-6"
        >
          <div className="flex items-start justify-between mb-4">
            <div>
              <p className="text-gray-400 text-sm mb-1">Expiring Documents (30d)</p>
              <h3 className="text-3xl font-bold">{kpis.expiringDocs30d}</h3>
              <p className="text-red-400 text-sm flex items-center gap-1 mt-2">
                <AlertTriangle size={16} />
                Review and renew
              </p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
              <Shield size={24} />
            </div>
          </div>
        </motion.div>
      </div>
      
      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Vehicle Availability Trend */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
          className="glass-card p-6"
        >
          <h2 className="text-xl font-bold mb-6">Vehicle Availability (7 days)</h2>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={availabilityData}>
              <defs>
                <linearGradient id="colorAvail" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.1}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="day" stroke="#9ca3af" />
              <YAxis stroke="#9ca3af" />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'rgba(17, 24, 39, 0.8)', 
                  borderColor: '#4b5563',
                  borderRadius: '0.5rem',
                  color: '#e5e7eb'
                }} 
                formatter={(value) => [value, 'Available']}
              />
              <Legend />
              <Area type="monotone" dataKey="available" stroke="#3b82f6" fillOpacity={1} fill="url(#colorAvail)" name="Available" />
            </AreaChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Assignment Status (Today) */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.35 }}
          className="glass-card p-6"
        >
          <h2 className="text-xl font-bold mb-6">Assignment Status (Today)</h2>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={assignmentStatus}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={90}
                paddingAngle={2}
                dataKey="value"
              >
                {assignmentStatus.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'rgba(17, 24, 39, 0.9)', 
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '8px'
                }} 
                formatter={(value, name, p) => [value, assignmentStatus[p?.payload?.index]?.name || name]}
              />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </motion.div>
      </div>
      
      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Compliance Health */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="glass-card p-6"
        >
          <h2 className="text-xl font-bold mb-6">Compliance Expiring (30 days)</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={complianceData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
              <XAxis 
                dataKey="type" 
                stroke="#9ca3af" 
                tick={{ fontSize: 12 }} 
                interval={0}
                tickFormatter={(v) => ({
                  'Driver License': 'DL',
                  'Vehicle Insurance': 'VI',
                  'Pollution (PUC)': 'PUC',
                  'Permit/RC': 'Permit/RC',
                }[v] || v)}
                tickMargin={8}
              />
              <YAxis stroke="#9ca3af" />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'rgba(17, 24, 39, 0.9)', 
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '8px'
                }}
                labelFormatter={(label, payload) => payload?.[0]?.payload?.type || label}
                formatter={(value) => [value, 'Count']}
              />
              <Bar dataKey="count" radius={[8, 8, 0, 0]}>
                {complianceData.map((entry, index) => (
                  <Cell key={`cell-c-${index}`} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Maintenance Due */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.45 }}
          className="glass-card p-6"
        >
          <h2 className="text-xl font-bold mb-6">Maintenance Due</h2>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={maintenanceDueData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
              <XAxis dataKey="bucket" stroke="#9ca3af" />
              <YAxis stroke="#9ca3af" />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'rgba(17, 24, 39, 0.9)', 
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '8px'
                }} 
                formatter={(value) => [value, 'Vehicles']}
              />
              <Bar dataKey="vehicles" fill="#f59e0b" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Quick Compliance Summary */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="glass-card p-6"
        >
          <h2 className="text-xl font-bold mb-4">Actions Needed</h2>
          <div className="space-y-3 text-sm">
            <div className="flex items-center justify-between">
              <span>Verify driver documents</span>
              <span className="px-2 py-0.5 rounded-full bg-orange-500 text-white">{kpis.pendingVerifications}</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Renew expiring documents</span>
              <span className="px-2 py-0.5 rounded-full bg-red-500 text-white">{kpis.expiringDocs30d}</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Schedule maintenance (this week)</span>
              <span className="px-2 py-0.5 rounded-full bg-yellow-500 text-slate-900">{maintenanceDueData[1].vehicles}</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Vehicles available now</span>
              <span className="px-2 py-0.5 rounded-full bg-emerald-500 text-white">{kpis.vehiclesAvailable}</span>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Analytics;
