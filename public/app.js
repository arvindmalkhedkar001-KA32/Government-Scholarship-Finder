/**
 * public/app.js
 *
 * Frontend client logic for the Government Scholarship Finder.
 * Features:
 * 1. Fetching schemes from Express API with query parameters (search, scope, level, type).
 * 2. Real-time search debouncing (250ms).
 * 3. Dynamic card rendering with Academic Year, Karnataka/Central badges, and missing data fallbacks.
 * 4. Interactive Student Eligibility Checker with rule-by-rule matching and zero fake percentages.
 * 5. Scheme detail modal dialog.
 * 6. Mobile navigation hamburger toggle.
 * 7. Security: Complete HTML entity escaping for XSS prevention.
 */

document.addEventListener('DOMContentLoaded', () => {

  // ========================================================
  // 1. DOM ELEMENT REFERENCES
  // ========================================================
  
  // Search & Filter controls (Simple search bar & quick chips)
  const searchInput = document.getElementById('searchInput');
  const clearSearchBtn = document.getElementById('clearSearchBtn');
  const searchSubmitBtn = document.getElementById('searchSubmitBtn');
  const quickFilterChips = document.getElementById('quickFilterChips');
  const emptyResetBtn = document.getElementById('emptyResetBtn');
  const retryBtn = document.getElementById('retryBtn');

  // Display containers
  const scholarshipsGrid = document.getElementById('scholarshipsGrid');
  const loadingState = document.getElementById('loadingState');
  const errorState = document.getElementById('errorState');
  const errorMessage = document.getElementById('errorMessage');
  const emptyState = document.getElementById('emptyState');
  const resultsCount = document.getElementById('resultsCount');

  // Metrics counters
  const metricTotal = document.getElementById('metricTotal');
  const metricKarnataka = document.getElementById('metricKarnataka');
  const metricVerified = document.getElementById('metricVerified');

  // Student Eligibility Checker controls
  const eligibilityForm = document.getElementById('eligibilityForm');
  const checkLevel = document.getElementById('checkLevel');
  const checkState = document.getElementById('checkState');
  const checkCategory = document.getElementById('checkCategory');
  const checkIncome = document.getElementById('checkIncome');
  const checkPercentage = document.getElementById('checkPercentage');
  const checkGender = document.getElementById('checkGender');
  const checkDisability = document.getElementById('checkDisability');
  const checkEligibilityBtn = document.getElementById('checkEligibilityBtn');
  const clearCheckerBtn = document.getElementById('clearCheckerBtn');
  const checkerResults = document.getElementById('checkerResults');

  // Modal dialog elements
  const detailModal = document.getElementById('detailModal');
  const modalCloseBtn = document.getElementById('modalCloseBtn');
  const modalDismissBtn = document.getElementById('modalDismissBtn');
  const modalTitle = document.getElementById('modalTitle');
  const modalProvider = document.getElementById('modalProvider');
  const modalStatusBadge = document.getElementById('modalStatusBadge');
  const modalLevel = document.getElementById('modalLevel');
  const modalScope = document.getElementById('modalScope');
  const modalAcademicYear = document.getElementById('modalAcademicYear');
  const modalCategory = document.getElementById('modalCategory');
  const modalBenefits = document.getElementById('modalBenefits');
  const modalEligibility = document.getElementById('modalEligibility');
  const modalDeadlineNote = document.getElementById('modalDeadlineNote');
  const modalVerificationNote = document.getElementById('modalVerificationNote');
  const modalSourceLink = document.getElementById('modalSourceLink');
  const modalNoteBlock = document.getElementById('modalNoteBlock');

  // Mobile Navigation
  const navToggle = document.getElementById('navToggle');
  const navMenu = document.getElementById('navMenu');

  // Local state
  let currentScholarships = [];
  let searchDebounceTimer = null;

  // ========================================================
  // 2. FETCH SCHOLARSHIPS DIRECTORY
  // ========================================================

  /**
   * Fetches scholarship schemes from the Express backend matching the simple search query.
   */
  async function fetchScholarships() {
    setUiState('loading');

    const query = searchInput.value.trim();
    const params = new URLSearchParams();
    if (query) params.append('q', query);

    const apiUrl = `/api/scholarships?${params.toString()}`;

    try {
      const response = await fetch(apiUrl);
      if (!response.ok) {
        throw new Error(`Server returned HTTP ${response.status}`);
      }

      const result = await response.json();
      if (result.success && Array.isArray(result.data)) {
        currentScholarships = result.data;
        renderScholarships(result.data);
        updateMetrics(result.data);
      } else {
        throw new Error(result.message || 'Malformed data response from server.');
      }
    } catch (err) {
      console.error('Fetch error:', err);
      errorMessage.textContent = err.message || 'Unable to connect to the server.';
      setUiState('error');
    }
  }

  // ========================================================
  // 3. UI STATE MANAGEMENT (Loading, Error, Empty, Content)
  // ========================================================

  function setUiState(state) {
    loadingState.style.display = 'none';
    errorState.style.display = 'none';
    emptyState.style.display = 'none';
    scholarshipsGrid.style.display = 'none';

    if (state === 'loading') {
      loadingState.style.display = 'flex';
      resultsCount.textContent = 'Searching scholarships...';
    } else if (state === 'error') {
      errorState.style.display = 'flex';
      resultsCount.textContent = 'Error loading directory';
    } else if (state === 'empty') {
      emptyState.style.display = 'flex';
      resultsCount.textContent = '0 schemes found';
    } else if (state === 'content') {
      scholarshipsGrid.style.display = 'grid';
    }
  }

  // ========================================================
  // 4. RENDERING SCHOLARSHIP CARDS
  // ========================================================

  /**
   * Dynamically renders cards with missing-data fallbacks and XSS escaping.
   * @param {Array} list - Array of scholarship items
   */
  function renderScholarships(list) {
    if (!list || list.length === 0) {
      setUiState('empty');
      return;
    }

    setUiState('content');
    resultsCount.textContent = `Showing ${list.length} scholarship scheme${list.length === 1 ? '' : 's'}`;
    scholarshipsGrid.innerHTML = '';

    list.forEach((scheme) => {
      const card = document.createElement('article');
      card.className = `scholarship-card ${scheme.isVerified ? 'is-verified' : 'is-demo'}`;
      card.setAttribute('aria-label', scheme.name || 'Scholarship Scheme');

      // 1. Verification status badge
      const verifyBadgeHtml = scheme.isVerified
        ? `<span class="badge badge-verified">
             <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">
               <polyline points="20 6 9 17 4 12"></polyline>
             </svg>
             Official Government Scheme
           </span>`
        : `<span class="badge badge-demo">
             <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
               <circle cx="12" cy="12" r="10"></circle>
               <line x1="12" y1="8" x2="12" y2="12"></line>
               <line x1="12" y1="16" x2="12.01" y2="16"></line>
             </svg>
             Demonstration Record
           </span>`;

      // 2. Scope / Region badge
      let scopeBadgeHtml = '';
      if (scheme.scope === 'Karnataka') {
        scopeBadgeHtml = `<span class="badge badge-karnataka">🏛️ Karnataka (SSP)</span>`;
      } else if (scheme.scope === 'Central') {
        scopeBadgeHtml = `<span class="badge badge-central">🇮🇳 Central Government</span>`;
      } else {
        scopeBadgeHtml = `<span class="badge badge-demo">🧪 Test Sample</span>`;
      }

      // 3. Fallbacks for missing/partial fields
      const safeName = escapeHtml(scheme.name || 'Untitled Scholarship Scheme');
      const safeProvider = escapeHtml(scheme.provider || 'Department / Ministry Not Specified');
      const safeLevel = escapeHtml(scheme.level || 'Education Level: Check Official Guidelines');
      const safeCategory = escapeHtml(scheme.category || 'General / All Categories');
      const safeBenefits = escapeHtml(scheme.benefits || 'Financial benefits details available in official portal notification.');
      const safeEligibility = escapeHtml(scheme.eligibility || 'Refer to active official circular for complete eligibility thresholds.');
      const safeAcademicYear = escapeHtml(scheme.academicYear || 'Academic Session: Not Specified');
      const safeSourceUrl = scheme.sourceUrl ? escapeHtml(scheme.sourceUrl) : '#';

      card.innerHTML = `
        <div class="card-header">
          <div class="card-badges">
            ${verifyBadgeHtml}
            ${scopeBadgeHtml}
            <span class="badge badge-category">${safeCategory}</span>
          </div>
          <h3 class="card-title">${safeName}</h3>
          <p class="card-provider">${safeProvider}</p>
        </div>

        <div class="card-body">
          <div class="info-item">
            <span class="info-label">Education Level</span>
            <span class="info-value">${safeLevel}</span>
          </div>

          <div class="info-item">
            <span class="info-label">Session / Cycle</span>
            <span class="info-value academic-year-pill">${safeAcademicYear}</span>
          </div>

          <div class="info-item">
            <span class="info-label">Key Benefits & Allowances</span>
            <span class="info-value benefit-highlight">${safeBenefits}</span>
          </div>

          <div class="info-item">
            <span class="info-label">Eligibility Summary</span>
            <span class="info-value eligibility-text">${safeEligibility}</span>
          </div>
        </div>

        <div class="card-footer">
          <button type="button" class="btn-card-details" data-id="${escapeHtml(scheme.id)}">
            View Details
          </button>
          <a href="${safeSourceUrl}" target="_blank" rel="noopener noreferrer" class="btn-card-portal" title="Open official scholarship portal">
            Official Portal
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
              <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
              <polyline points="15 3 21 3 21 9"></polyline>
              <line x1="10" y1="14" x2="21" y2="3"></line>
            </svg>
          </a>
        </div>
      `;

      // Event listener for opening detail modal
      const detailsBtn = card.querySelector('.btn-card-details');
      detailsBtn.addEventListener('click', () => openModal(scheme));

      scholarshipsGrid.appendChild(card);
    });
  }

  /**
   * Updates hero metric counters based on current list.
   */
  function updateMetrics(list) {
    if (!list) return;
    const total = list.length;
    const karnataka = list.filter((item) => item.scope === 'Karnataka').length;
    const verified = list.filter((item) => item.isVerified).length;

    metricTotal.textContent = total;
    metricKarnataka.textContent = karnataka;
    metricVerified.textContent = verified;
  }

  // ========================================================
  // 5. DETAIL MODAL DIALOG LOGIC
  // ========================================================

  function openModal(scheme) {
    modalTitle.textContent = scheme.name || 'Scholarship Scheme Details';
    modalProvider.textContent = scheme.provider || 'Provider Not Specified';
    modalLevel.textContent = scheme.level || 'Check Official Guidelines';
    modalScope.textContent = `${scheme.scope || 'General'} (${scheme.portalName || 'Government Portal'})`;
    modalAcademicYear.textContent = scheme.academicYear || 'Not Specified (Check Portal)';
    modalCategory.textContent = scheme.category || 'All Categories';
    modalBenefits.textContent = scheme.benefits || 'Please refer to official guidelines for benefit breakdown.';
    modalEligibility.textContent = scheme.eligibility || 'Please verify active eligibility criteria directly on the official portal.';
    modalDeadlineNote.textContent = scheme.deadlineNote || 'Application deadlines vary by academic cycle. Always check the official website.';
    modalVerificationNote.textContent = scheme.verificationNote || 'Verification details recorded by platform.';
    modalSourceLink.href = scheme.sourceUrl || '#';

    // Style the note block according to verification
    if (scheme.isVerified) {
      modalNoteBlock.className = 'modal-block note-block';
      modalStatusBadge.innerHTML = `
        <span class="badge badge-verified">Official Government Scheme</span>
      `;
    } else {
      modalNoteBlock.className = 'modal-block note-block is-demo-note';
      modalStatusBadge.innerHTML = `
        <span class="badge badge-demo">Demonstration / Testing Sample Record</span>
      `;
    }

    detailModal.classList.add('active');
    detailModal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
  }

  function closeModal() {
    detailModal.classList.remove('active');
    detailModal.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  }

  modalCloseBtn.addEventListener('click', closeModal);
  modalDismissBtn.addEventListener('click', closeModal);

  detailModal.addEventListener('click', (e) => {
    if (e.target === detailModal) closeModal();
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && detailModal.classList.contains('active')) {
      closeModal();
    }
  });

  // ========================================================
  // 6. STUDENT ELIGIBILITY CHECKER (RULE-BASED EVALUATION)
  // ========================================================

  async function handleEligibilityCheck(e) {
    if (e) e.preventDefault();

    const incomeVal = Number(checkIncome.value);
    const percentageVal = Number(checkPercentage.value);

    // Client-side validations
    if (isNaN(incomeVal) || incomeVal < 0) {
      alert('Please enter a valid non-negative annual family income in Indian Rupees (₹).');
      checkIncome.focus();
      return;
    }

    if (isNaN(percentageVal) || percentageVal < 0 || percentageVal > 100) {
      alert('Please enter a valid qualifying examination percentage between 0% and 100%.');
      checkPercentage.focus();
      return;
    }

    const payload = {
      educationLevel: checkLevel.value,
      annualIncome: incomeVal,
      category: checkCategory.value,
      domicileState: checkState.value,
      gender: checkGender.value,
      isDisability: checkDisability.value === 'true',
      percentage: percentageVal
    };

    // UI feedback during evaluation
    checkEligibilityBtn.disabled = true;
    checkEligibilityBtn.innerHTML = `
      <div class="spinner" style="width:16px;height:16px;border-width:2px;margin:0;display:inline-block;vertical-align:middle;"></div>
      Evaluating...
    `;

    try {
      const response = await fetch('/api/check-eligibility', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const errJson = await response.json().catch(() => ({}));
        throw new Error(errJson.message || `Server error (HTTP ${response.status})`);
      }

      const evalData = await response.json();
      if (evalData.success) {
        renderEligibilityResults(evalData);
        checkerResults.style.display = 'block';
        checkerResults.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      } else {
        throw new Error(evalData.message || 'Failed to calculate eligibility.');
      }
    } catch (err) {
      console.error('Eligibility check error:', err);
      alert(`Evaluation Error: ${err.message}`);
    } finally {
      checkEligibilityBtn.disabled = false;
      checkEligibilityBtn.innerHTML = `
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
          <polyline points="9 11 12 14 22 4"></polyline>
          <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"></path>
        </svg>
        Evaluate Eligibility
      `;
    }
  }

  /**
   * Renders rule-based eligibility evaluation results.
   */
  function renderEligibilityResults(evalData) {
    const { counts, results, userSummary } = evalData;

    let html = `
      <div class="checker-summary-banner">
        <div>
          <h3 class="summary-banner-title">Eligibility Evaluation Summary</h3>
          <p style="font-size: 0.85rem; color: #075985; margin-top: 0.2rem;">
            Profile: ${escapeHtml(userSummary.domicileState)} Domicile • ${escapeHtml(userSummary.category)} • Income: ₹${userSummary.annualIncome.toLocaleString('en-IN')} • Score: ${userSummary.percentage}%
          </p>
        </div>
        <div class="summary-stats-pills">
          <span class="stat-pill stat-pill-eligible">✓ ${counts.eligible} Likely Eligible</span>
          <span class="stat-pill stat-pill-caution">⚠️ ${counts.insufficientInfo} Needs Verification</span>
          <span class="stat-pill stat-pill-ineligible">✕ ${counts.ineligible} Unmet Criteria</span>
        </div>
      </div>
    `;

    // 1. Likely Eligible Matches
    if (results.eligible && results.eligible.length > 0) {
      html += `
        <div class="result-group">
          <h4 class="result-group-title group-title-eligible">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
              <polyline points="22 4 12 14.01 9 11.01"></polyline>
            </svg>
            Likely Eligible Matches (${results.eligible.length})
          </h4>
          <div class="result-cards-list">
            ${results.eligible.map((item) => `
              <div class="eval-card is-eligible-card">
                <div class="eval-card-header">
                  <div>
                    <h5 class="eval-scheme-title">${escapeHtml(item.scheme.name)}</h5>
                    <p class="eval-provider">${escapeHtml(item.scheme.provider)} • <strong>${escapeHtml(item.scheme.scope)} Scope</strong></p>
                  </div>
                  <span class="badge badge-verified">Eligible Match</span>
                </div>
                <div class="eval-reasons-list">
                  ${item.reasons.map((r) => `
                    <div class="reason-item matched">
                      <span class="reason-icon">✓</span>
                      <span>${escapeHtml(r)}</span>
                    </div>
                  `).join('')}
                </div>
                <div class="eval-card-footer">
                  <span style="font-size:0.8rem;color:#047857;font-weight:600;">
                    Benefits: ${escapeHtml(item.scheme.benefits)}
                  </span>
                  <a href="${escapeHtml(item.scheme.sourceUrl)}" target="_blank" rel="noopener noreferrer" class="eval-portal-btn">
                    Apply on Official Portal →
                  </a>
                </div>
              </div>
            `).join('')}
          </div>
        </div>
      `;
    }

    // 2. Insufficient Information / Requires Portal Verification
    if (results.insufficientInfo && results.insufficientInfo.length > 0) {
      html += `
        <div class="result-group">
          <h4 class="result-group-title group-title-caution">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="12" y1="8" x2="12" y2="12"></line>
              <line x1="12" y1="16" x2="12.01" y2="16"></line>
            </svg>
            Requires Verification / Incomplete Criteria (${results.insufficientInfo.length})
          </h4>
          <div class="result-cards-list">
            ${results.insufficientInfo.map((item) => `
              <div class="eval-card is-caution-card">
                <div class="eval-card-header">
                  <div>
                    <h5 class="eval-scheme-title">${escapeHtml(item.scheme.name)}</h5>
                    <p class="eval-provider">${escapeHtml(item.scheme.provider)}</p>
                  </div>
                  <span class="badge badge-demo">Needs Official Verification</span>
                </div>
                <div class="eval-reasons-list">
                  <div class="reason-item caution">
                    <span class="reason-icon">⚠️</span>
                    <span>${escapeHtml(item.reason)}</span>
                  </div>
                </div>
                <div class="eval-card-footer">
                  <span style="font-size:0.8rem;color:#92400e;">
                    Notice: Eligibility is never assumed without complete published criteria.
                  </span>
                  <a href="${escapeHtml(item.scheme.sourceUrl)}" target="_blank" rel="noopener noreferrer" class="eval-portal-btn">
                    Check Portal Guidelines →
                  </a>
                </div>
              </div>
            `).join('')}
          </div>
        </div>
      `;
    }

    // 3. Ineligible Schemes (Transparent Reasons)
    if (results.ineligible && results.ineligible.length > 0) {
      html += `
        <div class="result-group">
          <h4 class="result-group-title group-title-ineligible">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="15" y1="9" x2="9" y2="15"></line>
              <line x1="9" y1="9" x2="15" y2="15"></line>
            </svg>
            Unmet Scheme Criteria (${results.ineligible.length})
          </h4>
          <div class="result-cards-list">
            ${results.ineligible.map((item) => `
              <div class="eval-card is-ineligible-card">
                <div class="eval-card-header">
                  <div>
                    <h5 class="eval-scheme-title" style="color:#475569;">${escapeHtml(item.scheme.name)}</h5>
                    <p class="eval-provider">${escapeHtml(item.scheme.provider)}</p>
                  </div>
                  <span class="badge" style="background-color:#e2e8f0;color:#475569;">Criteria Not Met</span>
                </div>
                <div class="eval-reasons-list">
                  ${item.unmetReasons.map((r) => `
                    <div class="reason-item unmet">
                      <span class="reason-icon">✕</span>
                      <span>${escapeHtml(r)}</span>
                    </div>
                  `).join('')}
                </div>
              </div>
            `).join('')}
          </div>
        </div>
      `;
    }

    checkerResults.innerHTML = html;
  }

  function resetCheckerForm() {
    eligibilityForm.reset();
    checkIncome.value = 150000;
    checkPercentage.value = 75;
    checkState.value = 'Karnataka';
    checkCategory.value = 'SC';
    checkerResults.style.display = 'none';
    checkerResults.innerHTML = '';
  }

  eligibilityForm.addEventListener('submit', handleEligibilityCheck);
  clearCheckerBtn.addEventListener('click', resetCheckerForm);

  // ========================================================
  // 7. SIMPLE SEARCH & QUICK FILTER CHIPS
  // ========================================================

  const chipButtons = document.querySelectorAll('.chip-btn');

  function syncChipsWithQuery(query) {
    const clean = query.trim().toLowerCase();
    chipButtons.forEach((chip) => {
      const chipQuery = (chip.dataset.query || '').trim().toLowerCase();
      if (!clean && !chipQuery) {
        chip.classList.add('active');
      } else if (clean && chipQuery && clean === chipQuery) {
        chip.classList.add('active');
      } else {
        chip.classList.remove('active');
      }
    });
  }

  // Live debounced search (250ms)
  searchInput.addEventListener('input', () => {
    const val = searchInput.value.trim();
    clearSearchBtn.style.display = val ? 'block' : 'none';
    syncChipsWithQuery(val);

    clearTimeout(searchDebounceTimer);
    searchDebounceTimer = setTimeout(() => {
      fetchScholarships();
    }, 250);
  });

  // Enter key initiates immediate search
  searchInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      clearTimeout(searchDebounceTimer);
      fetchScholarships();
    }
  });

  // Search Submit button
  if (searchSubmitBtn) {
    searchSubmitBtn.addEventListener('click', () => {
      clearTimeout(searchDebounceTimer);
      fetchScholarships();
    });
  }

  // Clear search input button
  clearSearchBtn.addEventListener('click', () => {
    searchInput.value = '';
    clearSearchBtn.style.display = 'none';
    syncChipsWithQuery('');
    searchInput.focus();
    fetchScholarships();
  });

  // Quick Suggestion Chips click handling
  chipButtons.forEach((chip) => {
    chip.addEventListener('click', () => {
      chipButtons.forEach((c) => c.classList.remove('active'));
      chip.classList.add('active');

      const query = chip.dataset.query || '';
      searchInput.value = query;
      clearSearchBtn.style.display = query ? 'block' : 'none';
      fetchScholarships();
    });
  });

  function resetAllSearch() {
    searchInput.value = '';
    clearSearchBtn.style.display = 'none';
    syncChipsWithQuery('');
    fetchScholarships();
  }

  if (emptyResetBtn) {
    emptyResetBtn.addEventListener('click', resetAllSearch);
  }
  if (retryBtn) {
    retryBtn.addEventListener('click', fetchScholarships);
  }

  // ========================================================
  // 8. MOBILE NAVIGATION DRAWER
  // ========================================================
  navToggle.addEventListener('click', () => {
    const isActive = navMenu.classList.toggle('active');
    navToggle.setAttribute('aria-expanded', isActive ? 'true' : 'false');
  });

  navMenu.querySelectorAll('.nav-link').forEach((link) => {
    link.addEventListener('click', () => {
      navMenu.classList.remove('active');
      navToggle.setAttribute('aria-expanded', 'false');
    });
  });

  // ========================================================
  // 9. SECURITY HELPER (XSS PREVENTER)
  // ========================================================
  function escapeHtml(str) {
    if (str === null || str === undefined) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  // ========================================================
  // 10. INITIAL LOAD
  // ========================================================
  fetchScholarships();
});
