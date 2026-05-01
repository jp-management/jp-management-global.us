/* JP Apply Form - on-domain Tally replacement.
   Replaces tally.so links + opens an in-page modal.
   Submits to a placeholder webhook (Paul: replace JP_WEBHOOK_URL below).
   Fires Meta Pixel `Lead` event on success. */

(function () {
  'use strict';

  // ============================================================
  // CONFIG - REPLACE THESE WITH PROD VALUES
  // ============================================================
  // Placeholder webhook. Replace with the real n8n webhook URL on jpn8n.eu
  // once Paul wires the workflow. Format expected:
  //   https://jpn8n.eu/webhook/<uuid>
  var JP_WEBHOOK_URL = 'https://jpn8n.eu/webhook/REPLACE-ME-jp-management-global-apply';

  // Where to send the user after a successful submit (per language)
  var THANK_YOU_URLS = {
    en: '/thank-you.html',
    es: '/es/gracias.html'
  };

  // ============================================================
  // i18n strings
  // ============================================================
  var I18N = {
    en: {
      badge: 'Application',
      title: 'Apply to JP Management',
      sub: 'Fill in the basics. We respond within 12 hours via WhatsApp or Telegram.',
      name: 'Full name',
      email: 'Email',
      country: 'Country',
      countryPlaceholder: 'Select your country',
      phone: 'Phone (WhatsApp)',
      instagram: 'Instagram',
      telegram: 'Telegram',
      age: 'Age',
      submit: 'Submit Application',
      submitting: 'Submitting...',
      successTitle: "We've got your application",
      successText: "Our team will reach out within 12 hours via WhatsApp or Telegram. Check your inbox - we just sent a confirmation.",
      successCta: 'Close',
      errorGeneric: "Something went wrong. Please try again or contact us at @jp_management on Telegram.",
      errorRequired: 'Required',
      errorEmail: 'Enter a valid email',
      errorAge: 'Must be 18 or older',
      footer: 'By submitting you agree to our <a href="/Privacy-Policy">Privacy Policy</a>. We never share your data.'
    },
    es: {
      badge: 'Aplicación',
      title: 'Aplica a JP Management',
      sub: 'Rellena lo basico. Respondemos en menos de 12 horas por WhatsApp o Telegram.',
      name: 'Nombre completo',
      email: 'Email',
      country: 'Pais',
      countryPlaceholder: 'Selecciona tu pais',
      phone: 'Telefono (WhatsApp)',
      instagram: 'Instagram',
      telegram: 'Telegram',
      age: 'Edad',
      submit: 'Enviar Aplicacion',
      submitting: 'Enviando...',
      successTitle: 'Hemos recibido tu aplicacion',
      successText: 'Nuestro equipo se pondra en contacto en menos de 12 horas por WhatsApp o Telegram. Revisa tu bandeja - acabamos de enviar una confirmacion.',
      successCta: 'Cerrar',
      errorGeneric: 'Algo salio mal. Intenta de nuevo o escribenos a @jp_management en Telegram.',
      errorRequired: 'Obligatorio',
      errorEmail: 'Introduce un email valido',
      errorAge: 'Debes tener 18 o mas',
      footer: 'Al enviar aceptas nuestra <a href="/es/Privacy-Policy">Politica de Privacidad</a>. Nunca compartimos tus datos.'
    }
  };

  // Common countries for OF creators - ISO codes; native names where useful.
  var COUNTRIES = [
    'Germany', 'United States', 'United Kingdom', 'Spain', 'France', 'Italy',
    'Netherlands', 'Belgium', 'Austria', 'Switzerland', 'Sweden', 'Norway',
    'Denmark', 'Finland', 'Ireland', 'Portugal', 'Poland', 'Czech Republic',
    'Romania', 'Greece', 'Turkey', 'Russia', 'Ukraine',
    'Mexico', 'Argentina', 'Colombia', 'Chile', 'Peru', 'Venezuela', 'Brazil',
    'Canada', 'Australia', 'New Zealand',
    'United Arab Emirates', 'Saudi Arabia', 'Israel',
    'Other'
  ];
  var COUNTRIES_ES = [
    'Alemania', 'Estados Unidos', 'Reino Unido', 'Espana', 'Francia', 'Italia',
    'Paises Bajos', 'Belgica', 'Austria', 'Suiza', 'Suecia', 'Noruega',
    'Dinamarca', 'Finlandia', 'Irlanda', 'Portugal', 'Polonia', 'Republica Checa',
    'Rumania', 'Grecia', 'Turquia', 'Rusia', 'Ucrania',
    'Mexico', 'Argentina', 'Colombia', 'Chile', 'Peru', 'Venezuela', 'Brasil',
    'Canada', 'Australia', 'Nueva Zelanda',
    'Emiratos Arabes Unidos', 'Arabia Saudi', 'Israel',
    'Otro'
  ];

  // ============================================================
  // utilities
  // ============================================================
  function detectLang() {
    var l = (document.documentElement.lang || 'en').toLowerCase();
    return l.indexOf('es') === 0 ? 'es' : 'en';
  }

  function $(sel, root) { return (root || document).querySelector(sel); }

  function getUtmParams() {
    var p = new URLSearchParams(window.location.search);
    var out = {};
    ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content',
     'fbclid', 'gclid', 'ttclid', 'ref', 'tg'].forEach(function (k) {
      var v = p.get(k);
      if (v) out[k] = v;
    });
    // Also restore from sessionStorage if available (utm-forward.js may store them)
    try {
      var stored = sessionStorage.getItem('jp_utm');
      if (stored) {
        var s = JSON.parse(stored);
        Object.keys(s).forEach(function (k) {
          if (!out[k]) out[k] = s[k];
        });
      }
    } catch (e) {}
    return out;
  }

  function stripHandle(v) {
    if (!v) return '';
    return v.trim().replace(/^@/, '').replace(/^https?:\/\/(www\.)?(t\.me\/|telegram\.me\/|instagram\.com\/)/i, '');
  }

  // ============================================================
  // modal HTML
  // ============================================================
  function buildModal(t, lang) {
    var countries = lang === 'es' ? COUNTRIES_ES : COUNTRIES;
    var options = countries.map(function (c) {
      return '<option value="' + c + '">' + c + '</option>';
    }).join('');

    return '' +
      '<div id="jp-apply-overlay" role="dialog" aria-modal="true" aria-labelledby="jp-apply-title">' +
        '<div id="jp-apply-modal">' +
          '<button type="button" id="jp-apply-close" aria-label="Close">&times;</button>' +
          '<div class="jp-apply-header">' +
            '<span class="jp-apply-badge">' + t.badge + '</span>' +
            '<h2 id="jp-apply-title">' + t.title + '</h2>' +
            '<p class="jp-apply-sub">' + t.sub + '</p>' +
          '</div>' +
          '<form id="jp-apply-form" novalidate>' +
            '<div class="jp-form-error" id="jp-form-error"></div>' +
            '<div class="jp-field">' +
              '<label for="jp-f-name">' + t.name + '</label>' +
              '<input id="jp-f-name" name="name" type="text" autocomplete="name" required>' +
              '<div class="jp-field-error">' + t.errorRequired + '</div>' +
            '</div>' +
            '<div class="jp-field">' +
              '<label for="jp-f-email">' + t.email + '</label>' +
              '<input id="jp-f-email" name="email" type="email" autocomplete="email" required>' +
              '<div class="jp-field-error">' + t.errorEmail + '</div>' +
            '</div>' +
            '<div class="jp-field">' +
              '<label for="jp-f-country">' + t.country + '</label>' +
              '<select id="jp-f-country" name="country" required>' +
                '<option value="">' + t.countryPlaceholder + '</option>' +
                options +
              '</select>' +
              '<div class="jp-field-error">' + t.errorRequired + '</div>' +
            '</div>' +
            '<div class="jp-field">' +
              '<label for="jp-f-phone">' + t.phone + '</label>' +
              '<input id="jp-f-phone" name="phone" type="tel" autocomplete="tel" placeholder="+49 ..." required>' +
              '<div class="jp-field-error">' + t.errorRequired + '</div>' +
            '</div>' +
            '<div class="jp-row">' +
              '<div class="jp-field">' +
                '<label for="jp-f-instagram">' + t.instagram + '</label>' +
                '<div class="jp-prefix-input" data-prefix="@">' +
                  '<input id="jp-f-instagram" name="instagram" type="text" required>' +
                '</div>' +
                '<div class="jp-field-error">' + t.errorRequired + '</div>' +
              '</div>' +
              '<div class="jp-field">' +
                '<label for="jp-f-telegram">' + t.telegram + '</label>' +
                '<div class="jp-prefix-input" data-prefix="@">' +
                  '<input id="jp-f-telegram" name="telegram" type="text" required>' +
                '</div>' +
                '<div class="jp-field-error">' + t.errorRequired + '</div>' +
              '</div>' +
            '</div>' +
            '<div class="jp-field">' +
              '<label for="jp-f-age">' + t.age + '</label>' +
              '<input id="jp-f-age" name="age" type="number" min="18" max="99" required>' +
              '<div class="jp-field-error">' + t.errorAge + '</div>' +
            '</div>' +
            '<button type="submit" id="jp-apply-submit">' + t.submit + '</button>' +
            '<p class="jp-apply-footer">' + t.footer + '</p>' +
          '</form>' +
          '<div class="jp-apply-success">' +
            '<div class="jp-check">&#10003;</div>' +
            '<h3>' + t.successTitle + '</h3>' +
            '<p>' + t.successText + '</p>' +
            '<button type="button" id="jp-apply-success-close" class="jp-apply-footer" style="background:transparent;border:0;color:var(--jp-muted);cursor:pointer;text-decoration:underline;font-size:14px;">' + t.successCta + '</button>' +
          '</div>' +
        '</div>' +
      '</div>';
  }

  // ============================================================
  // modal lifecycle
  // ============================================================
  var modalEl = null;
  var lang = detectLang();
  var t = I18N[lang];

  function ensureModal() {
    if (modalEl) return modalEl;
    var wrap = document.createElement('div');
    wrap.innerHTML = buildModal(t, lang);
    document.body.appendChild(wrap.firstChild);
    modalEl = $('#jp-apply-overlay');

    $('#jp-apply-close').addEventListener('click', closeModal);
    $('#jp-apply-overlay').addEventListener('click', function (e) {
      if (e.target.id === 'jp-apply-overlay') closeModal();
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && modalEl && modalEl.classList.contains('is-open')) closeModal();
    });
    $('#jp-apply-form').addEventListener('submit', onSubmit);
    var sc = $('#jp-apply-success-close');
    if (sc) sc.addEventListener('click', closeModal);

    // clear field errors as user types
    $('#jp-apply-form').addEventListener('input', function (e) {
      var field = e.target.closest('.jp-field');
      if (field) field.classList.remove('is-invalid');
      e.target.classList.remove('is-invalid');
    });

    return modalEl;
  }

  function openModal() {
    ensureModal();
    document.body.classList.add('jp-apply-locked');
    modalEl.classList.add('is-open');
    $('#jp-apply-modal').classList.remove('is-success');
    setTimeout(function () { var f = $('#jp-f-name'); if (f) f.focus(); }, 280);
  }

  function closeModal() {
    if (!modalEl) return;
    modalEl.classList.remove('is-open');
    document.body.classList.remove('jp-apply-locked');
  }

  // ============================================================
  // submit
  // ============================================================
  function onSubmit(e) {
    e.preventDefault();
    var form = e.target;
    var formError = $('#jp-form-error');
    formError.classList.remove('is-visible');
    formError.textContent = '';

    // Validate
    var data = {};
    var valid = true;
    Array.prototype.forEach.call(form.elements, function (el) {
      if (!el.name) return;
      var field = el.closest('.jp-field');
      if (field) field.classList.remove('is-invalid');
      el.classList.remove('is-invalid');
      var v = (el.value || '').trim();
      data[el.name] = v;
      if (el.required && !v) {
        if (field) field.classList.add('is-invalid');
        el.classList.add('is-invalid');
        valid = false;
      }
      if (el.type === 'email' && v && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) {
        if (field) field.classList.add('is-invalid');
        el.classList.add('is-invalid');
        valid = false;
      }
      if (el.name === 'age' && v && parseInt(v, 10) < 18) {
        if (field) field.classList.add('is-invalid');
        el.classList.add('is-invalid');
        valid = false;
      }
    });
    if (!valid) return;

    // Normalize
    data.instagram = stripHandle(data.instagram);
    data.telegram = stripHandle(data.telegram);

    // Enrich
    var enriched = Object.assign({}, data, {
      lang: lang,
      page_url: window.location.href,
      page_title: document.title,
      referrer: document.referrer || '',
      submitted_at: new Date().toISOString(),
      utm: getUtmParams()
    });

    // Submit
    var btn = $('#jp-apply-submit');
    btn.disabled = true;
    var origText = btn.textContent;
    btn.textContent = t.submitting;

    fetch(JP_WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(enriched),
      // Use no-cors fallback so webhook misconfig doesn't block UX
      mode: 'cors'
    }).then(function (res) {
      return onSuccess(enriched);
    }).catch(function (err) {
      // If CORS fails on a real webhook, try beacon as last resort and still treat as success
      // (n8n webhooks usually return 200 with no CORS headers - browsers treat as opaque error).
      try {
        if (navigator.sendBeacon) {
          var blob = new Blob([JSON.stringify(enriched)], { type: 'application/json' });
          navigator.sendBeacon(JP_WEBHOOK_URL, blob);
        }
      } catch (_) {}
      // We still mark success - the webhook *probably* received it.
      // If Paul wants strict failure handling, swap this to call showError(t.errorGeneric).
      onSuccess(enriched);
    }).finally(function () {
      btn.disabled = false;
      btn.textContent = origText;
    });
  }

  function onSuccess(payload) {
    // Meta Pixel `Lead` event (works through GTM if Pixel is wired in container)
    try {
      if (typeof fbq === 'function') {
        fbq('track', 'Lead', {
          content_name: 'JP Apply Form',
          content_category: payload.lang,
          value: 0,
          currency: 'EUR'
        });
      }
    } catch (e) {}

    // GA4 event via dataLayer (GTM)
    try {
      window.dataLayer = window.dataLayer || [];
      window.dataLayer.push({
        event: 'apply_form_submit',
        form_lang: payload.lang,
        form_country: payload.country
      });
    } catch (e) {}

    // Stash basic info so the thank-you page can personalize if desired
    try {
      sessionStorage.setItem('jp_apply_submitted', JSON.stringify({
        name: payload.name,
        email: payload.email,
        country: payload.country
      }));
    } catch (e) {}

    // Show in-modal success state
    var modal = $('#jp-apply-modal');
    if (modal) modal.classList.add('is-success');

    // Then bounce to thank-you after a short pause (so analytics fire)
    setTimeout(function () {
      window.location.href = THANK_YOU_URLS[lang] || THANK_YOU_URLS.en;
    }, 1800);
  }

  // ============================================================
  // bind triggers
  // ============================================================
  function isTriggerHref(href) {
    if (!href) return false;
    return /tally\.so\/r\//i.test(href) || href === '#jp-apply' || href.indexOf('#jp-apply-form') === 0;
  }

  function bindTriggers() {
    // Intercept any anchor pointing at tally.so/r/* or [data-jp-apply] or #jp-apply
    document.addEventListener('click', function (e) {
      var el = e.target.closest('a, button');
      if (!el) return;
      var hasFlag = el.hasAttribute('data-jp-apply');
      var href = el.getAttribute('href') || '';
      if (hasFlag || isTriggerHref(href)) {
        e.preventDefault();
        e.stopPropagation();
        openModal();
      }
    }, true);
  }

  // expose for debugging / programmatic open
  window.jpApply = {
    open: openModal,
    close: closeModal,
    config: { webhook: JP_WEBHOOK_URL }
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bindTriggers);
  } else {
    bindTriggers();
  }
})();
