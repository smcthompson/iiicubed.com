import type { QueryExecutor, QueryParameters } from '#/shared';
import type { Product, ProductCategory, ProductStatus, ProductRepository, ProductSearchCriteria } from '#/workstation';

interface ProductRecord {
  id: string;
  brand: string;
  model: string;
  category: ProductCategory;
  status: ProductStatus;
  eliminatedReason: string | null;
}

function toProduct(record: ProductRecord): Product {
  return {
    id: record.id,
    brand: record.brand,
    model: record.model,
    category: record.category,
    status: record.status,
    eliminatedReason: record.eliminatedReason ?? undefined,
  };
}

export class SqlServerProductRepository implements ProductRepository {
  public constructor(private readonly queryExecutor: QueryExecutor) {}

  public async findProducts(criteria: ProductSearchCriteria = {}): Promise<Product[]> {
    const filters: string[] = [];
    const parameters: QueryParameters = {};

    if (criteria.category) {
      filters.push('category = @category');
      parameters.category = criteria.category;
    }

    if (!criteria.includeEliminated) {
      filters.push("status <> 'eliminated'");
    }

    const whereClause = filters.length > 0 ? `WHERE ${filters.join(' AND ')}` : '';
    const result = await this.queryExecutor.query<ProductRecord>(
      `
        SELECT
          id,
          brand,
          model,
          category,
          status,
          eliminated_reason AS eliminatedReason
        FROM workstation.products
        ${whereClause}
        ORDER BY category, brand, model;
      `,
      parameters,
    );

    return result.records.map(toProduct);
  }

  public async findProductById(id: string): Promise<Product | null> {
    const result = await this.queryExecutor.query<ProductRecord>(
      `
        SELECT
          id,
          brand,
          model,
          category,
          status,
          eliminated_reason AS eliminatedReason
        FROM workstation.products
        WHERE id = @id;
      `,
      { id },
    );

    return result.records[0] ? toProduct(result.records[0]) : null;
  }
}
