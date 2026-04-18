"use client";

import { useState, useEffect } from "react";
import { collection, onSnapshot, query, orderBy } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { isStale } from "@/lib/utils/time-utils";
import { Station } from "@/types";

export interface UseStationsOptions {
  onlyActive?: boolean;
}

export const useStations = (options: UseStationsOptions = { onlyActive: false }) => {
  const [stations, setStations] = useState<Station[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const onlyActive = !!options.onlyActive;

  useEffect(() => {
    const q = query(collection(db, "verified_pumps"), orderBy("name", "asc"));

    console.log("Initializing Firestore Sync listener...");
    const unsubscribe = onSnapshot(
      q, 
      (snapshot) => {
        console.log(`Firestore Sync: Received ${snapshot.docs.length} stations.`);
        const stationData: Station[] = snapshot.docs.map((doc) => ({
          ...doc.data(),
          id: doc.id,
        } as Station));

        // Apply filtering as requested by the Master Prompt
        const filteredData = onlyActive 
          ? stationData.filter(s => s.status === 'active' && !isStale(s.last_updated))
          : stationData;

        setStations(filteredData);
        setLoading(false);
      },
      (err) => {
        console.error("Firebase Snapshot Error:", err);
        setError(err.message);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [onlyActive]);

  return { stations, loading, error };
};
