export interface Building {
  id?: string;
  name: string;
  category: string;
  description: string;
  coordinates: [number, number];
  userId?: number;
}

