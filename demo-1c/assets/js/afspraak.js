// Booking form: builds a WhatsApp message. Asks as little as possible.
(function () {
  "use strict";
  var LABELS = {
    compleet: "Interieur & Exterieur compleet (€239)",
    premium: "Interieur & Exterieur premium (€439)",
    showroom: "Interieur & Exterieur showroom (€639)",
    bekledingsreiniging: "Bekledingsreiniging (€59)",
    ozonbehandeling: "Ozonbehandeling (€79)",
    leerbehandeling: "Leerbehandeling (€79)",
    interieur: "Interieur reiniging (€139)",
    koplamp: "Koplamp restauratie (€69)",
    cabriodak: "Cabriodak reinigen (€119)",
    exterieur: "Exterieur reiniging (€139)",
    polijsten: "Polijsten (€179)",
    coating: "Keramische coating (€899)",
    overleg: "Overleg gewenst"
  };

  // Preselect from ?dienst=
  var params = new URLSearchParams(location.search);
  var pre = params.get("dienst");
  var select = document.getElementById("dienst");
  if (pre && select && LABELS[pre]) select.value = pre;

  var form = document.getElementById("bookform");
  if (!form) return;

  function validate() {
    var ok = true;
    [select, document.getElementById("naam")].forEach(function (input) {
      var field = input.closest(".field");
      var err = field.querySelector(".field__error");
      var bad = !input.value.trim();
      field.classList.toggle("is-invalid", bad);
      if (err) err.hidden = !bad;
      if (bad) ok = false;
    });
    return ok;
  }

  function buildMessage() {
    var dienst = LABELS[select.value] || select.value;
    var naam = document.getElementById("naam").value.trim();
    var plaats = document.getElementById("plaats").value.trim();
    var wens = document.getElementById("wens").value.trim();
    var ophalen = document.getElementById("ophalen").checked;
    var lines = [
      "Hoi CarCleaningNL, ik wil graag een afspraak maken.",
      "Dienst: " + dienst,
      "Naam: " + naam
    ];
    if (plaats) lines.push("Woonplaats: " + plaats);
    lines.push("Halen en brengen: " + (ophalen ? "ja, graag" : "nee, ik kom langs"));
    if (wens) lines.push("Wanneer: " + wens);
    return lines.join("\n");
  }

  function send() {
    window.open("https://wa.me/31647421988?text=" + encodeURIComponent(buildMessage()), "_blank", "noopener");
    document.getElementById("bookdone").hidden = false;
  }

  form.addEventListener("submit", function (ev) {
    ev.preventDefault();
    if (!validate()) {
      var firstBad = form.querySelector(".is-invalid input, .is-invalid select");
      if (firstBad) firstBad.focus();
      return;
    }
    send();
  });

  var retry = document.getElementById("bookretry");
  if (retry) retry.addEventListener("click", function (ev) { ev.preventDefault(); send(); });
})();
