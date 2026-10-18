import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.0/firebase-app.js";
import {
  getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword,
  onAuthStateChanged, signOut, sendEmailVerification, sendPasswordResetEmail
} from "https://www.gstatic.com/firebasejs/10.7.0/firebase-auth.js";
import { getFirestore, collection, addDoc, serverTimestamp }
  from "https://www.gstatic.com/firebasejs/10.7.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyAkVn1rj2klXafSTkf30K6lsJNSJhu3Ryw",
  authDomain: "securityhire-fc26f.firebaseapp.com",
  projectId: "securityhire-fc26f",
  storageBucket: "securityhire-fc26f.firebasestorage.app",
  messagingSenderId: "234313705418",
  appId: "1:234313705418:web:4fce21c507c5ab62f01133",
  measurementId: "G-84P3Q1NCY7"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// सिर्फ़ UI की सुविधा के लिए। असली सुरक्षा Firestore Rules में है।
const ADMIN_EMAILS = ["mjha12527@gmail.com"];

const COMPANY_RE = /^[^\s@]+@(sisindia|group4india)\.com$/;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_RE = /^[6-9]\d{9}$/;

const SKILLS = [
  "सीसीटीवी (CCTV)", "फिजिकल गार्डिंग", "फायर एंड सेफ्टी", "क्राइसिस मैनेजमेंट",
  "एक्सेस कंट्रोल", "टीम सुपरविजन", "मटेरियल हैंडलिंग", "भूतपूर्व सैनिक (Ex-Servicemen)"
];

// Rules वाली लिस्ट से बड़ी रखें, ताकि क्लाइंट पहले पकड़ ले
const SCAM_WORDS = [
  'fee', 'fees', 'deposit', 'advance', 'registration', 'paisa', 'paise', 'visa',
  'पैसा', 'पैसे', 'फीस', 'फ़ीस', 'एडवांस', 'डिपॉजिट', 'रजिस्ट्रेशन',
  'वीजा', 'वीज़ा', 'सिक्योरिटी मनी', 'security money'
];

const ERR = {
  'auth/email-already-in-use': 'यह ईमेल पहले से रजिस्टर है। लॉगिन करें।',
  'auth/invalid-email': 'ईमेल सही नहीं है।',
  'auth/weak-password': 'पासवर्ड कमज़ोर है। कम से कम 8 अक्षर रखें।',
  'auth/invalid-credential': 'ईमेल या पासवर्ड गलत है।',
  'auth/user-not-found': 'ईमेल या पासवर्ड गलत है।',
  'auth/wrong-password': 'ईमेल या पासवर्ड गलत है।',
  'auth/too-many-requests': 'बहुत ज़्यादा कोशिशें हुईं। थोड़ी देर बाद फिर कोशिश करें।',
  'auth/network-request-failed': 'इंटरनेट की समस्या है। कनेक्शन जाँचें।',
  'permission-denied': 'अनुमति नहीं मिली। ईमेल वेरिफ़ाई है या नहीं जाँचें और विवरण नियमों के अनुसार रखें।'
};
const errText = e => ERR[e && e.code] || 'कुछ गड़बड़ हुई। दोबारा कोशिश करें।';

const $ = id => document.getElementById(id);
const skillsBox = $('skillsBox');
const authBox = $('authBox');
const jobForm = $('jobForm');
const userBar = $('userBar');

// ---------- संदेश (alert की जगह) ----------
function showMsg(text, ok = false) {
  let box = $('msg');
  if (!box) {
    box = document.createElement('div');
    box.id = 'msg';
    box.setAttribute('role', 'status');
    box.setAttribute('aria-live', 'polite');
    box.style.cssText = 'margin:12px 0;padding:12px;border-radius:8px;font-size:16px;color:#1b1b1b;';
    authBox.parentNode.insertBefore(box, authBox);
  }
  box.style.background = ok ? '#e6f4ea' : '#fdecea';
  box.textContent = text;
  box.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

// ---------- स्किल्स (innerHTML के बिना) ----------
SKILLS.forEach(s => {
  const label = document.createElement('label');
  const cb = document.createElement('input');
  cb.type = 'checkbox';
  cb.name = 'skills';
  cb.value = s;
  label.append(cb, ' ' + s);
  skillsBox.appendChild(label);
});

// ---------- यूज़र बार ----------
function makeBtn(label, fn) {
  const b = document.createElement('button');
  b.type = 'button';
  b.textContent = label;
  b.style.cssText = 'margin:6px 6px 0 0;padding:10px 14px;font-size:16px;';
  b.addEventListener('click', fn);
  return b;
}

function renderUserBar(user) {
  userBar.textContent = '';
  if (!user) return;
  userBar.append(user.email + ' • ');
  const out = document.createElement('a');
  out.href = '#';
  out.textContent = 'लॉगआउट';
  out.addEventListener('click', e => { e.preventDefault(); signOut(auth); });
  userBar.append(out);

  if (!user.emailVerified) {
    const wrap = document.createElement('div');
    wrap.append(
      makeBtn('वेरिफ़िकेशन मेल दोबारा भेजें', async () => {
        try { await sendEmailVerification(auth.currentUser); showMsg('✅ मेल भेज दिया गया है।', true); }
        catch (e) { showMsg(errText(e)); }
      }),
      makeBtn('मैंने वेरिफ़ाई कर लिया', async () => {
        try {
          await auth.currentUser.reload();
          await auth.currentUser.getIdToken(true);
          renderUserBar(auth.currentUser);
          showMsg(auth.currentUser.emailVerified ? '✅ ईमेल वेरिफ़ाई हो गया।' : '❌ अभी वेरिफ़ाई नहीं दिख रहा।',
                  auth.currentUser.emailVerified);
        } catch (e) { showMsg(errText(e)); }
      })
    );
    userBar.appendChild(wrap);
  }
}

onAuthStateChanged(auth, user => {
  authBox.style.display = user ? 'none' : 'block';
  jobForm.style.display = user ? 'block' : 'none';
  renderUserBar(user);
});

// ---------- साइनअप / लॉगिन ----------
$('signupBtn').addEventListener('click', async () => {
  const email = $('email').value.trim().toLowerCase();
  const pass = $('pass').value;
  if (!EMAIL_RE.test(email)) return showMsg('सही ईमेल डालें।');
  if (pass.length < 8) return showMsg('पासवर्ड कम से कम 8 अक्षर का रखें।');
  if (!COMPANY_RE.test(email) && !ADMIN_EMAILS.includes(email)) {
    return showMsg('❌ सिर्फ ऑफिशियल कंपनी के ईमेल से ही अकाउंट बन सकता है (जैसे: @sisindia.com)');
  }
  try {
    const cred = await createUserWithEmailAndPassword(auth, email, pass);
    await sendEmailVerification(cred.user);
    showMsg('✅ अकाउंट बन गया! ईमेल पर वेरिफ़िकेशन लिंक भेजा गया है। उसे दबाने के बाद "मैंने वेरिफ़ाई कर लिया" बटन दबाएँ, तभी नौकरी पोस्ट होगी।', true);
  } catch (e) { showMsg(errText(e)); }
});

$('loginBtn').addEventListener('click', async () => {
  const email = $('email').value.trim().toLowerCase();
  const pass = $('pass').value;
  if (!email || !pass) return showMsg('ईमेल और पासवर्ड डालें।');
  try { await signInWithEmailAndPassword(auth, email, pass); }
  catch (e) { showMsg(errText(e)); }
});

// वैकल्पिक: HTML में <a href="#" id="forgotBtn">पासवर्ड भूल गए?</a> जोड़ें
const forgot = $('forgotBtn');
if (forgot) {
  forgot.addEventListener('click', async e => {
    e.preventDefault();
    const email = $('email').value.trim().toLowerCase();
    if (!EMAIL_RE.test(email)) return showMsg('पहले ऊपर अपना ईमेल डालें।');
    try { await sendPasswordResetEmail(auth, email); } catch (_) {}
    showMsg('अगर यह ईमेल रजिस्टर है तो पासवर्ड बदलने का लिंक भेज दिया गया है।', true);
  });
}

// ---------- हेल्पर ----------
function hasScam(text) {
  const t = text.toLowerCase();
  const squeezed = t.replace(/[\s.\-_*]+/g, '');
  return SCAM_WORDS.some(w => t.includes(w) || squeezed.includes(w.replace(/\s+/g, '')));
}

function normPhone(v) {
  let d = v.replace(/\D/g, '');
  if (d.length === 12 && d.startsWith('91')) d = d.slice(2);
  if (d.length === 11 && d.startsWith('0')) d = d.slice(1);
  return d;
}

// ---------- नौकरी पोस्ट ----------
let busy = false;

jobForm.addEventListener('submit', async e => {
  e.preventDefault();
  if (busy) return;
  const btn = jobForm.querySelector('button, input[type="submit"]');
  busy = true;
  if (btn) btn.disabled = true;

  try {
    let user = auth.currentUser;
    if (!user) return showMsg('पहले लॉगिन करें।');

    // ताज़ा वेरिफ़िकेशन स्थिति और टोकन (Rules email_verified टोकन से पढ़ते हैं)
    if (!user.emailVerified) { await user.reload(); user = auth.currentUser; }
    if (!user.emailVerified) {
      return showMsg('❌ आपका ईमेल वेरिफ़ाई नहीं है। इनबॉक्स (और स्पैम) में लिंक दबाएँ, फिर "मैंने वेरिफ़ाई कर लिया" दबाएँ।');
    }
    await user.getIdToken(true);

    const f = jobForm.elements;
    const val = n => (f[n] ? f[n].value : '').trim();

    const title = val('title'), company = val('company'), location = val('location');
    const experience = val('experience'), salary = val('salary'), dutyHours = val('dutyHours');
    const description = val('description'), contactEmail = val('contactEmail').toLowerCase();
    const phone = normPhone(val('contactPhone'));
    const wa = normPhone(val('contactWhatsapp'));

    if (title.length < 3 || title.length > 100) return showMsg('पद का नाम 3 से 100 अक्षर का हो।');
    if (company.length < 2 || company.length > 100) return showMsg('कंपनी का नाम 2 से 100 अक्षर का हो।');
    if (location.length < 2 || location.length > 100) return showMsg('लोकेशन 2 से 100 अक्षर की हो।');
    if (experience.length > 50) return showMsg('अनुभव 50 अक्षर तक लिखें।');
    if (salary.length > 50 || dutyHours.length > 50) return showMsg('सैलरी और ड्यूटी घंटे 50 अक्षर तक लिखें।');
    if (description.length < 6 || description.length > 1000) return showMsg('विवरण 6 से 1000 अक्षर का हो।');

    if (phone && !PHONE_RE.test(phone)) return showMsg('फोन नंबर 10 अंक का सही नंबर हो।');
    if (wa && !PHONE_RE.test(wa)) return showMsg('WhatsApp नंबर 10 अंक का सही नंबर हो।');
    if (contactEmail && (!EMAIL_RE.test(contactEmail) || contactEmail.length > 100)) {
      return showMsg('संपर्क ईमेल सही नहीं है।');
    }
    if (!phone && !wa && !contactEmail) return showMsg('कम से कम एक संपर्क (फोन/WhatsApp/ईमेल) दें।');

    if ([title, company, location, description, salary, dutyHours].some(hasScam)) {
      return showMsg('❌ नौकरी में पैसों की मांग (फीस, एडवांस, डिपॉज़िट, रजिस्ट्रेशन आदि) नहीं की जा सकती।');
    }

    const facilities = [...document.querySelectorAll('input[name="facilities"]:checked')].map(x => x.value).slice(0, 10);
    const skills = [...document.querySelectorAll('input[name="skills"]:checked')].map(x => x.value).slice(0, 10);

    const isAdmin = ADMIN_EMAILS.includes(user.email.toLowerCase());

    await addDoc(collection(db, 'jobs'), {
      title, company, location, experience, salary, dutyHours,
      facilities, description, skills,
      contactPhone: phone,
      contactWhatsapp: wa,
      contactEmail,
      postedBy: user.uid,
      postedAt: serverTimestamp(),
      status: isAdmin ? 'approved' : 'pending'
    });

    showMsg(isAdmin
      ? '✅ नौकरी सीधे लाइव हो गई है! (एडमिन)'
      : '✅ आपकी नौकरी सबमिट हो गई है! एडमिन के अप्रूवल के बाद यह गार्ड्स को दिखेगी।', true);
    jobForm.reset();
  } catch (err) {
    showMsg(errText(err));
  } finally {
    busy = false;
    if (btn) btn.disabled = false;
  }
})	
	

