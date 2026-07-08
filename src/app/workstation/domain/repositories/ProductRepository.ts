import type { Product, ProductCategory } from '#/workstation';

export interface ProductSearchCriteria {
  category?: ProductCategory;
  includeEliminated?: boolean;
}

export interface ProductRepository {
  findProducts(criteria?: ProductSearchCriteria): Promise<Product[]>;
  findProductById(id: string): Promise<Product | null>;
}
