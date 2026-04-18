import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut as firebaseSignOut,
  AuthError
} from "firebase/auth";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";

export const authService = {
  /**
   * Normalizes BD phone numbers to +8801XXXXXXXXX format
   */
  normalizePhone(phone: string): string {
    let clean = phone.replace(/\D/g, "");
    if (clean.length === 10) clean = "880" + clean;
    if (clean.length === 11) clean = "88" + clean;
    return "+" + clean;
  },

  /**
   * Generates a virtual email from a phone number
   */
  generateVirtualEmail(phone: string): string {
    const normalized = this.normalizePhone(phone).replace("+", "");
    return `${normalized}@fuelfinder.app`;
  },

  /**
   * Translates Firebase Auth errors to Bengali
   */
  getBengaliError(error: AuthError): string {
    const code = error.code;
    switch (code) {
      case "auth/user-not-found":
        return "এই নম্বরে কোনো অ্যাকাউন্ট পাওয়া যায়নি";
      case "auth/wrong-password":
        return "ভুল পিন নম্বর";
      case "auth/email-already-in-use":
        return "এই মোবাইল নম্বর দিয়ে ইতিমধ্যে অ্যাকাউন্ট খোলা হয়েছে";
      case "auth/invalid-email":
        return "মোবাইল নম্বরটি সঠিক নয়";
      case "auth/weak-password":
        return "পিন নম্বরটি অন্তত ৬ ডিজিটের হতে হবে";
      default:
        return "অথেনটিকেশন ব্যর্থ হয়েছে। আবার চেষ্টা করুন।";
    }
  },

  /**
   * Registration: Creates a Virtual Email and registers the user
   */
  async signUp(name: string, phone: string, pin: string) {
    const email = this.generateVirtualEmail(phone);
    
    // 1. Create Auth User
    const userCredential = await createUserWithEmailAndPassword(auth, email, pin);
    const user = userCredential.user;

    // 2. Create Firestore Profile
    await setDoc(doc(db, "users", user.uid), {
      uid: user.uid,
      name,
      phone: this.normalizePhone(phone),
      role: "user",
      createdAt: serverTimestamp(),
      contributionCount: 0,
      isVerified: false
    });

    return user;
  },

  /**
   * Login: Sign in using Virtual Email derived from phone
   */
  async signIn(phone: string, pin: string) {
    const email = this.generateVirtualEmail(phone);
    const userCredential = await signInWithEmailAndPassword(auth, email, pin);
    return userCredential.user;
  },

  /**
   * Logout
   */
  async signOut() {
    await firebaseSignOut(auth);
  }
};
