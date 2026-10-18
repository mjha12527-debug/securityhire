import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.0/firebase-app.js";
import { getFirestore, collection, getDocs, query, where, orderBy, deleteDoc, doc } from "https://www.gstatic.com/firebasejs/10.7.0/firebase-firestore.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.0/firebase-auth.js";

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
const db = getFirestore(app);
const auth = getAuth(app);
const jobList = document.getElementById('jobList');
const searchInput = document.getElementById('searchInput');

let allJobs = []; 
let currentUser = null;

function escapeHTML(str) {
  if (!str) return '';
  return str.replace(/[&<>'"]/g, tag => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[tag] || tag));
}

function getTimeAgo(postedAt) {
  if (!postedAt) return 'हाल ही में';
  const date = postedAt.toDate ? postedAt.toDate() : new Date(postedAt);
  const diffInSeconds = Math.floor((new Date() - date) / 1000);
  if (diffInSeconds < 60) return 'अभी-अभी';
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) return `${diffInMinutes} मिनट पहले`;
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) return 'आज डाली गई';
  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays === 1) return 'कल डाली गई';
  if (diffInDays < 30) return `${diffInDays} दिन पहले`;
  const diffInMonths = Math.floor(diffInDays / 30);
  return `${diffInMonths} महीने पहले`;
}

onAuthStateChanged(auth, (user) => { currentUser = user; });

async function loadJobs() {
  try {
    // ✨ यहाँ हमने सिर्फ 'approved' नौकरियां मंगाने का फिल्टर लगाया है
    const q = query(collection(db, "jobs"), where("status", "==", "approved"), orderBy("postedAt", "desc"));
    const querySnapshot = await getDocs(q);
    allJobs = []; 
    querySnapshot.forEach((doc) => { allJobs.push({ id: doc.id, ...doc.data() }); });
    renderJobs(allJobs); 
  } catch (error) {
    // अगर पुरानी नौकरियां 'status' के बिना हैं, तो वो नहीं दिखेंगी, इसलिए एरर आ सकता है
    jobList.innerHTML = '<p style="text-align:center; color:red; margin-top:30px;">नौकरियाँ लोड करने में गलती आई।</p>';
  }
}

window.deleteJob = async function(jobId) {
  if (confirm("क्या आप सच में यह नौकरी डिलीट करना चाहते हैं?")) {
    try {
      await deleteDoc(doc(db, "jobs", jobId));
      alert("✅ नौकरी डिलीट हो गई!");
      loadJobs(); 
    } catch (error) { alert("गलती: " + error.message); }
  }
}

function renderJobs(jobsToShow) {
  jobList.innerHTML = ''; 
  if (jobsToShow.length === 0) {
    jobList.innerHTML = '<p style="text-align:center; margin-top:30px;">कोई नौकरी नहीं मिली।</p>';
    return;
  }

  jobsToShow.forEach((data) => {
    const safeTitle = escapeHTML(data.title);
    const safeCompany = escapeHTML(data.company);
    const safeLocation = escapeHTML(data.location);
    const safeExp = escapeHTML(data.experience);
    const safeSalary = escapeHTML(data.salary);
    const safeDuty = escapeHTML(data.dutyHours);
    const safeDesc = escapeHTML(data.description);
    const timeAgoText = getTimeAgo(data.postedAt);

    let skillsHtml = '';
    if (data.skills && Array.isArray(data.skills) && data.skills.length > 0) {
      skillsHtml = `<div class="skills-list">${data.skills.map(s => `<span>${escapeHTML(s)}</span>`).join('')}</div>`;
    }

    let facilitiesHtml = '';
    if (data.facilities && data.facilities.length > 0) {
      const safeFacilities = data.facilities.map(f => escapeHTML(f)).join(', ');
      facilitiesHtml = `<div class="facilities-text">✅ सुविधाएं: ${safeFacilities}</div>`;
    }

    let dutyHtml = data.dutyHours ? `<span class="duty-tag">⏰ ${safeDuty}</span>` : '';
    
    const waText = encodeURIComponent(`नमस्ते, SecurityHire पर "${data.title}" (${data.company}, ${data.location}) की नौकरी देखी। मैं इस काम के लिए इच्छुक हूं और मैं फिलहाल ${data.location} एरिया में ही रह रहा हूं। मैं अपना बायोडाटा/रिज्यूम भेज रहा हूं, कृपया इसे देखें।`);
    const waLink = data.contactWhatsapp ? `https://wa.me/91${escapeHTML(data.contactWhatsapp)}?text=${waText}` : '';

    let deleteBtnHtml = '';
    if (currentUser && data.postedBy === currentUser.uid) {
      deleteBtnHtml = `<button onclick="deleteJob('${data.id}')" class="btn-delete">🗑️ यह नौकरी हटाएं</button>`;
    }

    const card = document.createElement('div');
    card.className = 'job-card';
    card.innerHTML = `
      <div class="card-header"><h3>${safeTitle}</h3>${dutyHtml}</div>
      <div class="company-info">🏢 ${safeCompany} • 📍 ${safeLocation}</div>
      <div class="salary-info"><span>🎯 ${safeExp || '-'}</span><span>💰 ${safeSalary || '-'}</span></div>
      ${facilitiesHtml}
      ${data.description ? `<div class="desc">${safeDesc}</div>` : ''}
      ${skillsHtml}
      <div style="font-size: 12px; color: #9fc0e8; margin-bottom: 8px;">🕒 ${timeAgoText}</div>
      ${waLink ? `<a href="${waLink}" target="_blank" class="btn-wa">WhatsApp पर बात करें</a>` : ''}
      ${deleteBtnHtml}
    `;
    jobList.appendChild(card);
  });
}

searchInput.addEventListener('input', (e) => {
  const searchTerm = e.target.value.toLowerCase();
  renderJobs(allJobs.filter(job => (job.title && job.title.toLowerCase().includes(searchTerm)) || (job.location && job.location.toLowerCase().includes(searchTerm))));
});

loadJobs();
