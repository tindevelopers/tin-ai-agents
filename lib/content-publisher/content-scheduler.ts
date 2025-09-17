import { AIContent, PublishResult, ScheduleConfig } from './types';
import { AIContentPublisher } from './content-publisher';

interface ScheduledContent {
  id: string;
  content: AIContent;
  platforms: string[];
  scheduledTime: Date;
  priority: 'low' | 'medium' | 'high';
  status: 'pending' | 'processing' | 'completed' | 'failed';
  attempts: number;
  maxAttempts: number;
  lastAttempt?: Date;
  result?: PublishResult;
}

export class ContentScheduler {
  private publisher: AIContentPublisher;
  private config: ScheduleConfig;
  private queue: ScheduledContent[] = [];
  private isRunning: boolean = false;
  private intervalId?: NodeJS.Timeout;

  constructor(publisher: AIContentPublisher, config: ScheduleConfig) {
    this.publisher = publisher;
    this.config = config;
  }

  addToQueue(
    content: AIContent, 
    platforms: string[], 
    options: {
      priority?: 'low' | 'medium' | 'high';
      scheduledTime?: Date;
      autoSchedule?: boolean;
    } = {}
  ): ScheduledContent {
    const {
      priority = 'medium',
      scheduledTime = this.getNextScheduledTime(),
      autoSchedule = true
    } = options;

    const scheduledContent: ScheduledContent = {
      id: `scheduled_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      content,
      platforms,
      scheduledTime,
      priority,
      status: 'pending',
      attempts: 0,
      maxAttempts: this.config.retryFailed ? 3 : 1
    };

    this.queue.push(scheduledContent);
    this.sortQueue();

    if (autoSchedule && !this.isRunning) {
      this.start();
    }

    return scheduledContent;
  }

  start(): void {
    if (this.isRunning) {
      return;
    }

    this.isRunning = true;
    
    // Check every minute for scheduled content
    this.intervalId = setInterval(() => {
      this.processQueue();
    }, 60000);

    // Process immediately
    this.processQueue();
  }

  stop(): void {
    this.isRunning = false;
    
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = undefined;
    }
  }

  getQueue(): ScheduledContent[] {
    return [...this.queue];
  }

  getQueueStatus(): {
    total: number;
    pending: number;
    processing: number;
    completed: number;
    failed: number;
  } {
    return {
      total: this.queue.length,
      pending: this.queue.filter(item => item.status === 'pending').length,
      processing: this.queue.filter(item => item.status === 'processing').length,
      completed: this.queue.filter(item => item.status === 'completed').length,
      failed: this.queue.filter(item => item.status === 'failed').length
    };
  }

  removeFromQueue(id: string): boolean {
    const index = this.queue.findIndex(item => item.id === id);
    if (index !== -1) {
      this.queue.splice(index, 1);
      return true;
    }
    return false;
  }

  reschedule(id: string, newTime: Date): boolean {
    const item = this.queue.find(item => item.id === id);
    if (item && item.status === 'pending') {
      item.scheduledTime = newTime;
      item.attempts = 0;
      this.sortQueue();
      return true;
    }
    return false;
  }

  private async processQueue(): Promise<void> {
    const now = new Date();
    const readyItems = this.queue.filter(
      item => item.status === 'pending' && item.scheduledTime <= now
    );

    for (const item of readyItems) {
      await this.processItem(item);
    }

    // Clean up old completed/failed items (keep last 100)
    const completedItems = this.queue.filter(
      item => item.status === 'completed' || item.status === 'failed'
    );
    
    if (completedItems.length > 100) {
      completedItems
        .sort((a, b) => (b.lastAttempt?.getTime() || 0) - (a.lastAttempt?.getTime() || 0))
        .slice(100)
        .forEach(item => {
          const index = this.queue.indexOf(item);
          if (index !== -1) {
            this.queue.splice(index, 1);
          }
        });
    }
  }

  private async processItem(item: ScheduledContent): Promise<void> {
    item.status = 'processing';
    item.attempts++;
    item.lastAttempt = new Date();

    try {
      // Test content if configured
      if (this.config.autoTest) {
        const testResults = await this.publisher.testContentForMultiplePlatforms(
          item.content, 
          item.platforms
        );
        
        const incompatiblePlatforms = testResults
          .filter(result => !result.isCompatible)
          .map(result => result.platform);
        
        if (incompatiblePlatforms.length > 0) {
          item.status = 'failed';
          item.result = {
            success: false,
            message: `Content not compatible with platforms: ${incompatiblePlatforms.join(', ')}`,
            errors: testResults
              .filter(result => !result.isCompatible)
              .flatMap(result => result.issues)
          };
          return;
        }
      }

      // Publish to all platforms
      const results = await this.publisher.publishToMultiple(item.content, item.platforms);
      
      // Check if all publications succeeded
      const failedPlatforms = Object.entries(results)
        .filter(([_, result]) => !result.success)
        .map(([platform, _]) => platform);

      if (failedPlatforms.length === 0) {
        item.status = 'completed';
        item.result = {
          success: true,
          message: `Successfully published to all platforms: ${item.platforms.join(', ')}`,
          metadata: { results }
        };
      } else if (failedPlatforms.length < item.platforms.length) {
        // Partial success
        const successfulPlatforms = Object.entries(results)
          .filter(([_, result]) => result.success)
          .map(([platform, _]) => platform);

        item.status = 'completed';
        item.result = {
          success: true,
          message: `Published to ${successfulPlatforms.join(', ')}. Failed: ${failedPlatforms.join(', ')}`,
          warnings: [`Failed to publish to: ${failedPlatforms.join(', ')}`],
          metadata: { results }
        };
      } else {
        // Complete failure
        throw new Error(`Failed to publish to all platforms: ${failedPlatforms.join(', ')}`);
      }

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      // Retry if configured and attempts remaining
      if (this.config.retryFailed && item.attempts < item.maxAttempts) {
        item.status = 'pending';
        // Reschedule for 5 minutes later
        item.scheduledTime = new Date(Date.now() + 5 * 60 * 1000);
      } else {
        item.status = 'failed';
        item.result = {
          success: false,
          message: `Failed to publish after ${item.attempts} attempts`,
          errors: [errorMessage]
        };
      }
    }
  }

  private getNextScheduledTime(): Date {
    const now = new Date();
    const { frequency } = this.config;

    switch (frequency.type) {
      case 'daily':
        const [hours, minutes] = frequency.time.split(':').map(Number);
        const scheduledTime = new Date(now);
        scheduledTime.setHours(hours, minutes, 0, 0);
        
        // If time has passed today, schedule for tomorrow
        if (scheduledTime <= now) {
          scheduledTime.setDate(scheduledTime.getDate() + 1);
        }
        
        return scheduledTime;

      case 'weekly':
        // Implementation for weekly scheduling
        const weeklyTime = new Date(now);
        weeklyTime.setDate(now.getDate() + 7);
        return weeklyTime;

      case 'monthly':
        // Implementation for monthly scheduling
        const monthlyTime = new Date(now);
        monthlyTime.setMonth(now.getMonth() + 1);
        return monthlyTime;

      default:
        // Default to 1 hour from now
        return new Date(now.getTime() + 60 * 60 * 1000);
    }
  }

  private sortQueue(): void {
    this.queue.sort((a, b) => {
      // First by priority (high > medium > low)
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      const priorityDiff = priorityOrder[b.priority] - priorityOrder[a.priority];
      
      if (priorityDiff !== 0) {
        return priorityDiff;
      }
      
      // Then by scheduled time (earlier first)
      return a.scheduledTime.getTime() - b.scheduledTime.getTime();
    });
  }
}

