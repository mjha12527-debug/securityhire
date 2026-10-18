import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.0/firebase-app.js";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.7.0/firebase-auth.js";
import { getFirestore, collection, addDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.7.0/firebase-firestore.js";

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

// यहाँ हमने एडमिन की ईमेल आईडी डाल दी है
const ADMIN_EMAILS = [
  "mjha12527@gmail.com",
  "second_admin@gmail.com"
];

const SKILLS = [
  "सीसीटीवी (CCTV)", "फिजिकल गार्डिंग", "फायर एंड सेफ्टी", "क्राइसिस मैनेजमेंट", 
  "एक्सेस कंट्रोल", "टीम सुपरविजन", "मटेरियल हैंडलिंग", "भूतपूर्व सैनिक (Ex-Servicemen)"
];

const skillsBox = document.getElementById('skillsBox');
SKILLS.forEach(s => {
  const l = document.createElement('label');
  l.innerHTML = `<input type="checkbox" name="skills" value="${s}"> ${s}`;
  skillsBox.appendChild(l);
});

const authBox = document.getElementById('authBox');
const jobForm = document.getElementById('jobForm');
const userBar = document.getElementById('userBar');

onAuthStateChanged(auth, user => {
  if (user) {
    authBox.style.display = 'none';
    jobForm.style.display = 'block';
    userBar.innerHTML = `${user.email} • <a href="#" id="logout">लॉगआउट</a>`;
    document.getElementById('logout').onclick = e => { e.preventDefault(); signOut(auth); };
  } else {
    authBox.style.display = 'block';
    jobForm.style.display = 'none';
    userBar.innerHTML = '';
  }
});

document.getElementById('signupBtn').onclick = async () => {
  const email = document.getElementById('email').value;
  const pass = document.getElementById('pass').value;
  if (!email || pass.length < 6) return alert('ईमेल और 6+ अक्षर का पासवर्ड डालें!');

  const allowedDomains = ['@sisindia.com', '@group4india.com'];
  // अगर ईमेल ऑफिशियल नहीं है और एडमिन भी नहीं है, तो रोक दें
  if (!allowedDomains.some(domain => email.endsWith(domain)) && !ADMIN_EMAILS.includes(email)) {
    return alert('❌ सिर्फ ऑफिशियल कंपनी के ईमेल से ही अकाउंट बन सकता है (जैसे: @sisindia.com)');
  }
  
  try { await createUserWithEmailAndPassword(auth, email, pass); }
  catch(e) { alert(e.message); }
};

document.getElementById('loginBtn').onclick = async () => {
  const email = document.getElementById('email').value;
  const pass = document.getElementById('pass').value;
  try { await signInWithEmailAndPassword(auth, email, pass); }
  catch(e) { alert(e.message); }
};

jobForm.onsubmit = async (e) => {
  e.preventDefault();
  const f = jobForm;

  const facilities = [...document.querySelectorAll('input[name="facilities"]:checked')].map(x => x.value);
  const skills = [...document.querySelectorAll('input[name="skills"]:checked')].map(x => x.value);
  const phone = f.contactPhone.value.replace(/\D/g,'');
  const wa = f.contactWhatsapp.value.replace(/\D/g,'');
  
  if (!phone && !wa && !f.contactEmail.value) {
    return alert('कम से कम एक संपर्क (फोन/WhatsApp/ईमेल) दें');
  }

  const badWords = ['फीस', 'पैसा', 'पैसे', 'एडवांस', 'रजिस्ट्रेशन चार्ज', 'वीजा'];
  const descLower = f.description.value.toLowerCase();
  if (badWords.some(word => descLower.includes(word))) {
    return alert('❌ नौकरी के विवरण में पैसों की मांग (जैसे फीस, एडवांस) नहीं की जा सकती।');
  }

  // 🚀 एडमिन की नौकरी सीधे लाइव होगी (approved), बाकी की पेंडिंग में जाएगी
  let jobStatus = 'pending';
  if (ADMIN_EMAILS.includes(auth.currentUser.email)) {
    jobStatus = 'approved'; 
  }

  try {
    await addDoc(collection(db, 'jobs'), {
      title: f.title.value.trim(),
      company: f.company.value.trim(),
      location: f.location.value.trim(),
      experience: f.experience.value.trim(),
      salary: f.salary.value.trim(),
      dutyHours: f.dutyHours.value.trim(),
      facilities: facilities,
      description: f.description.value.trim(),
      skills: skills,
      contactPhone: phone,
      contactWhatsapp: wa,
      contactEmail: f.contactEmail.value.trim(),
      postedBy: auth.currentUser.uid,
      postedAt: serverTimestamp(),
      status: jobStatus 
    });
    
    if (jobStatus === 'approved') {
      alert('✅ नौकरी सीधे लाइव हो गई है! (एडमिन एक्सेस)');
    } else {
      alert('✅ आपकी नौकरी सबमिट हो गई है! एडमिन द्वारा अप्रूवल के बाद यह गार्ड्स को दिखेगी।');
    }
    jobForm.reset();
  } catch(e) { alert('गलती: ' + e.message); }
};
