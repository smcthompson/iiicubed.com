import type { ConstraintRepository, LayoutCandidateRepository, ProductRepository } from '#/workstation';

export interface WorkstationFoundationStatus {
  application: 'workstation';
  database: 'configured';
  productsAvailable: number;
  constraintsAvailable: number;
  rankedLayoutsAvailable: number;
}

export interface WorkstationFoundationStatusDependencies {
  productRepository: ProductRepository;
  constraintRepository: ConstraintRepository;
  layoutCandidateRepository: LayoutCandidateRepository;
}

export class GetWorkstationFoundationStatus {
  public constructor(private readonly dependencies: WorkstationFoundationStatusDependencies) {}

  public async execute(): Promise<WorkstationFoundationStatus> {
    const [products, constraints, rankedLayouts] = await Promise.all([this.dependencies.productRepository.findProducts({ includeEliminated: true }), this.dependencies.constraintRepository.findActiveConstraints(), this.dependencies.layoutCandidateRepository.findRankedLayoutCandidates(5)]);

    return {
      application: 'workstation',
      database: 'configured',
      productsAvailable: products.length,
      constraintsAvailable: constraints.length,
      rankedLayoutsAvailable: rankedLayouts.length,
    };
  }
}
