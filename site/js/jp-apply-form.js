/* JP Apply Form - on-domain Tally replacement.
   Replaces tally.so links + opens an in-page modal.
   Submits as multipart/form-data to the n8n webhook.
   Fires Meta Pixel `Lead` event on success. */

(function () {
  'use strict';

  // ============================================================
  // CONFIG
  // ============================================================
  // n8n webhook node: Method=POST, Binary Data=true, accepts multipart.
  // Reads each photo_1..photo_9 via $binary; all other fields top-level.
  var JP_WEBHOOK_URL = 'https://jpn8n.eu/webhook/14621d73-fba6-475b-84b3-c466b7016f48';

  // Image upload constraints
  var MIN_IMAGES = 5;
  var MAX_IMAGES = 15;
  var MAX_IMAGE_BYTES = 5 * 1024 * 1024;       // 5 MB per image
  var MAX_TOTAL_BYTES = 80 * 1024 * 1024;      // 80 MB combined (room for 15 photos)

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
      namePh: 'e.g. Maria Sanchez',
      email: 'Email',
      emailPh: 'e.g. maria@gmail.com',
      country: 'Country',
      countryPlaceholder: 'e.g. Germany',
      phone: 'Phone (WhatsApp)',
      phonePh: 'e.g. +49 170 1234567',
      instagram: 'Instagram',
      instagramPh: 'yourhandle',
      telegram: 'Telegram',
      telegramPh: 'yourhandle',
      age: 'Age',
      agePh: 'e.g. 24',
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
      errorPhone: 'Start with + and country code',
      errorInstagram: 'Check your handle',
      errorTelegram: 'Use at least 5 characters',
      images: 'Your photos',
      imagesHint: 'Add at least 5 of your best photos so we can review your application. (No nudes)',
      imagesMetaPre: '{n} of 5',
      imagesMetaMet: '{n} added',
      imagesMetaMore: '{n} added – you can add a few more',
      dropzoneTitle: 'Click to upload or drag photos here',
      dropzoneHint: 'JPG, PNG or WEBP – up to 5 MB each',
      dropzoneFull: 'Maximum reached',
      errorImages: 'Please add 5 photos to continue',
      errorImageType: 'Only JPG, PNG, or WEBP',
      errorImageSize: 'Each photo must be under 5 MB',
      errorTotalSize: 'Total upload size must be under 80 MB',
      consent: 'By submitting your information, you give your consent for JP Management to contact you to verify your details. If your application is approved, your information may be shared with our network of partners to find you a manager and a team to work with.',
      errorConsent: 'Please confirm to continue',
      footer: '<a href="/Privacy-Policy">Privacy Policy</a>'
    },
    es: {
      badge: 'Aplicación',
      title: 'Aplica a JP Management',
      sub: 'Rellena lo basico. Respondemos en menos de 12 horas por WhatsApp o Telegram.',
      name: 'Nombre completo',
      namePh: 'p.ej. Maria Sanchez',
      email: 'Email',
      emailPh: 'p.ej. maria@gmail.com',
      country: 'Pais',
      countryPlaceholder: 'p.ej. Espana',
      phone: 'Telefono (WhatsApp)',
      phonePh: 'p.ej. +34 600 12 34 56',
      instagram: 'Instagram',
      instagramPh: 'tu_usuario',
      telegram: 'Telegram',
      telegramPh: 'tu_usuario',
      age: 'Edad',
      agePh: 'p.ej. 24',
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
      errorPhone: 'Empieza con + y codigo de pais',
      errorInstagram: 'Revisa tu usuario',
      errorTelegram: 'Usa al menos 5 caracteres',
      images: 'Tus fotos',
      imagesHint: 'Anade al menos 5 de tus mejores fotos para que revisemos tu solicitud. (Sin desnudos)',
      imagesMetaPre: '{n} de 5',
      imagesMetaMet: '{n} anadidas',
      imagesMetaMore: '{n} anadidas – puedes anadir alguna mas',
      dropzoneTitle: 'Haz clic o arrastra tus fotos aqui',
      dropzoneHint: 'JPG, PNG o WEBP – hasta 5 MB cada una',
      dropzoneFull: 'Maximo alcanzado',
      errorImages: 'Anade 5 fotos para continuar',
      errorImageType: 'Solo JPG, PNG o WEBP',
      errorImageSize: 'Cada foto debe ser menor a 5 MB',
      errorTotalSize: 'El tamano total debe ser menor a 80 MB',
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

  // Tracking field allow-list. Anything outside this set gets dropped to keep
  // the payload predictable for the n8n workflow + downstream sheets.
  var TRACKING_KEYS = [
    'utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content',
    'fbclid', 'gclid', 'ttclid', 'msclkid', 'li_fat_id',
    'ref', 'tg'
  ];

  function getTrackingParams() {
    var out = {};
    // 1) URL params (highest priority - latest click wins)
    var p = new URLSearchParams(window.location.search);
    TRACKING_KEYS.forEach(function (k) {
      var v = p.get(k);
      if (v) out[k] = v;
    });
    // 2) Restore from sessionStorage (utm-forward.js stores URL-encoded
    // query string at "jp_utm_params" - same format the rest of the site uses).
    try {
      var stored = sessionStorage.getItem('jp_utm_params');
      if (stored) {
        var s = new URLSearchParams(stored);
        TRACKING_KEYS.forEach(function (k) {
          if (!out[k]) {
            var v = s.get(k);
            if (v) out[k] = v;
          }
        });
      }
    } catch (e) {}
    return out;
  }

  function readCookie(name) {
    try {
      var m = document.cookie.match(new RegExp('(?:^|; )' + name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '=([^;]*)'));
      return m ? decodeURIComponent(m[1]) : '';
    } catch (e) { return ''; }
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

    var dropzoneHtml = '' +
      '<button type="button" class="jp-dropzone" id="jp-image-dropzone">' +
        '<svg class="jp-dropzone-icon" viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
          '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>' +
          '<polyline points="17 8 12 3 7 8"></polyline>' +
          '<line x1="12" y1="3" x2="12" y2="15"></line>' +
        '</svg>' +
        '<span class="jp-dropzone-title">' + t.dropzoneTitle + '</span>' +
        '<span class="jp-dropzone-hint">' + t.dropzoneHint + '</span>' +
      '</button>';

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
              '<input id="jp-f-name" name="name" type="text" autocomplete="name" placeholder="' + t.namePh + '" required>' +
              '<div class="jp-field-error">' + t.errorRequired + '</div>' +
            '</div>' +
            '<div class="jp-row-2">' +
              '<div class="jp-field">' +
                '<label for="jp-f-email">' + t.email + '</label>' +
                '<input id="jp-f-email" name="email" type="email" autocomplete="email" placeholder="' + t.emailPh + '" required>' +
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
                '<input id="jp-f-phone" name="phone" type="tel" autocomplete="tel" inputmode="tel" placeholder="' + t.phonePh + '" required>' +
                '<div class="jp-field-error">' + t.errorPhone + '</div>' +
              '</div>' +
              '<div class="jp-field">' +
                '<label for="jp-f-age">' + t.age + '</label>' +
                '<input id="jp-f-age" name="age" type="number" min="18" max="99" placeholder="' + t.agePh + '" required>' +
                '<div class="jp-field-error">' + t.errorAge + '</div>' +
              '</div>' +
            '</div>' +
            '<div class="jp-row-2">' +
              '<div class="jp-field">' +
                '<label for="jp-f-instagram">' + t.instagram + '</label>' +
                '<div class="jp-prefix-input" data-prefix="@">' +
                  '<input id="jp-f-instagram" name="instagram" type="text" pattern="[A-Za-z0-9._]{1,30}" maxlength="30" placeholder="' + t.instagramPh + '" required>' +
                '</div>' +
                '<div class="jp-field-error" data-error-key="instagram">' + t.errorInstagram + '</div>' +
              '</div>' +
              '<div class="jp-field">' +
                '<label for="jp-f-telegram">' + t.telegram + '</label>' +
                '<div class="jp-prefix-input" data-prefix="@">' +
                  '<input id="jp-f-telegram" name="telegram" type="text" pattern="[A-Za-z][A-Za-z0-9_]{4,31}" minlength="5" maxlength="32" placeholder="' + t.telegramPh + '" required>' +
                '</div>' +
                '<div class="jp-field-error" data-error-key="telegram">' + t.errorTelegram + '</div>' +
              '</div>' +
            '</div>' +
            '<div class="jp-field jp-field-images">' +
              '<div class="jp-images-header">' +
                '<label>' + t.images + '</label>' +
                '<span class="jp-images-meta" id="jp-images-meta">' + t.imagesMetaPre.replace('{n}', '0') + '</span>' +
              '</div>' +
              '<p class="jp-images-hint">' + t.imagesHint + '</p>' +
              dropzoneHtml +
              '<div class="jp-image-thumbs" id="jp-image-thumbs"></div>' +
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
    var thumbs = $('#jp-image-thumbs');
    var dropzone = $('#jp-image-dropzone');
    var fieldEl = thumbs && thumbs.closest('.jp-field-images');
    if (!thumbs) return;

    // Re-render thumbnails (only actually uploaded photos).
    thumbs.innerHTML = '';
    uploadedImages.forEach(function (img, idx) {
      var thumb = document.createElement('div');
      thumb.className = 'jp-thumb';
      var picture = document.createElement('img');
      picture.src = img.dataUrl;
      picture.alt = 'photo-' + (idx + 1);
      var rm = document.createElement('button');
      rm.type = 'button';
      rm.className = 'jp-thumb-remove';
      rm.setAttribute('aria-label', 'Remove photo');
      rm.textContent = '×';
      rm.addEventListener('click', function (e) {
        e.preventDefault();
        e.stopPropagation();
        uploadedImages.splice(idx, 1);
        renderImageGrid();
      });
      thumb.appendChild(picture);
      thumb.appendChild(rm);
      thumbs.appendChild(thumb);
    });

    // Once at least one photo is uploaded, the big dropzone collapses into a
    // small "+ add" tile inside the thumb grid. Keeps the modal compact.
    if (uploadedImages.length > 0 && uploadedImages.length < MAX_IMAGES) {
      var addTile = document.createElement('button');
      addTile.type = 'button';
      addTile.className = 'jp-thumb jp-thumb-add';
      addTile.setAttribute('aria-label', t.dropzoneTitle);
      addTile.textContent = '+';
      addTile.addEventListener('click', function (e) {
        e.preventDefault();
        var input = $('#jp-image-input');
        if (input) input.click();
      });
      thumbs.appendChild(addTile);
    }

    // Counter copy
    var meta = $('#jp-images-meta');
    if (meta) {
      var n = uploadedImages.length;
      var tpl;
      if (n < MIN_IMAGES) tpl = t.imagesMetaPre;
      else if (n < MAX_IMAGES) tpl = t.imagesMetaMore;
      else tpl = t.imagesMetaMet;
      meta.textContent = tpl.replace('{n}', String(n));
      meta.classList.toggle('is-met', n >= MIN_IMAGES);
    }

    // Dropzone state - hide once max reached, otherwise active
    if (dropzone) {
      var full = uploadedImages.length >= MAX_IMAGES;
      dropzone.classList.toggle('is-full', full);
      dropzone.disabled = full;
      var titleEl = dropzone.querySelector('.jp-dropzone-title');
      if (titleEl) titleEl.textContent = full ? t.dropzoneFull : t.dropzoneTitle;
    }

    if (fieldEl) {
      fieldEl.classList.remove('is-invalid');
      fieldEl.classList.toggle('has-thumbs', uploadedImages.length > 0);
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
    var dropzone = $('#jp-image-dropzone');
    var input = $('#jp-image-input');
    if (!dropzone || !input) return;

    dropzone.addEventListener('click', function (e) {
      e.preventDefault();
      if (dropzone.disabled) return;
      input.click();
    });

    input.addEventListener('change', function () {
      addFiles(input.files);
      input.value = '';
    });

    ['dragenter', 'dragover'].forEach(function (ev) {
      dropzone.addEventListener(ev, function (e) {
        e.preventDefault();
        e.stopPropagation();
        if (!dropzone.disabled) dropzone.classList.add('is-dragging');
      });
    });
    ['dragleave', 'drop'].forEach(function (ev) {
      dropzone.addEventListener(ev, function (e) {
        e.preventDefault();
        e.stopPropagation();
        dropzone.classList.remove('is-dragging');
      });
    });
    dropzone.addEventListener('drop', function (e) {
      if (dropzone.disabled) return;
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
    function clearErrorsFor(el) {
      if (!el) return;
      var field = el.closest('.jp-field');
      if (field) field.classList.remove('is-invalid');
      el.classList.remove('is-invalid');
      var consentLabel = el.closest('.jp-consent');
      if (consentLabel) consentLabel.classList.remove('is-invalid');
      // Hide the form-level error banner as soon as the user starts fixing.
      clearFormError();
    }
    $('#jp-apply-form').addEventListener('input', function (e) {
      var el = e.target;
      clearErrorsFor(el);

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
      if (el.name === 'phone') {
        // Allow only digits, spaces, dashes, parens; force a leading "+" so
        // the country code is unambiguous for ops + WhatsApp deeplinks.
        var pv = el.value.replace(/[^\d+\s()\-]/g, '').replace(/\++/g, '+');
        if (pv && pv[0] !== '+') pv = '+' + pv;
        if (pv !== el.value) el.value = pv;
      }
    });
    // Checkbox + datalist <input> often fire `change` instead of `input` when
    // selecting a value - make sure the red state clears for those too.
    $('#jp-apply-form').addEventListener('change', function (e) {
      clearErrorsFor(e.target);
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
      if (el.name === 'phone' && v) {
        // Must start with "+" and have at least 7 digits total.
        var digits = v.replace(/\D/g, '');
        if (v[0] !== '+' || digits.length < 7) {
          if (field) field.classList.add('is-invalid');
          el.classList.add('is-invalid');
          valid = false;
        }
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
      var imgField = document.querySelector('.jp-field-images');
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
    data.consent = consentBox && consentBox.checked ? 'true' : 'false';

    // Tracking + attribution - flat fields so n8n can map them 1:1 to columns
    var tracking = getTrackingParams();
    TRACKING_KEYS.forEach(function (k) {
      if (!(k in tracking)) tracking[k] = '';
    });

    // Meta Pixel cookies for server-side CAPI matching
    var fbp = readCookie('_fbp');
    var fbc = readCookie('_fbc');
    // If we have an fbclid in URL but no _fbc cookie yet, synthesize it
    // (Meta's documented fallback format).
    if (!fbc && tracking.fbclid) {
      fbc = 'fb.1.' + Date.now() + '.' + tracking.fbclid;
    }

    // Enrich
    var enriched = Object.assign({}, data, tracking, {
      lang: lang,
      form_id: 'jp_apply_v1',
      page_url: window.location.href,
      page_path: window.location.pathname,
      page_title: document.title,
      referrer: document.referrer || '',
      submitted_at: new Date().toISOString(),
      user_agent: navigator.userAgent || '',
      screen_size: (window.screen ? window.screen.width + 'x' + window.screen.height : ''),
      timezone: (function () { try { return Intl.DateTimeFormat().resolvedOptions().timeZone || ''; } catch (e) { return ''; } })(),
      fbp: fbp,
      fbc: fbc,
      photo_count: String(uploadedImages.length)
    });

    // Build multipart FormData (n8n webhook reads this natively)
    var fd = new FormData();
    Object.keys(enriched).forEach(function (k) { fd.append(k, enriched[k]); });
    uploadedImages.forEach(function (img, idx) {
      // photo_1 ... photo_9 with original filename
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

    // Go straight to the thank-you page - no in-modal confirmation, otherwise
    // the user sees two consecutive "thanks" screens. Tiny pause lets fbq +
    // dataLayer queue their beacons before navigation.
    setTimeout(function () {
      window.location.href = THANK_YOU_URLS[lang] || THANK_YOU_URLS.en;
    }, 200);
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
