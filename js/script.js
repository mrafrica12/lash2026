/* ============================================================
   LASH LAIR — Production Script
   ============================================================ */

(function () {
  'use strict';

  /* ============================================================
     CONFIGURATION — update these values before going live
     ============================================================ */
  var CONFIG = {
    /* Paste your deployed Google Apps Script Web App URL here before launch. */
    SHEETS_URL: '',

    /* WhatsApp number in international format, no + or spaces. */
    WHATSAPP_NUMBER: '16784380539',

    /* Set to false to disable WhatsApp prompt entirely */
    WHATSAPP_ENABLED: true,

    /* Studio name used in WhatsApp message */
    STUDIO_NAME: 'Lash Lair'
  };

  /* ============================================================
     DISPOSABLE EMAIL DOMAINS — block known throwaway services
     ============================================================ */
  var DISPOSABLE_DOMAINS = [
    'mailinator.com', 'guerrillamail.com', 'tempmail.com', 'throwam.com',
    'yopmail.com', 'sharklasers.com', 'guerrillamailblock.com',
    'grr.la', 'guerrillamail.info', 'spam4.me', 'trashmail.com',
    'trashmail.me', 'trashmail.net', 'dispostable.com', 'maildrop.cc',
    'fakeinbox.com', 'mailnull.com', 'spamgourmet.com', 'mytemp.email',
    'temp-mail.org', 'tempinbox.com', '10minutemail.com', 'tempr.email'
  ];

  /* ============================================================
     UTILITY: Generate booking ID — format LL-YYMMDD-XXXX
     ============================================================ */
  function generateBookingId() {
    var now = new Date();
    var yy  = String(now.getFullYear()).slice(2);
    var mm  = String(now.getMonth() + 1).padStart(2, '0');
    var dd  = String(now.getDate()).padStart(2, '0');
    var chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // no ambiguous O/0/I/1
    var rand = '';
    for (var i = 0; i < 4; i++) {
      rand += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return 'LL-' + yy + mm + dd + '-' + rand;
  }

  /* ============================================================
     UTILITY: Reduced motion preference
     ============================================================ */
  var prefersReducedMotion = window.matchMedia &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ============================================================
     NAVIGATION: Scroll state
     ============================================================ */
  var nav = document.getElementById('nav');

  function updateNav() {
    if (!nav) return;
    nav.classList.toggle('scrolled', window.scrollY > 55);
  }
  window.addEventListener('scroll', updateNav, { passive: true });
  updateNav();

  /* ============================================================
     NAVIGATION: Mobile menu toggle + Escape key
     ============================================================ */
  var navToggle = document.getElementById('navToggle');
  var navLinks  = document.getElementById('navLinks');

  function closeMenu() {
    if (!navLinks || !navToggle) return;
    navLinks.classList.remove('open');
    navToggle.setAttribute('aria-expanded', 'false');
    navToggle.setAttribute('aria-label', 'Open navigation menu');
    document.body.style.overflow = '';
  }

  if (navToggle && navLinks) {
    navToggle.addEventListener('click', function () {
      var isOpen = navLinks.classList.toggle('open');
      navToggle.setAttribute('aria-expanded', String(isOpen));
      navToggle.setAttribute('aria-label', isOpen ? 'Close navigation menu' : 'Open navigation menu');
      document.body.style.overflow = isOpen ? 'hidden' : '';
    });

    navLinks.querySelectorAll('a').forEach(function (link) {
      link.addEventListener('click', closeMenu);
    });
  }

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && navLinks.classList.contains('open')) {
      closeMenu();
      navToggle.focus();
    }
  });

  /* ============================================================
     SMOOTH SCROLL: Anchor links with nav offset
     ============================================================ */
  document.querySelectorAll('a[href^="#"]').forEach(function (anchor) {
    anchor.addEventListener('click', function (e) {
      var href = anchor.getAttribute('href');
      if (href === '#') return;
      var target = document.querySelector(href);
      if (!target) return;
      e.preventDefault();
      var navH = parseInt(
        getComputedStyle(document.documentElement).getPropertyValue('--nav-h'),
        10
      ) || 80;
      var top = target.getBoundingClientRect().top + window.scrollY - navH;
      window.scrollTo({ top: top, behavior: prefersReducedMotion ? 'auto' : 'smooth' });
    });
  });

  /* ============================================================
     SCROLL REVEAL: IntersectionObserver
     ============================================================ */
  if (!prefersReducedMotion) {
    var revealObserver = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible');
            /* Release will-change after animation completes */
            entry.target.addEventListener('transitionend', function () {
              entry.target.style.willChange = 'auto';
            }, { once: true });
            revealObserver.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.1, rootMargin: '0px 0px -32px 0px' }
    );

    document.querySelectorAll('.reveal').forEach(function (el) {
      revealObserver.observe(el);
    });
  } else {
    /* Immediately show all reveal elements when motion is reduced */
    document.querySelectorAll('.reveal').forEach(function (el) {
      el.classList.add('visible');
      el.style.willChange = 'auto';
    });
  }

  /* ============================================================
     PHONE: Auto-format as (XXX) XXX-XXXX
     ============================================================ */
  var phoneInput = document.getElementById('phone');
  if (phoneInput) {
    phoneInput.addEventListener('input', function (e) {
      var raw = e.target.value.replace(/\D/g, '').slice(0, 10);
      var fmt = raw;
      if (raw.length >= 7) {
        fmt = '(' + raw.slice(0, 3) + ') ' + raw.slice(3, 6) + '-' + raw.slice(6);
      } else if (raw.length >= 4) {
        fmt = '(' + raw.slice(0, 3) + ') ' + raw.slice(3);
      } else if (raw.length > 0) {
        fmt = '(' + raw;
      }
      e.target.value = fmt;
    });
  }

  /* ============================================================
     DATE: Prevent booking in the past
     ============================================================ */
  var dateInput = document.getElementById('date');
  if (dateInput) {
    var today = new Date();
    var yyyy  = today.getFullYear();
    var mo    = String(today.getMonth() + 1).padStart(2, '0');
    var dy    = String(today.getDate()).padStart(2, '0');
    dateInput.setAttribute('min', yyyy + '-' + mo + '-' + dy);
  }

  /* ============================================================
     BOOKING FORM
     ============================================================ */
  var bookingForm    = document.getElementById('bookingForm');
  var bookingSuccess = document.getElementById('bookingSuccess');
  var formErrorDiv   = document.getElementById('formError');

  if (!bookingForm || !bookingSuccess) return; /* Guard — safety exit */

  /* ---- Validation ---- */
  function validateForm() {
    var valid = true;

    /* Clear previous errors */
    bookingForm.querySelectorAll('.form-field').forEach(function (field) {
      field.classList.remove('field--error');
      var control = field.querySelector('input, select, textarea');
      if (control) {
        control.removeAttribute('aria-invalid');
        control.removeAttribute('aria-describedby');
        control.style.borderBottomColor = '';
      }
      var msg = field.querySelector('.field-error-msg');
      if (msg) msg.remove();
    });
    hideFormError();

    /* --- Honeypot: bot filled the hidden field --- */
    var honey = document.getElementById('website_url');
    if (honey && honey.value.trim() !== '') {
      /* Silently pretend success — do not alert bots */
      showSuccess({ bookingId: generateBookingId(), silent: true });
      return false;
    }

    /* --- Required fields + placeholder detection --- */
    var PLACEHOLDER_PATTERNS = /^(test|testing|asdf|qwerty|n\/a|na|none|nope|fake|xxx|111|000|hello|hi there|your name)/i;

    var required = bookingForm.querySelectorAll('[required]');
    required.forEach(function (input) {
      var val = input.value.trim();
      if (!val) {
        markError(input, 'This field is required.');
        valid = false;
        return;
      }
      /* Reject obvious placeholder / test data */
      if (PLACEHOLDER_PATTERNS.test(val)) {
        markError(input, 'Please enter your real information.');
        valid = false;
      }
    });

    /* --- First / Last name: at least 2 characters --- */
    var firstNameInput = document.getElementById('firstName');
    var lastNameInput  = document.getElementById('lastName');
    if (firstNameInput && firstNameInput.value.trim().length > 0 &&
        firstNameInput.value.trim().length < 2) {
      markError(firstNameInput, 'Please enter a valid first name.');
      valid = false;
    }
    if (lastNameInput && lastNameInput.value.trim().length > 0 &&
        lastNameInput.value.trim().length < 2) {
      markError(lastNameInput, 'Please enter a valid last name.');
      valid = false;
    }

    /* --- Email: format + disposable domain check --- */
    var emailInput = document.getElementById('email');
    if (emailInput && emailInput.value.trim()) {
      var emailVal = emailInput.value.trim().toLowerCase();
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailVal)) {
        markError(emailInput, 'Please enter a valid email address.');
        valid = false;
      } else {
        var domain = emailVal.split('@')[1];
        if (DISPOSABLE_DOMAINS.indexOf(domain) !== -1) {
          markError(emailInput, 'Please use a permanent email address.');
          valid = false;
        }
      }
    }

    /* --- Phone: must be 10 digits when provided --- */
    if (phoneInput && phoneInput.value.trim()) {
      var digits = phoneInput.value.replace(/\D/g, '');
      if (digits.length !== 10) {
        markError(phoneInput, 'Please enter a valid 10-digit phone number.');
        valid = false;
      }
    }

    /* --- Date: must not be in the past --- */
    if (dateInput && dateInput.value) {
      var chosen = new Date(dateInput.value + 'T00:00:00');
      var todayMidnight = new Date();
      todayMidnight.setHours(0, 0, 0, 0);
      if (chosen < todayMidnight) {
        markError(dateInput, 'Please choose a future date.');
        valid = false;
      }
    }

    /* Scroll to first error */
    if (!valid) {
      var firstError = bookingForm.querySelector('.field--error input, .field--error select, .field--error textarea');
      if (firstError) {
        firstError.scrollIntoView({ behavior: prefersReducedMotion ? 'auto' : 'smooth', block: 'center' });
        firstError.focus();
      }
    }

    return valid;
  }

  function markError(input, message) {
    var field = input.closest('.form-field');
    if (!field) return;
    field.classList.add('field--error');

    var msg = document.createElement('span');
    var msgId = input.id ? input.id + 'Error' : 'fieldError' + Date.now();
    msg.className = 'field-error-msg';
    msg.id = msgId;
    msg.setAttribute('role', 'alert');
    msg.textContent = message;
    field.appendChild(msg);

    input.setAttribute('aria-invalid', 'true');
    input.setAttribute('aria-describedby', msgId);
    input.style.borderBottomColor = 'var(--dusty-rose)';
    input.addEventListener('input', function onFix() {
      field.classList.remove('field--error');
      var m = field.querySelector('.field-error-msg');
      if (m) m.remove();
      input.removeAttribute('aria-invalid');
      input.removeAttribute('aria-describedby');
      input.style.borderBottomColor = '';
      input.removeEventListener('input', onFix);
    }, { once: true });
  }

  function showFormError(message) {
    if (!formErrorDiv) return;
    formErrorDiv.textContent = message;
    formErrorDiv.classList.add('visible');
    formErrorDiv.scrollIntoView({ behavior: prefersReducedMotion ? 'auto' : 'smooth', block: 'center' });
  }

  function hideFormError() {
    if (!formErrorDiv) return;
    formErrorDiv.classList.remove('visible');
    formErrorDiv.textContent = '';
  }

  /* ---- Collect form data ---- */
  function collectFormData(bookingId) {
    var clientTypeEl = bookingForm.querySelector('input[name="clientType"]:checked');
    var serviceEl = document.getElementById('service');
    var serviceText = serviceEl && serviceEl.options
      ? serviceEl.options[serviceEl.selectedIndex].text
      : '';
    return {
      bookingId:   bookingId,
      timestamp:   new Date().toISOString(),
      firstName:   (document.getElementById('firstName')  || {}).value || '',
      lastName:    (document.getElementById('lastName')   || {}).value || '',
      email:       (document.getElementById('email')      || {}).value || '',
      phone:       (document.getElementById('phone')      || {}).value || '',
      service:     (serviceEl || {}).value || '',
      serviceLabel: serviceText,
      date:        (document.getElementById('date')       || {}).value || '',
      time:        (document.getElementById('time')       || {}).value || '',
      clientType:  clientTypeEl ? clientTypeEl.value : '',
      notes:       (document.getElementById('notes')      || {}).value || '',
      source:      'website'
    };
  }

  /* ---- Submit to Google Sheets via Apps Script ---- */
  function submitToSheets(data, onDone, onFail) {
    if (!CONFIG.SHEETS_URL) {
      onFail(new Error('Google Apps Script Web App URL is not configured.'));
      return;
    }

    fetch(CONFIG.SHEETS_URL, {
      method:  'POST',
      /* text/plain avoids CORS preflight on Apps Script */
      headers: { 'Content-Type': 'text/plain' },
      body:    JSON.stringify(data),
      mode:    'no-cors'
    })
    .then(function () {
      /* no-cors response is opaque — we assume success */
      onDone(data);
    })
    .catch(function (err) {
      console.warn('Lash Lair: Sheets submission failed:', err);
      onFail(err);
    });
  }

  /* ---- WhatsApp confirmation link ---- */
  function buildWhatsAppUrl(data) {
    if (!CONFIG.WHATSAPP_ENABLED || !CONFIG.WHATSAPP_NUMBER) return '';
    var serviceLabel = (document.getElementById('service') || {});
    var serviceText  = serviceLabel.options
      ? serviceLabel.options[serviceLabel.selectedIndex].text
      : data.service;

    var message =
      'Hi ' + CONFIG.STUDIO_NAME + '!\n\n' +
      'I just submitted a booking request.\n\n' +
      'Booking ID: ' + data.bookingId + '\n' +
      'Name: ' + data.firstName + ' ' + data.lastName + '\n' +
      'Service: ' + serviceText + '\n' +
      'Date: ' + data.date + '\n' +
      'Time: ' + data.time + '\n\n' +
      'Looking forward to my appointment!';

    return 'https://wa.me/' + CONFIG.WHATSAPP_NUMBER +
      '?text=' + encodeURIComponent(message);
  }

  /* ---- Success screen ---- */
  function showSuccess(data) {
    /* Populate success message with booking details */
    var nameEl = bookingSuccess.querySelector('.success__name');
    var idEl   = bookingSuccess.querySelector('.success__booking-id');
    var whatsappEl = bookingSuccess.querySelector('.success__whatsapp');
    if (nameEl) nameEl.textContent = data.firstName || '';
    if (idEl)   idEl.textContent   = data.bookingId || '';
    if (whatsappEl) {
      var whatsappUrl = buildWhatsAppUrl(data);
      if (whatsappUrl) {
        whatsappEl.href = whatsappUrl;
        whatsappEl.hidden = false;
      } else {
        whatsappEl.hidden = true;
      }
    }

    if (prefersReducedMotion) {
      bookingForm.style.display = 'none';
      bookingSuccess.classList.add('visible');
    } else {
      bookingForm.style.opacity    = '0';
      bookingForm.style.transform  = 'translateY(-12px)';
      bookingForm.style.transition = 'opacity 0.4s, transform 0.4s';

      setTimeout(function () {
        bookingForm.style.display = 'none';
        bookingSuccess.classList.add('visible');
        bookingSuccess.style.opacity   = '0';
        bookingSuccess.style.animation = 'fadeUp 0.7s ease forwards';
        bookingSuccess.scrollIntoView({ behavior: prefersReducedMotion ? 'auto' : 'smooth', block: 'center' });
      }, 400);
    }
  }

  /* ---- Form submit handler ---- */
  bookingForm.addEventListener('submit', function (e) {
    e.preventDefault();

    if (!validateForm()) return;

    var submitBtn    = bookingForm.querySelector('button[type="submit"]');
    var originalText = submitBtn ? submitBtn.textContent : '';
    if (submitBtn) {
      submitBtn.textContent = 'Sending…';
      submitBtn.disabled    = true;
      submitBtn.setAttribute('aria-busy', 'true');
    }

    var bookingId = generateBookingId();
    var formData  = collectFormData(bookingId);

    submitToSheets(
      formData,
      /* onDone */
      function (data) {
        if (submitBtn) {
          submitBtn.removeAttribute('aria-busy');
        }
        showSuccess(data);
      },
      /* onFail */
      function () {
        if (submitBtn) {
          submitBtn.textContent = originalText;
          submitBtn.disabled    = false;
          submitBtn.removeAttribute('aria-busy');
        }
        showFormError(
          'Something went wrong sending your request. ' +
          'Please try again or contact us directly.'
        );
      }
    );
  });

})();
