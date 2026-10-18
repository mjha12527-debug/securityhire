import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.0/firebase-app.js";
import { getFirestore, collection, getDocs, query, orderBy, deleteDoc, doc, updateDoc } from "https://www.gstatic.com/firebasejs/10.7.0/firebase-firestore.js";
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

const alertBox = document.getElementById('alertBox');
const jobList = document.getElementById('jobList');

// एडमिन की ईमेल लिस्ट
const ADMIN_EMAILS = [
  "mjha12527@gmail.com",     // आपकी ईमेल
  "second_admin@gmail.com"   // दूसरे एडमिन की ईमेल (बाद में बदल सकते हैं)
];

onAuthStateChanged(auth, (user) => {
  if (user && ADMIN_EMAILS.includes(user.email)) {
    alertBox.style.display = 'none';
    loadAllJobs();
  } else {
    alertBox.style.display = 'block';
    jobList.innerHTML = '';
  }
});

async function loadAllJobs() {
  try {
    const q = query(collection(db, "jobs"), orderBy("postedAt", "desc"));
    const querySnapshot = await getDocs(q);
    jobList.innerHTML = ''; 

    if (querySnapshot.empty) {
      jobList.innerHTML = '<p class="empty-state">डेटाबेस में कोई नौकरी नहीं है।</p>';
      return;
    }

    querySnapshot.forEach((docSnap) => {
      const data = docSnap.data();
      
      // स्टेटस के हिसाब से रंग और बटन
      let statusHtml = '';
      let approveBtn = '';
      if (data.status === 'pending') {
        statusHtml = `<p style="color: #ffa500; font-weight: bold;">स्थिति: पेंडिंग (Pending)</p>`;
        approveBtn = `<button onclick="approveJob('${docSnap.id}')" style="background:#4CAF50; color:#fff; border:none; padding:12px; border-radius:10px; width:100%; margin-top:10px; font-size:15px; font-weight:bold; cursor:pointer;">✅ नौकरी अप्रूव करें</button>`;
      } else if (data.status === 'approved') {
        statusHtml = `<p style="color: #4CAF50; font-weight: bold;">स्थिति: लाइव (Approved)</p>`;
      } else {
        statusHtml = `<p style="color: #9fc0e8;">स्थिति: ${data.status || 'पुरानी नौकरी'}</p>`;
      }

      const card = document.createElement('div');
      card.className = 'job-card';
      card.innerHTML = `
        <h3>${data.title || 'बिना नाम'}</h3>
        <p>🏢 कंपनी: ${data.company || '-'}</p>
        <p>📍 लोकेशन: ${data.location || '-'}</p>
        ${statusHtml}
        ${approveBtn}
        <button onclick="adminDeleteJob('${docSnap.id}')" class="btn-delete" style="margin-top:10px;">🗑️ नौकरी डिलीट करें</button>
      `;
      jobList.appendChild(card);
    });
  } catch (error) {
    // 🚨 यह हमें असली एरर बताएगा
    alert("एडमिन एरर: " + error.message); 
    jobList.innerHTML = '<p class="empty-state">नौकरियाँ लोड करने में गलती आई।</p>';
  }
}

// अप्रूव करने का फंक्शन
window.approveJob = async function(jobId) {
  try {
    const jobRef = doc(db, "jobs", jobId);
    await updateDoc(jobRef, { status: 'approved' });
    alert("✅ नौकरी अप्रूव हो गई! अब यह गार्ड्स को दिखेगी।");
    loadAllJobs(); 
  } catch (error) {
    alert("अप्रूव करने में गलती आई: " + error.message);
  }
}

window.adminDeleteJob = async function(jobId) {
  if (confirm("क्या आप सच में यह नौकरी डिलीट करना चाहते हैं?")) {
    try {
      await deleteDoc(doc(db, "jobs", jobId));
      alert("✅ नौकरी सफलतापूर्वक डिलीट हो गई!");
      loadAllJobs(); 
    } catch (error) {
      alert("डिलीट करने में गलती आई: " + error.message);
    }
  }
}
