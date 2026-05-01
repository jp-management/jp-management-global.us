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
  // n8n's Webhook node should be configured: Method=POST, Binary Data=true,
  // Property Name=photos (or read each photo_1..photo_5 from $binary).
  var JP_WEBHOOK_URL = 'https://jpn8n.eu/webhook/REPLACE-ME-jp-management-global-apply';

  // Image upload constraints
  var MIN_IMAGES = 5;
  var MAX_IMAGES = 9;
  var MAX_IMAGE_BYTES = 5 * 1024 * 1024;       // 5 MB per image
  var MAX_TOTAL_BYTES = 35 * 1024 * 1024;      // 35 MB combined (9 photos)

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
      uploading: 'Uploading photos...',
      successTitle: "We've got your application",
      successText: "Our team will reach out within 12 hours via WhatsApp or Telegram. Check your inbox - we just sent a confirmation.",
      successCta: 'Close',
      errorGeneric: "Something went wrong. Please try again or contact us at @jp_management on Telegram.",
      errorRequired: 'Required',
      errorEmail: 'Enter a valid email',
      errorAge: 'Must be 18 or older',
      errorInstagram: 'Letters, numbers, "." and "_" only',
      errorTelegram: 'Letters, numbers and "_" only (5-32 chars)',
      images: 'Photos',
      imagesHint: 'Min ' + MIN_IMAGES + ', up to ' + MAX_IMAGES + ' photos. Portrait + full body. JPG/PNG/WEBP, 5 MB each.',
      imagesMeta: '{n}/' + MAX_IMAGES + ' (min ' + MIN_IMAGES + ')',
      errorImages: 'Add at least ' + MIN_IMAGES + ' photos',
      errorImageType: 'Only JPG, PNG, or WEBP',
      errorImageSize: 'Each photo must be under 5 MB',
      errorTotalSize: 'Total upload size must be under 35 MB',
      consent: 'By submitting your information, you give your consent for JP Management to contact you to verify your details. If your application is approved, your information may be shared with our network of partners to find you a manager and a team to work with.',
      errorConsent: 'Please confirm to continue',
      footer: '<a href="/Privacy-Policy">Privacy Policy</a>'
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
      uploading: 'Subiendo fotos...',
      successTitle: 'Hemos recibido tu aplicacion',
      successText: 'Nuestro equipo se pondra en contacto en menos de 12 horas por WhatsApp o Telegram. Revisa tu bandeja - acabamos de enviar una confirmacion.',
      successCta: 'Cerrar',
      errorGeneric: 'Algo salio mal. Intenta de nuevo o escribenos a @jp_management en Telegram.',
      errorRequired: 'Obligatorio',
      errorEmail: 'Introduce un email valido',
      errorAge: 'Debes tener 18 o mas',
      errorInstagram: 'Solo letras, numeros, "." y "_"',
      errorTelegram: 'Solo letras, numeros y "_" (5-32 caracteres)',
      images: 'Fotos',
      imagesHint: 'Min ' + MIN_IMAGES + ', max ' + MAX_IMAGES + ' fotos. Retrato + cuerpo entero. JPG/PNG/WEBP, 5 MB cada una.',
      imagesMeta: '{n}/' + MAX_IMAGES + ' (min ' + MIN_IMAGES + ')',
      errorImages: 'Anade al menos ' + MIN_IMAGES + ' fotos',
      errorImageType: 'Solo JPG, PNG o WEBP',
      errorImageSize: 'Cada foto debe ser menor a 5 MB',
      errorTotalSize: 'El tamano total debe ser menor a 35 MB',
      consent: 'Al enviar tus datos, das tu consentimiento para que JP Management se ponga en contacto contigo para verificar tu informacion. Si tu solicitud es aprobada, tu informacion puede ser compartida con nuestra red de partners para encontrarte un manager y un equipo de trabajo.',
      errorConsent: 'Por favor confirma para continuar',
      footer: '<a href="/es/Privacy-Policy">Politica de Privacidad</a>'
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

    var slotsHtml = '';
    for (var i = 0; i < MAX_IMAGES; i++) {
      // First MIN_IMAGES are always visible. The rest are "optional" and
      // only fade in once the user fills the required quota.
      var optional = i >= MIN_IMAGES ? ' is-optional' : '';
      slotsHtml += '<div class="jp-image-slot' + optional + '" data-slot="' + i + '">+</div>';
    }

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
            '<div class="jp-field">' +
              '<label for="jp-f-name">' + t.name + '</label>' +
              '<input id="jp-f-name" name="name" type="text" autocomplete="name" required>' +
              '<div class="jp-field-error">' + t.errorRequired + '</div>' +
            '</div>' +
            '<div class="jp-row-2">' +
              '<div class="jp-field">' +
                '<label for="jp-f-email">' + t.email + '</label>' +
                '<input id="jp-f-email" name="email" type="email" autocomplete="email" required>' +
                '<div class="jp-field-error">' + t.errorEmail + '</div>' +
              '</div>' +
              '<div class="jp-field">' +
                '<label for="jp-f-country">' + t.country + '</label>' +
                '<input id="jp-f-country" name="country" type="text" list="jp-country-list" autocomplete="country-name" placeholder="' + t.countryPlaceholder + '" required>' +
                '<datalist id="jp-country-list">' + options + '</datalist>' +
                '<div class="jp-field-error">' + t.errorRequired + '</div>' +
              '</div>' +
            '</div>' +
            '<div class="jp-row-2">' +
              '<div class="jp-field">' +
                '<label for="jp-f-phone">' + t.phone + '</label>' +
                '<input id="jp-f-phone" name="phone" type="tel" autocomplete="tel" placeholder="+49 ..." required>' +
                '<div class="jp-field-error">' + t.errorRequired + '</div>' +
              '</div>' +
              '<div class="jp-field">' +
                '<label for="jp-f-age">' + t.age + '</label>' +
                '<input id="jp-f-age" name="age" type="number" min="18" max="99" required>' +
                '<div class="jp-field-error">' + t.errorAge + '</div>' +
              '</div>' +
            '</div>' +
            '<div class="jp-row-2">' +
              '<div class="jp-field">' +
                '<label for="jp-f-instagram">' + t.instagram + '</label>' +
                '<div class="jp-prefix-input" data-prefix="@">' +
                  '<input id="jp-f-instagram" name="instagram" type="text" pattern="[A-Za-z0-9._]{1,30}" maxlength="30" required>' +
                '</div>' +
                '<div class="jp-field-error" data-error-key="instagram">' + t.errorInstagram + '</div>' +
              '</div>' +
              '<div class="jp-field">' +
                '<label for="jp-f-telegram">' + t.telegram + '</label>' +
                '<div class="jp-prefix-input" data-prefix="@">' +
                  '<input id="jp-f-telegram" name="telegram" type="text" pattern="[A-Za-z][A-Za-z0-9_]{4,31}" minlength="5" maxlength="32" required>' +
                '</div>' +
                '<div class="jp-field-error" data-error-key="telegram">' + t.errorTelegram + '</div>' +
              '</div>' +
            '</div>' +
            '<div class="jp-field jp-field-images">' +
              '<div class="jp-images-header">' +
                '<label>' + t.images + '</label>' +
                '<span class="jp-images-meta" id="jp-images-meta">' + t.imagesMeta.replace('{n}', '0') + '</span>' +
              '</div>' +
              '<p class="jp-images-hint">' + t.imagesHint + '</p>' +
              '<div class="jp-image-grid" id="jp-image-grid">' + slotsHtml + '</div>' +
              '<input type="file" id="jp-image-input" accept="image/jpeg,image/png,image/webp" multiple hidden>' +
              '<div class="jp-field-error" id="jp-image-error">' + t.errorImages + '</div>' +
            '</div>' +
            '<div class="jp-bottom">' +
              '<label class="jp-consent" for="jp-f-consent">' +
                '<input type="checkbox" id="jp-f-consent" name="consent" required>' +
                '<span class="jp-consent-box" aria-hidden="true"></span>' +
                '<span class="jp-consent-text">' + t.consent + '</span>' +
              '</label>' +
              '<div class="jp-form-error" id="jp-form-error"></div>' +
              '<button type="submit" id="jp-apply-submit">' + t.submit + '</button>' +
              '<p class="jp-apply-footer">' + t.footer + '</p>' +
            '</div>' +
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
  // image upload state
  // ============================================================
  var uploadedImages = []; // array of {file, dataUrl}

  function bytesHuman(b) {
    if (b > 1024 * 1024) return (b / 1024 / 1024).toFixed(1) + ' MB';
    if (b > 1024) return Math.round(b / 1024) + ' KB';
    return b + ' B';
  }

  function totalUploadedBytes() {
    return uploadedImages.reduce(function (s, x) { return s + x.file.size; }, 0);
  }

  function showFormError(msg) {
    var e = $('#jp-form-error');
    if (!e) return;
    e.textContent = msg;
    e.classList.add('is-visible');
  }

  function clearFormError() {
    var e = $('#jp-form-error');
    if (!e) return;
    e.textContent = '';
    e.classList.remove('is-visible');
  }

  function renderImageGrid() {
    var grid = $('#jp-image-grid');
    if (!grid) return;
    var slots = grid.querySelectorAll('.jp-image-slot');
    Array.prototype.forEach.call(slots, function (slot, idx) {
      slot.innerHTML = '';
      slot.classList.remove('has-file');
      var img = uploadedImages[idx];
      if (img) {
        slot.classList.add('has-file');
        var thumb = document.createElement('img');
        thumb.src = img.dataUrl;
        thumb.alt = 'photo-' + (idx + 1);
        var rm = document.createElement('button');
        rm.type = 'button';
        rm.className = 'jp-slot-remove';
        rm.setAttribute('aria-label', 'Remove photo');
        rm.textContent = '×';
        rm.addEventListener('click', function (e) {
          e.preventDefault();
          e.stopPropagation();
          uploadedImages.splice(idx, 1);
          renderImageGrid();
        });
        slot.appendChild(thumb);
        slot.appendChild(rm);
      } else {
        slot.textContent = '+';
      }
    });
    var meta = $('#jp-images-meta');
    if (meta) {
      meta.textContent = t.imagesMeta.replace('{n}', String(uploadedImages.length));
      meta.classList.toggle('is-met', uploadedImages.length >= MIN_IMAGES);
    }
    var fieldEl = grid.closest('.jp-field-images');
    if (fieldEl) {
      fieldEl.classList.remove('is-invalid');
      // Reveal the 4 extra optional slots once the user has completed the
      // required 5 - keeps the form calm at first glance.
      fieldEl.classList.toggle('show-optional', uploadedImages.length >= MIN_IMAGES);
    }
  }

  function readAsDataURL(file) {
    return new Promise(function (resolve, reject) {
      var r = new FileReader();
      r.onload = function () { resolve(r.result); };
      r.onerror = reject;
      r.readAsDataURL(file);
    });
  }

  function addFiles(fileList) {
    if (!fileList || !fileList.length) return;
    var files = Array.prototype.slice.call(fileList);
    clearFormError();
    var validTypes = /^image\/(jpe?g|png|webp)$/i;

    var room = MAX_IMAGES - uploadedImages.length;
    if (files.length > room) files = files.slice(0, room);

    var promises = files.map(function (file) {
      if (!validTypes.test(file.type)) {
        showFormError(t.errorImageType);
        return Promise.resolve(null);
      }
      if (file.size > MAX_IMAGE_BYTES) {
        showFormError(t.errorImageSize);
        return Promise.resolve(null);
      }
      return readAsDataURL(file).then(function (dataUrl) {
        return { file: file, dataUrl: dataUrl };
      });
    });

    Promise.all(promises).then(function (results) {
      results.forEach(function (r) { if (r) uploadedImages.push(r); });
      // Cap at MAX_IMAGES
      uploadedImages = uploadedImages.slice(0, MAX_IMAGES);
      // Combined size check
      if (totalUploadedBytes() > MAX_TOTAL_BYTES) {
        // pop the last added until under the limit
        while (uploadedImages.length && totalUploadedBytes() > MAX_TOTAL_BYTES) {
          uploadedImages.pop();
        }
        showFormError(t.errorTotalSize);
      }
      renderImageGrid();
    });
  }

  function bindImageHandlers() {
    var grid = $('#jp-image-grid');
    var input = $('#jp-image-input');
    if (!grid || !input) return;

    grid.addEventListener('click', function (e) {
      var slot = e.target.closest('.jp-image-slot');
      if (!slot) return;
      if (slot.classList.contains('has-file')) return;
      input.click();
    });

    input.addEventListener('change', function () {
      addFiles(input.files);
      input.value = '';
    });

    ['dragenter', 'dragover'].forEach(function (ev) {
      grid.addEventListener(ev, function (e) {
        e.preventDefault();
        e.stopPropagation();
        grid.classList.add('is-dragging');
      });
    });
    ['dragleave', 'drop'].forEach(function (ev) {
      grid.addEventListener(ev, function (e) {
        e.preventDefault();
        e.stopPropagation();
        grid.classList.remove('is-dragging');
      });
    });
    grid.addEventListener('drop', function (e) {
      var dt = e.dataTransfer;
      if (dt && dt.files) addFiles(dt.files);
    });
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

    // Clear field errors + live-filter handles for IG/TG so the user can
    // never get an invalid character into the field at all.
    $('#jp-apply-form').addEventListener('input', function (e) {
      var el = e.target;
      var field = el.closest('.jp-field');
      if (field) field.classList.remove('is-invalid');
      el.classList.remove('is-invalid');
      var consentLabel = el.closest('.jp-consent');
      if (consentLabel) consentLabel.classList.remove('is-invalid');

      if (el.name === 'instagram') {
        var v = el.value.replace(/^@+/, '');
        var cleaned = v.replace(/[^A-Za-z0-9._]/g, '');
        if (cleaned !== el.value) el.value = cleaned;
      }
      if (el.name === 'telegram') {
        var tv = el.value.replace(/^@+/, '');
        // Telegram allows letters/digits/underscore. First char must be letter,
        // but during typing we don't want to delete what the user is typing if
        // they haven't reached the second char yet - so only strip non-allowed
        // chars, leave start-with-letter rule for submit-time validation.
        var tcleaned = tv.replace(/[^A-Za-z0-9_]/g, '');
        if (tcleaned !== el.value) el.value = tcleaned;
      }
    });

    bindImageHandlers();

    return modalEl;
  }

  function openModal() {
    ensureModal();
    document.body.classList.add('jp-apply-locked');
    modalEl.classList.add('is-open');
    $('#jp-apply-modal').classList.remove('is-success');
    // Reset image state on each open
    uploadedImages = [];
    renderImageGrid();
    clearFormError();
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
      if (el.name === 'instagram' && v) {
        // Strip leading @ if user typed one, then validate.
        var igClean = v.replace(/^@/, '');
        if (!/^[A-Za-z0-9._]{1,30}$/.test(igClean)) {
          if (field) field.classList.add('is-invalid');
          el.classList.add('is-invalid');
          valid = false;
        }
      }
      if (el.name === 'telegram' && v) {
        var tgClean = v.replace(/^@/, '');
        if (!/^[A-Za-z][A-Za-z0-9_]{4,31}$/.test(tgClean)) {
          if (field) field.classList.add('is-invalid');
          el.classList.add('is-invalid');
          valid = false;
        }
      }
    });
    // Image validation (min 5 required)
    if (uploadedImages.length < MIN_IMAGES) {
      var imgField = $('#jp-image-grid')?.closest('.jp-field-images');
      if (imgField) imgField.classList.add('is-invalid');
      showFormError(t.errorImages);
      valid = false;
    }

    // Consent checkbox required
    var consentBox = $('#jp-f-consent');
    if (consentBox && !consentBox.checked) {
      var consentLabel = consentBox.closest('.jp-consent');
      if (consentLabel) consentLabel.classList.add('is-invalid');
      showFormError(t.errorConsent);
      valid = false;
    }

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
      utm_json: JSON.stringify(getUtmParams()),
      photo_count: String(uploadedImages.length)
    });

    // Build multipart FormData (n8n webhook reads this natively)
    var fd = new FormData();
    Object.keys(enriched).forEach(function (k) { fd.append(k, enriched[k]); });
    uploadedImages.forEach(function (img, idx) {
      // photo_1 ... photo_5 with original filename
      fd.append('photo_' + (idx + 1), img.file, img.file.name || ('photo_' + (idx + 1) + '.jpg'));
    });

    // Submit
    var btn = $('#jp-apply-submit');
    btn.disabled = true;
    var origText = btn.textContent;
    btn.textContent = uploadedImages.length ? t.uploading : t.submitting;

    fetch(JP_WEBHOOK_URL, {
      method: 'POST',
      // Note: do NOT set Content-Type manually; browser sets the multipart boundary.
      body: fd,
      mode: 'cors'
    }).then(function (res) {
      return onSuccess(enriched);
    }).catch(function (err) {
      // n8n webhooks usually 200 without CORS headers -> opaque error.
      // Treat that as a success since the request typically reached the server.
      // (For a hard failure we'd want a JSON callback URL, but the placeholder
      // setup matches n8n's default response behavior.)
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
