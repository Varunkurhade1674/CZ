import React, { useState } from 'react';
import { Search, Filter, CalendarCheck } from 'lucide-react';
import { motion } from 'framer-motion';
import Modal from './Modal';
import AddDriverForm from './AddDriverForm';
import EditDriverForm from './EditDriverForm';
import AddVehicleForm from './AddVehicleForm';
import DriverSelector from './driver/DriverSelector';
import DocumentExtractor from './DocumentExtractor';
import DocumentRecords from './DocumentRecords';
import AttendanceCalendar from './AttendanceCalendar';

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
  const [showMessageModal, setShowMessageModal] = useState(false);
  const [showDriverDetails, setShowDriverDetails] = useState(false);
  const [showAddDriverModal, setShowAddDriverModal] = useState(false);
  const [showEditDriverModal, setShowEditDriverModal] = useState(false);
  const [selectedDriver, setSelectedDriver] = useState(null);
  const [selectedDocDriver, setSelectedDocDriver] = useState(null);
  const [recordsRefreshKey, setRecordsRefreshKey] = useState(0);
  const [recordBeingEdited, setRecordBeingEdited] = useState(null);
  const [showAttendanceModal, setShowAttendanceModal] = useState(false);

  const handleAddDriver = (formData) => {
    console.log('Adding driver:', formData);
    setShowAddDriverModal(false);
    if (addToast) addToast(`Driver ${formData.name} added successfully!`, 'success');
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
                onClick={() => setShowAttendanceModal(true)}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 transition-colors"
              >
                <CalendarCheck className="h-5 w-5 mr-2" />
                Attendance
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
          <DocumentExtractor
            selectedDriver={selectedDocDriver}
            addToast={addToast}
            onUploadComplete={() => setRecordsRefreshKey(prev => prev + 1)}
          />
        </motion.div>

        <DocumentRecords
          addToast={addToast}
          onEditRecord={handleRecordEditRequest}
          refreshSignal={recordsRefreshKey}
        />

        {
          showEditDriverModal && selectedDriver && (
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
          )
        }


        {/* Message Modal */}
        {
          showMessageModal && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="bg-white rounded-lg p-6 w-full max-w-md"
              >
                <h2 className="text-xl font-bold mb-4">Send Message to {selectedDriver.name}</h2>
                <textarea
                  className="w-full p-3 border border-gray-300 rounded-lg mb-4 h-32 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Type your message here..."
                  value={messageContent}
                  onChange={(e) => setMessageContent(e.target.value)}
                ></textarea>
                <div className="flex justify-end space-x-3">
                  <button
                    onClick={() => setShowMessageModal(false)}
                    className="btn-secondary"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSendMessage}
                    className="btn-primary"
                  >
                    Send Message
                  </button>
                </div>
              </motion.div>
            </div>
          )
        }

        {/* Driver Details Modal */}
        {
          showDriverDetails && selectedDriver && (
            <div className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm flex items-center justify-center z-[9999]">
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="rounded-2xl p-6 w-full max-w-3xl max-h-[90vh] overflow-y-auto shadow-2xl bg-gradient-to-br from-blue-50 via-white to-indigo-50 border border-blue-100"
              >
                <h2 className="text-xl font-bold mb-6">Driver Details</h2>

                <div className="flex flex-col md:flex-row mb-6 gap-4">
                  <div className="md:w-1/3">
                    <div className="h-40 md:h-48 w-full bg-white/80 border border-blue-100 rounded-xl flex items-center justify-center text-4xl text-blue-600 shadow-sm">
                      {selectedDriver.name.charAt(0)}
                    </div>
                  </div>
                  <div className="md:w-2/3 bg-white/80 rounded-xl border border-blue-100 p-4 shadow-sm">
                    <h3 className="text-2xl font-bold mb-3 text-blue-700">{selectedDriver.name}</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <p className="text-xs uppercase tracking-wide text-gray-500">Phone</p>
                        <p className="font-medium text-gray-900">{selectedDriver.phone}</p>
                      </div>
                      <div>
                        <p className="text-xs uppercase tracking-wide text-gray-500">Join Date</p>
                        <p className="font-medium text-gray-900">{selectedDriver.joinDate}</p>
                      </div>
                      {/* <div>
                    <p className="text-sm text-gray-500">Status</p>
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      selectedDriver.status === 'Active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {selectedDriver.status}
                    </span>
                  </div> */}
                      <div>
                        <p className="text-xs uppercase tracking-wide text-gray-500">Verification</p>
                        {selectedDriver.verification === 'Verified' ? (
                          <span className="flex items-center text-green-600 font-medium">
                            <CheckCircle size={16} className="mr-1" />
                            Verified
                          </span>
                        ) : selectedDriver.verification === 'Rejected' ? (
                          <span className="flex items-center text-red-600 font-medium">
                            <XCircle size={16} className="mr-1" />
                            Rejected
                          </span>
                        ) : (
                          <span className="flex items-center text-yellow-600 font-medium">
                            <AlertTriangle size={16} className="mr-1" />
                            Pending
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                  <div className="bg-white/90 border border-blue-100 p-4 rounded-xl shadow-sm">
                    <h4 className="font-semibold text-blue-700 mb-2">Vehicle Information</h4>
                    <p className="text-sm text-gray-600"><span className="font-medium text-gray-800">Vehicle Number:</span> {selectedDriver.vehicle}</p>
                    <p className="text-sm text-gray-600"><span className="font-medium text-gray-800">License Number:</span> {selectedDriver.licenseNo}</p>
                  </div>
                  {/* <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-bold mb-2">Performance</h4>
                <div className="flex items-center mb-2">
                  <span className="text-lg font-medium mr-2">{selectedDriver.rating}</span>
                  <Sparkles size={16} className="text-yellow-500" />
                  <span className="text-sm text-gray-500 ml-2">Rating</span>
                </div>
                <p><span className="text-gray-500">Total Trips:</span> {selectedDriver.trips}</p>
              </div> */}
                </div>

                <div className="flex justify-end space-x-3">
                  <button
                    onClick={() => {
                      setSelectedDriver(selectedDriver);
                      setShowDriverDetails(false);
                    }}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg shadow hover:bg-blue-700 transition-colors"
                  >
                    <Edit size={16} />
                    Edit Driver
                  </button>
                  <button
                    onClick={() => setShowDriverDetails(false)}
                    className="btn-secondary"
                  >
                    Close
                  </button>
                </div>
              </motion.div>
            </div>
          )
        }
        {/* Add Driver Modal */}
        {
          showAddDriverModal && (
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
          )
        }

        {/* Attendance Calendar Modal */}
        <AttendanceCalendar
          isOpen={showAttendanceModal}
          onClose={() => setShowAttendanceModal(false)}
          addToast={addToast}
        />

      </div >
    </div >
  );
};

export default DriverManagement;
