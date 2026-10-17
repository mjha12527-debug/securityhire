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

async function loadJobs() {
  try {
    const q = query(collection(db, "jobs"), orderBy("postedAt", "desc"));
    const querySnapshot = await getDocs(q);
    
    jobList.innerHTML = ''; 

    if (querySnapshot.empty) {
      jobList.innerHTML = '<p class="loading">अभी कोई नौकरी नहीं डाली गई है।</p>';
      return;
    }

    querySnapshot.forEach((doc) => {
      const data = doc.data();
      
      const waText = encodeURIComponent(`नमस्ते, SecurityHire पर "${data.title}" (${data.company}) की नौकरी देखी। क्या यह अभी खुली है?`);
      const waLink = data.contactWhatsapp ? `https://wa.me/91${data.contactWhatsapp}?text=${waText}` : '';

      // स्किल्स को सुंदर तरीके से दिखाना (अगर एरे है तो)
      let skillsHtml = '';
      if (data.skills && Array.isArray(data.skills) && data.skills.length > 0) {
        skillsHtml = `<div class="skills-list">${data.skills.map(s => `<span>${s}</span>`).join('')}</div>`;
      }

      // सुविधाएं दिखाना (रूम, खाना, PF आदि)
      let facilitiesHtml = '';
      if (data.facilities && data.facilities.length > 0) {
        facilitiesHtml = `<div class="meta" style="color: #4CAF50; margin-top:5px;">✅ सुविधाएं: ${data.facilities.join(', ')}</div>`;
      }

      // ड्यूटी के घंटे
      let dutyHtml = data.dutyHours ? `<div class="meta">⏰ ड्यूटी: ${data.dutyHours}</div>` : '';

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
      `;
      jobList.appendChild(card);
    });
  } catch (error) {
    console.error("Error loading jobs: ", error);
    jobList.innerHTML = '<p class="loading">नौकरियाँ लोड करने में गलती आई।</p>';
  }
}

loadJobs();


