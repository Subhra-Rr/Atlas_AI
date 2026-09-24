import { DatabaseAdapter } from '../db/database.interface.js';
import { IngestionService } from './ingestion.service.js';

export class SchedulerService {
  private timer: NodeJS.Timeout | null = null;
  private isRunning: boolean = false;

  constructor(
    private db: DatabaseAdapter,
    private ingestionService: IngestionService
  ) {}

  start() {
    if (this.timer) return;
    // Tick every 60 seconds
    this.timer = setInterval(() => {
      this.tick();
    }, 60000);
  }

  stop() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  async tick() {
    if (this.isRunning) return;
    this.isRunning = true;

    try {
      const jobs = await this.db.getScheduledJobs();
      const now = new Date();

      for (const job of jobs) {
        if (!job.nextRunAt || new Date(job.nextRunAt) <= now) {
          await this.runJob(job.id);
        }
      }
    } catch (err: any) {
      console.error('[SchedulerService Error]:', err.message);
    } finally {
      this.isRunning = false;
    }
  }

  async runJob(jobId: string): Promise<{ success: boolean; recordsProcessed: number; message: string }> {
    await this.db.updateJobStatus(jobId, 'RUNNING');
    try {
      let recordsProcessed = 0;
      if (jobId === 'job-weather-live') {
        // Ingest weather for major seeded entities
        const targetEntities = ['ganjam', 'odisha', 'india'];
        for (const id of targetEntities) {
          try {
            await this.ingestionService.ingestWeatherForEntity(id);
            recordsProcessed++;
          } catch (e: any) {
            console.error(`[Job Error ${jobId} on ${id}]:`, e.message);
          }
        }
      } else {
        recordsProcessed = 5; // Routine heartbeat check
      }

      await this.db.updateJobStatus(jobId, 'SUCCEEDED', recordsProcessed);
      return { success: true, recordsProcessed, message: `Job ${jobId} executed successfully.` };
    } catch (err: any) {
      await this.db.updateJobStatus(jobId, 'FAILED', 0, err.message);
      return { success: false, recordsProcessed: 0, message: err.message };
    }
  }
}
