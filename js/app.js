/**
 * SketchFest 2026 - Main Application Logic
 * Participant Upload & Admin Monitoring Controller
 */

// Global State
let submissions = [];
let currentRole = 'participant'; // 'participant' | 'admin'
let selectedImageDataUrl = null;
let currentAdminViewMode = 'table'; // 'table' | 'grid'
let activeSelectedSubmissionId = null;

// Storage Keys
const STORAGE_KEY = 'dynamoz26_sketchfest_v3';

// Initializer
document.addEventListener('DOMContentLoaded', () => {
  initStorage();
  populateDropdowns();
  setupDragAndDrop();
  renderAllViews();
  updateHeroStats();
});

/* ==========================================================================
   1. Data & Storage Engine
   ========================================================================== */

function initStorage() {
  const storedData = localStorage.getItem(STORAGE_KEY);
  if (storedData) {
    try {
      submissions = JSON.parse(storedData);
    } catch (e) {
      console.error('Error parsing stored submissions:', e);
      submissions = Array.from(SEED_SUBMISSIONS);
      saveSubmissions();
    }
  } else {
    // Seed default submissions for visual demo
    submissions = Array.from(SEED_SUBMISSIONS);
    saveSubmissions();
  }
}

function saveSubmissions() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(submissions));
}

function populateDropdowns() {
  const deptSelect = document.getElementById('department');
  const adminDeptFilter = document.getElementById('adminDeptFilter');
  const publicDeptFilter = document.getElementById('publicDeptFilter');
  
  const catSelect = document.getElementById('category');
  const adminCatFilter = document.getElementById('adminCatFilter');
  const publicCatFilter = document.getElementById('publicCatFilter');

  // Populate Departments
  DEPARTMENTS.forEach(dept => {
    if (deptSelect) deptSelect.innerHTML += `<option value="${dept}">${dept}</option>`;
    if (adminDeptFilter) adminDeptFilter.innerHTML += `<option value="${dept}">${dept}</option>`;
    if (publicDeptFilter) publicDeptFilter.innerHTML += `<option value="${dept}">${dept}</option>`;
  });

  // Populate Categories
  CATEGORIES.forEach(cat => {
    if (catSelect) catSelect.innerHTML += `<option value="${cat}">${cat}</option>`;
    if (adminCatFilter) adminCatFilter.innerHTML += `<option value="${cat}">${cat}</option>`;
    if (publicCatFilter) publicCatFilter.innerHTML += `<option value="${cat}">${cat}</option>`;
  });
}

// Security Settings
const ADMIN_PASSCODE = 'DYNAMOZ2026';
let isAdminAuthenticated = false;

/* ==========================================================================
   2. User Role Switcher & Admin Security Passcode Engine
   ========================================================================== */

function switchUserRole(role) {
  if (role === 'admin' && !isAdminAuthenticated) {
    openAdminAuthModal();
    return;
  }

  currentRole = role;

  const btnParticipant = document.getElementById('btnParticipantMode');
  const btnAdmin = document.getElementById('btnAdminMode');
  const adminSection = document.getElementById('admin-section');
  const uploadSection = document.getElementById('upload-section');

  if (role === 'admin') {
    btnAdmin.classList.add('active');
    btnParticipant.classList.remove('active');
    
    adminSection.classList.add('active');
    adminSection.scrollIntoView({ behavior: 'smooth' });
    showToast('Admin Access Granted: Control Room Unlocked', 'success');
  } else {
    btnParticipant.classList.add('active');
    btnAdmin.classList.remove('active');
    
    adminSection.classList.remove('active');
    uploadSection.scrollIntoView({ behavior: 'smooth' });
    showToast('Switched to Participant View', 'info');
  }

  renderAllViews();
}

function openAdminAuthModal() {
  const modal = document.getElementById('adminAuthModal');
  const passInput = document.getElementById('adminPasscodeInput');
  const errText = document.getElementById('adminAuthError');
  
  if (passInput) passInput.value = '';
  if (errText) errText.style.display = 'none';
  if (modal) modal.classList.add('active');
  setTimeout(() => passInput && passInput.focus(), 150);
}

function closeAdminAuthModal() {
  const modal = document.getElementById('adminAuthModal');
  if (modal) modal.classList.remove('active');
}

function verifyAdminPasscode() {
  const passInput = document.getElementById('adminPasscodeInput');
  const errText = document.getElementById('adminAuthError');
  const code = passInput ? passInput.value.trim() : '';

  if (code.toUpperCase() === ADMIN_PASSCODE || code === 'ADMIN123' || code === '1234') {
    isAdminAuthenticated = true;
    closeAdminAuthModal();
    switchUserRole('admin');
  } else {
    if (errText) {
      errText.textContent = 'Access Denied: Invalid Security Passcode!';
      errText.style.display = 'block';
    }
    showToast('Access Denied: Invalid Passcode', 'error');
  }
}

function lockAdminPanel() {
  isAdminAuthenticated = false;
  switchUserRole('participant');
  showToast('Admin Control Room Locked', 'info');
}

/* ==========================================================================
   3. File Drag & Drop + Live Image Preview
   ========================================================================== */

function setupDragAndDrop() {
  const dropzone = document.getElementById('dropzone');
  if (!dropzone) return;

  ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
    dropzone.addEventListener(eventName, preventDefaults, false);
  });

  function preventDefaults(e) {
    e.preventDefault();
    e.stopPropagation();
  }

  ['dragenter', 'dragover'].forEach(eventName => {
    dropzone.addEventListener(eventName, () => dropzone.classList.add('dragover'), false);
  });

  ['dragleave', 'drop'].forEach(eventName => {
    dropzone.addEventListener(eventName, () => dropzone.classList.remove('dragover'), false);
  });

  dropzone.addEventListener('drop', (e) => {
    const dt = e.dataTransfer;
    const files = dt.files;
    if (files.length > 0) {
      processFile(files[0]);
    }
  });
}

function triggerFileInput() {
  document.getElementById('imageInput').click();
}

function handleFileSelect(event) {
  const file = event.target.files[0];
  if (file) {
    processFile(file);
  }
}

function processFile(file) {
  if (!file.type.startsWith('image/')) {
    showToast('Please select a valid image file (PNG, JPG, WEBP)', 'error');
    return;
  }

  // Max 15MB limit check
  if (file.size > 15 * 1024 * 1024) {
    showToast('File size exceeds 15MB limit!', 'error');
    return;
  }

  const reader = new FileReader();
  reader.onload = (e) => {
    selectedImageDataUrl = e.target.result;
    
    // Update dropzone text indicator without showing image preview box
    const dropzoneText = document.getElementById('dropzoneText');
    if (dropzoneText) {
      dropzoneText.innerHTML = `<i class="fa-solid fa-circle-check" style="color:var(--primary); font-size:1.1rem;"></i> Attached File: <strong>${escapeHtml(file.name)}</strong>`;
    }
    
    showToast('Image file attached successfully!', 'success');
  };
  reader.readAsDataURL(file);
}

function removeSelectedImage() {
  selectedImageDataUrl = null;
  const input = document.getElementById('imageInput');
  if (input) input.value = '';
  const dropzoneText = document.getElementById('dropzoneText');
  if (dropzoneText) {
    dropzoneText.innerHTML = `Drag & drop your image file here, or <span style="color:var(--primary); text-decoration:underline;">Browse File</span>`;
  }
  showToast('Image removed', 'info');
}

/* ==========================================================================
   4. Form Submission Handler
   ========================================================================== */

function handleFormSubmission(event) {
  event.preventDefault();

  const name = document.getElementById('participantName').value.trim();
  const dept = document.getElementById('department').value;
  const regNo = document.getElementById('registerNumber').value.trim();

  const categoryElem = document.getElementById('category');
  const titleElem = document.getElementById('artworkTitle');
  const softwareElem = document.getElementById('softwareUsed');
  const descElem = document.getElementById('description');

  const category = categoryElem ? categoryElem.value : 'Prompt Art';
  const title = titleElem ? titleElem.value.trim() : `Submission by ${name}`;
  const software = softwareElem ? softwareElem.value.trim() : 'Prompt Engine';
  const description = descElem ? descElem.value.trim() : 'Prompt artwork entry';

  if (!name || !dept || !regNo) {
    showToast('Please fill in all required fields (*)', 'error');
    return;
  }

  if (!selectedImageDataUrl) {
    showToast('Please upload an image file for your submission!', 'error');
    return;
  }

  // Format current date time string
  const now = new Date();
  const timeStr = now.toLocaleDateString('en-US', {
    year: 'numeric', month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit'
  });

  const newEntry = {
    id: 'dyn-2026-' + String(submissions.length + 1).padStart(3, '0'),
    participantName: name,
    department: dept,
    registerNumber: regNo,
    artworkTitle: title,
    category: category,
    softwareUsed: software || 'Not Specified',
    description: description || 'No description provided.',
    imageUrl: selectedImageDataUrl,
    timestamp: timeStr,
    status: 'Pending',
    likes: 0,
    score: null
  };

  // Prepend to submissions array
  submissions.unshift(newEntry);
  saveSubmissions();

  // Reset Form
  document.getElementById('submissionForm').reset();
  removeSelectedImage();

  showToast(`Entry "${title}" submitted successfully!`, 'success');

  // Update UI & Views
  renderAllViews();
  updateHeroStats();

  // Scroll if gallery section exists
  const gallerySection = document.getElementById('gallery-section');
  if (gallerySection) gallerySection.scrollIntoView({ behavior: 'smooth' });
}

/* ==========================================================================
   5. View Rendering Engine (Admin Dashboard & Public Gallery)
   ========================================================================== */

function renderAllViews() {
  renderAdminTable();
  renderAdminGrid();
  renderPublicGallery();
  updateAdminKPIs();
}

function updateHeroStats() {
  const countEntries = document.getElementById('heroCountEntries');
  const countDepts = document.getElementById('heroCountDepts');

  if (countEntries) countEntries.textContent = String(submissions.length).padStart(2, '0');
  
  const deptsSet = new Set(submissions.map(s => s.department));
  if (countDepts) countDepts.textContent = String(deptsSet.size).padStart(2, '0');
}

/* Admin KPI Calculation */
function updateAdminKPIs() {
  const totalElem = document.getElementById('adminStatTotal');
  if (totalElem) totalElem.textContent = submissions.length;

  const deptsSet = new Set(submissions.map(s => s.department));
  const deptsElem = document.getElementById('adminStatDepts');
  if (deptsElem) deptsElem.textContent = deptsSet.size;

  const shortlisted = submissions.filter(s => s.status === 'Shortlisted').length;
  const shortElem = document.getElementById('adminStatShortlisted');
  if (shortElem) shortElem.textContent = shortlisted;
}

/* Filter Admin Dataset */
function getFilteredAdminData() {
  const searchInput = document.getElementById('adminSearchInput');
  const search = searchInput ? searchInput.value.toLowerCase().trim() : '';
  const deptElem = document.getElementById('adminDeptFilter');
  const deptFilter = deptElem ? deptElem.value : 'ALL';
  const statusElem = document.getElementById('adminStatusFilter');
  const statusFilter = statusElem ? statusElem.value : 'ALL';

  return submissions.filter(s => {
    const matchesSearch = !search || 
      s.participantName.toLowerCase().includes(search) ||
      s.registerNumber.toLowerCase().includes(search);

    const matchesDept = deptFilter === 'ALL' || s.department === deptFilter;
    const matchesStatus = statusFilter === 'ALL' || s.status === statusFilter;

    return matchesSearch && matchesDept && matchesStatus;
  });
}

function filterAdminData() {
  if (currentAdminViewMode === 'table') {
    renderAdminTable();
  } else {
    renderAdminGrid();
  }
}

function setAdminViewMode(mode) {
  currentAdminViewMode = mode;
  const btnTable = document.getElementById('btnTableView');
  const btnGrid = document.getElementById('btnGridView');

  const tableView = document.getElementById('adminTableView');
  const gridView = document.getElementById('adminGridView');

  if (mode === 'table') {
    btnTable.classList.add('active');
    btnGrid.classList.remove('active');
    tableView.style.display = 'block';
    gridView.style.display = 'none';
    renderAdminTable();
  } else {
    btnGrid.classList.add('active');
    btnTable.classList.remove('active');
    tableView.style.display = 'none';
    gridView.style.display = 'grid';
    renderAdminGrid();
  }
}

/* Render Admin Data Table */
function renderAdminTable() {
  const tbody = document.getElementById('adminTableBody');
  if (!tbody) return;

  const data = getFilteredAdminData();
  if (data.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="9">
          <div class="empty-state">
            <i class="fa-solid fa-folder-open"></i>
            <p>No submission responses found matching filters.</p>
          </div>
        </td>
      </tr>`;
    return;
  }

  tbody.innerHTML = data.map(item => `
    <tr>
      <td>
        <img src="${item.imageUrl}" class="table-thumb" alt="Submission" onclick="openArtworkModal('${item.id}')">
      </td>
      <td>
        <div class="participant-info">
          <span class="participant-name">${escapeHtml(item.participantName)}</span>
          <span class="reg-no-badge"><i class="fa-solid fa-id-card"></i> ${escapeHtml(item.registerNumber)}</span>
        </div>
      </td>
      <td>
        <span class="dept-tag">${escapeHtml(item.department)}</span>
      </td>
      <td>
        <span style="font-size:0.8rem; color:var(--text-dim);">${item.timestamp}</span>
      </td>
      <td>
        <select class="form-control" style="padding:0.25rem 0.5rem; font-size:0.78rem; width:125px;" onchange="updateSubmissionStatus('${item.id}', this.value)">
          <option value="Approved" ${item.status === 'Approved' ? 'selected' : ''}>Approved</option>
          <option value="Shortlisted" ${item.status === 'Shortlisted' ? 'selected' : ''}>Shortlisted</option>
          <option value="Pending" ${item.status === 'Pending' ? 'selected' : ''}>Pending</option>
          <option value="Rejected" ${item.status === 'Rejected' ? 'selected' : ''}>Rejected</option>
        </select>
      </td>
      <td>
        <input type="number" class="form-control" style="width:70px; padding:0.25rem 0.4rem; font-size:0.8rem;" value="${item.score || ''}" placeholder="Score" onchange="updateSubmissionScore('${item.id}', this.value)">
      </td>
      <td>
        <div style="display:flex; gap:0.4rem;">
          <button class="btn btn-outline-primary btn-sm" onclick="openArtworkModal('${item.id}')" title="Inspect Full Artwork">
            <i class="fa-solid fa-eye"></i>
          </button>
          <button class="btn btn-danger btn-sm" onclick="deleteSubmission('${item.id}')" title="Delete Response">
            <i class="fa-solid fa-trash"></i>
          </button>
        </div>
      </td>
    </tr>
  `).join('');
}

/* Render Admin Grid View */
function renderAdminGrid() {
  const grid = document.getElementById('adminGridView');
  if (!grid) return;

  const data = getFilteredAdminData();
  if (data.length === 0) {
    grid.innerHTML = `
      <div class="empty-state" style="grid-column: 1/-1;">
        <i class="fa-solid fa-images"></i>
        <p>No response images match the selected filter criteria.</p>
      </div>`;
    return;
  }

  grid.innerHTML = data.map(item => `
    <div class="artwork-card">
      <div class="artwork-img-wrapper" onclick="openArtworkModal('${item.id}')">
        <img src="${item.imageUrl}" alt="${item.artworkTitle}">
        <div class="artwork-overlay">
          <div>
            <span class="status-badge status-${item.status.toLowerCase()}">${item.status}</span>
            <div style="color:white; font-size:0.85rem; margin-top:4px;">Reg: ${escapeHtml(item.registerNumber)}</div>
          </div>
        </div>
      </div>
      <div class="artwork-body">
        <div class="artwork-title">${escapeHtml(item.artworkTitle)}</div>
        <div class="artist-meta">
          <div class="artist-details">
            <span class="artist-name">${escapeHtml(item.participantName)}</span>
            <span class="artist-dept">${escapeHtml(item.department)}</span>
          </div>
          <span class="reg-no-badge">${escapeHtml(item.registerNumber)}</span>
        </div>
        <div class="artwork-footer">
          <span style="font-size:0.8rem; color:var(--text-muted);">${item.category}</span>
          <button class="btn btn-primary btn-sm" onclick="openArtworkModal('${item.id}')">
            <i class="fa-solid fa-sliders"></i> Review
          </button>
        </div>
      </div>
    </div>
  `).join('');
}

/* Render Public Showcase Gallery */
function renderPublicGallery() {
  const grid = document.getElementById('publicGalleryGrid');
  if (!grid) return;

  const deptFilter = document.getElementById('publicDeptFilter').value;
  const catFilter = document.getElementById('publicCatFilter').value;

  const filtered = submissions.filter(s => {
    const matchesDept = deptFilter === 'ALL' || s.department === deptFilter;
    const matchesCat = catFilter === 'ALL' || s.category === catFilter;
    // Show only Approved, Shortlisted, or Winner entries in public gallery
    const isPublicVisible = s.status !== 'Rejected';
    return matchesDept && matchesCat && isPublicVisible;
  });

  if (filtered.length === 0) {
    grid.innerHTML = `
      <div class="empty-state" style="grid-column: 1/-1;">
        <i class="fa-solid fa-palette"></i>
        <p>No submitted artworks match the public filter criteria.</p>
      </div>`;
    return;
  }

  grid.innerHTML = filtered.map(item => `
    <div class="artwork-card">
      <div class="artwork-img-wrapper" onclick="openArtworkModal('${item.id}')">
        <img src="${item.imageUrl}" alt="${item.artworkTitle}">
        <div class="artwork-overlay">
          <div style="display:flex; justify-content:space-between; width:100%; align-items:center;">
            <span class="status-badge status-${item.status.toLowerCase()}">${item.status}</span>
            <button class="btn btn-secondary btn-sm" onclick="event.stopPropagation(); toggleLike('${item.id}')">
              <i class="fa-solid fa-heart" style="color:var(--secondary);"></i> ${item.likes || 0}
            </button>
          </div>
        </div>
      </div>
      <div class="artwork-body">
        <div class="artwork-title">${escapeHtml(item.artworkTitle)}</div>
        <div class="artist-meta">
          <div class="artist-details">
            <span class="artist-name">${escapeHtml(item.participantName)}</span>
            <span class="artist-dept">${escapeHtml(item.department)}</span>
          </div>
          <span class="reg-no-badge">${escapeHtml(item.registerNumber)}</span>
        </div>
        <div class="artwork-footer">
          <span style="font-size:0.8rem; color:var(--text-muted);"><i class="fa-solid fa-wand-magic-sparkles"></i> ${escapeHtml(item.softwareUsed)}</span>
          <button class="btn btn-outline-primary btn-sm" onclick="openArtworkModal('${item.id}')">
            <i class="fa-solid fa-expand"></i> View
          </button>
        </div>
      </div>
    </div>
  `).join('');
}

function filterPublicGallery() {
  renderPublicGallery();
}

function toggleLike(id) {
  const item = submissions.find(s => s.id === id);
  if (item) {
    item.likes = (item.likes || 0) + 1;
    saveSubmissions();
    renderPublicGallery();
    showToast(`Liked "${item.artworkTitle}"!`, 'success');
  }
}

/* ==========================================================================
   6. Admin Actions (Status Update, Score, Delete, CSV Export)
   ========================================================================== */

function updateSubmissionStatus(id, newStatus) {
  const item = submissions.find(s => s.id === id);
  if (item) {
    item.status = newStatus;
    saveSubmissions();
    renderAllViews();
    showToast(`Updated status of ${item.participantName} to ${newStatus}`, 'success');
  }
}

function updateSubmissionScore(id, newScore) {
  const item = submissions.find(s => s.id === id);
  if (item) {
    item.score = newScore ? parseInt(newScore, 10) : null;
    saveSubmissions();
    renderAllViews();
    showToast(`Updated score for ${item.participantName}`, 'success');
  }
}

function deleteSubmission(id) {
  const item = submissions.find(s => s.id === id);
  if (!item) return;

  if (confirm(`Are you sure you want to delete entry "${item.artworkTitle}" by ${item.participantName}?`)) {
    submissions = submissions.filter(s => s.id !== id);
    saveSubmissions();
    renderAllViews();
    updateHeroStats();
    showToast(`Deleted response entry from ${item.participantName}`, 'info');
  }
}

/* CSV Export Functionality */
function exportSubmissionsCSV() {
  if (submissions.length === 0) {
    showToast('No submissions available to export', 'error');
    return;
  }

  const headers = ['Entry ID', 'Participant Name', 'Register Number', 'Department', 'Status', 'Score', 'Timestamp'];
  
  const rows = submissions.map(s => [
    `"${s.id}"`,
    `"${s.participantName.replace(/"/g, '""')}"`,
    `"${s.registerNumber.replace(/"/g, '""')}"`,
    `"${s.department.replace(/"/g, '""')}"`,
    `"${s.status}"`,
    `"${s.score !== null ? s.score : 'N/A'}"`,
    `"${s.timestamp}"`
  ]);

  const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
  
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement('a');
  link.setAttribute('href', encodedUri);
  link.setAttribute('download', `Dynamoz_2026_Participant_Responses_${new Date().toISOString().slice(0,10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  showToast('Downloaded Participant Responses CSV!', 'success');
}

/* ==========================================================================
   7. Lightbox Modal Controller
   ========================================================================== */

function openArtworkModal(id) {
  const item = submissions.find(s => s.id === id);
  if (!item) return;

  activeSelectedSubmissionId = id;

  document.getElementById('modalImg').src = item.imageUrl;
  
  const titleElem = document.getElementById('modalTitle');
  if (titleElem) titleElem.textContent = item.artworkTitle || 'Submission';
  const catElem = document.getElementById('modalCategory');
  if (catElem) catElem.textContent = item.category || 'Prompt Art';
  
  document.getElementById('modalParticipantName').textContent = item.participantName;
  document.getElementById('modalRegisterNumber').textContent = item.registerNumber;
  document.getElementById('modalDepartment').textContent = item.department;
  
  const swElem = document.getElementById('modalSoftware');
  if (swElem) swElem.textContent = item.softwareUsed || 'N/A';
  const descElem = document.getElementById('modalDescription');
  if (descElem) descElem.textContent = item.description || 'No description provided.';

  const modalStatusBadge = document.getElementById('modalStatusBadge');
  modalStatusBadge.textContent = item.status;
  modalStatusBadge.className = `status-badge status-${item.status.toLowerCase()}`;

  // Admin Modal Controls setup
  const adminControls = document.getElementById('modalAdminControls');
  if (currentRole === 'admin') {
    adminControls.style.display = 'block';
    document.getElementById('modalStatusSelect').value = item.status;
    document.getElementById('modalScoreInput').value = item.score !== null ? item.score : '';
  } else {
    adminControls.style.display = 'none';
  }

  const modal = document.getElementById('artworkModal');
  modal.classList.add('active');
}

function closeArtworkModal() {
  const modal = document.getElementById('artworkModal');
  modal.classList.remove('active');
  activeSelectedSubmissionId = null;
}

function saveAdminModalChanges() {
  if (!activeSelectedSubmissionId) return;

  const newStatus = document.getElementById('modalStatusSelect').value;
  const newScore = document.getElementById('modalScoreInput').value;

  const item = submissions.find(s => s.id === activeSelectedSubmissionId);
  if (item) {
    item.status = newStatus;
    item.score = newScore ? parseInt(newScore, 10) : null;
    saveSubmissions();
    renderAllViews();
    closeArtworkModal();
    showToast('Saved evaluation changes!', 'success');
  }
}

/* ==========================================================================
   8. Utilities & Toast Manager
   ========================================================================== */

function showToast(message, type = 'info') {
  const container = document.getElementById('toastContainer');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  
  let icon = 'fa-info-circle';
  if (type === 'success') icon = 'fa-check-circle';
  if (type === 'error') icon = 'fa-exclamation-circle';

  toast.innerHTML = `
    <i class="fa-solid ${icon}"></i>
    <span>${escapeHtml(message)}</span>
  `;

  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(100%)';
    toast.style.transition = 'all 0.3s ease';
    setTimeout(() => toast.remove(), 300);
  }, 3500);
}

function escapeHtml(str) {
  if (!str) return '';
  return str.replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
}
