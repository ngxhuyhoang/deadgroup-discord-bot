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
  AudioPlayerStatus,
} from '@discordjs/voice';
import * as ytdl from 'ytdl-core';
import { ChannelType, Client } from 'discord.js';
import * as SoundCloud from 'soundcloud-scraper';
import { exec } from 'child_process';

class OptionDto {
  @StringOption({
    name: 'link',
    description: 'Link from YouTube',
    required: true,
  })
  link: string;
}

@Injectable()
export class AppCommandService {
  private readonly _soundCloudClient = new SoundCloud.Client();
  private readonly _queue: string[] = [];
  private _currentPlaying: string;

  constructor(private readonly client: Client) {}

  @SlashCommand({
    name: 'play',
    description: 'Play Music From YouTube',
  })
  public async onPlayYouTube(
    @Context() [interaction]: SlashCommandContext,
    @Options()
    { link }: OptionDto,
  ) {
    try {
      await interaction.deferReply({ ephemeral: false });

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
        let stream;

        if (link.includes('youtube') || link.includes('youtu.be')) {
          stream = await ytdl(link, {
            filter: 'audioonly',
            quality: 'highestaudio',
            highWaterMark: 1 << 25,
            dlChunkSize: 0,
          });
          this._queue.push(link);
        }

        if (link.includes('soundcloud')) {
          const track = await this._soundCloudClient.getSongInfo(link);
          stream = await track.downloadProgressive();
          this._queue.push(link);
        }

        const resource = createAudioResource(stream, {
          inputType: StreamType.Arbitrary,
        });
        const player = createAudioPlayer({
          behaviors: {
            noSubscriber: NoSubscriberBehavior.Play,
          },
        });
        player.play(resource);
        player.on(AudioPlayerStatus.Playing, () => {
          this._currentPlaying = link;
        });
        // player.on(AudioPlayerStatus.Idle, () => {
        //   player.play(resource);
        // });
        connection.subscribe(player);

        await interaction.followUp({
          content: `Đang phát: ${link}`,
          ephemeral: false,
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
      exec('killall node && cd $HOME/Code/deadgroup-bot && yarn start');
    }
  }
}
