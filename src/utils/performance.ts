/**
 * Performance Monitoring Utility
 *
 * Deze utility biedt tools voor het monitoren van query performance
 * en het detecteren van langzame queries.
 */

export interface PerformanceMetrics {
  name: string;
  duration: number;
  timestamp: number;
  success: boolean;
  error?: string;
}

class PerformanceMonitor {
  private metrics: PerformanceMetrics[] = [];
  private readonly MAX_METRICS = 1000; // Beperk aantal opgeslagen metrics
  private readonly SLOW_QUERY_THRESHOLD = 1000; // 1 seconde

  /**
   * Track een query of operatie
   */
  async trackQuery<T>(name: string, queryFn: () => Promise<T>): Promise<T> {
    const startTime = Date.now();

    try {
      const result = await queryFn();
      const duration = Date.now() - startTime;

      this.recordMetric({
        name,
        duration,
        timestamp: startTime,
        success: true,
      });

      if (duration > this.SLOW_QUERY_THRESHOLD) {
        console.warn(`Slow query detected: ${name} took ${duration}ms`);
      }

      return result;
    } catch (error) {
      const duration = Date.now() - startTime;

      this.recordMetric({
        name,
        duration,
        timestamp: startTime,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      });

      console.error(`Query failed: ${name} after ${duration}ms`, error);
      throw error;
    }
  }

  /**
   * Record een performance metric
   */
  private recordMetric(metric: PerformanceMetrics): void {
    this.metrics.push(metric);

    // Beperk aantal opgeslagen metrics
    if (this.metrics.length > this.MAX_METRICS) {
      this.metrics = this.metrics.slice(-this.MAX_METRICS / 2);
    }
  }

  /**
   * Haal performance statistieken op
   */
  getStats() {
    const successful = this.metrics.filter((m) => m.success);
    const failedMetrics = this.metrics.filter((m) => !m.success);

    if (successful.length === 0) {
      return {
        totalQueries: this.metrics.length,
        successRate: 0,
        averageDuration: 0,
        slowQueries: 0,
        failedQueries: failedMetrics.length,
        recentMetrics: this.metrics.slice(-10),
      };
    }

    const avgDuration = successful.reduce((sum, m) => sum + m.duration, 0) / successful.length;
    const slowQueries = successful.filter((m) => m.duration > this.SLOW_QUERY_THRESHOLD).length;

    return {
      totalQueries: this.metrics.length,
      successRate: successful.length / this.metrics.length,
      averageDuration: Math.round(avgDuration),
      slowQueries,
      failedQueries: failedMetrics.length,
      recentMetrics: this.metrics.slice(-10),
    };
  }

  /**
   * Haal langzame queries op
   */
  getSlowQueries(threshold = this.SLOW_QUERY_THRESHOLD) {
    return this.metrics
      .filter((m) => m.duration > threshold)
      .sort((a, b) => b.duration - a.duration);
  }

  /**
   * Reset alle metrics
   */
  reset(): void {
    this.metrics = [];
  }

  /**
   * Export metrics voor debugging
   */
  exportMetrics(): PerformanceMetrics[] {
    return [...this.metrics];
  }
}

// Export een singleton instance
export const performanceMonitor = new PerformanceMonitor();

// Export de trackQuery functie voor gemakkelijk gebruik
export const trackQuery = performanceMonitor.trackQuery.bind(performanceMonitor);
