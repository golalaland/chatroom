import { initializeApp } from "https://www.gstatic.com/firebasejs/10.6.2/firebase-app.js";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.6.2/firebase-auth.js";
import { getFirestore, doc, setDoc, getDoc, collection, addDoc, onSnapshot, query, orderBy, updateDoc, increment } from "https://www.gstatic.com/firebasejs/10.6.2/firebase-firestore.js";

// ---- Firebase Config ----
const firebaseConfig = {
  apiKey: "AIzaSyDmj1SQvIqI_A83EivlJfDg2z-kyUYIyrM",
  authDomain: "xixichatroomdb.firebaseapp.com",
  projectId: "xixichatroomdb",
  storageBucket: "xixichatroomdb.firebasestorage.app",
  messagingSenderId: "727244293530",
  appId: "1:727244293530:web:29559cbcc18b49831b2623"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

// ---- Elements ----
const loginContainer = document.getElementById("login-container");
const chatContainer = document.getElementById("chat-container");
const emailInput = document.getElementById("email");
const passwordInput = document.getElementById("password");
const loginBtn = document.getElementById("login-btn");
const signupBtn = document.getElementById("signup-btn");
const loginMsg = document.getElementById("login-msg");
const messageInput = document.getElementById("message");
const sendBtn = document.getElementById("send-btn");
const chatFeed = document.getElementById("chat-feed");
const starsCount = document.getElementById("stars-count");
const rewardPopup = document.getElementById("reward-popup");
const logoutBtn = document.getElementById("logout-btn");

let currentUser = null;
let isAdmin = false;
let rewardInterval = null;

// ---- Signup ----
signupBtn.onclick = async () => {
  loginMsg.textContent = "";
  const email = emailInput.value.trim();
  const password = passwordInput.value.trim();
  if (!email || !password) { loginMsg.textContent = "Enter email & password."; return; }
  try {
    const userCred = await createUserWithEmailAndPassword(auth, email, password);
    const uid = userCred.user.uid;
    await setDoc(doc(db, "users", uid), {
      email,
      displayName: email.split("@")[0],
      stars: 0,
      admin: false
    });
    loginMsg.textContent = "Signup successful!";
  } catch (err) {
    console.error(err);
    loginMsg.textContent = err.message;
  }
};

// ---- Login ----
loginBtn.onclick = async () => {
  loginMsg.textContent = "";
  const email = emailInput.value.trim();
  const password = passwordInput.value.trim();
  if (!email || !password) { loginMsg.textContent = "Enter email & password."; return; }
  try {
    await signInWithEmailAndPassword(auth, email, password);
    loginMsg.textContent = "Login successful!";
  } catch (err) {
    console.error(err);
    loginMsg.textContent = err.message;
  }
};

// ---- Auth State ----
onAuthStateChanged(auth, async (user) => {
  if (user) {
    currentUser = user;
    loginContainer.classList.add("hidden");
    chatContainer.classList.remove("hidden");

    const userDoc = await getDoc(doc(db, "users", user.uid));
    starsCount.textContent = userDoc.data().stars;
    isAdmin = userDoc.data().admin;

    startRewardTimer();
    loadChat();
  } else {
    currentUser = null;
    isAdmin = false;
    loginContainer.classList.remove("hidden");
    chatContainer.classList.add("hidden");
    clearInterval(rewardInterval);
  }
});

// ---- Chat ----
async function loadChat() {
  const messagesRef = collection(db, "global-messages");
  const q = query(messagesRef, orderBy("timestamp", "asc"));
  onSnapshot(q, (snap) => {
    chatFeed.innerHTML = "";
    snap.forEach(doc => {
      const data = doc.data();
      const msgDiv = document.createElement("div");
      msgDiv.classList.add("message");
      msgDiv.textContent = `${data.senderName}: ${data.text}`;

      // Admin buttons
      if (isAdmin) {
        const adminDiv = document.createElement("div");
        adminDiv.classList.add("admin-buttons");

        const deleteBtn = document.createElement("button");
        deleteBtn.textContent = "Delete";
        deleteBtn.onclick = async () => {
          await updateDoc(doc(db, "global-messages", doc.id), { deleted: true });
        };

        adminDiv.appendChild(deleteBtn);
        msgDiv.appendChild(adminDiv);
      }

      chatFeed.appendChild(msgDiv);
    });
    chatFeed.scrollTop = chatFeed.scrollHeight;
  });
}

// ---- Send Message ----
sendBtn.onclick = async () => {
  const text = messageInput.value.trim();
  if (!text) return;
  messageInput.value = "";
  await addDoc(collection(db, "global-messages"), {
    text,
    senderId: currentUser.uid,
    senderName: currentUser.email.split("@")[0],
    timestamp: new Date()
  });
};

// ---- Rewards ----
function startRewardTimer() {
  rewardInterval = setInterval(async () => {
    const userRef = doc(db, "users", currentUser.uid);
    await updateDoc(userRef, { stars: increment(1) });
    const docSnap = await getDoc(userRef);
    starsCount.textContent = docSnap.data().stars;
    rewardPopup.style.display = "block";
    setTimeout(() => rewardPopup.style.display = "none", 2000);
  }, 5 * 60 * 1000);
}

// ---- Logout ----
logoutBtn.onclick = () => signOut
