import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { GatewayIntentBits } from 'discord.js';
import { NecordModule } from 'necord';
import { AppCommandModule } from './app-command/app-command.module';
import { AppService } from './app.service';

@Module({
  imports: [
    ConfigModule.forRoot(),
    NecordModule.forRoot({
      token: process.env.TOKEN,
      intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.GuildVoiceStates,
      ],
    }),
    AppCommandModule,
  ],
  providers: [AppService],
})
export class AppModule {}
