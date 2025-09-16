import { initializeApp } from "https://www.gstatic.com/firebasejs/10.6.2/firebase-app.js";
import { getFirestore, collection, doc, setDoc, getDoc, addDoc, onSnapshot, query, orderBy, updateDoc, increment } from "https://www.gstatic.com/firebasejs/10.6.2/firebase-firestore.js";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.6.2/firebase-auth.js";

// Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyAv99TK5HKLHfvt8F1Cql7i22QP-FMqSKU",
  authDomain: "xixichatroom.firebaseapp.com",
  projectId: "xixichatroom",
  storageBucket: "xixichatroom.firebasestorage.app",
  messagingSenderId: "1025842693579",
  appId: "1:1025842693579:web:e553bccf9581e65e55224e",
  measurementId: "G-X3CBKSLFJN"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

// Elements
const loginPopup = document.getElementById("login-popup");
const emailInput = document.getElementById("email");
const passwordInput = document.getElementById("password");
const loginBtn = document.getElementById("login-btn");
const signupBtn = document.getElementById("signup-btn");
const loginMsg = document.getElementById("login-msg");
const chatContainer = document.getElementById("chat-container");
const chatFeed = document.getElementById("chat-feed");
const messageInput = document.getElementById("message");
const sendBtn = document.getElementById("send-btn");
const starsCount = document.getElementById("stars-count");
const rewardPopup = document.getElementById("reward-popup");
const logoutBtn = document.getElementById("logout-btn");

let currentUser = null;
let rewardInterval = null;

// ---------------- SIGNUP ----------------
signupBtn.onclick = async () => {
  loginMsg.textContent = "";
  const email = emailInput.value.trim();
  const password = passwordInput.value.trim();

  if (!email || !password) {
    loginMsg.textContent = "Enter email & password.";
    return;
  }

  try {
    const userCred = await createUserWithEmailAndPassword(auth, email, password);
    const uid = userCred.user.uid;
    await setDoc(doc(db, "users", uid), {
      email,
      displayName: email.split("@")[0],
      stars: 0,
      admin: false
    });
    console.log("Signup successful:", uid);
  } catch (err) {
    console.error(err.message);
    loginMsg.textContent = err.message;
  }
};

// ---------------- LOGIN ----------------
loginBtn.onclick = async () => {
  loginMsg.textContent = "";
  const email = emailInput.value.trim();
  const password = passwordInput.value.trim();

  if (!email || !password) {
    loginMsg.textContent = "Enter email & password.";
    return;
  }

  try {
    await signInWithEmailAndPassword(auth, email, password);
    console.log("Login successful");
  } catch (err) {
    console.error(err.message);
    loginMsg.textContent = err.message;
  }
};

// ---------------- LOGOUT ----------------
logoutBtn.onclick = () => signOut(auth);

// ---------------- AUTH STATE ----------------
onAuthStateChanged(auth, async (user) => {
  if (user) {
    currentUser = user;
    loginPopup.classList.add("hidden");
    chatContainer.classList.remove("hidden");

    const userDoc = await getDoc(doc(db, "users", user.uid));
    starsCount.textContent = userDoc.data().stars;

    startRewardTimer();
    loadChat();
  } else {
    currentUser = null;
    loginPopup.classList.remove("hidden");
    chatContainer.classList.add("hidden");
    clearInterval(rewardInterval);
  }
});

// ---------------- LOAD CHAT ----------------
function loadChat() {
  chatFeed.innerHTML = "";
  const messagesRef = collection(db, "globalChat", "messages");
  const q = query(messagesRef, orderBy("timestamp", "asc"));

  onSnapshot(q, (snap) => {
    chatFeed.innerHTML = "";
    snap.forEach(docSnap => {
      const data = docSnap.data();
      const msgDiv = document.createElement("div");
      msgDiv.classList.add("message");
      msgDiv.innerHTML = `<b>${data.senderName}</b>: ${data.text}`;
      chatFeed.appendChild(msgDiv);
    });
    chatFeed.scrollTop = chatFeed.scrollHeight;
  });
}

// ---------------- SEND MESSAGE ----------------
sendBtn.onclick = async () => {
  const text = messageInput.value.trim();
  if (!text) return;
  messageInput.value = "";

  await addDoc(collection(db, "globalChat", "messages"), {
    text,
    senderName: currentUser.email.split("@")[0],
    timestamp: new Date()
  });
};

// ---------------- REWARDS ----------------
function startRewardTimer() {
  rewardInterval = setInterval(async () => {
    const userRef = doc(db, "users", currentUser.uid);
    await updateDoc(userRef, { stars: increment(1) });
    const docSnap = await getDoc(userRef);
    starsCount.textContent = docSnap.data().stars;

    rewardPopup.classList.remove("hidden");
    setTimeout(() => rewardPopup.classList.add("hidden"), 2000);
  }, 5 * 60 * 1000);
}
