import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, X, Calendar as CalendarIcon, Check, XCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const AttendanceCalendar = ({ isOpen, onClose, addToast }) => {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [attendanceData, setAttendanceData] = useState({});
    const [selectedDriver, setSelectedDriver] = useState(null);
    const [drivers, setDrivers] = useState([]);
    const [loading, setLoading] = useState(false);

    const API_BASE_URL = import.meta.env?.VITE_API_BASE_URL || '';
    const buildUrl = (path = '') => `${API_BASE_URL}${path}`;

    // Fetch drivers list
    useEffect(() => {
        if (isOpen) {
            fetchDrivers();
        }
    }, [isOpen]);

    const fetchDrivers = async () => {
        try {
            const response = await fetch(buildUrl('/api/drivers'));
            if (response.ok) {
                const data = await response.json();
                setDrivers(data || []);
            }
        } catch (error) {
            console.error('Failed to fetch drivers:', error);
        }
    };

    // Fetch attendance data for selected driver
    useEffect(() => {
        if (selectedDriver) {
            fetchAttendance();
        }
    }, [selectedDriver, currentDate]);

    const fetchAttendance = async () => {
        if (!selectedDriver) return;

        setLoading(true);
        try {
            const year = currentDate.getFullYear();
            const month = currentDate.getMonth() + 1;
            const response = await fetch(
                buildUrl(`/api/attendance/${selectedDriver.id}?year=${year}&month=${month}`)
            );

            if (response.ok) {
                const data = await response.json();
                setAttendanceData(data || {});
            } else {
                setAttendanceData({});
            }
        } catch (error) {
            console.error('Failed to fetch attendance:', error);
            setAttendanceData({});
        } finally {
            setLoading(false);
        }
    };

    const getDaysInMonth = (date) => {
        const year = date.getFullYear();
        const month = date.getMonth();
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        const daysInMonth = lastDay.getDate();
        const startingDayOfWeek = firstDay.getDay();

        return { daysInMonth, startingDayOfWeek };
    };

    const getAttendanceStatus = (day) => {
        const dateKey = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        return attendanceData[dateKey];
    };

    const markAttendance = async (day, status) => {
        if (!selectedDriver) {
            addToast?.('Please select a driver first', 'error');
            return;
        }

        const dateKey = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        const currentStatus = attendanceData[dateKey];

        // If clicking the same status, clear it
        const newStatus = currentStatus === status ? null : status;

        try {
            const response = await fetch(buildUrl('/api/attendance'), {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    driverId: selectedDriver.id,
                    date: dateKey,
                    status: newStatus,
                }),
            });

            if (response.ok) {
                setAttendanceData(prev => ({
                    ...prev,
                    [dateKey]: newStatus,
                }));
                const statusText = newStatus === 'present' ? 'Present' : newStatus === 'absent' ? 'Absent' : 'Unmarked';
                addToast?.(`Marked as ${statusText}`, 'success');
            }
        } catch (error) {
            console.error('Failed to update attendance:', error);
            addToast?.('Failed to update attendance', 'error');
        }
    };

    const renderCalendar = () => {
        const { daysInMonth, startingDayOfWeek } = getDaysInMonth(currentDate);
        const days = [];
        const today = new Date();
        const isCurrentMonth =
            today.getMonth() === currentDate.getMonth() &&
            today.getFullYear() === currentDate.getFullYear();

        // Empty cells for days before month starts
        for (let i = 0; i < startingDayOfWeek; i++) {
            days.push(<div key={`empty-${i}`} className="p-2" />);
        }

        // Days of the month
        for (let day = 1; day <= daysInMonth; day++) {
            const status = getAttendanceStatus(day);
            const isToday = isCurrentMonth && today.getDate() === day;

            days.push(
                <div
                    key={day}
                    className={`p-2 rounded-lg border ${isToday ? 'border-blue-400 bg-blue-500/10' : 'border-white/10 bg-slate-800/30'
                        }`}
                >
                    <div className="text-center mb-2">
                        <span className={`text-sm font-semibold ${isToday ? 'text-blue-300' : 'text-gray-300'}`}>
                            {day}
                        </span>
                    </div>
                    <div className="flex gap-1">
                        <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => markAttendance(day, 'present')}
                            disabled={!selectedDriver || loading}
                            className={`flex-1 p-1.5 rounded flex items-center justify-center transition-all ${status === 'present'
                                    ? 'bg-emerald-500 text-white shadow-lg'
                                    : 'bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30'
                                } disabled:opacity-50 disabled:cursor-not-allowed`}
                            title="Mark Present"
                        >
                            <Check size={14} />
                        </motion.button>
                        <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => markAttendance(day, 'absent')}
                            disabled={!selectedDriver || loading}
                            className={`flex-1 p-1.5 rounded flex items-center justify-center transition-all ${status === 'absent'
                                    ? 'bg-red-500 text-white shadow-lg'
                                    : 'bg-red-500/20 text-red-300 hover:bg-red-500/30'
                                } disabled:opacity-50 disabled:cursor-not-allowed`}
                            title="Mark Absent"
                        >
                            <XCircle size={14} />
                        </motion.button>
                    </div>
                </div>
            );
        }

        return days;
    };

    const changeMonth = (direction) => {
        setCurrentDate(prev => {
            const newDate = new Date(prev);
            newDate.setMonth(prev.getMonth() + direction);
            return newDate;
        });
    };

    const monthNames = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
    ];

    const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[9999] px-4">
                <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.9, opacity: 0 }}
                    className="w-full max-w-4xl bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl shadow-2xl border border-white/10 overflow-hidden max-h-[90vh] flex flex-col"
                >
                    {/* Header */}
                    <div className="bg-gradient-to-r from-emerald-600 to-cyan-600 p-5">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <CalendarIcon className="text-white" size={28} />
                                <div>
                                    <h2 className="text-xl font-bold text-white">Driver Attendance</h2>
                                    <p className="text-emerald-100 text-xs">Mark daily attendance with ease</p>
                                </div>
                            </div>
                            <button
                                onClick={onClose}
                                className="p-2 rounded-full bg-white/20 hover:bg-white/30 transition-colors"
                            >
                                <X className="text-white" size={20} />
                            </button>
                        </div>
                    </div>

                    {/* Content */}
                    <div className="p-5 space-y-4 overflow-y-auto flex-1">
                        {/* Driver Selection */}
                        <div>
                            <label className="block text-sm font-semibold text-gray-200 mb-2">
                                Select Driver
                            </label>
                            <select
                                value={selectedDriver?.id || ''}
                                onChange={(e) => {
                                    const driver = drivers.find(d => d.id === e.target.value);
                                    setSelectedDriver(driver || null);
                                }}
                                className="w-full glass-input py-2.5 px-4 rounded-lg border border-white/10 bg-slate-900 focus:border-emerald-400/60 text-sm text-white"
                                style={{ colorScheme: 'dark' }}
                            >
                                <option value="" style={{ backgroundColor: '#1e293b', color: '#fff' }}>-- Select a driver --</option>
                                {drivers.map(driver => (
                                    <option key={driver.id} value={driver.id} style={{ backgroundColor: '#1e293b', color: '#fff' }}>
                                        {driver.name || 'Unnamed'} ({driver.phone || driver.id})
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Month Navigation */}
                        <div className="flex items-center justify-between bg-slate-800/50 rounded-lg p-3">
                            <button
                                onClick={() => changeMonth(-1)}
                                className="p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
                            >
                                <ChevronLeft className="text-gray-300" size={20} />
                            </button>
                            <h3 className="text-lg font-bold text-white">
                                {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
                            </h3>
                            <button
                                onClick={() => changeMonth(1)}
                                className="p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
                            >
                                <ChevronRight className="text-gray-300" size={20} />
                            </button>
                        </div>

                        {/* Legend */}
                        <div className="flex items-center justify-center gap-6 text-xs bg-slate-800/30 rounded-lg p-3">
                            <div className="flex items-center gap-2">
                                <div className="w-6 h-6 rounded bg-emerald-500 flex items-center justify-center">
                                    <Check size={14} className="text-white" />
                                </div>
                                <span className="text-gray-300">Present</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-6 h-6 rounded bg-red-500 flex items-center justify-center">
                                    <XCircle size={14} className="text-white" />
                                </div>
                                <span className="text-gray-300">Absent</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-6 h-6 rounded bg-slate-700 border border-white/20" />
                                <span className="text-gray-300">Not Marked</span>
                            </div>
                        </div>

                        {/* Calendar Grid */}
                        {selectedDriver ? (
                            <div className="bg-slate-800/30 rounded-lg p-4">
                                {/* Week day headers */}
                                <div className="grid grid-cols-7 gap-2 mb-3">
                                    {weekDays.map(day => (
                                        <div key={day} className="text-center text-xs font-semibold text-gray-400 uppercase">
                                            {day}
                                        </div>
                                    ))}
                                </div>

                                {/* Calendar days */}
                                <div className="grid grid-cols-7 gap-2">
                                    {renderCalendar()}
                                </div>
                            </div>
                        ) : (
                            <div className="text-center text-gray-400 py-12 bg-slate-800/30 rounded-lg">
                                <CalendarIcon className="mx-auto mb-3 text-gray-500" size={48} />
                                <p className="text-sm">Please select a driver to view and manage attendance</p>
                            </div>
                        )}
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
};

export default AttendanceCalendar;
