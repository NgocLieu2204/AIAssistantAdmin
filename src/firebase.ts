import { initializeApp } from 'firebase/app';
import { getDatabase } from 'firebase/database';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyAnGo4YTXwWprCxyyzv5Ui0X1awYHF8NKs",
  authDomain: "aivisionassistant.firebaseapp.com",
  databaseURL: "https://aivisionassistant-default-rtdb.firebaseio.com",
  projectId: "aivisionassistant",
  storageBucket: "aivisionassistant.firebasestorage.app",
  messagingSenderId: "893942052978",
  appId: "1:893942052978:android:6f1474482433257216aaeb",
};

const app = initializeApp(firebaseConfig);
export const db = getDatabase(app);
export const auth = getAuth(app);

// App phụ dùng để tạo tài khoản mới mà không làm đăng xuất Admin hiện tại
const secondaryApp = initializeApp(firebaseConfig, 'Secondary');
export const secondaryAuth = getAuth(secondaryApp);

export default app;
