function buildWifiString(ssid, password, security, hidden) {
  var t = security === 'nopass' ? '' : security;
  var s = escapeField(ssid);
  var p = password ? escapeField(password) : '';
  var h = hidden ? 'H:true;' : '';
  return 'WIFI:T:' + t + ';S:' + s + ';P:' + p + ';' + h + ';';
}

function escapeField(str) {
  return (str + '').replace(/[\\;:,]/g, '\\$&');
}

function escapeHtml(str) {
  var el = document.createElement('div');
  el.textContent = str;
  return el.innerHTML;
}

(function () {
  var wifiString = '';
  var form = document.getElementById('wifi-form');
  var output = document.getElementById('output');
  var qrEl = document.getElementById('qrcode');
  var printCreds = document.getElementById('print-credentials');

  function renderQR(text, size) {
    qrEl.innerHTML = '';
    new QRCode(qrEl, { text: text, width: size, height: size });
  }

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var ssid = document.getElementById('ssid').value.trim();
    var password = document.getElementById('password').value;
    var security = document.getElementById('security').value;
    var hidden = document.getElementById('hidden').checked;

    wifiString = buildWifiString(ssid, password, security, hidden);
    renderQR(wifiString, 260);

    printCreds.innerHTML =
      '<div class="credential-line"><span class="credential-label">Network:</span>' + escapeHtml(ssid) + '</div>' +
      '<div class="credential-line"><span class="credential-label">Password:</span>' + escapeHtml(password || '(no password)') + '</div>';

    output.removeAttribute('hidden');
    output.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  });

  document.getElementById('download-btn').addEventListener('click', function () {
    var canvas = qrEl.querySelector('canvas');
    if (!canvas) return;
    var a = document.createElement('a');
    a.download = 'wifi-qr.png';
    a.href = canvas.toDataURL('image/png');
    a.click();
  });

  document.getElementById('print-btn').addEventListener('click', function () {
    if (!wifiString) return;
    function restore() {
      renderQR(wifiString, 260);
      window.removeEventListener('afterprint', restore);
    }
    window.addEventListener('afterprint', restore);
    renderQR(wifiString, 1200);
    window.print();
  });
})();
