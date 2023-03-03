import { Injectable } from '@nestjs/common';
import {
  Context,
  Options,
  SlashCommand,
  SlashCommandContext,
  StringOption,
} from 'necord';
import {
  joinVoiceChannel,
  createAudioPlayer,
  StreamType,
  createAudioResource,
  VoiceConnectionStatus,
  NoSubscriberBehavior,
} from '@discordjs/voice';
import * as ytdl from 'ytdl-core';
import { ChannelType, Client } from 'discord.js';

class OptionDto {
  @StringOption({
    name: 'link',
    description: 'Link from YouTube',
    required: true,
  })
  keyword: string;
}

@Injectable()
export class AppCommandService {
  constructor(private readonly client: Client) {}

  @SlashCommand({
    name: 'play',
    description: 'Play Music From YouTube',
  })
  public async onPlayYouTube(
    @Context() [interaction]: SlashCommandContext,
    @Options()
    { keyword }: OptionDto,
  ) {
    try {
      const channels = await interaction.guild.channels.fetch();
      const voiceChannels = channels.find(
        (c) => c.type === ChannelType.GuildVoice,
      );

      const connection = joinVoiceChannel({
        channelId: voiceChannels.id,
        adapterCreator: interaction.guild.voiceAdapterCreator,
        guildId: interaction.guildId,
        selfMute: false,
        selfDeaf: false,
      });

      connection.on(VoiceConnectionStatus.Signalling, () => {
        console.log('Signalling');
      });
      connection.on(VoiceConnectionStatus.Connecting, () => {
        console.log('Connecting');
      });
      connection.on(VoiceConnectionStatus.Disconnected, () => {
        console.log('Disconnected');
      });

      connection.on(VoiceConnectionStatus.Ready, async () => {
        const stream = await ytdl(keyword, {
          filter: 'audioonly',
          quality: 'highestaudio',
          highWaterMark: 1 << 25,
          dlChunkSize: 0,
        });

        const resource = createAudioResource(stream, {
          inputType: StreamType.Arbitrary,
        });
        const player = createAudioPlayer({
          behaviors: {
            noSubscriber: NoSubscriberBehavior.Play,
          },
        });
        player.play(resource);
        connection.subscribe(player);

        return await interaction.reply({
          content: `Đang phát: ${keyword}`,
        });
      });

      connection.on('stateChange', (oldState, newState) => {
        const oldNetworking = Reflect.get(oldState, 'networking');
        const newNetworking = Reflect.get(newState, 'networking');

        const networkStateChangeHandler = (
          oldNetworkState,
          newNetworkState,
        ) => {
          const newUdp = Reflect.get(newNetworkState, 'udp');
          clearInterval(newUdp?.keepAliveInterval);
        };

        oldNetworking?.off('stateChange', networkStateChangeHandler);
        newNetworking?.on('stateChange', networkStateChangeHandler);
      });
    } catch (error) {
      console.log(error);
    }
  }
}
