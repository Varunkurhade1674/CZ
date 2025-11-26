import React, { useState } from 'react';
import { Search, Filter, Upload, MapPin, Wrench, FileText, Calendar, AlertCircle, CheckCircle } from 'lucide-react';
import { motion } from 'framer-motion';

const VehicleManagement = ({ addToast }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showVehicleDetails, setShowVehicleDetails] = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [filterStatus, setFilterStatus] = useState('all');

  const vehicles = [
    {
      id: 1,
      vehicleId: 'KA-01-AB-1234',
      model: 'Maruti Suzuki Swift Dzire',
      rcNumber: 'RC-2023-001234',
      fitnessCert: '2024-12-31',
      insuranceExpiry: '2024-08-15',
      status: 'Active',
      driver: 'Praveen Kumar',
      lastService: '2024-01-15',
      nextService: '2024-04-15',
      mileage: '45,230 km',
      location: 'Andheri, Mumbai'
    },
    {
      id: 2,
      vehicleId: 'KA-02-CD-5678',
      model: 'Honda City',
      rcNumber: 'RC-2023-005678',
      fitnessCert: '2025-03-20',
      insuranceExpiry: '2024-06-10',
      status: 'Active',
      driver: 'Amit Sharma',
      lastService: '2024-02-01',
      nextService: '2024-05-01',
      mileage: '38,450 km',
      location: 'Bandra, Mumbai'
    },
    {
      id: 3,
      vehicleId: 'KA-03-EF-9012',
      model: 'Hyundai Verna',
      rcNumber: 'RC-2023-009012',
      fitnessCert: '2024-11-10',
      insuranceExpiry: '2024-04-25',
      status: 'Maintenance',
      driver: 'Suresh Patil',
      lastService: '2024-01-20',
      nextService: '2024-04-20',
      mileage: '52,890 km',
      location: 'Service Center'
    },
    {
      id: 4,
      vehicleId: 'KA-04-GH-3456',
      model: 'Toyota Etios',
      rcNumber: 'RC-2023-003456',
      fitnessCert: '2025-05-08',
      insuranceExpiry: '2024-09-30',
      status: 'Active',
      driver: 'Vijay Singh',
      lastService: '2024-02-10',
      nextService: '2024-05-10',
      mileage: '41,670 km',
      location: 'Powai, Mumbai'
    },
    {
      id: 5,
      vehicleId: 'KA-05-IJ-7890',
      model: 'Maruti Suzuki Dzire',
      rcNumber: 'RC-2023-007890',
      fitnessCert: '2025-02-14',
      insuranceExpiry: '2024-07-20',
      status: 'Active',
      driver: 'Prakash Desai',
      lastService: '2024-01-25',
      nextService: '2024-04-25',
      mileage: '43,120 km',
      location: 'Goregaon, Mumbai'
    },
  ];

  const getStatusColor = (status) => {
    switch (status.toLowerCase()) {
      case 'active':
        return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'maintenance':
        return 'bg-orange-500/20 text-orange-400 border-orange-500/30';
      case 'inactive':
        return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
      default:
        return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
    }
  };

  const isExpiringSoon = (dateStr) => {
    const date = new Date(dateStr);
    const today = new Date();
    const diffDays = Math.ceil((date - today) / (1000 * 60 * 60 * 24));
    return diffDays <= 30 && diffDays > 0;
  };

  const isExpired = (dateStr) => {
    const date = new Date(dateStr);
    const today = new Date();
    return date < today;
  };

  const getExpiryColor = (dateStr) => {
    if (isExpired(dateStr)) {
      return 'text-red-400';
    } else if (isExpiringSoon(dateStr)) {
      return 'text-orange-400';
    } else {
      return 'text-green-400';
    }
  };

  const handleUploadDocuments = () => {
    if (addToast) addToast('Vehicle document upload feature coming soon!', 'info');
  };

  const handleTrackAll = () => {
    if (addToast) addToast(`Tracking all ${vehicles.length} vehicles`, 'success');
  };

  const handleViewLocation = (vehicle) => {
    if (addToast) addToast(`Viewing location for ${vehicle.vehicleId}`, 'info');
  };

  const handleMaintenance = (vehicle) => {
    if (addToast) addToast(`Maintenance scheduled for ${vehicle.vehicleId}`, 'success');
  };

  const handleViewDocuments = (vehicle) => {
    setSelectedVehicle(vehicle);
    setShowVehicleDetails(true);
    if (addToast) addToast(`Viewing documents for ${vehicle.vehicleId}`, 'info');
  };

  const handleScheduleService = (vehicle) => {
    if (addToast) addToast(`Service scheduled for ${vehicle.vehicleId}`, 'success');
  };

  const filteredVehicles = vehicles.filter(vehicle => {
    const matchesSearch = vehicle.vehicleId.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         vehicle.model.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         vehicle.rcNumber.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterStatus === 'all' || vehicle.status.toLowerCase() === filterStatus;
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card p-6"
      >
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold gradient-text mb-2">Vehicle Management</h1>
            <p className="text-gray-400">Monitor and manage your fleet vehicles</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={handleUploadDocuments}
              className="glass-button px-6 py-3 bg-gradient-to-r from-purple-500/20 to-pink-500/20 hover:from-purple-500/30 hover:to-pink-500/30 flex items-center gap-2"
            >
              <Upload size={20} />
              Upload Documents
            </button>
            <button
              onClick={handleTrackAll}
              className="glass-button px-6 py-3 bg-gradient-to-r from-blue-500/20 to-cyan-500/20 hover:from-blue-500/30 hover:to-cyan-500/30 flex items-center gap-2"
            >
              <MapPin size={20} />
              Track All
            </button>
          </div>
        </div>
      </motion.div>

      {/* Search and Filters */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="glass-card p-6"
      >
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Search by vehicle ID, model, or RC number..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="glass-input w-full pl-10"
            />
          </div>
          <div className="flex gap-3">
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="glass-input"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="maintenance">Maintenance</option>
              <option value="inactive">Inactive</option>
            </select>
            <button
              onClick={() => {
                if (addToast) addToast('Advanced filters coming soon!', 'info');
              }}
              className="glass-button px-4 flex items-center gap-2"
            >
              <Filter size={20} />
              More Filters
            </button>
          </div>
        </div>
      </motion.div>

      {/* Vehicles Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="glass-card p-6 overflow-x-auto"
      >
        <table className="w-full">
          <thead>
            <tr className="border-b border-white/10">
              <th className="text-left py-4 px-4 text-gray-400 font-semibold">Vehicle</th>
              <th className="text-left py-4 px-4 text-gray-400 font-semibold">RC Number</th>
              <th className="text-left py-4 px-4 text-gray-400 font-semibold">Driver</th>
              <th className="text-left py-4 px-4 text-gray-400 font-semibold">Fitness Cert.</th>
              <th className="text-left py-4 px-4 text-gray-400 font-semibold">Insurance</th>
              <th className="text-left py-4 px-4 text-gray-400 font-semibold">Status</th>
              <th className="text-left py-4 px-4 text-gray-400 font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredVehicles.map((vehicle, index) => (
              <motion.tr
                key={vehicle.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 + index * 0.05 }}
                className="border-b border-white/5 hover:bg-white/5 transition-all"
              >
                <td className="py-4 px-4">
                  <div>
                    <p className="font-mono font-bold text-lg">{vehicle.vehicleId}</p>
                    <p className="text-sm text-gray-400">{vehicle.model}</p>
                    <p className="text-xs text-gray-500 flex items-center gap-1 mt-1">
                      <MapPin size={12} />
                      {vehicle.location}
                    </p>
                  </div>
                </td>
                <td className="py-4 px-4">
                  <p className="font-mono text-sm">{vehicle.rcNumber}</p>
                  <p className="text-xs text-gray-400 mt-1">{vehicle.mileage}</p>
                </td>
                <td className="py-4 px-4">
                  <p className="font-semibold">{vehicle.driver}</p>
                </td>
                <td className="py-4 px-4">
                  <div className="flex items-center gap-2">
                    {isExpired(vehicle.fitnessCert) ? (
                      <AlertCircle size={16} className="text-red-400" />
                    ) : isExpiringSoon(vehicle.fitnessCert) ? (
                      <AlertCircle size={16} className="text-orange-400" />
                    ) : (
                      <CheckCircle size={16} className="text-green-400" />
                    )}
                    <div>
                      <p className={`text-sm font-semibold ${getExpiryColor(vehicle.fitnessCert)}`}>
                        {vehicle.fitnessCert}
                      </p>
                      {isExpiringSoon(vehicle.fitnessCert) && (
                        <p className="text-xs text-orange-400">Expiring soon</p>
                      )}
                      {isExpired(vehicle.fitnessCert) && (
                        <p className="text-xs text-red-400">Expired</p>
                      )}
                    </div>
                  </div>
                </td>
                <td className="py-4 px-4">
                  <div className="flex items-center gap-2">
                    {isExpired(vehicle.insuranceExpiry) ? (
                      <AlertCircle size={16} className="text-red-400" />
                    ) : isExpiringSoon(vehicle.insuranceExpiry) ? (
                      <AlertCircle size={16} className="text-orange-400" />
                    ) : (
                      <CheckCircle size={16} className="text-green-400" />
                    )}
                    <div>
                      <p className={`text-sm font-semibold ${getExpiryColor(vehicle.insuranceExpiry)}`}>
                        {vehicle.insuranceExpiry}
                      </p>
                      {isExpiringSoon(vehicle.insuranceExpiry) && (
                        <p className="text-xs text-orange-400">Expiring soon</p>
                      )}
                      {isExpired(vehicle.insuranceExpiry) && (
                        <p className="text-xs text-red-400">Expired</p>
                      )}
                    </div>
                  </div>
                </td>
                <td className="py-4 px-4">
                  <span className={`status-badge border ${getStatusColor(vehicle.status)}`}>
                    {vehicle.status}
                  </span>
                </td>
                <td className="py-4 px-4">
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleViewLocation(vehicle)}
                      className="glass-button p-2 hover:bg-blue-500/20 transition-colors"
                      title="View Location"
                    >
                      <MapPin size={16} />
                    </button>
                    <button
                      onClick={() => handleMaintenance(vehicle)}
                      className="glass-button p-2 hover:bg-purple-500/20 transition-colors"
                      title="Schedule Maintenance"
                    >
                      <Wrench size={16} />
                    </button>
                    <button
                      onClick={() => handleViewDocuments(vehicle)}
                      className="glass-button p-2 hover:bg-green-500/20 transition-colors"
                      title="View Documents"
                    >
                      <FileText size={16} />
                    </button>
                    <button
                      onClick={() => handleScheduleService(vehicle)}
                      className="glass-button p-2 hover:bg-orange-500/20 transition-colors"
                      title="Schedule Service"
                    >
                      <Calendar size={16} />
                    </button>
                  </div>
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </motion.div>

      {/* Summary Stats */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="grid grid-cols-1 md:grid-cols-4 gap-4"
      >
        <div className="glass-card p-4">
          <p className="text-gray-400 text-sm mb-1">Total Vehicles</p>
          <p className="text-2xl font-bold">{filteredVehicles.length}</p>
        </div>
        <div className="glass-card p-4">
          <p className="text-gray-400 text-sm mb-1">Active</p>
          <p className="text-2xl font-bold text-green-400">
            {filteredVehicles.filter(v => v.status === 'Active').length}
          </p>
        </div>
        <div className="glass-card p-4">
          <p className="text-gray-400 text-sm mb-1">In Maintenance</p>
          <p className="text-2xl font-bold text-orange-400">
            {filteredVehicles.filter(v => v.status === 'Maintenance').length}
          </p>
        </div>
        <div className="glass-card p-4">
          <p className="text-gray-400 text-sm mb-1">Expiring Soon</p>
          <p className="text-2xl font-bold text-red-400">
            {filteredVehicles.filter(v => isExpiringSoon(v.insuranceExpiry) || isExpiringSoon(v.fitnessCert)).length}
          </p>
        </div>
      </motion.div>
    </div>
  );
};

export default VehicleManagement;
