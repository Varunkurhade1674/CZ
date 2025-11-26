import React, { useState } from 'react';
import { Search, Filter, UserPlus } from 'lucide-react';
import { motion } from 'framer-motion';
import AddDriverForm from './AddDriverForm';
import EditDriverForm from './EditDriverForm';
import DriverSelector from './driver/DriverSelector';
import DocumentExtractor from './DocumentExtractor';
import DocumentRecords from './DocumentRecords';

const API_BASE_URL = import.meta.env?.VITE_API_BASE_URL || '';
const buildUrl = (path = '') => `${API_BASE_URL}${path}`;

const toInputDate = (value = '') => {
  if (!value) return '';
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(value)) {
    const [dd, mm, yyyy] = value.split('/');
    return `${yyyy}-${mm}-${dd}`;
  }
  return value;
};

const toDisplayDate = (value = '') => {
  if (!value) return '';
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(value)) return value;
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    const [yyyy, mm, dd] = value.split('-');
    return `${dd}/${mm}/${yyyy}`;
  }
  return value;
};

const DriverManagement = ({ addToast }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterOption, setFilterOption] = useState('all');
  const [showAddDriverModal, setShowAddDriverModal] = useState(false);
  const [showEditDriverModal, setShowEditDriverModal] = useState(false);
  const [selectedDriver, setSelectedDriver] = useState(null);
  const [selectedDocDriver, setSelectedDocDriver] = useState(null);
  const [recordsRefreshKey, setRecordsRefreshKey] = useState(0);
  const [recordBeingEdited, setRecordBeingEdited] = useState(null);

  const handleAddDriver = (formData) => {
    console.log('Adding driver:', formData);
    setShowAddDriverModal(false);
    if (addToast) addToast(`Driver ${formData.name} added successfully!`, 'success');
  };

  const mapRecordToDriver = (record) => {
    const data = record?.extractedData || {};
    return {
      id: record?.id,
      name: data.name || '',
      phone: data.phone || record?.id || '',
      licenseNo: data.licenseNumber || '',
      vehicle: data.vehicle || data.vehicleClass || '',
      dob: toInputDate(data.dob),
      doi: toInputDate(data.doi || data.issueDate),
      licenseExpiry: toInputDate(data.validity),
      joinDate: '',
      address: data.address || '',
    };
  };

  const handleRecordEditRequest = (record) => {
    if (!record) return;
    setRecordBeingEdited(record);
    setSelectedDriver(mapRecordToDriver(record));
    setShowEditDriverModal(true);
  };

  const handleDriverUpdate = async (formData) => {
    if (!recordBeingEdited?.id) return;
    const baseData = recordBeingEdited.extractedData || {};
    const updatedPayload = {
      ...baseData,
      name: formData.name,
      phone: formData.phone,
      licenseNumber: formData.licenseNo,
      dob: toDisplayDate(formData.dob),
      validity: toDisplayDate(formData.licenseExpiry),
      address: formData.address,
    };
    if (formData.doi) updatedPayload.doi = toDisplayDate(formData.doi);

    try {
      const response = await fetch(buildUrl(`/api/licenses/${recordBeingEdited.id}`), {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ extractedData: updatedPayload }),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(payload?.message || 'Failed to update driver record');
      }
      addToast?.('Driver record updated successfully', 'success');
      setShowEditDriverModal(false);
      setRecordBeingEdited(null);
      setSelectedDriver(null);
      setRecordsRefreshKey((prev) => prev + 1);
    } catch (error) {
      addToast?.(error.message || 'Unable to update driver record', 'error');
    }
  };

  const handleCancelEdit = () => {
    setShowEditDriverModal(false);
    setRecordBeingEdited(null);
    setSelectedDriver(null);
  };

  return (
    <div className="flex flex-col min-h-[calc(100vh-8rem)] justify-start pt-8 pb-12">
      <div className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
      <motion.div 
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card p-6"
      >
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold gradient-text mb-2">Driver Management</h1>
            <p className="text-gray-400">Manage and monitor your fleet drivers and their details</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowAddDriverModal(true)}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
            >
              <UserPlus className="h-5 w-5 mr-2" />
              Add New Driver
            </button>
          </div>
        </div>
      
        <div className="mt-6 pt-6 border-t border-gray-700/50">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="text"
                placeholder="Search by name or vehicle number..."
                className="glass-input w-full pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
              <select
                className="glass-input pl-10 pr-8 text-white bg-slate-900/70 border border-white/20"
                value={filterOption}
                onChange={(e) => setFilterOption(e.target.value)}
              >
                <option value="all">All Drivers</option>
                <optgroup label="Verification">
                  <option value="verification:verified">Verified</option>
                  <option value="verification:pending">Pending</option>
                  <option value="verification:rejected">Rejected</option>
                </optgroup>
                <optgroup label="Expiry">
                  <option value="expiry:expired">Expired</option>
                  <option value="expiry:upcoming">Expiring Soon (30 days)</option>
                </optgroup>
              </select>
            </div>
          </div>
          {searchTerm.trim() && (
            <div className="mt-3 text-sm text-blue-600">
              Showing results for <span className="font-semibold">"{searchTerm}"</span>
              <button
                type="button"
                className="ml-3 text-xs text-blue-500 hover:text-blue-700"
                onClick={() => setSearchTerm('')}
              >
                Clear
              </button>
            </div>
          )}
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="space-y-6"
      >
        <DriverSelector selectedDriver={selectedDocDriver} onSelect={setSelectedDocDriver} />
        <DocumentExtractor selectedDriver={selectedDocDriver} addToast={addToast} />
      </motion.div>
      
      <DocumentRecords
        addToast={addToast}
        onEditRecord={handleRecordEditRequest}
        refreshSignal={recordsRefreshKey}
      />

      {showEditDriverModal && selectedDriver && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-[9999] px-4">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="w-full max-w-xl max-h-[80vh] rounded-xl p-6 shadow-xl bg-white border border-slate-200 flex flex-col"
          >
            <h2 className="text-2xl font-semibold text-slate-900 mb-4">Edit Driver</h2>
            <p className="text-sm text-slate-500 mb-4">
              Update the driver details below. Fields are pre-filled from the extracted licence data.
            </p>
            <div className="overflow-y-auto pr-1 flex-1">
              <EditDriverForm
                driver={selectedDriver}
                onSubmit={handleDriverUpdate}
                onCancel={handleCancelEdit}
              />
            </div>
          </motion.div>
        </div>
      )}

      {/* Add Driver Modal */}
      {showAddDriverModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-[9999] px-4">
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="w-full max-w-2xl max-h-[85vh] rounded-2xl p-4 sm:p-6 shadow-2xl bg-transparent flex flex-col"
          >
            <div className="overflow-y-auto pr-1 flex-1">
              <AddDriverForm
                onSubmit={handleAddDriver}
                onCancel={() => setShowAddDriverModal(false)}
              />
            </div>
          </motion.div>
        </div>
      )}

      </div>
    </div>
  );
};

export default DriverManagement;
