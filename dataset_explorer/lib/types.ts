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
  width?: number;
  height?: number;
  url: string;
  storage_path: string;
}

export interface Label {
  id: string;
  dataset_id: string;
  name: string;
  color?: string;
  order_index?: number;
  created_at: string;
}
