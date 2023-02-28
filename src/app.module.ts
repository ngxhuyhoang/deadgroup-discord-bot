import { Module } from '@nestjs/common';
import { GatewayIntentBits } from 'discord.js';
import { NecordModule } from 'necord';
import { AppController } from './app.controller';
import { AppService } from './app.service';

@Module({
  imports: [
    NecordModule.forRoot({
      token:
        'ODEwNDA2NjQyNzUxMjQyMjUw.G04mLU.eBkJG2bpLa4n8XJtea8Wy7IOmU6EPAIAXTUbVg',
      intents: [GatewayIntentBits.Guilds],
    }),
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
