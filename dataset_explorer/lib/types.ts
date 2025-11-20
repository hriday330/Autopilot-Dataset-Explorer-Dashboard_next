export interface BoundingBox {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  label: string;
}

export interface Dataset {
  id: string;
  name: string;
  created_at?: string;
}

export interface ImageThumbnail {
  id: string;
  url: string;
  storage_path: string;
}