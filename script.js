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
  var printSsid = '';
  var printPassword = '';
  var form = document.getElementById('wifi-form');
  var output = document.getElementById('output');
  var qrEl = document.getElementById('qrcode');
  var printCreds = document.getElementById('print-credentials');

  function isMobile() {
    return /iPhone|iPad|iPod|Android/i.test(navigator.userAgent) ||
      (navigator.maxTouchPoints > 0 && window.innerWidth <= 768);
  }

  function loadScript(src) {
    return new Promise(function (resolve, reject) {
      if (document.querySelector('script[src="' + src + '"]')) {
        resolve();
        return;
      }
      var s = document.createElement('script');
      s.src = src;
      s.onload = resolve;
      s.onerror = reject;
      document.head.appendChild(s);
    });
  }

  function renderQR(text, size) {
    qrEl.innerHTML = '';
    new QRCode(qrEl, { text: text, width: size, height: size });
  }

  function openPdfFromQr(canvas, ssid, password, callback) {
    var JSPDF_URL = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js';
    loadScript(JSPDF_URL).then(function () {
      try {
        var jsPDF = window.jspdf.jsPDF;
        var doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
        var pageW = 210;
        var pageH = 297;
        var qrSize = 160;
        var qrX = (pageW - qrSize) / 2;
        var qrY = 15;
        doc.addImage(canvas.toDataURL('image/png'), 'PNG', qrX, qrY, qrSize, qrSize);
        var textY = qrY + qrSize + 12;
        doc.setFontSize(11);
        doc.text('Network: ' + ssid, pageW / 2, textY, { align: 'center' });
        doc.text('Password: ' + (password || '(no password)'), pageW / 2, textY + 7, { align: 'center' });
        var blob = doc.output('blob');
        var url = URL.createObjectURL(blob);
        var printWindow = window.open(url, '_blank');
        setTimeout(function () {
          if (printWindow && !printWindow.closed) {
            try { printWindow.print(); } catch (e) {}
          }
          URL.revokeObjectURL(url);
        }, 1500);
      } catch (err) {
        console.error(err);
        if (typeof callback === 'function') callback();
        else window.print();
      }
      if (typeof callback === 'function') callback();
    }).catch(function () {
      if (typeof callback === 'function') callback();
      window.print();
    });
  }

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var ssid = document.getElementById('ssid').value.trim();
    var password = document.getElementById('password').value;
    var security = document.getElementById('security').value;
    var hidden = document.getElementById('hidden').checked;

    wifiString = buildWifiString(ssid, password, security, hidden);
    printSsid = ssid;
    printPassword = password;
    renderQR(wifiString, 260);

    printCreds.innerHTML =
      '<div class="credential-line"><span class="credential-label">Network:</span>' + escapeHtml(ssid) + '</div>' +
      '<div class="credential-line"><span class="credential-label">Password:</span>' + escapeHtml(password || '(no password)') + '</div>';

    output.removeAttribute('hidden');
    output.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  });

  var printBtn = document.getElementById('print-btn');

  document.getElementById('download-btn').addEventListener('click', function () {
    var canvas = qrEl.querySelector('canvas');
    if (!canvas) return;
    var a = document.createElement('a');
    a.download = 'wifi-qr.png';
    a.href = canvas.toDataURL('image/png');
    a.click();
  });

  printBtn.addEventListener('click', function () {
    if (!wifiString) return;
    if (isMobile()) {
      renderQR(wifiString, 1200);
      setTimeout(function () {
        var canvas = qrEl.querySelector('canvas');
        if (!canvas) return;
        openPdfFromQr(canvas, printSsid, printPassword, function () {
          renderQR(wifiString, 260);
        });
      }, 150);
      return;
    }
    function restore() {
      renderQR(wifiString, 260);
      window.removeEventListener('afterprint', restore);
    }
    window.addEventListener('afterprint', restore);
    renderQR(wifiString, 1200);
    window.print();
  });
})();
