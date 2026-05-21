/* ============================================================
   LASH LAIR — Main JS
   ============================================================ */

(function () {
  'use strict';

  /* ---- Navigation: scroll state ---- */
  var nav = document.getElementById('nav');

  function updateNav() {
    nav.classList.toggle('scrolled', window.scrollY > 55);
  }
  window.addEventListener('scroll', updateNav, { passive: true });
  updateNav();

  /* ---- Mobile menu toggle ---- */
  var navToggle = document.getElementById('navToggle');
  var navLinks  = document.getElementById('navLinks');

  navToggle.addEventListener('click', function () {
    var isOpen = navLinks.classList.toggle('open');
    navToggle.setAttribute('aria-expanded', String(isOpen));
    document.body.style.overflow = isOpen ? 'hidden' : '';
  });

  navLinks.querySelectorAll('a').forEach(function (link) {
    link.addEventListener('click', function () {
      navLinks.classList.remove('open');
      navToggle.setAttribute('aria-expanded', 'false');
      document.body.style.overflow = '';
    });
  });

  /* ---- Smooth scroll for anchor links ---- */
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
      window.scrollTo({ top: top, behavior: 'smooth' });
    });
  });

  /* ---- Scroll reveal ---- */
  var revealObserver = new IntersectionObserver(
    function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          revealObserver.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.1, rootMargin: '0px 0px -32px 0px' }
  );

  document.querySelectorAll('.reveal').forEach(function (el) {
    revealObserver.observe(el);
  });

  /* ---- Phone number auto-format ---- */
  var phoneInput = document.getElementById('phone');
  if (phoneInput) {
    phoneInput.addEventListener('input', function (e) {
      var raw = e.target.value.replace(/\D/g, '').slice(0, 10);
      var formatted = raw;
      if (raw.length >= 7) {
        formatted = '(' + raw.slice(0, 3) + ') ' + raw.slice(3, 6) + '-' + raw.slice(6);
      } else if (raw.length >= 4) {
        formatted = '(' + raw.slice(0, 3) + ') ' + raw.slice(3);
      } else if (raw.length > 0) {
        formatted = '(' + raw;
      }
      e.target.value = formatted;
    });
  }

  /* ---- Date input: prevent past dates ---- */
  var dateInput = document.getElementById('date');
  if (dateInput) {
    var today = new Date();
    var yyyy  = today.getFullYear();
    var mm    = String(today.getMonth() + 1).padStart(2, '0');
    var dd    = String(today.getDate()).padStart(2, '0');
    dateInput.setAttribute('min', yyyy + '-' + mm + '-' + dd);
  }

  /* ---- Booking form submission ---- */
  var bookingForm    = document.getElementById('bookingForm');
  var bookingSuccess = document.getElementById('bookingSuccess');

  if (bookingForm && bookingSuccess) {
    bookingForm.addEventListener('submit', function (e) {
      e.preventDefault();

      if (!validateForm()) return;

      /* Show loading state on button */
      var submitBtn = bookingForm.querySelector('button[type="submit"]');
      var originalText = submitBtn.textContent;
      submitBtn.textContent = 'Sending…';
      submitBtn.disabled = true;

      /*
        INTEGRATION POINT:
        Replace the setTimeout below with a real fetch() to your
        booking backend (e.g. Vagaro API, Formspree, EmailJS, etc.)

        Example using Formspree:
        fetch('https://formspree.io/f/YOUR_FORM_ID', {
          method: 'POST',
          headers: { 'Accept': 'application/json' },
          body: new FormData(bookingForm)
        })
        .then(function(r) { if (r.ok) showSuccess(); else resetButton(); })
        .catch(function() { resetButton(); });
      */

      setTimeout(function () {
        showSuccess();
      }, 1200);

      function showSuccess() {
        bookingForm.style.opacity = '0';
        bookingForm.style.transform = 'translateY(-12px)';
        bookingForm.style.transition = 'opacity 0.4s, transform 0.4s';

        setTimeout(function () {
          bookingForm.style.display = 'none';
          bookingSuccess.classList.add('visible');
          bookingSuccess.style.opacity = '0';
          bookingSuccess.style.animation = 'fadeUp 0.7s ease forwards';
          /* Scroll top of booking section into view */
          bookingSuccess.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }, 400);
      }

      function resetButton() {
        submitBtn.textContent = originalText;
        submitBtn.disabled = false;
      }
    });
  }

  /* ---- Simple client-side validation ---- */
  function validateForm() {
    var valid = true;

    /* Clear previous errors */
    bookingForm.querySelectorAll('.form-field').forEach(function (field) {
      field.classList.remove('field--error');
      var msg = field.querySelector('.field-error-msg');
      if (msg) msg.remove();
    });

    var required = bookingForm.querySelectorAll('[required]');
    required.forEach(function (input) {
      if (!input.value.trim()) {
        markError(input, 'This field is required.');
        valid = false;
      }
    });

    /* Email format */
    var emailInput = document.getElementById('email');
    if (emailInput && emailInput.value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailInput.value)) {
      markError(emailInput, 'Please enter a valid email.');
      valid = false;
    }

    /* Scroll to first error */
    if (!valid) {
      var firstError = bookingForm.querySelector('.field--error input, .field--error select');
      if (firstError) firstError.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }

    return valid;
  }

  function markError(input, message) {
    var field = input.closest('.form-field');
    if (!field) return;
    field.classList.add('field--error');

    var msg = document.createElement('span');
    msg.className = 'field-error-msg';
    msg.textContent = message;
    field.appendChild(msg);

    input.style.borderBottomColor = 'var(--dusty-rose)';
    input.addEventListener('input', function onFix() {
      field.classList.remove('field--error');
      var m = field.querySelector('.field-error-msg');
      if (m) m.remove();
      input.style.borderBottomColor = '';
      input.removeEventListener('input', onFix);
    }, { once: true });
  }

})();
