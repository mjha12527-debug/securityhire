import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.0/firebase-app.js";
import { getFirestore, collection, getDocs, query, orderBy } from "https://www.gstatic.com/firebasejs/10.7.0/firebase-firestore.js";

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
const jobList = document.getElementById('jobList');

// डेटाबेस से नौकरियां लाना
async function loadJobs() {
  try {
    // नई नौकरियां सबसे ऊपर दिखाने के लिए query
    const q = query(collection(db, "jobs"), orderBy("postedAt", "desc"));
    const querySnapshot = await getDocs(q);
    
    jobList.innerHTML = ''; // लोडिंग हटाएं

    if (querySnapshot.empty) {
      jobList.innerHTML = '<p class="loading">अभी कोई नौकरी नहीं डाली गई है।</p>';
      return;
    }

    querySnapshot.forEach((doc) => {
      const data = doc.data();
      
      // WhatsApp लिंक बनाना
      const waText = encodeURIComponent(`नमस्ते, SecurityHire पर "${data.title}" (${data.company}) की नौकरी देखी। क्या यह अभी खुली है?`);
      const waLink = data.contactWhatsapp ? `https://wa.me/91${data.contactWhatsapp}?text=${waText}` : '';

      // कार्ड बनाना
      const card = document.createElement('div');
      card.className = 'job-card';
      card.innerHTML = `
        <h3>${data.title}</h3>
        <div class="meta">🏢 ${data.company} • 📍 ${data.location}</div>
        <div class="meta">🎯 अनुभव: ${data.experience || '-'} ${data.salary ? '• 💰 ' + data.salary : ''}</div>
        ${data.description ? `<div class="desc">${data.description}</div>` : ''}
        ${waLink ? `<a href="${waLink}" target="_blank" class="btn-wa">WhatsApp पर बात करें</a>` : ''}
      `;
      jobList.appendChild(card);
    });
  } catch (error) {
    console.error("Error loading jobs: ", error);
    jobList.innerHTML = '<p class="loading">नौकरियाँ लोड करने में गलती आई।</p>';
  }
}

// पेज खुलते ही नौकरियां लोड करो
loadJobs();
