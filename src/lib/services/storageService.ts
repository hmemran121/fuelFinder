import { storage, db } from "../firebase";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { collection, addDoc, serverTimestamp, doc, updateDoc, arrayUnion } from "firebase/firestore";

export const storageService = {
  /**
   * Upload an evidence photo to Firebase Storage and record it in Firestore
   */
  async uploadStationImage(stationId: string, userId: string, file: File) {
    try {
      // Create a unique file path: verified_pumps/{stationId}/reports/{timestamp}_{userId}.jpg
      const fileName = `${Date.now()}_${userId}.jpg`;
      const storageRef = ref(storage, `verified_pumps/${stationId}/reports/${fileName}`);

      // Upload the file
      const snapshot = await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(snapshot.ref);

      // Record the evidence in a centralized telemetry collection
      const signalRef = await addDoc(collection(db, "public_signals"), {
        station_id: stationId,
        user_id: userId,
        type: "photo",
        image_url: downloadURL,
        timestamp: serverTimestamp(),
        verified: true
      });

      // Update the station's primary document with the latest evidence reference
      const stationRef = doc(db, "verified_pumps", stationId);
      await updateDoc(stationRef, {
        latest_photo: downloadURL,
        last_updated: serverTimestamp(),
        social_verify_count: arrayUnion(userId) // Optimistically count as verification
      });


      return downloadURL;
    } catch (error) {
      console.error("Storage upload failed:", error);
      throw error;
    }
  },

  /**
   * Helper to compress images on the client side using Canvas
   * Reduces image to max 1200px width and ~0.7 quality
   */
  async compressImage(file: File): Promise<Blob> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target?.result as string;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const MAX_WIDTH = 1200;
          let width = img.width;
          let height = img.height;

          if (width > MAX_WIDTH) {
            height *= MAX_WIDTH / width;
            width = MAX_WIDTH;
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, width, height);
          
          canvas.toBlob((blob) => {
            if (blob) resolve(blob);
            else reject(new Error("Compression failed"));
          }, 'image/jpeg', 0.7);
        };
      };
      reader.onerror = (error) => reject(error);
    });
  }
};
