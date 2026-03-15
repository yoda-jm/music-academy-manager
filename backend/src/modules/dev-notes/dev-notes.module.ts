import { Module } from '@nestjs/common';
import { DevNotesController } from './dev-notes.controller';

@Module({
  controllers: [DevNotesController],
})
export class DevNotesModule {}
