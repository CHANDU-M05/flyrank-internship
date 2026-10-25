(function () {
  var scriptTag = document.currentScript;
  var widgetId = new URL(scriptTag.src).searchParams.get('id');
  if (!widgetId) {
    console.error('[flyrank-widget] missing ?id= on script src');
    return;
  }

  var apiOrigin = new URL(scriptTag.src).origin;

  fetch(apiOrigin + '/widgets/' + widgetId + '/config')
    .then(function (res) {
      if (!res.ok) throw new Error('config fetch failed: ' + res.status);
      return res.json();
    })
    .then(function (payload) {
      render(payload.widget);
    })
    .catch(function (err) {
      console.error('[flyrank-widget] failed to load widget', err);
    });

  function render(widget) {
    var container = document.createElement('div');
    container.className = 'flyrank-widget';
    container.style.cssText =
      'max-width:360px;padding:16px;border:1px solid #ddd;border-radius:8px;font-family:sans-serif;';

    var title = document.createElement('h3');
    title.textContent = widget.title;
    container.appendChild(title);

    if (widget.description) {
      var desc = document.createElement('p');
      desc.textContent = widget.description;
      desc.style.cssText = 'color:#555;font-size:14px;margin-top:-8px;';
      container.appendChild(desc);
    }

    var form = document.createElement('form');

    widget.fields.forEach(function (field) {
      var label = document.createElement('label');
      label.textContent = field.label;
      label.style.cssText = 'display:block;margin-top:8px;font-size:13px;';

      var input = document.createElement(field.type === 'textarea' ? 'textarea' : 'input');
      if (field.type !== 'textarea') input.type = field.type || 'text';
      input.name = field.name;
      input.required = !!field.required;
      input.style.cssText = 'width:100%;padding:6px;margin-top:4px;box-sizing:border-box;';

      label.appendChild(input);
      form.appendChild(label);
    });

    // Honeypot: real visitors never see or fill this. Bots that
    // autofill every input on the page usually do.
    var honeypot = document.createElement('input');
    honeypot.type = 'text';
    honeypot.name = 'website';
    honeypot.autocomplete = 'off';
    honeypot.tabIndex = -1;
    honeypot.style.cssText = 'position:absolute;left:-9999px;opacity:0;height:0;width:0;';
    form.appendChild(honeypot);

    var submitBtn = document.createElement('button');
    submitBtn.type = 'submit';
    submitBtn.textContent = widget.button_text || 'Submit';
    submitBtn.style.cssText = 'margin-top:12px;padding:8px 16px;cursor:pointer;';
    form.appendChild(submitBtn);

    var status = document.createElement('p');
    status.style.cssText = 'font-size:13px;margin-top:8px;';
    form.appendChild(status);

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var formData = new FormData(form);
      var data = {};
      formData.forEach(function (value, key) {
        if (key !== 'website') data[key] = value;
      });

      submitBtn.disabled = true;
      status.textContent = 'Sending...';

      fetch(apiOrigin + '/submissions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ widgetId: widget.id, data: data, website: formData.get('website') }),
      })
        .then(function (res) {
          if (res.status === 429) {
            status.textContent = "You're submitting too fast — try again in a bit.";
            return;
          }
          if (!res.ok) throw new Error('submission failed: ' + res.status);
          status.textContent = 'Thanks! We got it.';
          form.reset();
        })
        .catch(function (err) {
          console.error('[flyrank-widget] submission error', err);
          status.textContent = 'Something went wrong. Please try again.';
        })
        .finally(function () {
          submitBtn.disabled = false;
        });
    });

    container.appendChild(form);
    scriptTag.insertAdjacentElement('afterend', container);
  }
})();
