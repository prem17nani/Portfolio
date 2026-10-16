/**
 * SELENIX BUSINESS SOLUTIONS - CLIENT-SIDE APPLICATION
 * Privacy-First Architecture: 100% Cookieless
 * Zero document.cookie reads/writes.
 */

(function () {
  'use strict';

  // Application In-Memory State (strictly zero cookie storage)
  const AppState = {
    selectedService: 'Accounting & Bookkeeping',
    selectedDay: null,
    selectedSlot: '10:00 AM EST',
    inquiryData: null
  };

  /* ============================================================
     1. BRANDED LOADER / SPLASH SCREEN
  ============================================================ */
  function initLoader() {
    const loader = document.getElementById('app-loader');
    const fill = document.getElementById('loader-progress-fill');
    const statusText = document.getElementById('loader-status-text');

    if (!loader) return;

    let progress = 0;
    const interval = setInterval(() => {
      progress += Math.floor(Math.random() * 18) + 12;
      if (progress > 100) progress = 100;

      if (fill) fill.style.width = progress + '%';
      if (statusText) statusText.textContent = `INITIALIZING ENGINES [${progress}%]`;

      if (progress >= 100) {
        clearInterval(interval);
        setTimeout(() => {
          loader.classList.add('loaded');
          // Announcement for screen readers
          const liveRegion = document.getElementById('a11y-announcer');
          if (liveRegion) liveRegion.textContent = 'Selenix platform ready.';
        }, 400);
      }
    }, 60);
  }

  // Allow replaying loader for user evaluation
  window.replayLoader = function () {
    const loader = document.getElementById('app-loader');
    if (!loader) return;
    loader.classList.remove('loaded');
    initLoader();
  };



  /* ============================================================
     3. ACCESSIBLE TAB COMPONENT (DUAL-ENGINE MATRIX)
  ============================================================ */
  function initTabs() {
    const tabList = document.querySelector('[role="tablist"]');
    if (!tabList) return;

    const tabs = tabList.querySelectorAll('[role="tab"]');
    const panels = document.querySelectorAll('[role="tabpanel"]');

    function activateTab(tab) {
      tabs.forEach((t) => {
        t.setAttribute('aria-selected', 'false');
        t.setAttribute('tabindex', '-1');
      });

      panels.forEach((p) => {
        p.classList.remove('active');
      });

      tab.setAttribute('aria-selected', 'true');
      tab.removeAttribute('tabindex');
      tab.focus();

      const targetId = tab.getAttribute('aria-controls');
      const targetPanel = document.getElementById(targetId);
      if (targetPanel) {
        targetPanel.classList.add('active');
      }
    }

    tabs.forEach((tab, index) => {
      tab.addEventListener('click', () => {
        activateTab(tab);
      });

      // Keyboard navigation
      tab.addEventListener('keydown', (e) => {
        let newIndex = null;
        if (e.key === 'ArrowRight') {
          newIndex = (index + 1) % tabs.length;
        } else if (e.key === 'ArrowLeft') {
          newIndex = (index - 1 + tabs.length) % tabs.length;
        } else if (e.key === 'Home') {
          newIndex = 0;
        } else if (e.key === 'End') {
          newIndex = tabs.length - 1;
        }

        if (newIndex !== null) {
          e.preventDefault();
          activateTab(tabs[newIndex]);
        }
      });
    });
  }

  /* ============================================================
     4. CALENDAR TIME SLOT PICKER
  ============================================================ */
  function initSlotPicker() {
    const daySelector = document.getElementById('day-selector');
    const timeSlotsGrid = document.getElementById('time-slots-grid');
    if (!daySelector || !timeSlotsGrid) return;

    // Generate upcoming 5 business days
    const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    
    let currentDate = new Date();
    // Default to tomorrow or next weekday
    currentDate.setDate(currentDate.getDate() + 1);
    
    const businessDays = [];
    while (businessDays.length < 5) {
      const day = currentDate.getDay();
      if (day !== 0 && day !== 6) { // Skip weekends
        businessDays.push(new Date(currentDate));
      }
      currentDate.setDate(currentDate.getDate() + 1);
    }

    daySelector.innerHTML = '';
    businessDays.forEach((date, idx) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = `day-btn ${idx === 0 ? 'active' : ''}`;
      btn.setAttribute('data-date-str', `${months[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`);
      btn.innerHTML = `
        <span class="day-name">${daysOfWeek[date.getDay()]}</span>
        <span class="day-date">${date.getDate()}</span>
      `;

      btn.addEventListener('click', () => {
        daySelector.querySelectorAll('.day-btn').forEach((b) => b.classList.remove('active'));
        btn.classList.add('active');
        AppState.selectedDay = btn.getAttribute('data-date-str');
        updateSlotSummary();
      });

      daySelector.appendChild(btn);
    });

    // Default first day
    if (businessDays.length > 0) {
      AppState.selectedDay = `${months[businessDays[0].getMonth()]} ${businessDays[0].getDate()}, ${businessDays[0].getFullYear()}`;
    }

    // Time slot click handling
    const slotBtns = timeSlotsGrid.querySelectorAll('.slot-btn');
    slotBtns.forEach((btn) => {
      btn.addEventListener('click', () => {
        slotBtns.forEach((b) => b.classList.remove('active'));
        btn.classList.add('active');
        AppState.selectedSlot = btn.getAttribute('data-time') || btn.textContent.trim();
        updateSlotSummary();
      });
    });

    updateSlotSummary();
  }

  function updateSlotSummary() {
    const summarySpan = document.getElementById('selected-schedule-summary');
    if (summarySpan && AppState.selectedDay && AppState.selectedSlot) {
      summarySpan.textContent = `${AppState.selectedDay} at ${AppState.selectedSlot}`;
    }
  }

  /* ============================================================
     5. SERVICE PRE-POPULATION TRIGGERS
  ============================================================ */
  function initServicePreSelectors() {
    const triggers = document.querySelectorAll('[data-select-service]');
    const serviceSelect = document.getElementById('service-dropdown');
    const summaryCallout = document.getElementById('live-summary-service');

    triggers.forEach((trigger) => {
      trigger.addEventListener('click', (e) => {
        const serviceName = trigger.getAttribute('data-select-service');
        if (serviceSelect && serviceName) {
          serviceSelect.value = serviceName;
          AppState.selectedService = serviceName;
          if (summaryCallout) {
            summaryCallout.textContent = serviceName;
          }
        }
      });
    });

    if (serviceSelect) {
      serviceSelect.addEventListener('change', () => {
        AppState.selectedService = serviceSelect.value;
        if (summaryCallout) {
          summaryCallout.textContent = serviceSelect.value;
        }
      });
    }
  }

  /* ============================================================
     6. ACCESSIBLE FORM VALIDATION & CONFIRMATION VOUCHER
  ============================================================ */
  function initFormValidation() {
    const form = document.getElementById('consultation-form');
    if (!form) return;

    const fields = [
      {
        id: 'user-name',
        validate: (val) => val.trim().length >= 2,
        errorMsg: 'Please enter your full legal or representative name.'
      },
      {
        id: 'user-email',
        validate: (val) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val.trim()),
        errorMsg: 'Please provide a valid corporate email address.'
      },
      {
        id: 'user-phone',
        validate: (val) => val.trim().replace(/[^0-9]/g, '').length >= 7,
        errorMsg: 'Please enter a valid telephone contact number.'
      },
      {
        id: 'user-company',
        validate: (val) => val.trim().length >= 2,
        errorMsg: 'Please enter your company or registered entity name.'
      },
      {
        id: 'service-dropdown',
        validate: (val) => val !== '',
        errorMsg: 'Please select your primary service requirement.'
      }
    ];

    function validateField(fieldConfig) {
      const el = document.getElementById(fieldConfig.id);
      if (!el) return true;

      const group = el.closest('.form-group');
      const errorEl = group ? group.querySelector('.form-error') : null;
      const isValid = fieldConfig.validate(el.value);

      if (!isValid) {
        el.classList.add('is-invalid');
        el.setAttribute('aria-invalid', 'true');
        if (group) group.classList.add('has-error');
        if (errorEl) errorEl.textContent = fieldConfig.errorMsg;
        return false;
      } else {
        el.classList.remove('is-invalid');
        el.removeAttribute('aria-invalid');
        if (group) group.classList.remove('has-error');
        return true;
      }
    }

    // Real-time blur validation
    fields.forEach((fieldConfig) => {
      const el = document.getElementById(fieldConfig.id);
      if (el) {
        el.addEventListener('blur', () => validateField(fieldConfig));
        el.addEventListener('input', () => {
          if (el.classList.contains('is-invalid')) {
            validateField(fieldConfig);
          }
        });
      }
    });

    // Form Submission
    form.addEventListener('submit', (e) => {
      e.preventDefault();

      let formIsValid = true;
      let firstInvalidEl = null;

      fields.forEach((fieldConfig) => {
        const isFieldValid = validateField(fieldConfig);
        if (!isFieldValid) {
          formIsValid = false;
          if (!firstInvalidEl) {
            firstInvalidEl = document.getElementById(fieldConfig.id);
          }
        }
      });

      if (!formIsValid) {
        if (firstInvalidEl) firstInvalidEl.focus();
        return;
      }

      // Collect data into memory
      const name = document.getElementById('user-name').value.trim();
      const email = document.getElementById('user-email').value.trim();
      const phone = document.getElementById('user-phone').value.trim();
      const company = document.getElementById('user-company').value.trim();
      const service = document.getElementById('service-dropdown').value;
      const timelineRadio = form.querySelector('input[name="timeline"]:checked');
      const timeline = timelineRadio ? timelineRadio.value : 'Immediate';
      const notes = document.getElementById('user-notes') ? document.getElementById('user-notes').value.trim() : '';

      const meetingId = 'SLX-' + Math.floor(100000 + Math.random() * 900000);

      AppState.inquiryData = {
        meetingId,
        name,
        email,
        phone,
        company,
        service,
        timeline,
        notes,
        date: AppState.selectedDay,
        slot: AppState.selectedSlot
      };

      // Show submitting state
      const submitBtn = document.getElementById('submit-btn');
      const originalText = submitBtn.innerHTML;
      submitBtn.innerHTML = `
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" class="spin-icon"><path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/></svg>
        Securing Advisory Slot...
      `;
      submitBtn.disabled = true;

      setTimeout(() => {
        // Hide form and render confirmation voucher
        form.style.display = 'none';
        const voucher = document.getElementById('booking-voucher');
        if (voucher) {
          document.getElementById('voucher-ref').textContent = meetingId;
          document.getElementById('voucher-name').textContent = name;
          document.getElementById('voucher-company').textContent = company;
          document.getElementById('voucher-service').textContent = service;
          document.getElementById('voucher-schedule').textContent = `${AppState.selectedDay} @ ${AppState.selectedSlot}`;
          
          voucher.style.display = 'block';
          voucher.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 900);
    });
  }

  /* ============================================================
     7. RFC-5545 CALENDAR INVITE GENERATOR (IN-MEMORY ICS)
  ============================================================ */
  function initCalendarDownload() {
    const downloadBtn = document.getElementById('download-ics-btn');
    if (!downloadBtn) return;

    downloadBtn.addEventListener('click', () => {
      const data = AppState.inquiryData;
      if (!data) return;

      const title = `Selenix Advisory Consultation: ${data.service}`;
      const description = `Strategic consultation between ${data.name} (${data.company}) and Selenix Group Senior Advisors. Reference ID: ${data.meetingId}. Focus: ${data.service}. Zero-penalty compliance and digital enablement review.`;
      const location = `Selenix Executive Secure Video Portal (Link transmitted to ${data.email})`;

      // Create iCal blob
      const icsContent = [
        'BEGIN:VCALENDAR',
        'VERSION:2.0',
        'PRODID:-//Selenix Group//Business Enablement Advisory//EN',
        'CALSCALE:GREGORIAN',
        'METHOD:REQUEST',
        'BEGIN:VEVENT',
        `UID:${data.meetingId}@selenixgroup.com`,
        `DTSTAMP:${new Date().toISOString().replace(/[-:]/g, '').split('.')[0]}Z`,
        `SUMMARY:${title}`,
        `DESCRIPTION:${description}`,
        `LOCATION:${location}`,
        'STATUS:CONFIRMED',
        'END:VEVENT',
        'END:VCALENDAR'
      ].join('\r\n');

      const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `selenix-advisory-${data.meetingId}.ics`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    });
  }

  /* ============================================================
     8. MOBILE DRAWER NAVIGATION
  ============================================================ */
  function initMobileMenu() {
    const toggle = document.querySelector('.mobile-toggle');
    const drawer = document.querySelector('.mobile-drawer');
    const overlay = document.querySelector('.mobile-drawer-overlay');
    const closeBtn = document.querySelector('.drawer-close-btn');
    const drawerLinks = document.querySelectorAll('.drawer-nav-link');

    if (!toggle || !drawer || !overlay) return;

    function openMenu() {
      drawer.classList.add('open');
      overlay.classList.add('open');
      document.body.style.overflow = 'hidden';
      if (closeBtn) closeBtn.focus();
    }

    function closeMenu() {
      drawer.classList.remove('open');
      overlay.classList.remove('open');
      document.body.style.overflow = '';
      toggle.focus();
    }

    toggle.addEventListener('click', openMenu);
    if (closeBtn) closeBtn.addEventListener('click', closeMenu);
    overlay.addEventListener('click', closeMenu);

    drawerLinks.forEach((link) => {
      link.addEventListener('click', () => {
        closeMenu();
      });
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && drawer.classList.contains('open')) {
        closeMenu();
      }
    });
  }

  /* ============================================================
     9. SMOOTH SCROLL WITH STICKY NAVBAR OFFSET
  ============================================================ */
  function initSmoothScroll() {
    document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
      anchor.addEventListener('click', function (e) {
        const targetId = this.getAttribute('href');
        if (targetId === '#' || targetId === '') return;

        const targetEl = document.querySelector(targetId);
        if (!targetEl) return;

        e.preventDefault();
        const navHeight = 85;
        const targetPos = targetEl.getBoundingClientRect().top + window.pageYOffset - navHeight;

        window.scrollTo({
          top: targetPos,
          behavior: 'smooth'
        });

        // Set focus to heading for accessibility
        targetEl.setAttribute('tabindex', '-1');
        targetEl.focus({ preventScroll: true });
      });
    });
  }

  /* ============================================================
     9. INITIALIZATION
  ============================================================ */
  document.addEventListener('DOMContentLoaded', () => {
    initLoader();
    initTabs();
    initSlotPicker();
    initServicePreSelectors();
    initFormValidation();
    initCalendarDownload();
    initMobileMenu();
    initSmoothScroll();
  });
})();
