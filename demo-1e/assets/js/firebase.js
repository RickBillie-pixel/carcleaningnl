// Firebase Analytics voor de gehoste versie. Wordt alleen geladen op de
// Firebase-domeinen, zodat lokaal werken en het screenshotharnas geen externe
// verzoeken doen en offline blijven werken.
const HOSTS = ["web.app", "firebaseapp.com"];
const host = location.hostname;

if (HOSTS.some((h) => host === h || host.endsWith("." + h))) {
  const cfg = {
    apiKey: "AIzaSyDP809kZ9MefVoAQVkj07jXdPq6u_Cla2k",
    authDomain: "carcleaningnl-d8ec7.firebaseapp.com",
    projectId: "carcleaningnl-d8ec7",
    storageBucket: "carcleaningnl-d8ec7.firebasestorage.app",
    messagingSenderId: "178199076872",
    appId: "1:178199076872:web:155fdc9dac0cee62b5f1bd",
    measurementId: "G-0XW0B00D7X",
  };
  const BASE = "https://www.gstatic.com/firebasejs/11.6.0/";
  try {
    const [{ initializeApp }, { getAnalytics }] = await Promise.all([
      import(BASE + "firebase-app.js"),
      import(BASE + "firebase-analytics.js"),
    ]);
    getAnalytics(initializeApp(cfg));
  } catch (err) {
    // Analytics mag de pagina nooit tegenhouden.
    console.warn("Firebase Analytics niet geladen:", err);
  }
}
