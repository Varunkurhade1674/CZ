// public/app.js - cleaned and fixed

// Query DOM elements
const uploadForm = document.getElementById('uploadForm');
const messageElement = document.getElementById('message') || document.createElement('div');
const refreshButton = document.getElementById('refreshData');
const tableBody = document.querySelector('#licenseTable tbody');
const searchInput = document.getElementById('searchInput');

// Keep last fetched data in memory for filtering
let lastData = [];

// Helper: show a temporary message (type: 'success'|'error'|empty)
function showMessage(text, type) {
    if (!messageElement) return;
    messageElement.textContent = text || '';
    messageElement.className = type || '';
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
    img.alt = 'License Image';

    // Setup close handlers
    modal.querySelector('.close-modal').onclick = () => modal.remove();
    modal.addEventListener('click', (e) => { if (e.target === modal) modal.remove(); });
}

// Create action buttons for a row
function createActions(record, row) {
    const actionsDiv = document.createElement('div');
    actionsDiv.className = 'actions';

    // View
    const viewBtn = document.createElement('button');
    viewBtn.className = 'action-icon';
    viewBtn.classList.add('view');
    viewBtn.setAttribute('aria-label', 'View License Image');
    viewBtn.title = 'View License Image';
    viewBtn.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>';
    viewBtn.addEventListener('click', async () => {
        try {
            if (!record.imagePath) {
                throw new Error('No image path available');
            }

            showMessage('Loading image...', '');
            
            // Construct the URL using the stored imagePath
            const imageUrl = `/uploads/${record.imagePath}`;
            console.log('Attempting to load image:', imageUrl);

            // Create a new image element to test loading
            const testImage = new Image();
            testImage.onload = () => {
                showImagePreview(imageUrl);
                showMessage('', ''); // Clear message
            };
            testImage.onerror = () => {
                throw new Error('Failed to load image');
            };
            testImage.src = imageUrl;

        } catch (err) {
            console.error('Image view error:', err);
            showMessage('Could not load the license image. Please try uploading again.', 'error');
        }
    });

    // Edit
    const editBtn = document.createElement('button');
    editBtn.className = 'action-icon';
    editBtn.classList.add('edit');
    editBtn.setAttribute('aria-label', 'Edit Record');
    editBtn.title = 'Edit Record';
    editBtn.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>';
    editBtn.addEventListener('click', () => openEditModal(record));

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
            const res = await fetch('/api/licenses/' + record._id, { method: 'DELETE' });
            if (res.ok) {
                // row may be a table row or a card DOM element
                if (row && typeof row.remove === 'function') row.remove();
                showMessage('Record deleted successfully!', 'success');
            } else {
                throw new Error('Delete failed');
            }
        } catch (err) {
            showMessage('Failed to delete record: ' + err.message, 'error');
        }
    });

    actionsDiv.appendChild(viewBtn);
    actionsDiv.appendChild(editBtn);
    actionsDiv.appendChild(deleteBtn);
    return actionsDiv;
}

// Open edit modal
function openEditModal(record) {
    const modal = document.createElement('div');
    modal.className = 'modal';
    const data = record.extractedData || {};
    modal.innerHTML = '' +
        '<div class="modal-content">' +
            '<span class="close-modal">&times;</span>' +
            '<h3>Edit License Details</h3>' +
            '<form class="edit-form">' +
                '<div class="form-group"><label>Name</label><input name="name" value="' + (data.name || '') + '"></div>' +
                '<div class="form-group"><label>Phone</label><input name="phone" value="' + (data.phone || '') + '"></div>' +
                '<div class="form-group"><label>License Number</label><input name="licenseNumber" value="' + (data.licenseNumber || '') + '"></div>' +
                '<div class="form-group"><label>DOB</label><input name="dob" value="' + (data.dob || '') + '"></div>' +
                '<div class="form-group"><label>Expiry Date</label><input name="validity" value="' + (data.validity || '') + '"></div>' +
                '<button type="submit" class="save-btn">Save Changes</button>' +
            '</form>' +
        '</div>';
    document.body.appendChild(modal);

    modal.querySelector('.close-modal').onclick = () => modal.remove();
    modal.addEventListener('click', (e) => { if (e.target === modal) modal.remove(); });

    const form = modal.querySelector('form');
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        showMessage('Saving changes...', '');
        
        const fd = new FormData(form);
        const updated = Object.fromEntries(fd.entries());
        
        try {
            console.log('Sending update for record:', record._id, 'with data:', updated);
            
            const res = await fetch('/api/licenses/' + record._id, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ extractedData: updated })
            });
            
            const responseText = await res.text();
            console.log('Server response:', res.status, responseText);
            
            if (!res.ok) {
                throw new Error('Update failed: ' + responseText);
            }
            
            showMessage('Record updated successfully!', 'success');
            modal.remove();
            
            console.log('Refreshing table data...');
            await fetchAndDisplayData();
            console.log('Table refresh complete');
            
        } catch (err) {
            console.error('Update error:', err);
            showMessage('Failed to update record: ' + err.message, 'error');
        }
    });
}

// Upload form handling
if (uploadForm) {
    uploadForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        showMessage('Processing image...', '');
        const fd = new FormData(uploadForm);
        try {
            const res = await fetch('/api/licenses', { method: 'POST', body: fd });
            const result = await res.json();
            if (res.ok) {
                showMessage('Saved: ' + (result.data?.licenseNumber || 'saved'), 'success');
                await fetchAndDisplayData();
            } else {
                throw new Error(result.message || 'Save failed');
            }
        } catch (err) {
            showMessage('Error: ' + err.message, 'error');
        }
    });
}

// Render table rows from provided data
function renderTable(data) {
    if (!tableBody) return;
    tableBody.innerHTML = '';
    if (!Array.isArray(data) || data.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="7">No records found in the database.</td></tr>';
        return;
    }

    data.forEach(record => {
        const row = tableBody.insertRow();

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
        actionsCell.appendChild(createActions(record, row));
    });
}

// Fetch and render either cards or table depending on page layout
async function fetchAndDisplayData() {
    try {
        const res = await fetch('/api/licenses');
        const data = await res.json();
        lastData = Array.isArray(data) ? data : [];

        // Apply search filter if present
        const q = (searchInput?.value || '').trim().toLowerCase();
        const filtered = q ? lastData.filter(rec => {
            const d = rec.extractedData || {};
            return (d.name || '').toLowerCase().includes(q) || (d.licenseNumber || '').toLowerCase().includes(q) || (d.dob || '').toLowerCase().includes(q) || (d.validity || '').toLowerCase().includes(q);
        }) : lastData;

        // Always render table for this UI
        renderTable(filtered);
    } catch (err) {
        console.error('fetch error', err);
        showMessage('Could not retrieve license records. Please try again.', 'error');
    }
}

// Wire refresh button
if (refreshButton) refreshButton.addEventListener('click', fetchAndDisplayData);

// Search input - filter locally from lastData
if (searchInput) {
    searchInput.addEventListener('input', () => {
        const q = (searchInput.value || '').trim().toLowerCase();
        const filtered = q ? lastData.filter(rec => {
            const d = rec.extractedData || {};
            return (d.name || '').toLowerCase().includes(q) || (d.licenseNumber || '').toLowerCase().includes(q) || (d.dob || '').toLowerCase().includes(q) || (d.validity || '').toLowerCase().includes(q);
        }) : lastData;
        renderTable(filtered);
    });
}

// Toggle view was removed for table-only UI (no-op)

// Initial load
fetchAndDisplayData();
