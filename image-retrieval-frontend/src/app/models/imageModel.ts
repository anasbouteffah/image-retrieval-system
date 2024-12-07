export interface Image {
  _id: string;
  filename: string;
  path: string;
  size: number;
  uploadDate: Date;
  category: string | null;
  descriptors?: any;
}
