import { Injectable, Logger } from '@nestjs/common';
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
  VoiceConnection,
  AudioPlayer,
} from '@discordjs/voice';
import * as ytdl from 'ytdl-core';
import {
  CacheType,
  ChannelType,
  ChatInputCommandInteraction,
} from 'discord.js';
import * as SoundCloud from 'soundcloud-scraper';

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
  private readonly logger = new Logger(AppCommandService.name);
  private readonly _soundCloudClient = new SoundCloud.Client();
  private _queue: string[] = [];
  private _currentPlaying = '';
  private _player: AudioPlayer;
  private _voiceConnection: VoiceConnection;

  constructor() {
    console.log(Math.random());
  }

  @SlashCommand({
    name: 'play',
    description: 'Play Music From YouTube',
  })
  public async onPlay(
    @Context() [interaction]: SlashCommandContext,
    @Options()
    { link }: OptionDto,
  ) {
    try {
      if (this._currentPlaying) {
        this._addToQueue(link, interaction);
        return;
      }

      await interaction.deferReply({ ephemeral: false });

      const channels = await interaction.guild.channels.fetch();
      const voiceChannels = channels.find(
        (c) => c.type === ChannelType.GuildVoice,
      );

      this._voiceConnection = joinVoiceChannel({
        channelId: voiceChannels.id,
        adapterCreator: interaction.guild.voiceAdapterCreator,
        guildId: interaction.guildId,
        selfMute: false,
        selfDeaf: false,
      });

      this._voiceConnection.on(VoiceConnectionStatus.Disconnected, () =>
        this._handleDisconnect(interaction),
      );

      this._voiceConnection.on(VoiceConnectionStatus.Ready, async () => {
        const stream = await this._getStream(link);
        if (!stream) return;
        await this._playTrack(stream);
        this._player.on(AudioPlayerStatus.Playing, () =>
          this._handlePlaying(link, interaction),
        );
        this._player.on(AudioPlayerStatus.Idle, () =>
          this._handleIdle(interaction),
        );
        this._voiceConnection.subscribe(this._player);
      });

      this._voiceConnection.on('stateChange', (oldState, newState) => {
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
      this.logger.error(error);
    }
  }

  @SlashCommand({
    name: 'nowplaying',
    description: 'Show current playing track',
  })
  public async nowPlaying(@Context() [interaction]: SlashCommandContext) {
    await interaction.deferReply({ ephemeral: false });
    await interaction.followUp({
      content: this._currentPlaying,
    });
  }

  @SlashCommand({
    name: 'stop',
    description: 'Stop playing',
  })
  public async stop(@Context() [interaction]: SlashCommandContext) {
    this._player.stop();
    this._currentPlaying = '';
    this._voiceConnection.destroy();
    await interaction.followUp({
      content: this._currentPlaying,
    });
  }

  @SlashCommand({
    name: 'pause',
    description: 'Stop playing',
  })
  public async pause(@Context() [interaction]: SlashCommandContext) {
    this._player.pause();
    this._currentPlaying = '';
    this._voiceConnection.destroy();
    await interaction.followUp({
      content: 'Đã tạm dừng',
    });
  }

  @SlashCommand({
    name: 'resume',
    description: 'Resume playing',
  })
  public async resume(@Context() [interaction]: SlashCommandContext) {
    this._player.unpause();
    await interaction.followUp({
      content: `Tiếp tục phát ${this._currentPlaying}`,
    });
  }

  private async _addToQueue(
    link: string,
    interaction: ChatInputCommandInteraction<CacheType>,
  ) {
    this._queue.push(link);
    await interaction.deferReply({ ephemeral: false });
    await interaction.followUp({
      content: `Đã thêm vào hàng chờ: ${link}`,
    });
  }

  private async _getStream(link: string) {
    if (link.includes('youtube') || link.includes('youtu.be')) {
      return await ytdl(link, {
        filter: 'audioonly',
        quality: 'highestaudio',
        highWaterMark: 1 << 25,
        dlChunkSize: 0,
      });
    }

    if (link.includes('soundcloud')) {
      const track = await this._soundCloudClient.getSongInfo(link);
      return await track.downloadProgressive();
    }
  }

  private async _playTrack(stream) {
    const resource = createAudioResource(stream, {
      inputType: StreamType.Arbitrary,
    });
    this._player = createAudioPlayer({
      behaviors: {
        noSubscriber: NoSubscriberBehavior.Play,
      },
    });
    this._player.play(resource);
  }

  private async _handlePlaying(
    link: string,
    interaction: ChatInputCommandInteraction<CacheType>,
  ) {
    this._queue.push(link);
    this._currentPlaying = link;
    await interaction.followUp({
      content: `Đang phát: ${link}`,
    });
  }

  private async _handleIdle(
    interaction: ChatInputCommandInteraction<CacheType>,
  ) {
    console.log('idle');
    const index = this._queue.indexOf(this._currentPlaying);
    if (this._queue.length) return;
    if (index === -1) {
      await interaction.followUp({
        content: 'Không tìm thấy bài tiếp theo',
      });
      return;
    }
    this._currentPlaying = this._queue[index + 1];
    this._queue.shift();
    if (index > -1) {
      const stream = await this._getStream(this._currentPlaying);
      if (!stream) return;
      await this._playTrack(stream);
      this._voiceConnection.subscribe(this._player);
    }
  }

  private async _handleDisconnect(interaction) {
    this._queue = [];
    this._currentPlaying = '';
    await interaction.deferReply({ ephemeral: false });
    await interaction.followUp({
      content: 'Tạm biệt anh em, tôi nghỉ đây',
    });
  }
}
