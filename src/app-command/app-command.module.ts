import { Module } from '@nestjs/common';
import { AppCommandService } from './app-command.service';

@Module({
  providers: [AppCommandService],
})
export class AppCommandModule {}
