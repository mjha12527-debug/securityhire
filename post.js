import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.0/firebase-app.js";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.0/firebase-auth.js";
import { getFirestore, collection, addDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.7.0/firebase-firestore.js";

// आपका Firebase कोड (जो आपने मुझे भेजा था)
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

const authBox = document.getElementById('authBox');
const jobForm = document.getElementById('jobForm');

// लॉगिन चेक करना (अगर लॉगिन है तो फॉर्म दिखेगा, नहीं तो लॉगिन बॉक्स)
onAuthStateChanged(auth, (user) => {
  if (user) {
    authBox.style.display = 'none';
    jobForm.style.display = 'block';
  } else {
    authBox.style.display = 'block';
    jobForm.style.display = 'none';
  }
});

// नया अकाउंट बनाना
document.getElementById('signupBtn').addEventListener('click', async () => {
  const email = document.getElementById('email').value;
  const pass = document.getElementById('pass').value;
  if(!email || pass.length < 6) return alert('ईमेल और 6+ अक्षर का पासवर्ड डालें!');
  
  try {
    await createUserWithEmailAndPassword(auth, email, pass);
    alert('अकाउंट बन गया! अब आप नौकरी पोस्ट कर सकते हैं।');
  } catch (error) {
    alert('गलती: ' + error.message);
  }
});

// लॉगिन करना
document.getElementById('loginBtn').addEventListener('click', async () => {
  const email = document.getElementById('email').value;
  const pass = document.getElementById('pass').value;
  
  try {
    await signInWithEmailAndPassword(auth, email, pass);
    alert('लॉगिन हो गया!');
  } catch (error) {
    alert('गलती: ' + error.message);
  }
});

// नौकरी का फॉर्म सेव करना
document.getElementById('postBtn').addEventListener('click', async () => {
  const title = document.querySelector('input[name="title"]').value;
  const company = document.querySelector('input[name="company"]').value;
  const location = document.querySelector('input[name="location"]').value;
  const experience = document.querySelector('input[name="experience"]').value;
  const salary = document.querySelector('input[name="salary"]').value;
  const description = document.querySelector('textarea[name="description"]').value;
  const contactWhatsapp = document.querySelector('input[name="contactWhatsapp"]').value;

  if (!title || !company || !location) {
    return alert('पद, कंपनी और लोकेशन जरूरी है!');
  }

  try {
    await addDoc(collection(db, "jobs"), {
      title, company, location, experience, salary, description, contactWhatsapp,
      postedBy: auth.currentUser.uid,
      postedAt: serverTimestamp()
    });
    alert('✅ नौकरी पोस्ट हो गई!');
    
    // फॉर्म खाली करना
    document.querySelectorAll('#jobForm input, #jobForm textarea').forEach(el => el.value = '');
  } catch (error) {
    alert('गलती: ' + error.message);
  }
});
