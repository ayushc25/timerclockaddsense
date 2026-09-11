(function () {
  var form = document.getElementById('contact-form');
  if (!form) return;

  var EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  function setInvalid(field, invalid) {
    if (invalid) {
      field.setAttribute('aria-invalid', 'true');
    } else {
      field.removeAttribute('aria-invalid');
    }
  }

  form.addEventListener('submit', function (event) {
    event.preventDefault();

    var name = document.getElementById('contact-name');
    var email = document.getElementById('contact-email');
    var subject = document.getElementById('contact-subject');
    var message = document.getElementById('contact-message');

    var valid = true;

    [name, subject, message].forEach(function (field) {
      var empty = !field.value || !field.value.trim();
      setInvalid(field, empty);
      if (empty) valid = false;
    });

    var emailValid = EMAIL_RE.test(email.value.trim());
    setInvalid(email, !emailValid);
    if (!emailValid) valid = false;

    if (!valid) {
      var firstInvalid = form.querySelector('[aria-invalid="true"]');
      if (firstInvalid) firstInvalid.focus();
      if (window.TimerHubToast) {
        window.TimerHubToast('Please fill in all fields with a valid email address.');
      }
      return;
    }

    form.reset();
    [name, email, subject, message].forEach(function (field) {
      setInvalid(field, false);
    });

    if (window.TimerHubToast) {
      window.TimerHubToast('Thanks — we will get back to you soon.');
    }
  });
})();
