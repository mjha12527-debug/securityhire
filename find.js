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

// चेक करें कि यूजर लॉगिन है या नहीं
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

// डिलीट करने का फंक्शन (ग्लोबल बनाया गया है ताकि बटन से कॉल हो सके)
window.deleteJob = async function(jobId) {
  if (confirm("क्या आप सच में यह नौकरी डिलीट करना चाहते हैं?")) {
    try {
      await deleteDoc(doc(db, "jobs", jobId));
      alert("✅ नौकरी डिलीट हो गई!");
      loadJobs(); // लिस्ट फिर से लोड करें
    } catch (error) {
      alert("डिलीट करने में गलती आई: " + error.message);
    }
  }
}

function renderJobs(jobsToShow) {
  jobList.innerHTML = ''; 

  if (jobsToShow.length === 0) {
    jobList.innerHTML = '<p class="loading">कोई नौकरी नहीं मिली।</p>';
    return;
  }

  jobsToShow.forEach((data) => {
    const waText = encodeURIComponent(`नमस्ते, SecurityHire पर "${data.title}" (${data.company}) की नौकरी देखी। क्या यह अभी खुली है?`);
    const waLink = data.contactWhatsapp ? `https://wa.me/91${data.contactWhatsapp}?text=${waText}` : '';

    let skillsHtml = '';
    if (data.skills && Array.isArray(data.skills) && data.skills.length > 0) {
      skillsHtml = `<div class="skills-list">${data.skills.map(s => `<span>${s}</span>`).join('')}</div>`;
    }

    let facilitiesHtml = '';
    if (data.facilities && data.facilities.length > 0) {
      facilitiesHtml = `<div class="meta" style="color: #4CAF50; margin-top:5px;">✅ सुविधाएं: ${data.facilities.join(', ')}</div>`;
    }

    let dutyHtml = data.dutyHours ? `<div class="meta">⏰ ड्यूटी: ${data.dutyHours}</div>` : '';

    // चेक करें कि क्या यह नौकरी उसी यूजर ने पोस्ट की है जो अभी लॉगिन है
    let deleteBtnHtml = '';
    if (currentUser && data.postedBy === currentUser.uid) {
      deleteBtnHtml = `<button onclick="deleteJob('${data.id}')" style="background:#d32f2f; color:#fff; border:none; padding:12px; border-radius:10px; width:100%; margin-top:10px; font-size:16px; font-weight:bold; cursor:pointer;">🗑️ यह नौकरी हटाएं (Delete)</button>`;
    }

    const card = document.createElement('div');
    card.className = 'job-card';
    card.innerHTML = `
      <h3>${data.title}</h3>
      <div class="meta">🏢 ${data.company} • 📍 ${data.location}</div>
      <div class="meta">🎯 अनुभव: ${data.experience || '-'} ${data.salary ? '• 💰 ' + data.salary : ''}</div>
      ${dutyHtml}
      ${facilitiesHtml}
      ${data.description ? `<div class="desc">${data.description}</div>` : ''}
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
	

