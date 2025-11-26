import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, X, Calendar as CalendarIcon } from 'lucide-react';
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

    const toggleAttendance = async (day) => {
        if (!selectedDriver) {
            addToast?.('Please select a driver first', 'error');
            return;
        }

        const dateKey = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        const currentStatus = attendanceData[dateKey];
        const newStatus = currentStatus === 'present' ? 'absent' : currentStatus === 'absent' ? null : 'present';

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
                addToast?.(`Marked as ${newStatus || 'unmarked'}`, 'success');
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
            days.push(<div key={`empty-${i}`} className="aspect-square" />);
        }

        // Days of the month
        for (let day = 1; day <= daysInMonth; day++) {
            const status = getAttendanceStatus(day);
            const isToday = isCurrentMonth && today.getDate() === day;

            let bgColor = 'bg-slate-800/50 hover:bg-slate-700/50';
            if (status === 'present') bgColor = 'bg-emerald-500/20 border-emerald-500/50 hover:bg-emerald-500/30';
            if (status === 'absent') bgColor = 'bg-red-500/20 border-red-500/50 hover:bg-red-500/30';

            days.push(
                <motion.button
                    key={day}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => toggleAttendance(day)}
                    disabled={!selectedDriver || loading}
                    className={`aspect-square rounded-lg border ${bgColor} ${isToday ? 'ring-2 ring-blue-400' : 'border-white/10'
                        } flex items-center justify-center text-sm font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                    <div className="text-center">
                        <div className={status === 'present' ? 'text-emerald-200' : status === 'absent' ? 'text-red-200' : 'text-gray-300'}>
                            {day}
                        </div>
                    </div>
                </motion.button>
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
                    className="w-full max-w-2xl bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl shadow-2xl border border-white/10 overflow-hidden"
                >
                    {/* Header */}
                    <div className="bg-gradient-to-r from-emerald-600 to-cyan-600 p-5">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <CalendarIcon className="text-white" size={28} />
                                <div>
                                    <h2 className="text-xl font-bold text-white">Driver Attendance</h2>
                                    <p className="text-emerald-100 text-xs">Track monthly attendance records</p>
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
                    <div className="p-5 space-y-4">
                        {/* Driver Selection */}
                        <div>
                            <label className="block text-xs font-semibold text-gray-200 mb-2">
                                Select Driver
                            </label>
                            <select
                                value={selectedDriver?.id || ''}
                                onChange={(e) => {
                                    const driver = drivers.find(d => d.id === e.target.value);
                                    setSelectedDriver(driver || null);
                                }}
                                className="w-full glass-input py-2 px-3 rounded-lg border border-white/10 bg-white/5 focus:border-emerald-400/60 text-sm"
                            >
                                <option value="">-- Select a driver --</option>
                                {drivers.map(driver => (
                                    <option key={driver.id} value={driver.id}>
                                        {driver.name || 'Unnamed'} ({driver.phone || driver.id})
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Month Navigation */}
                        <div className="flex items-center justify-between bg-slate-800/50 rounded-lg p-3">
                            <button
                                onClick={() => changeMonth(-1)}
                                className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
                            >
                                <ChevronLeft className="text-gray-300" size={20} />
                            </button>
                            <h3 className="text-lg font-bold text-white">
                                {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
                            </h3>
                            <button
                                onClick={() => changeMonth(1)}
                                className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
                            >
                                <ChevronRight className="text-gray-300" size={20} />
                            </button>
                        </div>

                        {/* Legend */}
                        <div className="flex items-center justify-center gap-4 text-xs">
                            <div className="flex items-center gap-1.5">
                                <div className="w-3 h-3 rounded bg-emerald-500/30 border border-emerald-500/50" />
                                <span className="text-gray-300">Present</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                                <div className="w-3 h-3 rounded bg-red-500/30 border border-red-500/50" />
                                <span className="text-gray-300">Absent</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                                <div className="w-3 h-3 rounded bg-slate-800/50 border border-white/10" />
                                <span className="text-gray-300">Not Marked</span>
                            </div>
                        </div>

                        {/* Calendar Grid */}
                        <div className="bg-slate-800/30 rounded-lg p-3">
                            {/* Week day headers */}
                            <div className="grid grid-cols-7 gap-1.5 mb-2">
                                {weekDays.map(day => (
                                    <div key={day} className="text-center text-[10px] font-semibold text-gray-400 uppercase">
                                        {day}
                                    </div>
                                ))}
                            </div>

                            {/* Calendar days */}
                            <div className="grid grid-cols-7 gap-1.5">
                                {renderCalendar()}
                            </div>
                        </div>

                        {!selectedDriver && (
                            <div className="text-center text-gray-400 text-sm py-2">
                                Please select a driver to view and manage attendance
                            </div>
                        )}
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
};

export default AttendanceCalendar;
