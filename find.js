import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.0/firebase-app.js";
import { getFirestore, collection, getDocs, query, orderBy, deleteDoc, doc } from "https://www.gstatic.com/firebasejs/10.7.0/firebase-firestore.js";
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

// 🛡️ XSS सुरक्षा कवच (हैकर्स के कोड को बेअसर करने के लिए)
function escapeHTML(str) {
  if (!str) return '';
  return str.replace(/[&<>'"]/g, 
    tag => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;'
    }[tag] || tag)
  );
}

onAuthStateChanged(auth, (user) => {
  currentUser = user;
});

async function loadJobs() {
  try {
    const q = query(collection(db, "jobs"), orderBy("postedAt", "desc"));
    const querySnapshot = await getDocs(q);
    
    allJobs = []; 
    querySnapshot.forEach((doc) => {
      allJobs.push({ id: doc.id, ...doc.data() });
    });
    renderJobs(allJobs); 
  } catch (error) {
    console.error("Error loading jobs: ", error);
    jobList.innerHTML = '<p class="loading">नौकरियाँ लोड करने में गलती आई।</p>';
  }
}

window.deleteJob = async function(jobId) {
  if (confirm("क्या आप सच में यह नौकरी डिलीट करना चाहते हैं?")) {
    try {
      await deleteDoc(doc(db, "jobs", jobId));
      alert("✅ नौकरी डिलीट हो गई!");
      loadJobs(); 
    } catch (error) {
      alert("डिलीट करने में गलती आई: " + error.message);
    }
  }
}

function renderJobs(jobsToShow) {
  jobList.innerHTML = ''; 

  if (jobsToShow.length === 0) {
    jobList.innerHTML = '<div class="empty-state">🔍<br><br>कोई नौकरी नहीं मिली।</div>';
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

    const waText = encodeURIComponent(`नमस्ते, SecurityHire पर "${data.title}" (${data.company}) की नौकरी देखी। क्या यह अभी खुली है?`);
    const waLink = data.contactWhatsapp ? `https://wa.me/91${escapeHTML(data.contactWhatsapp)}?text=${waText}` : '';

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

    let deleteBtnHtml = '';
    if (currentUser && data.postedBy === currentUser.uid) {
      deleteBtnHtml = `<button onclick="deleteJob('${data.id}')" class="btn-delete">🗑️ यह नौकरी हटाएं</button>`;
    }

    const card = document.createElement('div');
    card.className = 'job-card';
    card.innerHTML = `
      <div class="card-header">
        <h3>${safeTitle}</h3>
        ${dutyHtml}
      </div>
      <div class="company-info">🏢 ${safeCompany} <span class="dot">•</span> 📍 ${safeLocation}</div>
      <div class="salary-info">
        <span>🎯 ${safeExp || 'फ्रेशर'}</span>
        <span>💰 ${safeSalary || 'सैलरी डिस्कस'}</span>
      </div>
      ${facilitiesHtml}
      ${data.description ? `<div class="desc">${safeDesc}</div>` : ''}
      ${skillsHtml}
      ${waLink ? `<a href="${waLink}" target="_blank" class="btn-wa">WhatsApp पर बात करें</a>` : ''}
      ${deleteBtnHtml}
    `;
    jobList.appendChild(card);
  });
}

searchInput.addEventListener('input', (e) => {
  const searchTerm = e.target.value.toLowerCase();
  const filteredJobs = allJobs.filter(job => {
    return (
      (job.title && job.title.toLowerCase().includes(searchTerm)) ||
      (job.company && job.company.toLowerCase().includes(searchTerm)) ||
      (job.location && job.location.toLowerCase().includes(searchTerm))
    );
  });
  renderJobs(filteredJobs);
});

loadJobs();
