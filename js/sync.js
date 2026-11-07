/*
 * Keeps this website in step with the booking system.
 *
 * Prices, rooms, contact details, policies and timings are read live from
 * https://book.thefrozengarden.in/api/public/site, so when the owner changes
 * the Rate card or contact details there, this site follows within minutes.
 *
 * Every value is also written into the HTML, so the page still reads
 * correctly if the booking system can't be reached or JavaScript is off.
 *
 * Markup:
 *   data-fg="packages.dayOuting.adult.veg" data-fg-format="inr"   → text
 *   data-fg-href="tel" | "whatsapp" | "mailto" | "maps"            → link
 *   data-fg-social="instagramUrl" | "facebookUrl"                  → link, hidden if not set
 *   data-fg-rooms                                                  → <tbody> rebuilt from rooms
 *   data-fg-list="packages.dayOuting.inclusions"                   → <ul> rebuilt
 */
(function () {
  var API = 'https://book.thefrozengarden.in/api/public/site';
  var CACHE_KEY = 'fg-site-v1';

  function get(obj, path) {
    return path.split('.').reduce(function (o, k) {
      return o == null ? undefined : o[k];
    }, obj);
  }

  function inr(n) {
    return '₹' + Number(n).toLocaleString('en-IN');
  }

  // "11:30" → "11:30 AM", "17:30" → "5:30 PM"
  function time(hhmm) {
    var p = String(hhmm).split(':');
    var h = Number(p[0]);
    var suffix = h >= 12 ? 'PM' : 'AM';
    var h12 = h % 12 === 0 ? 12 : h % 12;
    return h12 + ':' + p[1] + ' ' + suffix;
  }

  function format(value, kind) {
    if (value == null || value === '') return null;
    if (kind === 'inr') return inr(value);
    if (kind === 'time') return time(value);
    if (kind === 'minus1') return String(Number(value) - 1);
    return String(value);
  }

  function apply(data) {
    document.querySelectorAll('[data-fg]').forEach(function (el) {
      var text = format(get(data, el.getAttribute('data-fg')), el.getAttribute('data-fg-format'));
      if (text != null) el.textContent = text;
    });

    var b = data.brand || {};
    var links = {
      tel: b.phone && 'tel:' + b.phone,
      whatsapp: b.whatsapp && 'https://wa.me/' + String(b.whatsapp).replace(/\D/g, ''),
      mailto: b.email && 'mailto:' + b.email,
      maps: b.mapsUrl,
    };
    document.querySelectorAll('[data-fg-href]').forEach(function (el) {
      var href = links[el.getAttribute('data-fg-href')];
      if (href) el.setAttribute('href', href);
    });

    document.querySelectorAll('[data-fg-social]').forEach(function (el) {
      var url = b[el.getAttribute('data-fg-social')];
      if (url) {
        el.setAttribute('href', url);
        el.hidden = false;
      } else {
        el.hidden = true;
      }
    });

    document.querySelectorAll('[data-fg-list]').forEach(function (ul) {
      var items = get(data, ul.getAttribute('data-fg-list'));
      if (!Array.isArray(items) || !items.length) return;
      ul.textContent = '';
      items.forEach(function (item) {
        var li = document.createElement('li');
        li.textContent = item;
        ul.appendChild(li);
      });
    });

    document.querySelectorAll('[data-fg-rooms]').forEach(function (tbody) {
      if (!Array.isArray(data.rooms) || !data.rooms.length) return;
      tbody.textContent = '';
      data.rooms.forEach(function (r) {
        var tr = document.createElement('tr');
        [r.name, inr(r.rate) + ' / night', String(r.units)].forEach(function (cell) {
          var td = document.createElement('td');
          td.textContent = cell;
          tr.appendChild(td);
        });
        tbody.appendChild(tr);
      });
    });
  }

  // Show the last good copy straight away, then refresh from the API.
  try {
    var cached = sessionStorage.getItem(CACHE_KEY);
    if (cached) apply(JSON.parse(cached));
  } catch (e) {}

  fetch(API, { credentials: 'omit' })
    .then(function (res) {
      return res.ok ? res.json() : null;
    })
    .then(function (data) {
      if (!data) return;
      apply(data);
      try {
        sessionStorage.setItem(CACHE_KEY, JSON.stringify(data));
      } catch (e) {}
    })
    .catch(function () {
      // Keep the values already written into the page.
    });
})();
