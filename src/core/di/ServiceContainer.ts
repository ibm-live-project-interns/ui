/**
 * ServiceContainer - Simple Dependency Injection container
 * Manages service instances and their dependencies
 */

type ServiceFactory<T> = () => T;
type ServiceIdentifier = string | symbol;

export class ServiceContainer {
  private static instance: ServiceContainer;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private services = new Map<ServiceIdentifier, any>();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private factories = new Map<ServiceIdentifier, ServiceFactory<any>>();

  private constructor() {}

  static getInstance(): ServiceContainer {
    if (!ServiceContainer.instance) {
      ServiceContainer.instance = new ServiceContainer();
    }
    return ServiceContainer.instance;
  }

  /**
   * Register a service instance
   */
  register<T>(identifier: ServiceIdentifier, instance: T): void {
    this.services.set(identifier, instance);
  }

  /**
   * Register a service factory (lazy instantiation)
   */
  registerFactory<T>(identifier: ServiceIdentifier, factory: ServiceFactory<T>): void {
    this.factories.set(identifier, factory);
  }

  /**
   * Resolve a service instance
   */
  resolve<T>(identifier: ServiceIdentifier): T {
    // Check if instance already exists
    if (this.services.has(identifier)) {
      return this.services.get(identifier);
    }

    // Check if factory exists
    if (this.factories.has(identifier)) {
      const factory = this.factories.get(identifier)!;
      const instance = factory();
      this.services.set(identifier, instance);
      return instance;
    }

    throw new Error(`Service not found: ${String(identifier)}`);
  }

  /**
   * Check if service is registered
   */
  has(identifier: ServiceIdentifier): boolean {
    return this.services.has(identifier) || this.factories.has(identifier);
  }

  /**
   * Clear all services (useful for testing)
   */
  clear(): void {
    this.services.clear();
    this.factories.clear();
  }

  /**
   * Reset to new instance (useful for testing)
   */
  static reset(): void {
    ServiceContainer.instance = new ServiceContainer();
  }
}

export const container = ServiceContainer.getInstance();
