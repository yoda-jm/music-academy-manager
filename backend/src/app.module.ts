import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { ThrottlerModule } from '@nestjs/throttler';
import { PrismaModule } from './prisma/prisma.module';
import { RedisModule } from './redis/redis.module';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { FamiliesModule } from './modules/families/families.module';
import { TeachersModule } from './modules/teachers/teachers.module';
import { StudentsModule } from './modules/students/students.module';
import { RoomsModule } from './modules/rooms/rooms.module';
import { InstrumentsModule } from './modules/instruments/instruments.module';
import { CoursesModule } from './modules/courses/courses.module';
import { SchedulingModule } from './modules/scheduling/scheduling.module';
import { AttendanceModule } from './modules/attendance/attendance.module';
import { BillingModule } from './modules/billing/billing.module';
import { VacationsModule } from './modules/vacations/vacations.module';
import { MessagingModule } from './modules/messaging/messaging.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { ReportsModule } from './modules/reports/reports.module';
import { EventsModule } from './modules/events/events.module';
import { DevNotesModule } from './modules/dev-notes/dev-notes.module';
import { SettingsModule } from './modules/settings/settings.module';
import appConfig from './config/app.config';
import databaseConfig from './config/database.config';
import redisConfig from './config/redis.config';
import jwtConfig from './config/jwt.config';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [appConfig, databaseConfig, redisConfig, jwtConfig],
      envFilePath: ['.env', '.env.local'],
    }),
    EventEmitterModule.forRoot({
      wildcard: true,
      delimiter: '.',
      newListener: false,
      removeListener: false,
      maxListeners: 20,
      verboseMemoryLeak: true,
      ignoreErrors: false,
    }),
    ThrottlerModule.forRoot([
      {
        ttl: 60000,
        limit: 100,
      },
    ]),
    PrismaModule,
    RedisModule,
    AuthModule,
    UsersModule,
    FamiliesModule,
    TeachersModule,
    StudentsModule,
    RoomsModule,
    InstrumentsModule,
    CoursesModule,
    SchedulingModule,
    AttendanceModule,
    BillingModule,
    VacationsModule,
    MessagingModule,
    NotificationsModule,
    ReportsModule,
    EventsModule,
    DevNotesModule,
    SettingsModule,
  ],
})
export class AppModule {}
