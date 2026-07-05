import type { Product, ProductCategory } from '#/app/workstation/domain/Product.js';

export interface ProductSearchCriteria {
  category?: ProductCategory;
  includeEliminated?: boolean;
}

export interface ProductRepository {
  findProducts(criteria?: ProductSearchCriteria): Promise<Product[]>;
  findProductById(id: string): Promise<Product | null>;
}
