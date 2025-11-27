import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Eye, Pencil, Trash2, RefreshCcw, Search } from 'lucide-react';

const API_BASE_URL = import.meta.env?.VITE_API_BASE_URL || '';
const buildUrl = (path = '') => `${API_BASE_URL}${path}`;

const TAB_CONFIG = {
  license: {
    label: 'Driving License',
    endpoint: '/api/licenses',
    deleteEndpoint: (id) => `/api/licenses/${id}`,
    searchFields: ['name', 'licenseNumber', 'dob', 'validity', 'phone'],
    emptyMessage: 'No driving license records yet. Upload a DL to see it here.',
  },
  vehicle: {
    label: 'Vehicle RC',
    endpoint: '/api/vehicles',
    deleteEndpoint: (id) => `/api/vehicles/${id}`,
    searchFields: ['ownerName', 'registrationNo', 'model', 'fuelType', 'rcValidUpto'],
    emptyMessage: 'No vehicle RC records yet.',
  },
  aadhaar: {
    label: 'Aadhaar Card',
    endpoint: '/api/aadhar',
    deleteEndpoint: (id) => `/api/aadhar/${id}`,
    searchFields: ['name', 'aadhaar_no', 'dob', 'gender', 'address', 'pincode'],
    emptyMessage: 'No Aadhaar records yet.',
  },
};

const getInitials = (value = '') =>
  value
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((chunk) => chunk[0])
    .join('')
    .toUpperCase() || 'NA';

const DocumentRecords = ({ addToast, onEditRecord, refreshSignal = 0 }) => {
  const [activeTab, setActiveTab] = useState('license');
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [error, setError] = useState('');
  const [viewingImage, setViewingImage] = useState(null);

  const fetchRecords = useCallback(async () => {
    const config = TAB_CONFIG[activeTab];
    if (!config) return;

    setLoading(true);
    setError('');
    try {
      const response = await fetch(buildUrl(config.endpoint));
      const payload = await response.json().catch(() => []);
      if (!response.ok) {
        throw new Error(payload?.message || `Failed to load ${config.label} records`);
      }
      setRecords(Array.isArray(payload) ? payload : []);
    } catch (err) {
      const message = err.message || 'Something went wrong while fetching records.';
      setError(message);
      setRecords([]);
      if (typeof addToast === 'function') addToast(message, 'error');
    } finally {
      setLoading(false);
    }
  }, [activeTab, addToast]);

  useEffect(() => {
    fetchRecords();
  }, [fetchRecords, refreshSignal]);

  const filteredRecords = useMemo(() => {
    if (!searchTerm.trim()) return records;
    const config = TAB_CONFIG[activeTab];
    const query = searchTerm.trim().toLowerCase();
    return records.filter((record) => {
      const data = record?.extractedData || {};
      return config.searchFields.some((field) => (data[field] || '').toLowerCase().includes(query));
    });
  }, [records, searchTerm, activeTab]);

  const handleViewDocument = (record) => {
    if (!record?.imagePath) {
      addToast?.('Document image not available for this record.', 'info');
      return;
    }
    setViewingImage({
      url: buildUrl(`/uploads/${record.imagePath}`),
      name: record.extractedData?.name || 'Document'
    });
  };

  const handleDelete = async (record) => {
    if (!record?.id) return;
    const config = TAB_CONFIG[activeTab];
    if (!config.deleteEndpoint) return;
    if (!confirm('Are you sure you want to delete this record?')) return;

    try {
      const response = await fetch(buildUrl(config.deleteEndpoint(record.id)), {
        method: 'DELETE',
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(payload?.message || 'Failed to delete record');
      }
      if (typeof addToast === 'function') addToast('Record deleted', 'success');
      fetchRecords();
    } catch (err) {
      addToast?.(err.message || 'Unable to delete record', 'error');
    }
  };

  const renderLicenseRow = (record) => {
    const data = record.extractedData || {};
    return (
      <tr key={record.id} className="border-b border-white/5 last:border-transparent hover:bg-white/5 transition">
        <td className="px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-indigo-500 text-white flex items-center justify-center font-semibold">
              {getInitials(data.name)}
            </div>
            <div>
              <p className="font-semibold">{data.name || 'N/A'}</p>
              <p className="text-sm text-gray-400">{data.phone || record.id}</p>
            </div>
          </div>
        </td>
        <td className="px-6 py-4 text-sm">{data.licenseNumber || 'N/A'}</td>
        <td className="px-6 py-4 text-sm">{data.dob || 'N/A'}</td>
        <td className="px-6 py-4 text-sm">{data.validity || 'N/A'}</td>
        <td className="px-6 py-4 text-sm">
          <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-white/10 text-xs uppercase tracking-wide">
            {record.status || 'Pending'}
          </span>
        </td>
        <td className="px-6 py-4">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => handleViewDocument(record)}
              className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition"
              title="View document"
            >
              <Eye size={16} />
            </button>
            <button
              type="button"
              onClick={() => onEditRecord?.(record, 'license')}
              className="p-2 rounded-full bg-indigo-500/20 text-indigo-200 hover:bg-indigo-500/40 transition"
              title="Edit driver"
            >
              <Pencil size={16} />
            </button>
            <button
              type="button"
              onClick={() => handleDelete(record)}
              className="p-2 rounded-full bg-red-500/20 text-red-200 hover:bg-red-500/40 transition"
              title="Delete record"
            >
              <Trash2 size={16} />
            </button>
          </div>
        </td>
      </tr>
    );
  };

  const renderVehicleRow = (record) => {
    const data = record.extractedData || {};
    return (
      <tr key={record.id} className="border-b border-white/5 last:border-transparent hover:bg-white/5 transition">
        <td className="px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-cyan-500 text-white flex items-center justify-center font-semibold">
              {getInitials(data.ownerName)}
            </div>
            <div className="font-semibold">{data.ownerName || 'N/A'}</div>
          </div>
        </td>
        <td className="px-6 py-4 text-sm">{data.registrationNo || 'N/A'}</td>
        <td className="px-6 py-4 text-sm">{data.model || 'N/A'}</td>
        <td className="px-6 py-4 text-sm">{data.fuelType || 'N/A'}</td>
        <td className="px-6 py-4 text-sm">{data.rcValidUpto || 'N/A'}</td>
        <td className="px-6 py-4">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => handleViewDocument(record)}
              className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition"
              title="View document"
            >
              <Eye size={16} />
            </button>
            <button
              type="button"
              onClick={() => handleDelete(record)}
              className="p-2 rounded-full bg-red-500/20 text-red-200 hover:bg-red-500/40 transition"
              title="Delete record"
            >
              <Trash2 size={16} />
            </button>
          </div>
        </td>
      </tr>
    );
  };

  const renderAadhaarRow = (record) => {
    const data = record.extractedData || {};
    const aadhaarNo = data.aadhaar_no || '';
    const masked = aadhaarNo.length >= 12 ? `${aadhaarNo.slice(0, 4)}XXXX${aadhaarNo.slice(-4)}` : aadhaarNo;
    return (
      <tr key={record.id} className="border-b border-white/5 last:border-transparent hover:bg-white/5 transition">
        <td className="px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-purple-500 text-white flex items-center justify-center font-semibold">
              {getInitials(data.name)}
            </div>
            <div className="font-semibold">{data.name || 'N/A'}</div>
          </div>
        </td>
        <td className="px-6 py-4 text-sm tracking-widest">{masked || 'N/A'}</td>
        <td className="px-6 py-4 text-sm">{data.dob || 'N/A'}</td>
        <td className="px-6 py-4 text-sm uppercase">{data.gender || 'N/A'}</td>
        <td className="px-6 py-4 text-sm">{data.address || 'N/A'}</td>
        <td className="px-6 py-4 text-sm">{data.pincode || 'N/A'}</td>
        <td className="px-6 py-4">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => handleViewDocument(record)}
              className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition"
              title="View document"
            >
              <Eye size={16} />
            </button>
            <button
              type="button"
              onClick={() => handleDelete(record)}
              className="p-2 rounded-full bg-red-500/20 text-red-200 hover:bg-red-500/40 transition"
              title="Delete record"
            >
              <Trash2 size={16} />
            </button>
          </div>
        </td>
      </tr>
    );
  };

  const renderTableBody = () => {
    if (loading) {
      return (
        <tr>
          <td colSpan={7} className="py-12 text-center text-gray-400">
            Loading records...
          </td>
        </tr>
      );
    }

    if (error) {
      return (
        <tr>
          <td colSpan={7} className="py-8 text-center text-red-300">
            {error}
          </td>
        </tr>
      );
    }

    if (!filteredRecords.length) {
      return (
        <tr>
          <td colSpan={7} className="py-12 text-center text-gray-400">
            {TAB_CONFIG[activeTab].emptyMessage}
          </td>
        </tr>
      );
    }

    if (activeTab === 'license') return filteredRecords.map(renderLicenseRow);
    if (activeTab === 'vehicle') return filteredRecords.map(renderVehicleRow);
    return filteredRecords.map(renderAadhaarRow);
  };

  const renderTableHead = () => {
    if (activeTab === 'license') {
      return (
        <tr>
          <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-300">Driver Details</th>
          <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-300">License No.</th>
          <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-300">DOB</th>
          <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-300">Expiry Date</th>
          <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-300">Status</th>
          <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-300">Actions</th>
        </tr>
      );
    }

    if (activeTab === 'vehicle') {
      return (
        <tr>
          <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-300">Owner</th>
          <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-300">Registration No.</th>
          <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-300">Model</th>
          <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-300">Fuel Type</th>
          <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-300">RC Valid Upto</th>
          <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-300">Actions</th>
        </tr>
      );
    }

    return (
      <tr>
        <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-300">Name</th>
        <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-300">Aadhaar No.</th>
        <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-300">DOB</th>
        <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-300">Gender</th>
        <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-300">Address</th>
        <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-300">PIN Code</th>
        <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-300">Actions</th>
      </tr>
    );
  };

  return (
    <div className="glass-card p-6 space-y-4 bg-white/5 border border-white/10">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex flex-wrap gap-2">
          {Object.entries(TAB_CONFIG).map(([key, tab]) => (
            <button
              key={key}
              type="button"
              onClick={() => setActiveTab(key)}
              className={`px-4 py-2 rounded-full text-sm font-semibold transition ${activeTab === key
                ? 'bg-gradient-to-r from-indigo-500 to-purple-500 text-white shadow-lg shadow-indigo-500/30'
                : 'bg-white/5 text-gray-300 border border-white/10 hover:border-indigo-300/50'
                }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              className="glass-input pl-9 pr-3 py-2 w-64"
              placeholder={`Search ${TAB_CONFIG[activeTab].label}...`}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <button
            type="button"
            onClick={fetchRecords}
            className="btn-secondary inline-flex items-center gap-2"
          >
            <RefreshCcw size={16} className={loading ? 'animate-spin' : ''} />
            Refresh
          </button>
        </div>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-white/10">
        <table className="min-w-full divide-y divide-white/10">
          <thead className="bg-slate-900/70 text-gray-300 text-sm">
            {renderTableHead()}
          </thead>
          <tbody className="bg-slate-900/40 text-white text-sm">{renderTableBody()}</tbody>
        </table>
      </div>

      {/* Image Viewer Modal */}
      {viewingImage && (
        <div
          className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[9999] p-4"
          onClick={() => setViewingImage(null)}
        >
          <div
            className="relative bg-slate-900 rounded-xl shadow-2xl border border-white/10 max-w-lg w-full max-h-[60vh] overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-3 flex items-center justify-between">
              <h3 className="text-white font-semibold text-sm">{viewingImage.name}</h3>
              <button
                onClick={() => setViewingImage(null)}
                className="text-white hover:bg-white/20 rounded-full p-1.5 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-4 flex items-center justify-center bg-black/50">
              <img
                src={viewingImage.url}
                alt={viewingImage.name}
                className="max-w-full max-h-[60vh] object-contain rounded-lg"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DocumentRecords;

