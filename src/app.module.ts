import { Module } from '@nestjs/common';
import { GatewayIntentBits } from 'discord.js';
import { NecordModule } from 'necord';
import { AppCommandModule } from './app-command/app-command.module';

@Module({
  imports: [
    NecordModule.forRoot({
      token:
        'ODEwNDA2NjQyNzUxMjQyMjUw.G04mLU.eBkJG2bpLa4n8XJtea8Wy7IOmU6EPAIAXTUbVg',
      intents: [GatewayIntentBits.Guilds],
    }),
    AppCommandModule,
  ],
})
export class AppModule {}
