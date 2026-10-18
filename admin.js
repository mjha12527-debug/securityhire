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

const alertBox = document.getElementById('alertBox');
const jobList = document.getElementById('jobList');

// 🔐 यहाँ आप अपनी और अपने भरोसेमंद आदमी की ईमेल आईडी डाल सकते हैं
// (दूसरी आईडी की जगह आप अपने दोस्त/पार्टनर की ईमेल डाल दें)
const ADMIN_EMAILS = [
  "mjha12527@gmail.com",     // आपकी ईमेल आईडी
  "second_admin@gmail.com"   // दूसरे एडमिन की ईमेल आईडी (इसे बाद में बदल लें)
];

onAuthStateChanged(auth, (user) => {
  if (user && ADMIN_EMAILS.includes(user.email)) {
    // अगर लॉगिन किया हुआ यूजर एडमिन है
    alertBox.style.display = 'none';
    loadAllJobs();
  } else {
    // अगर एडमिन नहीं है
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
      
      const card = document.createElement('div');
      card.className = 'job-card';
      card.innerHTML = `
        <h3>${data.title || 'बिना नाम'}</h3>
        <p>🏢 कंपनी: ${data.company || '-'}</p>
        <p>📍 लोकेशन: ${data.location || '-'}</p>
        <p>📧 ईमेल: ${data.postedBy ? 'यूजर आईडी है' : '-'}</p>
        <button onclick="adminDeleteJob('${docSnap.id}')" class="btn-delete">🗑️ नौकरी डिलीट करें</button>
      `;
      jobList.appendChild(card);
    });
  } catch (error) {
    console.error("Error loading jobs: ", error);
    jobList.innerHTML = '<p class="empty-state">नौकरियाँ लोड करने में गलती आई।</p>';
  }
}

// डिलीट करने का फंक्शन
window.adminDeleteJob = async function(jobId) {
  if (confirm("क्या आप सच में यह नौकरी डिलीट करना चाहते हैं? (यह वापस नहीं आएगी)")) {
    try {
      await deleteDoc(doc(db, "jobs", jobId));
      alert("✅ नौकरी सफलतापूर्वक डिलीट हो गई!");
      loadAllJobs(); // लिस्ट फिर से लोड करें
    } catch (error) {
      alert("डिलीट करने में गलती आई: " + error.message);
    }
  }
}
