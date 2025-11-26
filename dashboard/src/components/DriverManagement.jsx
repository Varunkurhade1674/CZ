import React, { useState } from 'react';
import { Search, Filter, CheckCircle, XCircle, AlertTriangle, Mail, Eye, Edit, Trash2, Sparkles, UserPlus } from 'lucide-react';
import { motion } from 'framer-motion';
import Modal from './Modal';
import AddDriverForm from './AddDriverForm';
import EditDriverForm from './EditDriverForm';
import AddVehicleForm from './AddVehicleForm';
import DriverSelector from './driver/DriverSelector';

const DriverManagement = ({ addToast }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterOption, setFilterOption] = useState('all');
  const [showMessageModal, setShowMessageModal] = useState(false);
  const [showDriverDetails, setShowDriverDetails] = useState(false);
  const [showAddDriverModal, setShowAddDriverModal] = useState(false);
  const [showEditDriverModal, setShowEditDriverModal] = useState(false);
  const [selectedDriver, setSelectedDriver] = useState(null);
  const [selectedDocDriver, setSelectedDocDriver] = useState(null);
  const [messageContent, setMessageContent] = useState('');
  const [clickedDriver, setClickedDriver] = useState(null);
  const [popupPosition, setPopupPosition] = useState({ x: 0, y: 0 });
  
  const handleShowDriverDetails = (driver) => {
    setSelectedDriver(driver);
    setShowDriverDetails(true);
  };

  const drivers = [
    {
      id: 1,
      name: 'Rajesh Kumar',
      vehicle: 'MH-01-AB-1234',
      licenseNo: 'DL-0120210012345',
      status: 'Active',
      verification: 'Verified',
      dob: '1988-05-12',
      doi: '2010-03-10',
      phone: '+91 98765 43210',
      joinDate: '2023-01-15',
      trips: 1250,
      rating: 4.8,
      licenseExpiry: '2026-03-15'
    },
    {
      id: 2,
      name: 'Salim Shaikh',
      vehicle: 'MH-02-CD-5678',
      licenseNo: 'DL-0120210054321',
      status: 'Active',
      verification: 'Pending',
      dob: '1991-08-24',
      doi: '2012-05-01',
      phone: '+91 91234 56789',
      joinDate: '2022-05-20',
      trips: 980,
      rating: 4.5,
      licenseExpiry: '2025-09-30'
    },
    {
      id: 3,
      name: 'Vikram Patil',
      vehicle: 'MH-03-EF-9012',
      licenseNo: 'DL-0120210098765',
      status: 'Inactive',
      verification: 'Rejected',
      dob: '1985-11-05',
      doi: '2008-07-12',
      phone: '+91 99887 66554',
      joinDate: '2021-09-12',
      trips: 450,
      rating: 4.2,
      licenseExpiry: '2025-11-10'
    },
    {
      id: 4,
      name: 'Pranav Hugar',
      vehicle: 'KA71 20220002422',
      licenseNo: 'KA71-20220002422',
      status: 'Pending',
      verification: 'Pending',
      dob: '2004-01-25',
      doi: '2021-01-24',
      phone: '+91 90123 45678',
      joinDate: '2024-07-18',
      trips: 600,
      rating: 4.1,
      licenseExpiry: '2044-01-24'
    },
    {
      id: 5,
      name: 'Saurabh Kumar Singh',
      vehicle: 'KA22 20230006797',
      licenseNo: 'KA22-20230006797',
      status: 'Pending',
      verification: 'Pending',
      dob: '2004-06-24',
      doi: '2021-06-23',
      phone: '+91 93456 78901',
      joinDate: '2024-02-02',
      trips: 720,
      rating: 4.3,
      licenseExpiry: '2044-06-23'
    }
  ];

  const now = new Date();
  const upcomingThreshold = new Date();
  upcomingThreshold.setDate(now.getDate() + 30);

  const filteredDrivers = drivers.filter(driver => {
    const normalizedSearch = searchTerm.trim().toLowerCase();
    const matchesSearch =
      normalizedSearch.length === 0 ||
      [driver.name, driver.vehicle, driver.licenseNo, driver.phone]
        .filter(Boolean)
        .some((field) => field.toLowerCase().includes(normalizedSearch));

    if (filterOption === 'all') return matchesSearch;

    if (filterOption.startsWith('verification:')) {
      const verificationStatus = filterOption.split(':')[1];
      return matchesSearch && driver.verification.toLowerCase() === verificationStatus;
    }

    if (filterOption === 'expiry:expired') {
      return matchesSearch && new Date(driver.licenseExpiry) < now;
    }

    if (filterOption === 'expiry:upcoming') {
      const expiryDate = new Date(driver.licenseExpiry);
      return matchesSearch && expiryDate >= now && expiryDate <= upcomingThreshold;
    }

    return matchesSearch;
  });

  const handleSendMessage = () => {
    if (messageContent.trim() === '') {
      addToast('Please enter a message', 'error');
      return;
    }
    
    addToast(`Message sent to ${selectedDriver.name}`, 'success');
    setMessageContent('');
    setShowMessageModal(false);
  };


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
      >
        <DriverSelector selectedDriver={selectedDocDriver} onSelect={setSelectedDocDriver} />
      </motion.div>
      
      <div className="glass-card p-0 overflow-hidden border border-white/10 backdrop-blur-sm">
        <table className="min-w-full divide-y divide-white/10">
          <thead className="bg-slate-900/70">
            <tr>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-200 uppercase tracking-wider">Driver Details</th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-200 uppercase tracking-wider">Phone No.</th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-200 uppercase tracking-wider">License No.</th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-200 uppercase tracking-wider">DOB</th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-200 uppercase tracking-wider">DOI</th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-200 uppercase tracking-wider">Expiry Date</th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-200 uppercase tracking-wider">Verification</th>
            </tr>
          </thead>
          <tbody className="bg-slate-900/40 divide-y divide-white/10">
            {filteredDrivers.map(driver => (
              <tr key={driver.id} className="transition hover:bg-white/5">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 h-10 w-10 bg-blue-500 text-white rounded-full flex items-center justify-center font-semibold shadow-md shadow-blue-500/30">
                      {driver.name.split(' ').map(n => n.charAt(0)).join('')}
                    </div>
                    <div className="ml-4">
                      <div 
                        className="text-sm font-semibold text-blue-300 cursor-pointer underline decoration-dotted"
                        onClick={(e) => {
                          const rect = e.target.getBoundingClientRect();
                          const popupWidth = 320; // matches w-80
                          const padding = 16;
                          const calculatedLeft = Math.min(
                            window.innerWidth - popupWidth - padding,
                            Math.max(padding, rect.left)
                          );
                          const calculatedTop = Math.max(padding, rect.top - 220);
                          setPopupPosition({ x: calculatedLeft, y: calculatedTop });
                          setClickedDriver(driver);
                        }}
                      >
                        {driver.name}
                      </div>
                      <div className="text-xs text-gray-400">{driver.vehicle || 'N/A'}</div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-200">{driver.phone}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-200">{driver.licenseNo}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-200">{driver.dob || '25-01-2004'}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-200">{driver.doi || '15-03-2020'}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-200">{driver.licenseExpiry}</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wide bg-white/10 text-white border border-white/10">
                    {driver.verification}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Click Popup for Driver Details */}
      {clickedDriver && (
        <>
          {/* Backdrop to close popup */}
          <div 
            className="fixed inset-0 z-40"
            onClick={() => setClickedDriver(null)}
          />
          <div 
            className="fixed z-50 bg-white rounded-lg shadow-2xl border border-gray-200 p-4 w-80"
            style={{ 
              left: `${popupPosition.x}px`, 
              top: `${popupPosition.y}px`
            }}
          >
            <div className="space-y-3">
              <div className="flex items-center space-x-3 pb-3 border-b">
                <div className="h-12 w-12 bg-blue-500 text-white rounded-full flex items-center justify-center font-semibold text-lg">
                  {clickedDriver.name.split(' ').map(n => n.charAt(0)).join('')}
                </div>
                <div>
                  <h3 className="font-bold text-gray-900">{clickedDriver.name}</h3>
                  <p className="text-sm text-gray-500">{clickedDriver.vehicle || 'N/A'}</p>
                </div>
              </div>
              
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Phone:</span>
                  <span className="font-medium text-gray-900">{clickedDriver.phone}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">License No:</span>
                  <span className="font-medium text-gray-900">{clickedDriver.licenseNo}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">DOB:</span>
                  <span className="font-medium text-gray-900">{clickedDriver.dob || '25-01-2004'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">DOI:</span>
                  <span className="font-medium text-gray-900">{clickedDriver.doi || '15-03-2020'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Expiry:</span>
                  <span className="font-medium text-gray-900">{clickedDriver.licenseExpiry}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Status:</span>
                  <span className={`font-medium ${
                    clickedDriver.verification === 'Verified' ? 'text-green-600' : 
                    clickedDriver.verification === 'Rejected' ? 'text-red-600' : 
                    'text-yellow-600'
                  }`}>
                    {clickedDriver.verification}
                  </span>
                </div>
              </div>

              {/* Edit Button */}
              <div className="flex justify-end pt-3 border-t">
                <button
                  onClick={() => {
                    setSelectedDriver(clickedDriver);
                    setClickedDriver(null);
                    setShowEditDriverModal(true);
                  }}
                  className="inline-flex items-center gap-2 px-3 py-1.5 bg-blue-600 text-white text-sm rounded-lg shadow hover:bg-blue-700 transition-colors"
                >
                  <Edit size={14} />
                  Edit
                </button>
              </div>
            </div>
          </div>
        </>
      )}
      
      {/* Edit Driver Modal */}
      {showEditDriverModal && selectedDriver && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-[9999] px-4">
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="w-full max-w-xl max-h-[80vh] rounded-xl p-6 shadow-xl bg-white border border-slate-200 flex flex-col"
          >
            <h2 className="text-2xl font-semibold text-slate-900 mb-4">Edit Driver</h2>
            <p className="text-sm text-slate-500 mb-4">Update the driver details below. Fields are pre-filled from the driving licence.</p>
            <div className="overflow-y-auto pr-1 flex-1">
              <EditDriverForm
                driver={selectedDriver}
                onSubmit={(formData) => {
                  console.log('Updating driver:', formData);
                  setShowEditDriverModal(false);
                  if (addToast) addToast(`Driver ${formData.name} updated successfully!`, 'success');
                }}
                onCancel={() => setShowEditDriverModal(false)}
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

      {/* Message Modal */}
      {showMessageModal && (
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
      )}
      
      {/* Driver Details Modal */}
      {showDriverDetails && selectedDriver && (
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
      )}
      </div>
    </div>
  );
};

export default DriverManagement;
