// ===== FarmerChoice — App Logic & Backend Integration =====

import { api } from './api.js';

(function () {
  'use strict';

  // ---------- STATE ----------
  let currentUser = api.auth.getUser();
  let currentFarm = null;
  let currentAssessment = null;
  let pendingAssessmentSubmission = false;

  // ---------- DOM REFERENCES ----------
  const sections = document.querySelectorAll('.page-section');
  const navLinks = document.querySelectorAll('.nav-link');
  const formSteps = document.querySelectorAll('.form-step');
  const progressSteps = document.querySelectorAll('.progress-step');
  const progressFill = document.getElementById('progressFill');
  const prevBtn = document.getElementById('prevBtn');
  const nextBtn = document.getElementById('nextBtn');
  const stepIndicator = document.getElementById('stepIndicatorText');
  const form = document.getElementById('assessmentForm');
  const mobileMenuBtn = document.getElementById('mobileMenuBtn');
  const mainNav = document.getElementById('mainNav');
  const headerAuthArea = document.getElementById('headerAuthArea');
  const adminNavLink = document.getElementById('adminNavLink');

  // Modals
  const authModal = document.getElementById('authModal');
  const docsModal = document.getElementById('docsModal');
  const closeAuthModalBtn = document.getElementById('closeAuthModalBtn');
  const closeDocsModalBtn = document.getElementById('closeDocsModalBtn');
  const tabSignIn = document.getElementById('tabSignIn');
  const tabRegister = document.getElementById('tabRegister');
  const signInForm = document.getElementById('signInForm');
  const registerForm = document.getElementById('registerForm');
  const authAlert = document.getElementById('authAlert');
  const toastContainer = document.getElementById('toastContainer');

  let currentStep = 1;
  const totalSteps = 7;

  // ---------- TOAST NOTIFICATIONS ----------
  function showToast(message, type = 'info') {
    if (!toastContainer) return;
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;
    toastContainer.appendChild(toast);
    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(10px)';
      toast.style.transition = 'all 0.3s ease';
      setTimeout(() => toast.remove(), 300);
    }, 3500);
  }

  // ---------- NAVIGATION ----------
  function showSection(sectionId) {
    sections.forEach(s => s.classList.remove('active'));
    const target = document.getElementById(sectionId);
    if (target) {
      target.classList.add('active');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    navLinks.forEach(link => {
      link.classList.toggle('active', link.getAttribute('data-section') === sectionId);
    });

    if (mainNav) mainNav.classList.remove('open');

    // If navigating to admin section, load admin data
    if (sectionId === 'admin-section' && currentUser?.role === 'ADMIN') {
      loadAdminDashboard();
    }
  }

  // Nav link clicks
  navLinks.forEach(link => {
    link.addEventListener('click', e => {
      e.preventDefault();
      const section = link.getAttribute('data-section');
      if (section) showSection(section);
    });
  });

  // Footer links
  document.querySelectorAll('#footer a[data-section]').forEach(link => {
    link.addEventListener('click', e => {
      e.preventDefault();
      const section = link.getAttribute('data-section');
      if (section) showSection(section);
    });
  });

  // Buttons with data-goto
  document.querySelectorAll('[data-goto]').forEach(btn => {
    btn.addEventListener('click', () => {
      const target = btn.getAttribute('data-goto');
      showSection(target);
    });
  });

  // Mobile menu
  if (mobileMenuBtn) {
    mobileMenuBtn.addEventListener('click', () => {
      mainNav.classList.toggle('open');
    });
  }

  // ---------- AUTHENTICATION UI & STATE ----------
  function updateAuthUI() {
    currentUser = api.auth.getUser();

    if (headerAuthArea) {
      if (currentUser) {
        const displayName = currentUser.farmer?.name || currentUser.email.split('@')[0];
        headerAuthArea.innerHTML = `
          <div class="user-badge" title="${currentUser.email}">
            <span>👨‍🌾</span>
            <span>${displayName}</span>
          </div>
          <button class="btn btn-sm btn-outline" id="logoutBtn" type="button">Logout</button>
          <button class="btn btn-primary header-cta" data-goto="assessment" type="button">Start Assessment</button>
        `;
        const logoutBtn = document.getElementById('logoutBtn');
        if (logoutBtn) {
          logoutBtn.addEventListener('click', handleLogout);
        }
        const ctaBtn = headerAuthArea.querySelector('.header-cta');
        if (ctaBtn) {
          ctaBtn.addEventListener('click', () => showSection('assessment'));
        }
      } else {
        headerAuthArea.innerHTML = `
          <button class="btn btn-outline" id="openAuthModalBtn" type="button">Sign In</button>
          <button class="btn btn-primary header-cta" data-goto="assessment" type="button">Start Assessment</button>
        `;
        const openBtn = document.getElementById('openAuthModalBtn');
        if (openBtn) {
          openBtn.addEventListener('click', () => openAuthModal());
        }
        const ctaBtn = headerAuthArea.querySelector('.header-cta');
        if (ctaBtn) {
          ctaBtn.addEventListener('click', () => showSection('assessment'));
        }
      }
    }

    if (adminNavLink) {
      adminNavLink.style.display = currentUser?.role === 'ADMIN' ? 'inline-block' : 'none';
    }
  }

  function openAuthModal(message = null) {
    if (!authModal) return;
    authModal.style.display = 'flex';
    if (authAlert) {
      if (message) {
        authAlert.textContent = message;
        authAlert.className = 'form-alert visible error';
      } else {
        authAlert.className = 'form-alert';
        authAlert.textContent = '';
      }
    }
  }

  function closeAuthModal() {
    if (!authModal) return;
    authModal.style.display = 'none';
    if (authAlert) authAlert.className = 'form-alert';
  }

  if (closeAuthModalBtn) {
    closeAuthModalBtn.addEventListener('click', closeAuthModal);
  }

  // Auth modal outside click
  if (authModal) {
    authModal.addEventListener('click', e => {
      if (e.target === authModal) closeAuthModal();
    });
  }

  // Auth tabs
  if (tabSignIn && tabRegister) {
    tabSignIn.addEventListener('click', () => {
      tabSignIn.classList.add('active');
      tabRegister.classList.remove('active');
      signInForm.style.display = 'block';
      registerForm.style.display = 'none';
      if (authAlert) authAlert.className = 'form-alert';
    });
    tabRegister.addEventListener('click', () => {
      tabRegister.classList.add('active');
      tabSignIn.classList.remove('active');
      registerForm.style.display = 'block';
      signInForm.style.display = 'none';
      if (authAlert) authAlert.className = 'form-alert';
    });
  }

  // Sign In submit
  if (signInForm) {
    signInForm.addEventListener('submit', async e => {
      e.preventDefault();
      const email = document.getElementById('loginEmail').value.trim();
      const password = document.getElementById('loginPassword').value;
      const submitBtn = document.getElementById('signInSubmitBtn');

      try {
        submitBtn.disabled = true;
        submitBtn.textContent = 'Signing in...';
        await api.auth.login({ email, password });
        updateAuthUI();
        closeAuthModal();
        showToast('Signed in successfully!', 'success');

        if (pendingAssessmentSubmission) {
          pendingAssessmentSubmission = false;
          submitAssessment();
        }
      } catch (err) {
        if (authAlert) {
          authAlert.textContent = err.message || 'Login failed. Please check your credentials.';
          authAlert.className = 'form-alert visible error';
        }
      } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Sign In';
      }
    });
  }

  // Register submit
  if (registerForm) {
    registerForm.addEventListener('submit', async e => {
      e.preventDefault();
      const name = document.getElementById('regName').value.trim();
      const phone = document.getElementById('regPhone').value.trim();
      const email = document.getElementById('regEmail').value.trim();
      const password = document.getElementById('regPassword').value;
      const state = document.getElementById('regState').value.trim();
      const district = document.getElementById('regDistrict').value.trim();
      const submitBtn = document.getElementById('registerSubmitBtn');

      try {
        submitBtn.disabled = true;
        submitBtn.textContent = 'Creating account...';
        await api.auth.register({ name, phone, email, password, state, district });
        updateAuthUI();
        closeAuthModal();
        showToast('Account created and logged in!', 'success');

        if (pendingAssessmentSubmission) {
          pendingAssessmentSubmission = false;
          submitAssessment();
        }
      } catch (err) {
        if (authAlert) {
          authAlert.textContent = err.message || 'Registration failed. Please try again.';
          authAlert.className = 'form-alert visible error';
        }
      } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Create Account';
      }
    });
  }

  function handleLogout() {
    api.auth.logout();
    currentUser = null;
    currentFarm = null;
    currentAssessment = null;
    updateAuthUI();
    showToast('Logged out successfully.', 'info');
    showSection('home');
  }

  window.addEventListener('krishi:unauthorized', () => {
    updateAuthUI();
    openAuthModal('Your session has expired. Please sign in again.');
  });

  // Verify stored session on boot
  if (api.auth.isAuthenticated()) {
    api.auth.getMe()
      .then(profile => {
        currentUser = profile;
        updateAuthUI();
      })
      .catch(() => {
        api.auth.logout();
        updateAuthUI();
      });
  }

  // ---------- FORM STEP MANAGEMENT ----------
  function updateFormUI() {
    formSteps.forEach(step => {
      step.classList.toggle('active', parseInt(step.getAttribute('data-step')) === currentStep);
    });

    progressSteps.forEach(ps => {
      const stepNum = parseInt(ps.getAttribute('data-step'));
      ps.classList.remove('active', 'completed');
      if (stepNum === currentStep) ps.classList.add('active');
      else if (stepNum < currentStep) ps.classList.add('completed');
    });

    const pct = ((currentStep - 1) / (totalSteps - 1)) * 100;
    if (progressFill) progressFill.style.width = pct + '%';

    if (prevBtn) prevBtn.style.visibility = currentStep === 1 ? 'hidden' : 'visible';
    if (nextBtn) {
      if (currentStep === totalSteps) {
        nextBtn.textContent = 'Submit Assessment';
        nextBtn.classList.add('btn-submit');
      } else {
        nextBtn.textContent = 'Next Step →';
        nextBtn.classList.remove('btn-submit');
      }
    }

    if (stepIndicator) {
      stepIndicator.textContent = `Step ${currentStep} of ${totalSteps}`;
    }

    const assessEl = document.getElementById('assessment');
    if (assessEl) {
      const headerH = document.getElementById('header')?.offsetHeight || 64;
      const top = assessEl.getBoundingClientRect().top + window.scrollY - headerH - 12;
      window.scrollTo({ top, behavior: 'smooth' });
    }
  }

  function validateCurrentStep() {
    const activeStep = document.querySelector(`.form-step[data-step="${currentStep}"]`);
    if (!activeStep) return true;
    const requiredFields = activeStep.querySelectorAll('[required]');
    let valid = true;

    requiredFields.forEach(field => {
      field.classList.remove('error');
      if (!field.value || field.value.trim() === '') {
        field.classList.add('error');
        valid = false;
      }
    });

    if (currentStep === 2) {
      const checked = activeStep.querySelectorAll('input[name="crops"]:checked');
      if (checked.length === 0) {
        valid = false;
        const grid = activeStep.querySelector('.checkbox-grid');
        if (grid) grid.style.border = '1px solid var(--red-600)';
        setTimeout(() => { if (grid) grid.style.border = ''; }, 3000);
      }
    }

    return valid;
  }

  // Next button
  if (nextBtn) {
    nextBtn.addEventListener('click', () => {
      if (!validateCurrentStep()) {
        nextBtn.style.animation = 'none';
        void nextBtn.offsetWidth;
        nextBtn.style.animation = 'shake 0.4s ease';
        setTimeout(() => { nextBtn.style.animation = ''; }, 500);
        return;
      }

      if (currentStep < totalSteps) {
        currentStep++;
        updateFormUI();
      } else {
        submitAssessment();
      }
    });
  }

  // Previous button
  if (prevBtn) {
    prevBtn.addEventListener('click', () => {
      if (currentStep > 1) {
        currentStep--;
        updateFormUI();
      }
    });
  }

  // Progress step clicks
  progressSteps.forEach(ps => {
    ps.addEventListener('click', () => {
      const target = parseInt(ps.getAttribute('data-step'));
      if (target < currentStep) {
        currentStep = target;
        updateFormUI();
      }
    });
  });

  // Shake keyframe
  const style = document.createElement('style');
  style.textContent = `@keyframes shake { 0%,100%{transform:translateX(0)} 20%{transform:translateX(-6px)} 40%{transform:translateX(6px)} 60%{transform:translateX(-4px)} 80%{transform:translateX(4px)} }`;
  document.head.appendChild(style);

  // ---------- FORM DATA EXTRACTION ----------
  function val(id) {
    const el = document.getElementById(id);
    return el ? el.value : '';
  }

  function checkedValues(name) {
    return Array.from(document.querySelectorAll(`input[name="${name}"]:checked`)).map(cb => cb.value);
  }

  function gatherFormData() {
    const d = {};
    // Step 1
    d.farmName = val('farmName');
    d.state = val('state');
    d.district = val('district');
    d.farmArea = parseFloat(val('farmArea')) || 0;
    d.areaUnit = val('areaUnit');
    d.ownership = val('ownership');
    d.farmingYears = val('farmingYears');

    // Step 2
    d.crops = checkedValues('crops');
    d.cropRotation = val('cropRotation');
    d.coverCrops = val('coverCrops');
    d.residueMgmt = val('residueMgmt');

    // Step 3
    d.tillage = val('tillage');
    d.organicFarming = val('organicFarming');
    d.agroforestry = val('agroforestry');
    d.intercropping = val('intercropping');
    d.livestock = val('livestock');
    d.energySource = val('energySource');

    // Step 4
    d.fertilizerCategory = val('fertilizerCategory');
    d.organicFertilizerType = val('organicFertilizerType');
    d.chemFertilizer = val('chemFertilizer');
    d.organicManure = val('organicManure');
    d.pesticide = val('pesticide');
    d.bioFertilizer = val('bioFertilizer');
    d.soilAmendments = val('soilAmendments');
    d.inputRecords = val('inputRecords');

    // Step 5
    d.irrigationType = val('irrigationType');
    d.waterSource = val('waterSource');
    d.waterConservation = val('waterConservation');
    d.waterEfficiency = val('waterEfficiency');

    // Step 6
    d.soilTesting = val('soilTesting');
    d.soilHealthCard = val('soilHealthCard');
    d.composting = val('composting');
    d.mulching = val('mulching');
    d.erosionControl = val('erosionControl');
    d.soilOrganic = val('soilOrganic');

    // Step 7
    d.records = checkedValues('records');
    d.digitalRecords = val('digitalRecords');
    d.govSchemes = val('govSchemes');
    d.additionalInfo = val('additionalInfo');

    return d;
  }

  // ---------- REAL BACKEND ASSESSMENT SUBMISSION ----------
  async function submitAssessment() {
    // 1. Verify authentication
    if (!api.auth.isAuthenticated()) {
      pendingAssessmentSubmission = true;
      openAuthModal('Please sign in or create an account to save your farm and run your assessment.');
      return;
    }

    // 2. Show loading overlay
    const overlay = document.createElement('div');
    overlay.className = 'loading-overlay';
    overlay.innerHTML = `
      <div class="loading-spinner"></div>
      <div class="loading-text">Saving Farm & Computing Assessment</div>
      <div class="loading-subtext">Executing backend deterministic scoring engine with PostgreSQL persistence...</div>
    `;
    document.body.appendChild(overlay);

    try {
      const d = gatherFormData();

      // Convert area to acres
      let areaInAcres = parseFloat(d.farmArea) || 1;
      if (d.areaUnit === 'hectares') areaInAcres = Math.round(areaInAcres * 2.47105 * 10) / 10;
      else if (d.areaUnit === 'bigha') areaInAcres = Math.round(areaInAcres * 0.625 * 10) / 10;
      if (areaInAcres <= 0) areaInAcres = 1;

      // Soil type mapping
      let soilType = 'Alluvial Fertile Soil';
      if (d.soilOrganic === 'yes') soilType = 'Organic-Enriched Loam (Profiled)';
      else if (d.soilTesting === 'lab_recent') soilType = 'Tested Clay Loam Soil';
      else if (d.erosionControl && d.erosionControl !== 'none') soilType = 'Managed Silt Loam';

      // Irrigation method mapping
      let irrigationMethod = 'Sprinkler Irrigation';
      if (d.irrigationType === 'drip') irrigationMethod = 'Drip Micro-Irrigation';
      else if (d.irrigationType === 'flood') irrigationMethod = 'Flood Surface Irrigation';
      else if (d.irrigationType === 'rainfed') irrigationMethod = 'Rainfed Conservation Irrigation';

      // Water source mapping
      let waterSource = 'Groundwater Borewell';
      if (d.waterSource === 'pond') waterSource = 'Rainwater Harvesting Farm Pond';
      else if (d.waterSource === 'canal') waterSource = 'Canal Irrigation Network';
      else if (d.waterSource === 'river') waterSource = 'River Lift Pumping';
      else if (d.waterSource === 'rain') waterSource = 'Direct Precipitation Only';

      // Fertilizer management & category mapping
      const fertilizerCategory = d.fertilizerCategory || (d.chemFertilizer === 'none' ? 'ORGANIC' : (d.chemFertilizer === 'low' ? 'INTEGRATED' : 'SYNTHETIC'));
      const organicFertilizerType = (fertilizerCategory === 'ORGANIC' && d.organicFertilizerType) ? d.organicFertilizerType : null;

      let fertilizerUsage = fertilizerCategory;
      if (organicFertilizerType) {
        fertilizerUsage = `${fertilizerCategory} (${organicFertilizerType})`;
      } else if (d.chemFertilizer === 'heavy' || d.chemFertilizer === 'high') {
        fertilizerUsage = `${fertilizerCategory} - Heavy Chemical NPK Application`;
      } else if (d.chemFertilizer === 'none') {
        fertilizerUsage = `${fertilizerCategory} - 100% Bio & Organic Manure`;
      }

      // Pesticide usage mapping
      let pesticideUsage = 'Integrated Pest Management (Neem & Biologicals)';
      if (d.pesticide === 'none') pesticideUsage = 'Biological Pest Management & Pheromones';
      else if (d.pesticide === 'high') pesticideUsage = 'Periodic Intensive Chemical Sprays';

      // Tillage mapping
      let tillageMethod = 'Reduced / Conservation Tillage';
      if (d.tillage === 'no_till') tillageMethod = 'Zero Tillage / No-Till';
      else if (d.tillage === 'conventional') tillageMethod = 'Conventional Deep Ploughing';

      // Residue management mapping
      let residueManagement = 'In-situ Residue Mulching with Happy Seeder';
      if (d.residueMgmt === 'burn') residueManagement = 'Field Burning / Stubble Burning';
      else if (d.residueMgmt === 'incorporate') residueManagement = 'In-situ Soil Incorporation';
      else if (d.residueMgmt === 'compost') residueManagement = 'Composting & Biomass Recycling';
      else if (d.residueMgmt === 'remove') residueManagement = 'Residue Removal for Fodder';

      const organicPractices = d.organicFarming === 'certified' || d.organicFarming === 'practising';

      // 3. Create Farm in Backend
      const farmPayload = {
        name: d.farmName || 'FarmerChoice Agro Parcel',
        areaAcres: areaInAcres,
        soilType,
        irrigationMethod,
        waterSource,
        fertilizerUsage,
        fertilizerCategory,
        organicFertilizerType,
        pesticideUsage,
        tillageMethod,
        residueManagement,
        organicPractices,
      };

      const farm = await api.farms.createFarm(farmPayload);
      currentFarm = farm;

      // 4. Create Crops in Backend
      const cropNamesMap = {
        rice: 'Paddy (Rice)',
        wheat: 'Wheat',
        maize: 'Maize (Corn)',
        cotton: 'Cotton',
        sugarcane: 'Sugarcane',
        pulses: 'Chickpea / Pulses (Legumes)',
        oilseeds: 'Mustard / Oilseeds',
        vegetables: 'Seasonal Vegetables',
        fruits: 'Horticulture Fruits',
        spices: 'Spices',
        millets: 'Millets (Bajra/Ragi)',
        other: 'Cover & Mixed Crop',
      };

      const cropsToSave = d.crops.length > 0 ? d.crops : ['wheat'];
      for (const c of cropsToSave) {
        try {
          await api.crops.createCrop({
            farmId: farm.id,
            crop: cropNamesMap[c] || c,
            season: 'Kharif',
            year: 2024,
            yield: 2.5,
          });
        } catch (cropErr) {
          console.warn('Failed to save crop', c, cropErr);
        }
      }

      // 5. Run Assessment via Backend
      const assessment = await api.assessments.runAssessment(farm.id);
      currentAssessment = assessment;

      // 6. Render real API results
      renderResults(assessment, farm);

      // 7. Load real assessment history
      loadAssessmentHistory(farm.id);

      overlay.remove();
      showSection('results');
      showToast('Assessment generated successfully from backend!', 'success');
    } catch (err) {
      overlay.remove();
      console.error('Assessment submission error:', err);
      showToast(err.message || 'Failed to submit assessment.', 'error');
    }
  }

  // ---------- RENDER RESULTS (DRIVEN BY BACKEND API) ----------
  function renderResults(assessment, farm) {
    const score = assessment.overallScore;

    // Animate score circle
    const arc = document.getElementById('scoreArc');
    const scoreValEl = document.getElementById('scoreValue');
    const circumference = 2 * Math.PI * 70; // r=70
    const offset = circumference - (score / 100) * circumference;

    let arcColor = '#2e7d32';
    if (score < 40) arcColor = '#dc2626';
    else if (score < 70) arcColor = '#d97706';

    if (arc) {
      arc.setAttribute('stroke', arcColor);
      arc.setAttribute('stroke-dasharray', circumference);
      arc.setAttribute('stroke-dashoffset', offset);
      arc.style.transition = 'stroke-dashoffset 1.2s ease';
    }

    if (scoreValEl) {
      let current = 0;
      const step = Math.max(1, Math.floor(score / 30));
      const counter = setInterval(() => {
        current += step;
        if (current >= score) {
          current = score;
          clearInterval(counter);
        }
        scoreValEl.textContent = current;
      }, 30);
    }

    // Readiness badge
    const badge = document.getElementById('readinessBadge');
    if (badge) {
      const label = assessment.readinessLabel || formatLevel(assessment.readinessLevel);
      badge.textContent = label;
      badge.className = 'readiness-badge ' + (score >= 70 ? 'level-high' : (score >= 40 ? 'level-moderate' : 'level-low'));
    }

    // Readiness description / disclaimer
    const descEl = document.getElementById('readinessDesc');
    if (descEl) {
      descEl.textContent = assessment.disclaimer || 'Assessment calculated by FarmerChoice deterministic scoring engine based on verified farm practices, crop diversity, and documented evidence.';
    }

    // Score breakdown (from backend category scores)
    const breakdownEl = document.getElementById('scoreBreakdown');
    if (breakdownEl && assessment.categories) {
      breakdownEl.innerHTML = '';
      const catLabels = {
        farmingPractices: 'Farming Practices',
        soilManagement: 'Soil Management',
        irrigation: 'Irrigation Efficiency',
        cropHistory: 'Crop Management',
        documentation: 'Documentation Records',
        evidenceQuality: 'Evidence Quality',
      };

      Object.entries(assessment.categories).forEach(([key, val]) => {
        const catScore = Math.round(val);
        let barColor = '#2e7d32';
        if (catScore < 40) barColor = '#dc2626';
        else if (catScore < 65) barColor = '#d97706';

        const item = document.createElement('div');
        item.className = 'breakdown-item';
        item.innerHTML = `
          <div class="breakdown-label">${catLabels[key] || key}</div>
          <div class="breakdown-bar"><div class="breakdown-bar-fill" style="width:0%;background:${barColor}"></div></div>
          <div class="breakdown-score">${catScore} / 100</div>
        `;
        breakdownEl.appendChild(item);

        setTimeout(() => {
          const fill = item.querySelector('.breakdown-bar-fill');
          if (fill) fill.style.width = catScore + '%';
        }, 300);
      });
    }

    // Farm Dashboard population (Real Farm Practices from PostgreSQL)
    const activeFarm = farm || assessment.farm || currentFarm;
    if (activeFarm) {
      const dashFarmName = document.getElementById('dashFarmName');
      if (dashFarmName) dashFarmName.textContent = activeFarm.name || 'Your Farm';

      const dashFertManagement = document.getElementById('dashFertilizerManagement');
      if (dashFertManagement) {
        let catText = '—';
        if (activeFarm.fertilizerCategory) {
          catText = formatFertilizerCategory(activeFarm.fertilizerCategory);
        } else if (activeFarm.fertilizerUsage) {
          catText = activeFarm.fertilizerUsage;
        }
        dashFertManagement.textContent = catText;
      }

      const dashOrgBox = document.getElementById('dashOrganicTypeBox');
      const dashOrgVal = document.getElementById('dashOrganicFertilizer');
      if (dashOrgBox && dashOrgVal) {
        if (activeFarm.organicFertilizerType) {
          dashOrgBox.style.display = 'block';
          dashOrgVal.textContent = formatOrganicFertilizerType(activeFarm.organicFertilizerType);
        } else {
          dashOrgBox.style.display = 'none';
        }
      }

      const dashTillage = document.getElementById('dashTillage');
      if (dashTillage) dashTillage.textContent = activeFarm.tillageMethod || '—';

      const dashResidue = document.getElementById('dashResidue');
      if (dashResidue) dashResidue.textContent = activeFarm.residueManagement || '—';

      const dashIrrigation = document.getElementById('dashIrrigation');
      if (dashIrrigation) dashIrrigation.textContent = activeFarm.irrigationMethod || '—';

      // Sync Quick Practice Updater select elements
      const quickCat = document.getElementById('quickFertCategory');
      const quickOrg = document.getElementById('quickOrganicType');
      if (quickCat) {
        quickCat.value = activeFarm.fertilizerCategory || 'ORGANIC';
        if (quickOrg) {
          quickOrg.style.display = quickCat.value === 'ORGANIC' ? 'inline-block' : 'none';
          if (activeFarm.organicFertilizerType) {
            quickOrg.value = activeFarm.organicFertilizerType;
          }
        }
      }
    }

    // Strengths
    populateList('strengthsList', assessment.strengths?.length > 0 ? assessment.strengths : ['Farm data documented in the FarmerChoice registry.']);

    // Gaps
    populateList('gapsList', assessment.gaps?.length > 0 ? assessment.gaps : ['No critical practices penalized in the assessment.']);

    // Improvements / Factors
    const improvements = assessment.factors?.length > 0 ? assessment.factors : ['Continue maintaining sustainable soil and input records.'];
    populateList('improvementsList', improvements);

    // Recommendations (Interactive toggles linked to PATCH /api/assessments/recommendations/:id/toggle)
    const stepsList = document.getElementById('nextStepsList');
    if (stepsList) {
      stepsList.innerHTML = '';
      if (assessment.recommendations && assessment.recommendations.length > 0) {
        assessment.recommendations.forEach(rec => {
          const li = document.createElement('li');
          li.className = `rec-item ${rec.completed ? 'completed' : ''}`;
          li.innerHTML = `
            <input type="checkbox" class="rec-checkbox" ${rec.completed ? 'checked' : ''} data-rec-id="${rec.id}">
            <div class="rec-text">${escapeHtml(rec.message)}</div>
            <span class="rec-priority ${rec.priority}">${rec.priority}</span>
          `;

          const cb = li.querySelector('.rec-checkbox');
          cb.addEventListener('change', async () => {
            try {
              const updated = await api.assessments.toggleRecommendation(rec.id);
              rec.completed = updated.completed;
              li.classList.toggle('completed', updated.completed);
              showToast(updated.completed ? 'Recommendation marked as completed!' : 'Recommendation marked as pending.');
            } catch (err) {
              cb.checked = !cb.checked;
              showToast(err.message || 'Failed to update recommendation status.', 'error');
            }
          });

          stepsList.appendChild(li);
        });
      } else {
        const li = document.createElement('li');
        li.textContent = 'Upload supporting documentation (soil test reports, land papers) to increase evidence score.';
        stepsList.appendChild(li);
      }
    }
  }

  function formatLevel(lvl) {
    if (!lvl) return 'Needs Improvement';
    return lvl.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, c => c.toUpperCase());
  }

  function populateList(id, items) {
    const ul = document.getElementById(id);
    if (!ul) return;
    ul.innerHTML = '';
    items.forEach(text => {
      const li = document.createElement('li');
      li.textContent = text;
      ul.appendChild(li);
    });
  }

  function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  function formatFertilizerCategory(cat) {
    if (!cat) return '—';
    if (cat === 'ORGANIC') return 'Organic';
    if (cat === 'SYNTHETIC') return 'Synthetic';
    if (cat === 'INTEGRATED') return 'Integrated';
    return cat.replace(/_/g, ' ');
  }

  function formatOrganicFertilizerType(type) {
    if (!type) return '—';
    const names = {
      COMPOST: 'Compost',
      FARMYARD_MANURE: 'Farmyard Manure (FYM)',
      VERMICOMPOST: 'Vermicompost',
      BIOFERTILIZER: 'Biofertilizer',
      GREEN_MANURE: 'Green Manure',
      OTHER: 'Other Organic Fertilizer',
    };
    return names[type] || type.replace(/_/g, ' ');
  }

  // ---------- ASSESSMENT HISTORY ----------
  async function loadAssessmentHistory(farmId) {
    const historyList = document.getElementById('historyList');
    if (!historyList || !farmId) return;

    try {
      const assessments = await api.assessments.getFarmAssessments(farmId);
      if (!assessments || assessments.length === 0) {
        historyList.innerHTML = `<p style="color: var(--gray-500); font-size: 0.9rem;">No historical assessment versions recorded for this farm.</p>`;
        return;
      }

      historyList.innerHTML = '';
      assessments.forEach((ass, index) => {
        const dateStr = new Date(ass.createdAt).toLocaleDateString('en-IN', {
          day: 'numeric',
          month: 'short',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        });
        const isLatest = index === 0;

        const card = document.createElement('div');
        card.className = 'history-card';
        card.innerHTML = `
          <div>
            <div style="font-weight: 700; color: var(--gray-900);">
              Assessment #${assessments.length - index} ${isLatest ? '<span class="status-tag verified" style="margin-left: 8px;">Latest</span>' : ''}
            </div>
            <div style="font-size: 0.8rem; color: var(--gray-500); margin-top: 2px;">${dateStr}</div>
          </div>
          <div style="display: flex; align-items: center; gap: 16px;">
            <span class="status-tag ${ass.overallScore >= 70 ? 'verified' : (ass.overallScore >= 40 ? 'review' : 'missing')}">
              ${ass.readinessLabel || ass.readinessLevel}
            </span>
            <div class="history-score">${ass.overallScore}<span style="font-size: 0.8rem; font-weight: normal; color: var(--gray-500);">/100</span></div>
            <button class="btn btn-sm btn-outline view-hist-btn" type="button" data-hist-id="${ass.id}">View</button>
          </div>
        `;

        card.querySelector('.view-hist-btn').addEventListener('click', async () => {
          try {
            const detail = await api.assessments.getAssessment(ass.id);
            currentAssessment = detail;
            renderResults(detail, currentFarm);
            showToast(`Loaded assessment version #${assessments.length - index}`);
          } catch (e) {
            showToast('Failed to load assessment details', 'error');
          }
        });

        historyList.appendChild(card);
      });
    } catch (err) {
      console.warn('Failed to load assessment history', err);
    }
  }

  // ---------- RECALCULATE ASSESSMENT ----------
  const recalcBtn = document.getElementById('recalcAssessmentBtn');
  if (recalcBtn) {
    recalcBtn.addEventListener('click', async () => {
      if (!currentAssessment?.id) {
        showToast('No active assessment available to recalculate.', 'error');
        return;
      }

      try {
        recalcBtn.disabled = true;
        recalcBtn.textContent = 'Recalculating...';
        showToast('Recalculating assessment with latest farm data...', 'info');

        const newAssessment = await api.assessments.recalculate(currentAssessment.id);
        currentAssessment = newAssessment;
        if (newAssessment.farm) {
          currentFarm = newAssessment.farm;
        } else if (currentFarm?.id) {
          try {
            currentFarm = await api.farms.getFarm(currentFarm.id);
          } catch (e) {}
        }
        renderResults(newAssessment, currentFarm);
        if (currentFarm?.id) {
          loadAssessmentHistory(currentFarm.id);
        }
        showToast('Assessment recalculated and new version created!', 'success');
      } catch (err) {
        showToast(err.message || 'Recalculation failed.', 'error');
      } finally {
        recalcBtn.disabled = false;
        recalcBtn.textContent = '🔄 Recalculate Assessment';
      }
    });
  }

  // ---------- FERTILIZER MANAGEMENT HANDLERS ----------
  const fertCatInput = document.getElementById('fertilizerCategory');
  const orgTypeCont = document.getElementById('organicTypeContainer');
  const orgTypeInput = document.getElementById('organicFertilizerType');

  if (fertCatInput && orgTypeCont) {
    fertCatInput.addEventListener('change', () => {
      if (fertCatInput.value === 'ORGANIC') {
        orgTypeCont.style.display = 'block';
      } else {
        orgTypeCont.style.display = 'none';
        if (orgTypeInput) orgTypeInput.value = '';
      }
    });
  }

  const quickCatSelect = document.getElementById('quickFertCategory');
  const quickOrgSelect = document.getElementById('quickOrganicType');
  const updatePracticeBtn = document.getElementById('updatePracticeBtn');

  if (quickCatSelect && quickOrgSelect) {
    quickCatSelect.addEventListener('change', () => {
      quickOrgSelect.style.display = quickCatSelect.value === 'ORGANIC' ? 'inline-block' : 'none';
    });
  }

  if (updatePracticeBtn) {
    updatePracticeBtn.addEventListener('click', async () => {
      if (!currentFarm?.id) {
        showToast('No active farm found to update.', 'error');
        return;
      }
      if (!currentAssessment?.id) {
        showToast('No active assessment found to recalculate.', 'error');
        return;
      }

      try {
        updatePracticeBtn.disabled = true;
        updatePracticeBtn.textContent = 'Updating...';

        const category = quickCatSelect.value;
        const organicType = category === 'ORGANIC' ? quickOrgSelect.value : null;

        // 1. Update farm practice in PostgreSQL via PUT /api/farms/:id
        const updatedFarm = await api.farms.updateFarm(currentFarm.id, {
          fertilizerCategory: category,
          organicFertilizerType: organicType,
        });
        currentFarm = updatedFarm;

        showToast(`Farm practice updated to ${formatFertilizerCategory(category)}. Recalculating assessment...`, 'info');

        // 2. Recalculate assessment via POST /api/assessments/:id/recalculate
        const newAssessment = await api.assessments.recalculate(currentAssessment.id);
        currentAssessment = newAssessment;

        // 3. Render new assessment results and update history timeline
        renderResults(newAssessment, updatedFarm);
        loadAssessmentHistory(currentFarm.id);

        showToast('Assessment successfully recalculated and persisted!', 'success');
      } catch (err) {
        console.error('Failed to update practice and recalculate:', err);
        showToast(err.message || 'Failed to update practice.', 'error');
      } finally {
        updatePracticeBtn.disabled = false;
        updatePracticeBtn.textContent = 'Update & Recalculate';
      }
    });
  }

  // ---------- EVIDENCE & DOCUMENT MANAGEMENT ----------
  const manageEvidenceBtn = document.getElementById('manageEvidenceBtn');
  if (manageEvidenceBtn) {
    manageEvidenceBtn.addEventListener('click', () => {
      if (!currentFarm?.id) {
        showToast('Please submit an assessment to create a farm first.', 'error');
        return;
      }
      openDocsModal();
    });
  }

  function openDocsModal() {
    if (!docsModal) return;
    docsModal.style.display = 'flex';
    loadEvidenceSummary();
  }

  function closeDocsModal() {
    if (!docsModal) return;
    docsModal.style.display = 'none';
  }

  if (closeDocsModalBtn) {
    closeDocsModalBtn.addEventListener('click', closeDocsModal);
  }

  if (docsModal) {
    docsModal.addEventListener('click', e => {
      if (e.target === docsModal) closeDocsModal();
    });
  }

  async function loadEvidenceSummary() {
    if (!currentFarm?.id) return;
    try {
      const summary = await api.documents.getEvidenceSummary(currentFarm.id);
      const docs = await api.documents.getFarmDocuments(currentFarm.id);

      const statExpected = document.getElementById('statExpected');
      const statUploaded = document.getElementById('statUploaded');
      const statVerified = document.getElementById('statVerified');
      const statQuality = document.getElementById('statQuality');

      if (statExpected) statExpected.textContent = summary.totalExpected || 5;
      if (statUploaded) statUploaded.textContent = summary.totalUploaded || 0;
      if (statVerified) statVerified.textContent = summary.verifiedCount || 0;
      if (statQuality) statQuality.textContent = (summary.qualityScore || 0) + '%';

      const tbody = document.getElementById('docsTableBody');
      if (tbody) {
        if (!docs || docs.length === 0) {
          tbody.innerHTML = `<tr><td colspan="3" style="text-align: center; color: var(--gray-500);">No documents uploaded yet for this farm.</td></tr>`;
          return;
        }

        tbody.innerHTML = '';
        docs.forEach(doc => {
          const tr = document.createElement('tr');
          const isVerified = doc.status === 'VERIFIED';
          const isReview = doc.status === 'REVIEW_REQUIRED';
          const badgeClass = isVerified ? 'verified' : (isReview ? 'review' : 'missing');

          tr.innerHTML = `
            <td><strong>${doc.type.replace(/_/g, ' ')}</strong></td>
            <td><span class="status-tag ${badgeClass}">${doc.status}</span></td>
            <td>${escapeHtml(doc.filename)}</td>
          `;
          tbody.appendChild(tr);
        });
      }
    } catch (err) {
      console.warn('Failed to load evidence summary', err);
    }
  }

  // Upload document submit
  const uploadDocForm = document.getElementById('uploadDocForm');
  if (uploadDocForm) {
    uploadDocForm.addEventListener('submit', async e => {
      e.preventDefault();
      if (!currentFarm?.id) {
        showToast('Please submit an assessment first.', 'error');
        return;
      }

      const typeSelect = document.getElementById('docTypeSelect');
      const fileInput = document.getElementById('docFileInput');
      const submitBtn = document.getElementById('uploadSubmitBtn');

      if (!fileInput.files || fileInput.files.length === 0) {
        showToast('Please select a file to upload.', 'error');
        return;
      }

      const file = fileInput.files[0];
      const type = typeSelect.value;

      try {
        submitBtn.disabled = true;
        submitBtn.textContent = 'Uploading...';
        await api.documents.uploadDocument(currentFarm.id, type, file);
        showToast('Evidence document uploaded successfully! Status: REVIEW_REQUIRED', 'success');
        fileInput.value = '';
        await loadEvidenceSummary();
      } catch (err) {
        showToast(err.message || 'Document upload failed.', 'error');
      } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Upload Evidence';
      }
    });
  }

  // ---------- ADMIN DASHBOARD ----------
  async function loadAdminDashboard() {
    try {
      const [dash, stats, farmers] = await Promise.all([
        api.admin.getDashboard(),
        api.admin.getStatistics(),
        api.admin.getFarmers(),
      ]);

      const fEl = document.getElementById('adminTotalFarmers');
      const farmsEl = document.getElementById('adminTotalFarms');
      const assEl = document.getElementById('adminTotalAssessments');
      const scoreEl = document.getElementById('adminAvgScore');

      if (fEl) fEl.textContent = dash.overview?.totalFarmers ?? dash.totalFarmers ?? 0;
      if (farmsEl) farmsEl.textContent = dash.overview?.totalFarms ?? dash.totalFarms ?? 0;
      if (assEl) assEl.textContent = dash.overview?.totalAssessments ?? dash.totalAssessments ?? 0;
      if (scoreEl) scoreEl.textContent = dash.overview?.averageReadinessScore ?? dash.averageReadinessScore ?? 0;

      // Readiness distribution
      const distEl = document.getElementById('adminReadinessDist');
      const dist = stats.readinessDistribution || dash.readinessDistribution;
      if (distEl && dist) {
        distEl.innerHTML = '';
        const highCount = dist.high || dist.highReadiness || 0;
        const modCount = dist.moderate || dist.moderateReadiness || 0;
        const lowCount = dist.needsImprovement || 0;
        const total = highCount + modCount + lowCount || 1;

        const tiers = [
          { label: 'High Readiness (70+)', count: highCount, color: '#2e7d32' },
          { label: 'Moderate Readiness (40-69)', count: modCount, color: '#d97706' },
          { label: 'Needs Improvement (<40)', count: lowCount, color: '#dc2626' },
        ];

        tiers.forEach(t => {
          const pct = Math.round((t.count / total) * 100);
          const div = document.createElement('div');
          div.style.marginBottom = '12px';
          div.innerHTML = `
            <div style="display: flex; justify-content: space-between; font-size: 0.85rem; margin-bottom: 4px;">
              <span>${t.label}</span>
              <strong>${t.count} (${pct}%)</strong>
            </div>
            <div class="breakdown-bar"><div class="breakdown-bar-fill" style="width:${pct}%;background:${t.color}"></div></div>
          `;
          distEl.appendChild(div);
        });
      }

      // Top Gaps
      const gapsEl = document.getElementById('adminTopGaps');
      const commonGaps = stats.topGaps || dash.mostCommonGaps;
      if (gapsEl && commonGaps) {
        gapsEl.innerHTML = '';
        if (commonGaps.length === 0) {
          gapsEl.innerHTML = '<li>No persistent gaps detected across assessments.</li>';
        } else {
          commonGaps.forEach(g => {
            const gapName = g.gap;
            const count = g.count || g.occurrences || 1;
            const li = document.createElement('li');
            li.textContent = `${gapName} (${count} farms)`;
            gapsEl.appendChild(li);
          });
        }
      }

      // Farmers table
      const fBody = document.getElementById('adminFarmersTableBody');
      const farmerList = Array.isArray(farmers) ? farmers : (farmers?.farmers || []);
      if (fBody) {
        if (!farmerList || farmerList.length === 0) {
          fBody.innerHTML = `<tr><td colspan="5" style="text-align: center; color: var(--gray-500);">No registered farmers.</td></tr>`;
          return;
        }

        fBody.innerHTML = '';
        farmerList.forEach(f => {
          const tr = document.createElement('tr');
          const dateStr = new Date(f.createdAt).toLocaleDateString();
          tr.innerHTML = `
            <td><strong>${escapeHtml(f.name)}</strong></td>
            <td>${escapeHtml(f.phone || f.user?.email || 'N/A')}</td>
            <td>${escapeHtml(f.state)}, ${escapeHtml(f.district)}</td>
            <td>${f._count?.farms || f.farms?.length || 0}</td>
            <td>${dateStr}</td>
          `;
          fBody.appendChild(tr);
        });
      }
    } catch (err) {
      console.warn('Failed to load admin dashboard:', err);
    }
  }

  // ---------- PRINT & RETAKE ACTIONS ----------
  const printBtn = document.getElementById('printReport');
  if (printBtn) {
    printBtn.addEventListener('click', () => {
      window.print();
    });
  }

  const retakeBtn = document.getElementById('retakeAssessment');
  if (retakeBtn) {
    retakeBtn.addEventListener('click', () => {
      if (form) form.reset();
      currentStep = 1;
      updateFormUI();
      showSection('assessment');

      const arc = document.getElementById('scoreArc');
      if (arc) {
        arc.style.transition = 'none';
        arc.setAttribute('stroke-dashoffset', '440');
      }
      const scoreVal = document.getElementById('scoreValue');
      if (scoreVal) scoreVal.textContent = '0';
    });
  }

  // ---------- INITIAL STATE ----------
  updateFormUI();
  updateAuthUI();
})();
