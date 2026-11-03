/*
 * Sends the contact form to the booking system, so website enquiries land in
 * the staff Enquiries screen and get the same confirmation email as enquiries
 * made on book.thefrozengarden.in.
 */
(function () {
  var API = 'https://book.thefrozengarden.in/api/enquiries';
  var form = document.getElementById('enquiryForm');
  if (!form) return;
  var status = document.getElementById('enquiryStatus');
  var button = form.querySelector('button[type="submit"]');

  function show(text, ok) {
    status.textContent = text;
    status.style.color = ok ? '#7fe0c0' : '#ff9d9d';
  }

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var data = {
      name: form.name.value.trim(),
      phone: form.phone.value.trim(),
      email: form.email.value.trim(),
      type: form.type.value,
      message: form.message.value.trim(),
      company: form.company.value,
      source: 'thefrozengarden.in',
    };
    if (data.name.length < 2) return show('Please enter your name.', false);
    if (data.phone.replace(/\D/g, '').length < 10) return show('Please enter a 10-digit phone number.', false);

    button.disabled = true;
    show('Sending…', true);
    fetch(API, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'omit',
      body: JSON.stringify(data),
    })
      .then(function (res) {
        return res.json().catch(function () { return {}; }).then(function (body) {
          return { ok: res.ok, body: body };
        });
      })
      .then(function (r) {
        if (r.ok) {
          form.reset();
          show('Thank you. We have your message and will call or WhatsApp you within a day.', true);
          return;
        }
        var detail = r.body.details && r.body.details[0] && r.body.details[0].message;
        show(detail || r.body.message || 'That didn’t send. Please call or WhatsApp +91 90467 88988.', false);
      })
      .catch(function () {
        show('That didn’t send. Please call or WhatsApp +91 90467 88988.', false);
      })
      .then(function () {
        button.disabled = false;
      });
  });
})();
