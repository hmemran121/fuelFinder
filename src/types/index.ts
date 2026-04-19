export type StationStatus = "active" | "inactive" | "unknown";

export interface Station {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  status: StationStatus;
  isVerified: boolean;
  confidence_score: number;
  last_updated: any | null; // Keep flexible as it can be Firestore Timestamp
  source?: string;
  category?: string;
  social_verify_count?: number;
  user_verification_list?: string[];
  last_updated_by?: string;
  area?: string;
  latest_photo?: string;
  fuelTypes?: string[];
  amenities?: string[];
}

export interface UserProfile {
  uid: string;
  name: string;
  phone: string;
  role: "user" | "admin";
  contributionCount: number;
  isVerified: boolean;
  createdAt: any;
}
