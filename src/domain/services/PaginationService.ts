/**
 * PaginationService - Domain service for pagination logic
 * Generic pagination that works with any array
 */
export class PaginationService {
  private static instance: PaginationService;

  private constructor() {}

  static getInstance(): PaginationService {
    if (!PaginationService.instance) {
      PaginationService.instance = new PaginationService();
    }
    return PaginationService.instance;
  }

  /**
   * Paginate an array of items
   */
  paginate<T>(items: T[], page: number, pageSize: number) {
    const total = items.length;
    const totalPages = Math.ceil(total / pageSize);
    const startIndex = (page - 1) * pageSize;
    const paginatedItems = items.slice(startIndex, startIndex + pageSize);

    return {
      items: paginatedItems,
      total,
      page,
      pageSize,
      totalPages,
      hasNextPage: page < totalPages,
      hasPreviousPage: page > 1,
    };
  }
}

export const paginationService = PaginationService.getInstance();
