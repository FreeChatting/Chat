// app.js - shared firebase + helpers
// Put this file in same folder and included by each html page after firebase compat scripts

// ---- FIREBASE CONFIG (user provided) ----
const firebaseConfig = {
  apiKey: "AIzaSyBXCMjlg84qvF1xlaHaWVQeJyY0MmsCWxI",
  authDomain: "chatting-f6825.firebaseapp.com",
  databaseURL: "https://chatting-f6825-default-rtdb.firebaseio.com",
  projectId: "chatting-f6825",
  storageBucket: "chatting-f6825.firebasestorage.app",
  messagingSenderId: "668245496547",
  appId: "1:668245496547:web:990edf7bd72e32e87e6bd6"
};

// init
if(!firebase.apps.length){
  firebase.initializeApp(firebaseConfig);
}
const auth = firebase.auth();
const db = firebase.database();
const storage = firebase.storage();

// --- Authentication helpers ---
function authOnLoad(cb){
  auth.onAuthStateChanged(user => cb(user));
}
function createUserWithEmail(email,password){
  return new Promise((res,rej)=>{
    auth.createUserWithEmailAndPassword(email,password).then(u=>res(u.user)).catch(rej);
  });
}
function signInWithEmail(email,password){
  return new Promise((res,rej)=>{
    auth.signInWithEmailAndPassword(email,password).then(u=>res(u.user)).catch(rej);
  });
}
function signOut(){ return auth.signOut(); }

// --- Realtime DB helpers (small wrappers) ---
function setDb(path, val){ return db.ref(path).set(val); }
function updateDb(path, val){ return db.ref(path).update(val); }
function removeDb(path){ return db.ref(path).remove(); }
function pushDb(path, val){ return db.ref(path).push(val); }
async function dbRefOnce(path){
  const snap = await db.ref(path).once('value');
  return snap.exists() ? snap.val() : null;
}
function onDbValue(path, cb){
  db.ref(path).on('value', snap => cb(snap));
}
function onDbChildAdded(path, cb){
  db.ref(path).on('child_added', snap => cb(snap));
}
function onDbChildRemoved(path, cb){
  db.ref(path).on('child_removed', snap => cb(snap));
}

// --- Storage helpers ---
async function uploadAvatar(uid, file){
  const ref = storage.ref().child(`avatars/${uid}_${Date.now()}`);
  await ref.put(file);
  return await ref.getDownloadURL();
}
async function uploadChatImage(chatId, file){
  const ref = storage.ref().child(`chats/${chatId}/${Date.now()}_${file.name}`);
  await ref.put(file);
  return await ref.getDownloadURL();
}

// --- Chat helpers ---
function createChatId(a,b){
  return [a,b].sort().join('_'); // deterministic for 1:1
}
async function pushMessage(chatId, message){
  // message: { from: uid, text: string|null, image: url|null, t: timestamp }
  const key = db.ref(`/messages/${chatId}`).push().key;
  await db.ref(`/messages/${chatId}/${key}`).set(message);
  // ensure both participants have chat reference
  const meta = await dbRefOnce(`/chats/${chatId}`) || { participants: {} };
  const parts = meta.participants || {};
  for(const p in parts) {
    await db.ref(`/users/${p}/chats/${chatId}`).set(true);
  }
}

// --- small utils ---
function timeAgo(ts){
  if(!ts) return '';
  const diff = Math.floor((Date.now()-ts)/1000);
  if(diff<60) return diff+'s';
  const m = Math.floor(diff/60); if(m<60) return m+'m';
  const h = Math.floor(m/60); if(h<24) return h+'h';
  const d = Math.floor(h/24); return d+'d';
}

// expose some to window for debug
window._chatApp = { firebase, auth, db, storage, setDb, dbRefOnce, pushMessage, timeAgo };
