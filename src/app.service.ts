import { Injectable, Logger } from '@nestjs/common';
import { Client, VoiceState } from 'discord.js';
import { Context, ContextOf, On, Once } from 'necord';

@Injectable()
export class AppService {
  private readonly logger = new Logger(AppService.name);

  public constructor(private readonly client: Client) {}

  @Once('ready')
  public onReady(@Context() [client]: ContextOf<'ready'>) {
    this.logger.log(`Bot logged in as ${client.user.username}`);
  }

  @On('voiceStateUpdate')
  public async onVoiceStateUpdate(
    @Context() [oldState, newState]: ContextOf<'voiceStateUpdate'>,
  ) {
    if (newState.channelId === null) {
      // const channel = await this.client.channels.fetch(oldState.channelId);

      // console.log('user left channel', oldState.channelId);
      // console.log('User:', newState.member.user.username);
      // this.client.user.send(
      //   `Tôi vừa phát hiện ${newState.member.user.username} thoát`,
      // );
      return;
    }
    if (oldState.channelId === null) {
      // const channel = await this.client.channels.fetch(newState.channelId);

      // console.log('user joined channel', newState.channelId);
      // console.log('User:', newState.member.user.username);
      // this.client.user.send(
      //   `Tôi vừa phát hiện ${newState.member.user.username} vào`,
      // );
      return;
    }

    // console.log('user moved channels', oldState.channelId, newState.channelId);
    // console.log('User:', newState.member.user.username);
  }
}
