export interface Todo {
  id: number;
  content: string;
}

export interface Meta {
  totalCount: number;
}

export interface Course {
  id: string;
  collectionId?: string;
  collectionName?: string;
  name: string;
  city: string;
  country: string;
  gps: {
    latitude: number;
    longitude: number;
  };
  logo: string;
  header: string;
  header_image: string;
  email: string;
  website: string;
  owner: string;
  moderators: string[];
  category: string;
  role?: 'owner' | 'moderator';
  expand?: {
    category?: {
      id: string;
      name: string;
      icon?: string;
    };
  };
}

export interface GPSLocation {
  latitude: number;
  longitude: number;
  altitude?: number; // Hoogte in meters
}

export interface Registration {
  id: string;
  event: string;
  user: string;
  status?: string;
  category?: string;
  notitie?: string;
  created?: string;
  updated?: string;
  expand?: {
    event?: Record<string, unknown>;
    user?: Record<string, unknown>;
    status?: Record<string, unknown>;
    category?: Record<string, unknown>;
  };
}

export interface Category {
  id: string;
  name: string;
  description?: string;
  cat_type: string;
  icon?: string; // File ID van het icoon
  metadata?: Record<string, unknown>; // JSON metadata
}

// Interface voor een Hole (baan-hole), gebruikt in o.a. BaanDetailPage
export interface Hole {
  id: string; // Uniek ID van de hole
  hole: number; // Nummer van de hole
  hole_length: number; // Lengte van de hole in meters
  hole_index: number; // Index van de hole
  image?: string; // Optionele afbeelding van de hole
  [key: string]: unknown; // Voor eventuele extra velden
}

export interface Country {
  id: string;
  name: string;
  flag: string; // base64-string van de vlag
}
