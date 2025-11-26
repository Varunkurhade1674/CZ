import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { RefreshCcw, UserPlus, Phone, UserCircle2 } from 'lucide-react';

const API_BASE_URL = import.meta.env?.VITE_API_BASE_URL || '';

const messageStyles = {
  success: 'bg-emerald-500/10 border border-emerald-500/40 text-emerald-200',
  error: 'bg-red-500/10 border border-red-500/40 text-red-200',
  info: 'bg-cyan-500/10 border border-cyan-500/40 text-cyan-100',
};

const buildUrl = (path = '') => `${API_BASE_URL}${path}`;

const DriverSelector = ({ selectedDriver, onSelect }) => {
  const [drivers, setDrivers] = useState([]);
  const [loadingDrivers, setLoadingDrivers] = useState(false);
  const [savingDriver, setSavingDriver] = useState(false);
  const [formValues, setFormValues] = useState({ name: '', phone: '' });
  const [status, setStatus] = useState({ type: '', text: '' });

  const loadDrivers = useCallback(async () => {
    setLoadingDrivers(true);
    try {
      const response = await fetch(buildUrl('/api/drivers'));
      if (!response.ok) {
        throw new Error('Unable to fetch drivers');
      }
      const payload = await response.json();
      const list = Array.isArray(payload) ? payload : [];
      setDrivers(list);

      if (selectedDriver) {
        const stillExists = list.find((driver) => driver.id === selectedDriver.id);
        if (!stillExists) {
          onSelect(null);
        }
      }

      if (list.length === 0) {
        setStatus({
          type: 'info',
          text: 'No drivers yet. Add one below to get started.',
        });
      } else if (!selectedDriver) {
        setStatus({
          type: 'info',
          text: 'Pick an existing driver or create a new one.',
        });
      }
    } catch (error) {
      setStatus({
        type: 'error',
        text: error.message || 'Failed to load drivers',
      });
    } finally {
      setLoadingDrivers(false);
    }
  }, [selectedDriver, onSelect]);

  useEffect(() => {
    loadDrivers();
  }, [loadDrivers]);

  const handleSelect = (event) => {
    const driverId = event.target.value;
    if (!driverId) {
      onSelect(null);
      setStatus({
        type: 'info',
        text: 'Select a driver to link future uploads.',
      });
      return;
    }

    const driver = drivers.find((entry) => entry.id === driverId);
    onSelect(driver || null);
    if (driver) {
      setStatus({
        type: 'success',
        text: `Selected driver: ${driver.name || driver.id}`,
      });
    }
  };

  const handleInputChange = (event) => {
    const { name, value } = event.target;
    setFormValues((prev) => ({
      ...prev,
      [name]: name === 'phone' ? value.replace(/\D/g, '') : value,
    }));
  };

  const isPhoneValid = useMemo(() => /^\d{10}$/.test(formValues.phone), [formValues.phone]);
  const canSaveDriver = isPhoneValid && !savingDriver;

  const handleSaveDriver = async (event) => {
    event.preventDefault();
    if (!isPhoneValid) {
      setStatus({ type: 'error', text: 'Enter a valid 10-digit phone number.' });
      return;
    }

    setSavingDriver(true);
    try {
      const response = await fetch(buildUrl('/api/drivers'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          driverId: formValues.phone.trim(),
          driverName: formValues.name.trim(),
        }),
      });

      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(payload?.message || 'Failed to save driver');
      }

      setDrivers((prev) => {
        const withoutDuplicate = prev.filter((driver) => driver.id !== payload.id);
        return [...withoutDuplicate, payload].sort((a, b) => a.name.localeCompare(b.name));
      });

      onSelect(payload);
      setFormValues({ name: '', phone: '' });
      setStatus({
        type: 'success',
        text: `Saved & selected driver: ${payload.name || payload.id}`,
      });
    } catch (error) {
      setStatus({
        type: 'error',
        text: error.message || 'Unable to save driver',
      });
    } finally {
      setSavingDriver(false);
    }
  };

  return (
    <div className="glass-card p-6 border border-white/5 bg-white/5">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        <div>
          <p className="text-sm uppercase tracking-wider text-emerald-300/70 font-semibold">
            Driving License & Vehicle RC Data Extractor
          </p>
          <h3 className="text-2xl font-bold mt-1">Select Driver</h3>
          <p className="text-sm text-gray-400">
            Choose an existing driver or add a new driver before uploading documents.
          </p>
        </div>
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-500/40 to-cyan-500/40 flex items-center justify-center">
          <UserCircle2 className="text-white" size={32} />
        </div>
      </div>

      <div className="space-y-4">
        <div>
          <label className="text-sm font-semibold text-gray-200 mb-2 block">
            Existing Drivers
          </label>
          <div className="flex flex-col lg:flex-row gap-3">
            <select
              className="flex-1 glass-input py-3 px-4 rounded-xl border border-white/10 bg-white/5 focus:border-emerald-400/60"
              value={selectedDriver?.id || ''}
              onChange={handleSelect}
              disabled={loadingDrivers}
            >
              <option value="">-- Select driver --</option>
              {drivers
                .sort((a, b) => (a.name || a.id).localeCompare(b.name || b.id))
                .map((driver) => (
                  <option key={driver.id} value={driver.id}>
                    {driver.name || 'Unnamed'} ({driver.phone || driver.id})
                  </option>
                ))}
            </select>
            <button
              type="button"
              onClick={loadDrivers}
              className="btn-secondary flex items-center justify-center gap-2 px-5 py-3 rounded-xl"
              disabled={loadingDrivers}
            >
              <RefreshCcw size={18} className={loadingDrivers ? 'animate-spin' : ''} />
              Refresh
            </button>
          </div>
        </div>

        <form
          onSubmit={handleSaveDriver}
          className="grid grid-cols-1 md:grid-cols-[1fr,250px,150px] gap-3"
        >
          <div>
            <label className="text-sm font-semibold text-gray-200 mb-2 block">
              New Driver Name
            </label>
            <div className="relative">
              <input
                name="name"
                placeholder="Driver name"
                value={formValues.name}
                onChange={handleInputChange}
                className="glass-input w-full py-3 pl-11 pr-3 rounded-xl"
              />
              <UserPlus size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-emerald-300" />
            </div>
          </div>

          <div>
            <label className="text-sm font-semibold text-gray-200 mb-2 block">
              Driver Phone (driverId)
            </label>
            <div className="relative">
              <input
                name="phone"
                placeholder="10-digit phone"
                value={formValues.phone}
                onChange={handleInputChange}
                className="glass-input w-full py-3 pl-11 pr-3 rounded-xl"
                maxLength={10}
              />
              <Phone size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-cyan-300" />
            </div>
          </div>

          <div className="flex items-end">
            <button
              type="submit"
              className="btn-primary w-full py-3 flex items-center justify-center gap-2 rounded-xl disabled:opacity-60 disabled:cursor-not-allowed"
              disabled={!canSaveDriver}
            >
              <span>{savingDriver ? 'Saving...' : 'Save & Select'}</span>
            </button>
          </div>
        </form>

        {status.text && (
          <div
            className={`rounded-xl px-4 py-3 text-sm ${messageStyles[status.type] || 'bg-white/5 text-gray-200 border border-white/10'}`}
          >
            {status.text}
          </div>
        )}
      </div>
    </div>
  );
};

export default DriverSelector;

