import { Module } from '@nestjs/common';
import { GatewayIntentBits } from 'discord.js';
import { NecordModule } from 'necord';
import { AppCommandModule } from './app-command/app-command.module';

@Module({
  imports: [
    NecordModule.forRoot({
      token:
        'MTA4MDg3NjQwNzA5OTUwMjY3Mw.GJW3xL.21YSuZHs54mHRJEbGAeQJyRjAUJmJ_m5-jslMk',
      intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.GuildVoiceStates,
      ],
    }),
    AppCommandModule,
  ],
})
export class AppModule {}
