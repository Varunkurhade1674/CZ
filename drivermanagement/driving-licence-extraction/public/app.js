// public/app.js - updated for DL and RC

// Query DOM elements
const uploadForm = document.getElementById('uploadForm');
const messageElement = document.getElementById('message') || document.createElement('div');
const refreshLicenseButton = document.getElementById('refreshLicenseData');
const licenseTableBody = document.querySelector('#licenseTable tbody');
const searchLicenseInput = document.getElementById('searchLicenseInput');

// Vehicle elements
const vehicleUploadForm = document.getElementById('vehicleUploadForm');
const vehicleMessageElement = document.getElementById('vehicleMessage') || document.createElement('div');
const refreshVehicleButton = document.getElementById('refreshVehicleData');
const vehicleTableBody = document.querySelector('#vehicleTable tbody');
const searchVehicleInput = document.getElementById('searchVehicleInput');

// Aadhaar elements
const aadharUploadForm = document.getElementById('aadharUploadForm');
const aadharMessageElement = document.getElementById('aadharMessage') || document.createElement('div');
const refreshAadharButton = document.getElementById('refreshAadharData');
const aadharTableBody = document.querySelector('#aadharTable tbody');
const searchAadharInput = document.getElementById('searchAadharInput');

// Driver selection elements
const driverDropdown = document.getElementById('driverDropdown');
const refreshDriversBtn = document.getElementById('refreshDrivers');
const addDriverBtn = document.getElementById('addDriverBtn');
const driverNameInput = document.getElementById('driverNameInput');
const driverPhoneInput = document.getElementById('driverPhoneInput');
const driverMessage = document.getElementById('driverMessage');
const themeToggle = document.getElementById('themeToggle');

// Tab elements
const tabButtons = document.querySelectorAll('.tab-button');
const tabContents = document.querySelectorAll('.tab-content');

// Keep last fetched data in memory for filtering
let lastLicenseData = [];
let lastVehicleData = [];
let lastAadharData = [];
let selectedDriverId = '';
let selectedDriverName = '';

const licenseInput = document.getElementById('licenseImage');
const vehicleInput = document.getElementById('vehicleImage');
const aadharInput = document.getElementById('aadharImage');
const licenseFileName = document.getElementById('licenseFileName');
const vehicleFileName = document.getElementById('vehicleFileName');
const aadharFileName = document.getElementById('aadharFileName');
const licenseDrop = document.getElementById('licenseDrop');
const vehicleDrop = document.getElementById('vehicleDrop');
const aadharDrop = document.getElementById('aadharDrop');

// Helper: show a temporary message (type: 'success'|'error'|empty)
function showMessage(text, type, isVehicle = false, isAadhar = false) {
    let element;
    if (isAadhar) {
        element = aadharMessageElement;
    } else if (isVehicle) {
        element = vehicleMessageElement;
    } else {
        element = messageElement;
    }
    if (!element) return;
    element.textContent = text || '';
    element.className = type || '';
}

function showDriverMessage(text, type) {
    if (!driverMessage) return;
    driverMessage.textContent = text || '';
    driverMessage.className = type || '';
}

async function fetchDrivers() {
    try {
        const res = await fetch('/api/drivers');
        const drivers = await res.json();
        if (Array.isArray(drivers) && driverDropdown) {
            driverDropdown.innerHTML = '<option value="">-- Select driver --</option>';
            drivers.forEach(d => {
                const opt = document.createElement('option');
                opt.value = d.id;
                opt.textContent = `${d.name || 'Unnamed'} (${d.phone || d.id})`;
                driverDropdown.appendChild(opt);
            });
        }
    } catch (err) {
        showDriverMessage('Failed to load drivers', 'error');
    }
}

function setSelectedDriver(id, name) {
    selectedDriverId = id || '';
    selectedDriverName = name || '';
    const enabled = !!selectedDriverId;
    // Enable/disable upload forms
    uploadForm?.querySelector('button[type="submit"]').toggleAttribute('disabled', !enabled);
    vehicleUploadForm?.querySelector('button[type="submit"]').toggleAttribute('disabled', !enabled);
    aadharUploadForm?.querySelector('button[type="submit"]').toggleAttribute('disabled', !enabled);
    showDriverMessage(enabled ? `Selected driver: ${selectedDriverName || selectedDriverId}` : 'Select a driver to upload documents', enabled ? 'success' : '');
}

function setFileName(el, name) { if (el) el.textContent = name || ''; }

function setupDrop(drop, input, nameEl) {
    if (!drop || !input) return;
    input.addEventListener('change', () => setFileName(nameEl, input.files[0]?.name || ''));
    drop.addEventListener('dragover', (e) => { e.preventDefault(); drop.classList.add('dragover'); });
    drop.addEventListener('dragleave', () => drop.classList.remove('dragover'));
    drop.addEventListener('drop', (e) => { e.preventDefault(); drop.classList.remove('dragover'); const f = e.dataTransfer.files; if (f && f.length) { input.files = f; setFileName(nameEl, f[0].name); } });
}

// Helper: build small initials from a full name
function getInitials(name) {
    if (!name) return 'NA';
    return name
        .split(' ')
        .filter(Boolean)
        .slice(0, 2)
        .map(w => w[0].toUpperCase())
        .join('');
}

// Modal image preview
function showImagePreview(url) {
    const modal = document.createElement('div');
    modal.className = 'modal';

    // Create loading state
    modal.innerHTML = '' +
        '<div class="modal-content image-preview">' +
            '<span class="close-modal">&times;</span>' +
            '<div class="loading">Loading image...</div>' +
        '</div>';
    document.body.appendChild(modal);

    // Load image
    const img = new Image();
    img.onload = () => {
        const content = modal.querySelector('.modal-content');
        content.querySelector('.loading').remove();
        img.style.maxWidth = '100%';
        img.style.height = 'auto';
        content.appendChild(img);
    };
    img.onerror = () => {
        modal.remove();
        showMessage('Failed to load image', 'error');
    };
    img.src = url;
    img.alt = 'Document Image';

    // Setup close handlers
    modal.querySelector('.close-modal').onclick = () => modal.remove();
    modal.addEventListener('click', (e) => { if (e.target === modal) modal.remove(); });
}

// Create action buttons for a row
function createActions(record, row, isVehicle = false, isAadhar = false) {
    const actionsDiv = document.createElement('div');
    actionsDiv.className = 'actions';

    // View
    const viewBtn = document.createElement('button');
    viewBtn.className = 'action-icon';
    viewBtn.classList.add('view');
    viewBtn.setAttribute('aria-label', 'View Document Image');
    viewBtn.title = 'View Document Image';
    viewBtn.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>';
    viewBtn.addEventListener('click', async () => {
        try {
            if (!record.imagePath) {
                throw new Error('No image path available');
            }

            showMessage('Loading image...', '', isVehicle, isAadhar);

            // Construct the URL using the stored imagePath
            const imageUrl = `/uploads/${record.imagePath}`;
            console.log('Attempting to load image:', imageUrl);

            // Create a new image element to test loading
            const testImage = new Image();
            testImage.onload = () => {
                showImagePreview(imageUrl);
                showMessage('', '', isVehicle, isAadhar); // Clear message
            };
            testImage.onerror = () => {
                throw new Error('Failed to load image');
            };
            testImage.src = imageUrl;

        } catch (err) {
            console.error('Image view error:', err);
            showMessage('Could not load the document image. Please try uploading again.', 'error', isVehicle, isAadhar);
        }
    });

    // Edit
    const editBtn = document.createElement('button');
    editBtn.className = 'action-icon';
    editBtn.classList.add('edit');
    editBtn.setAttribute('aria-label', 'Edit Record');
    editBtn.title = 'Edit Record';
    editBtn.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>';
    editBtn.addEventListener('click', () => openEditModal(record, isVehicle, isAadhar));

    // Delete
    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'action-icon';
    deleteBtn.classList.add('delete');
    deleteBtn.setAttribute('aria-label', 'Delete Record');
    deleteBtn.title = 'Delete Record';
    deleteBtn.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"></path><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>';
    deleteBtn.addEventListener('click', async () => {
        if (!confirm('Are you sure you want to delete this record?')) return;
        try {
            let endpoint;
            if (isAadhar) {
                endpoint = '/api/aadhar/';
            } else if (isVehicle) {
                endpoint = '/api/vehicles/';
            } else {
                endpoint = '/api/licenses/';
            }
            const res = await fetch(endpoint + record.id, { method: 'DELETE' });
            if (res.ok) {
                // row may be a table row or a card DOM element
                if (row && typeof row.remove === 'function') row.remove();
                showMessage('Record deleted successfully!', 'success', isVehicle, isAadhar);
            } else {
                throw new Error('Delete failed');
            }
        } catch (err) {
            showMessage('Failed to delete record: ' + err.message, 'error', isVehicle, isAadhar);
        }
    });

    actionsDiv.appendChild(viewBtn);
    actionsDiv.appendChild(editBtn);
    actionsDiv.appendChild(deleteBtn);
    return actionsDiv;
}

// Open edit modal
function openEditModal(record, isVehicle = false, isAadhar = false) {
    const modal = document.createElement('div');
    modal.className = 'modal';
    const data = record.extractedData || {};
    let title, fields;

    if (isAadhar) {
        title = 'Edit Aadhaar Details';
        fields = [
            { name: 'name', label: 'Full Name', value: data.name || '' },
            { name: 'aadhaar_no', label: 'Aadhaar Number', value: data.aadhaar_no || '' },
            { name: 'dob', label: 'Date of Birth', value: data.dob || '' },
            { name: 'gender', label: 'Gender', value: data.gender || '' },
            { name: 'address', label: 'Address', value: data.address || '' },
            { name: 'pincode', label: 'PIN Code', value: data.pincode || '' }
        ];
    } else if (isVehicle) {
        title = 'Edit Vehicle Details';
        fields = [
            { name: 'ownerName', label: 'Owner Name', value: data.ownerName || '' },
            { name: 'registrationNo', label: 'Registration No.', value: data.registrationNo || '' },
            { name: 'model', label: 'Model', value: data.model || '' },
            { name: 'fuelType', label: 'Fuel Type', value: data.fuelType || '' },
            { name: 'rcValidUpto', label: 'RC Valid Upto', value: data.rcValidUpto || '' },
            { name: 'chassisNo', label: 'Chassis No.', value: data.chassisNo || '' }
        ];
    } else {
        title = 'Edit License Details';
        fields = [
            { name: 'name', label: 'Name', value: data.name || '' },
            { name: 'phone', label: 'Phone', value: data.phone || '' },
            { name: 'licenseNumber', label: 'License Number', value: data.licenseNumber || '' },
            { name: 'dob', label: 'DOB', value: data.dob || '' },
            { name: 'validity', label: 'Expiry Date', value: data.validity || '' }
        ];
    }

    let formHTML = '<form class="edit-form">';
    fields.forEach(field => {
        formHTML += `<div class="form-group"><label>${field.label}</label><input name="${field.name}" value="${field.value}"></div>`;
    });
    formHTML += '<button type="submit" class="save-btn">Save Changes</button></form>';

    modal.innerHTML = '' +
        '<div class="modal-content">' +
            '<span class="close-modal">&times;</span>' +
            '<h3>' + title + '</h3>' +
            formHTML +
        '</div>';
    document.body.appendChild(modal);

    modal.querySelector('.close-modal').onclick = () => modal.remove();
    modal.addEventListener('click', (e) => { if (e.target === modal) modal.remove(); });

    const form = modal.querySelector('form');
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        showMessage('Saving changes...', '', isVehicle || isAadhar);

        const fd = new FormData(form);
        const updated = Object.fromEntries(fd.entries());

        try {
            console.log('Sending update for record:', record.id, 'with data:', updated);

            let endpoint;
            if (isAadhar) {
                endpoint = '/api/aadhar/';
            } else if (isVehicle) {
                endpoint = '/api/vehicles/';
            } else {
                endpoint = '/api/licenses/';
            }

            const res = await fetch(endpoint + record.id, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ extractedData: updated })
            });

            const responseText = await res.text();
            console.log('Server response:', res.status, responseText);

            if (!res.ok) {
                throw new Error('Update failed: ' + responseText);
            }

            showMessage('Record updated successfully!', 'success', isVehicle, isAadhar);
            modal.remove();

            console.log('Refreshing table data...');
            if (isAadhar) {
                await fetchAndDisplayAadharData();
            } else if (isVehicle) {
                await fetchAndDisplayVehicleData();
            } else {
                await fetchAndDisplayLicenseData();
            }
            console.log('Table refresh complete');

        } catch (err) {
            console.error('Update error:', err);
            showMessage('Failed to update record: ' + err.message, 'error', isVehicle, isAadhar);
        }
    });
}

// Upload form handling for licenses
if (uploadForm) {
    uploadForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        if (!selectedDriverId) { showMessage('Select a driver before uploading', 'error'); return; }
        showMessage('Processing image...', '', false);
        const submitBtn = uploadForm.querySelector('button[type="submit"]');
        submitBtn?.classList.add('loading');
        const fd = new FormData(uploadForm);
        fd.append('driverId', selectedDriverId);
        if (selectedDriverName) fd.append('driverName', selectedDriverName);
        try {
            const res = await fetch('/api/licenses', { method: 'POST', body: fd });
            const result = await res.json();
            if (res.ok) {
                showMessage('Saved: ' + (result.data?.licenseNumber || 'saved'), 'success', false);
                await fetchAndDisplayLicenseData();
            } else {
                throw new Error(result.message || 'Save failed');
            }
        } catch (err) {
            showMessage('Error: ' + err.message, 'error', false);
        } finally {
            submitBtn?.classList.remove('loading');
        }
    });
}

// Upload form handling for vehicles
if (vehicleUploadForm) {
    vehicleUploadForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        if (!selectedDriverId) { showMessage('Select a driver before uploading', 'error', true); return; }
        showMessage('Processing document...', '', true);
        const submitBtn = vehicleUploadForm.querySelector('button[type="submit"]');
        submitBtn?.classList.add('loading');
        const fd = new FormData(vehicleUploadForm);
        fd.append('driverId', selectedDriverId);
        if (selectedDriverName) fd.append('driverName', selectedDriverName);
        try {
            const res = await fetch('/api/vehicles', { method: 'POST', body: fd });
            const result = await res.json();
            if (res.ok) {
                showMessage('Saved: ' + (result.data?.registrationNo || 'saved'), 'success', true);
                await fetchAndDisplayVehicleData();
            } else {
                throw new Error(result.message || 'Save failed');
            }
        } catch (err) {
            showMessage('Error: ' + err.message, 'error', true);
        } finally {
            submitBtn?.classList.remove('loading');
        }
    });
}

// Upload form handling for Aadhaar
if (aadharUploadForm) {
    aadharUploadForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        if (!selectedDriverId) { showMessage('Select a driver before uploading', 'error', false, true); return; }
        showMessage('Processing Aadhaar card...', '', false, true);
        const submitBtn = aadharUploadForm.querySelector('button[type="submit"]');
        submitBtn?.classList.add('loading');
        const fd = new FormData(aadharUploadForm);
        fd.append('driverId', selectedDriverId);
        if (selectedDriverName) fd.append('driverName', selectedDriverName);
        try {
            const res = await fetch('/api/aadhar/upload', { method: 'POST', body: fd });
            const result = await res.json();
            if (res.ok) {
                showMessage('Saved: ' + (result.data?.name || 'saved'), 'success', false, true);
                await fetchAndDisplayAadharData();
            } else {
                throw new Error(result.message || 'Save failed');
            }
        } catch (err) {
            showMessage('Error: ' + err.message, 'error', false, true);
        } finally {
            submitBtn?.classList.remove('loading');
        }
    });
}

// Render license table rows
function renderLicenseTable(data) {
    if (!licenseTableBody) return;
    licenseTableBody.innerHTML = '';
    if (!Array.isArray(data) || data.length === 0) {
        licenseTableBody.innerHTML = '<tr class="empty-state-row"><td colspan="7">No records found in the database.</td></tr>';
        return;
    }

    data.forEach(record => {
        const row = licenseTableBody.insertRow();

        // Driver cell
        const driverCell = row.insertCell();
        const d = record.extractedData || {};
        driverCell.innerHTML = '' +
            '<div class="driver-info">' +
                '<div class="avatar">' + getInitials(d.name) + '</div>' +
                '<div class="driver-details">' +
                    '<span class="driver-name">' + (d.name || 'N/A') + '</span>' +
                    '<span class="driver-phone">' + (d.phone || 'N/A') + '</span>' +
                '</div>' +
            '</div>';

        // License number cell
        const licenseCell = row.insertCell();
        licenseCell.textContent = d.licenseNumber || 'N/A';

        // DOB cell
        const dobCell = row.insertCell();
        dobCell.textContent = d.dob || 'N/A';

        // Expiry Date cell
        const expiryCell = row.insertCell();
        expiryCell.textContent = d.validity || 'N/A';

        // Status cell (placeholder)
        const statusCell = row.insertCell();
        statusCell.textContent = record.status || 'N/A';

        // Verification cell (placeholder)
        const verifyCell = row.insertCell();
        verifyCell.textContent = record.verified ? 'Verified' : 'Pending';

        // Actions
        const actionsCell = row.insertCell();
        actionsCell.appendChild(createActions(record, row, false));
    });
}

// Render vehicle table rows
function renderVehicleTable(data) {
    if (!vehicleTableBody) return;
    vehicleTableBody.innerHTML = '';
    if (!Array.isArray(data) || data.length === 0) {
        vehicleTableBody.innerHTML = '<tr class="empty-state-row"><td colspan="6">No records found in the database.</td></tr>';
        return;
    }

    data.forEach(record => {
        const row = vehicleTableBody.insertRow();

        // Owner cell
        const ownerCell = row.insertCell();
        const d = record.extractedData || {};
        ownerCell.innerHTML = '' +
            '<div class="driver-info">' +
                '<div class="avatar">' + getInitials(d.ownerName) + '</div>' +
                '<div class="driver-details">' +
                    '<span class="driver-name">' + (d.ownerName || 'N/A') + '</span>' +
                '</div>' +
            '</div>';

        // Registration number cell
        const regCell = row.insertCell();
        regCell.textContent = d.registrationNo || 'N/A';

        // Model cell
        const modelCell = row.insertCell();
        modelCell.textContent = d.model || 'N/A';

        // Fuel Type cell
        const fuelCell = row.insertCell();
        fuelCell.textContent = d.fuelType || 'N/A';

        // RC Valid Upto cell
        const rcValidCell = row.insertCell();
        rcValidCell.textContent = d.rcValidUpto || 'N/A';

        // Actions
        const actionsCell = row.insertCell();
        actionsCell.appendChild(createActions(record, row, true));
    });
}

// Render Aadhaar table rows
function renderAadharTable(data) {
    if (!aadharTableBody) return;
    aadharTableBody.innerHTML = '';
    if (!Array.isArray(data) || data.length === 0) {
        aadharTableBody.innerHTML = '<tr class="empty-state-row"><td colspan="7">No records found in the database.</td></tr>';
        return;
    }

    data.forEach(record => {
        const row = aadharTableBody.insertRow();

        // Name cell
        const nameCell = row.insertCell();
        const d = record.extractedData || {};
        nameCell.innerHTML = '' +
            '<div class="driver-info">' +
                '<div class="avatar">' + getInitials(d.name) + '</div>' +
                '<div class="driver-details">' +
                    '<span class="driver-name">' + (d.name || 'N/A') + '</span>' +
                '</div>' +
            '</div>';

        // Aadhaar number cell (masked)
        const aadhaarCell = row.insertCell();
        const aadhaarNo = d.aadhaar_no || '';
        const maskedAadhaar = aadhaarNo.length >= 12 ? aadhaarNo.slice(0, 4) + 'XXXX' + aadhaarNo.slice(-4) : aadhaarNo;
        aadhaarCell.textContent = maskedAadhaar || 'N/A';

        // DOB cell
        const dobCell = row.insertCell();
        dobCell.textContent = d.dob || 'N/A';

        // Gender cell
        const genderCell = row.insertCell();
        genderCell.textContent = d.gender || 'N/A';

        // Address cell
        const addressCell = row.insertCell();
        addressCell.textContent = d.address || 'N/A';

        // PIN Code cell
        const pincodeCell = row.insertCell();
        pincodeCell.textContent = d.pincode || 'N/A';

        // Actions
        const actionsCell = row.insertCell();
        actionsCell.appendChild(createActions(record, row, false, true));
    });
}

// Fetch and render license data
async function fetchAndDisplayLicenseData() {
    try {
        const res = await fetch('/api/licenses');
        const data = await res.json();
        lastLicenseData = Array.isArray(data) ? data : [];

        // Apply search filter if present
        const q = (searchLicenseInput?.value || '').trim().toLowerCase();
        const filtered = q ? lastLicenseData.filter(rec => {
            const d = rec.extractedData || {};
            return (d.name || '').toLowerCase().includes(q) || (d.licenseNumber || '').toLowerCase().includes(q) || (d.dob || '').toLowerCase().includes(q) || (d.validity || '').toLowerCase().includes(q);
        }) : lastLicenseData;

        renderLicenseTable(filtered);
    } catch (err) {
        console.error('fetch license error', err);
        showMessage('Could not retrieve license records. Please try again.', 'error', false);
    }
}

// Fetch and render vehicle data
async function fetchAndDisplayVehicleData() {
    try {
        const res = await fetch('/api/vehicles');
        const data = await res.json();
        lastVehicleData = Array.isArray(data) ? data : [];

        // Apply search filter if present
        const q = (searchVehicleInput?.value || '').trim().toLowerCase();
        const filtered = q ? lastVehicleData.filter(rec => {
            const d = rec.extractedData || {};
            return (d.ownerName || '').toLowerCase().includes(q) || (d.registrationNo || '').toLowerCase().includes(q) || (d.model || '').toLowerCase().includes(q) || (d.fuelType || '').toLowerCase().includes(q) || (d.rcValidUpto || '').toLowerCase().includes(q);
        }) : lastVehicleData;

        renderVehicleTable(filtered);
    } catch (err) {
        console.error('fetch vehicle error', err);
        showMessage('Could not retrieve vehicle records. Please try again.', 'error', true);
    }
}

// Fetch and render Aadhaar data
async function fetchAndDisplayAadharData() {
    try {
        const res = await fetch('/api/aadhar');
        const data = await res.json();
        lastAadharData = Array.isArray(data) ? data : [];

        // Apply search filter if present
        const q = (searchAadharInput?.value || '').trim().toLowerCase();
        const filtered = q ? lastAadharData.filter(rec => {
            const d = rec.extractedData || {};
            return (d.name || '').toLowerCase().includes(q) || (d.aadhaar_no || '').toLowerCase().includes(q) || (d.dob || '').toLowerCase().includes(q) || (d.address || '').toLowerCase().includes(q);
        }) : lastAadharData;

        renderAadharTable(filtered);
    } catch (err) {
        console.error('fetch Aadhaar error', err);
        showMessage('Could not retrieve Aadhaar records. Please try again.', 'error', false, true);
    }
}

// Wire refresh buttons
if (refreshLicenseButton) refreshLicenseButton.addEventListener('click', fetchAndDisplayLicenseData);
if (refreshVehicleButton) refreshVehicleButton.addEventListener('click', fetchAndDisplayVehicleData);
if (refreshAadharButton) refreshAadharButton.addEventListener('click', fetchAndDisplayAadharData);

// Search inputs
if (searchLicenseInput) {
    searchLicenseInput.addEventListener('input', () => {
        const q = (searchLicenseInput.value || '').trim().toLowerCase();
        const filtered = q ? lastLicenseData.filter(rec => {
            const d = rec.extractedData || {};
            return (d.name || '').toLowerCase().includes(q) || (d.licenseNumber || '').toLowerCase().includes(q) || (d.dob || '').toLowerCase().includes(q) || (d.validity || '').toLowerCase().includes(q);
        }) : lastLicenseData;
        renderLicenseTable(filtered);
    });
}

if (searchVehicleInput) {
    searchVehicleInput.addEventListener('input', () => {
        const q = (searchVehicleInput.value || '').trim().toLowerCase();
        const filtered = q ? lastVehicleData.filter(rec => {
            const d = rec.extractedData || {};
            return (d.ownerName || '').toLowerCase().includes(q) || (d.registrationNo || '').toLowerCase().includes(q) || (d.model || '').toLowerCase().includes(q) || (d.fuelType || '').toLowerCase().includes(q) || (d.rcValidUpto || '').toLowerCase().includes(q);
        }) : lastVehicleData;
        renderVehicleTable(filtered);
    });
}

// Aadhaar search input
if (searchAadharInput) {
    searchAadharInput.addEventListener('input', () => {
        const q = (searchAadharInput.value || '').trim().toLowerCase();
        const filtered = q ? lastAadharData.filter(rec => {
            const d = rec.extractedData || {};
            return (d.name || '').toLowerCase().includes(q) || (d.aadhaar_no || '').toLowerCase().includes(q) || (d.dob || '').toLowerCase().includes(q) || (d.address || '').toLowerCase().includes(q);
        }) : lastAadharData;
        renderAadharTable(filtered);
    });
}

// Tab switching
tabButtons.forEach(button => {
    button.addEventListener('click', () => {
        // Remove active class from all buttons and contents
        tabButtons.forEach(btn => btn.classList.remove('active'));
        tabContents.forEach(content => content.classList.remove('active'));

        // Add active class to clicked button and corresponding content
        button.classList.add('active');
        const tabId = button.getAttribute('data-tab');
        document.getElementById(tabId + '-tab').classList.add('active');
    });
});

// Initial load
fetchAndDisplayLicenseData();
fetchAndDisplayAadharData();

// Driver selection wiring
if (refreshDriversBtn) refreshDriversBtn.addEventListener('click', fetchDrivers);
if (driverDropdown) {
    driverDropdown.addEventListener('change', () => {
        const id = driverDropdown.value;
        const text = driverDropdown.options[driverDropdown.selectedIndex]?.text || '';
        const name = text.split('(')[0].trim();
        setSelectedDriver(id, name);
    });
}
if (addDriverBtn) {
    addDriverBtn.addEventListener('click', async (e) => {
        e.preventDefault();
        const name = (driverNameInput?.value || '').trim();
        const id = (driverPhoneInput?.value || '').trim();
        if (!id) { showDriverMessage('Enter driver phone number', 'error'); return; }
        try {
            const res = await fetch('/api/drivers', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ driverId: id, driverName: name })
            });
            if (!res.ok) throw new Error('Failed to save driver');
            await fetchDrivers();
            // Select saved driver
            driverDropdown.value = id;
            setSelectedDriver(id, name);
            showDriverMessage('Driver saved and selected', 'success');
        } catch (err) {
            showDriverMessage('Failed to save driver', 'error');
        }
    });
}

fetchDrivers();
setupDrop(licenseDrop, licenseInput, licenseFileName);
setupDrop(vehicleDrop, vehicleInput, vehicleFileName);
setupDrop(aadharDrop, aadharInput, aadharFileName);
function applyTheme(t) { document.body.setAttribute('data-theme', t === 'dark' ? 'dark' : 'light'); }
const savedTheme = localStorage.getItem('theme') || 'light';
applyTheme(savedTheme);
if (themeToggle) {
    themeToggle.addEventListener('click', () => {
        const next = document.body.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
        applyTheme(next);
        localStorage.setItem('theme', next);
    });
}
