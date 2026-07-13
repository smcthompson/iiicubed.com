export type ProductCategory = 'monitor' | 'arm' | 'dock' | 'desk' | 'chair' | 'center_device' | 'accessory';

export type ProductStatus = 'candidate' | 'approved' | 'eliminated';

export interface Product {
  id: string;
  brand: string;
  model: string;
  category: ProductCategory;
  status: ProductStatus;
  eliminatedReason?: string;
}
