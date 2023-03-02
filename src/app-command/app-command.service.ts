import { Injectable } from '@nestjs/common';
import {
  ChannelOption,
  Context,
  MemberOption,
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
} from '@discordjs/voice';
import * as ytdl from 'ytdl-core';
import { Channel } from 'discord.js';

class OptionDto {
  @StringOption({
    name: 'query',
    description: 'Query to search',
    required: true,
  })
  keyword: string;
}

class ChannelDto {
  @ChannelOption({
    name: 'channel',
    description: 'Channel to join',
    required: true,
  })
  channel: Channel;
}

@Injectable()
export class AppCommandService {
  @SlashCommand({
    name: 'ping',
    description: 'Ping-Pong Command',
  })
  public async onPing(@Context() [interaction]: SlashCommandContext) {
    return interaction.reply({ content: 'Pong!' });
  }

  @SlashCommand({
    name: 'join',
    description: 'Join Voice Channel',
  })
  public async onJoin(
    @Context() [interaction]: SlashCommandContext,
    @Options() { channel }: ChannelDto,
  ) {
    try {
      console.log(channel);

      const connection = joinVoiceChannel({
        // channelId: interaction.channelId,
        channelId: '878281642702176330',
        adapterCreator: interaction.guild.voiceAdapterCreator,
        guildId: interaction.guildId,
      });
      console.log(connection.state);
    } catch (error) {
      console.log(error);
    }
  }

  @SlashCommand({
    name: 'play',
    description: 'Play Music From YouTube',
  })
  public async onPlayYouTube(
    @Context() [interaction]: SlashCommandContext,
    @Options() { keyword }: OptionDto,
  ) {
    try {
      const connection = joinVoiceChannel({
        // channelId: interaction.channelId,
        channelId: '878281642702176330',
        adapterCreator: interaction.guild.voiceAdapterCreator,
        guildId: interaction.guildId,
        selfMute: false,
        selfDeaf: false,
      });

      console.log(connection.state);

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
        const stream = ytdl(keyword, {
          filter: 'audioonly',
          quality: 'highestaudio',
        });
        const resource = createAudioResource(stream, {
          inputType: StreamType.Arbitrary,
        });
        const player = createAudioPlayer();
        player.play(resource);
        connection.subscribe(player);
        return await interaction.reply(`Now playing: ${keyword}`);
      });
    } catch (error) {
      console.log(error);
    }
  }
}
