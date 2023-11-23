import { CronCommand, CronJob } from 'cron';
import { db } from './db';

const TIME_ZONE = 'Asia/Ho_Chi_Minh';

const DeleteDailyCommand: CronCommand<null, false> = async () => {
  await db.dailyView.deleteMany();
};

const DeleteWeeklyCommand: CronCommand<null, false> = async () => {
  await db.weeklyView.deleteMany();
};

const DeleteMonthlyCommand: CronCommand<null, false> = async () => {
  await db.notify.deleteMany();
};

const DailyJob = new CronJob(
  '59 2 * * *',
  DeleteDailyCommand,
  null,
  true,
  TIME_ZONE
);

const WeeklyJob = new CronJob(
  '59 2 * * 1',
  DeleteWeeklyCommand,
  null,
  true,
  TIME_ZONE
);

const MonthlyJob = new CronJob(
  '59 2 1 * *',
  DeleteMonthlyCommand,
  null,
  true,
  TIME_ZONE
);

DailyJob.start();
WeeklyJob.start();
MonthlyJob.start();

console.log('CRON is running!');

export {};
