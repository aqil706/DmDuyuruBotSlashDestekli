const { Client, GatewayIntentBits, Events, EmbedBuilder, REST, Routes } = require('discord.js');
const { joinVoiceChannel } = require('@discordjs/voice'); // Ses kanalları için gerekli
const config = require('./config.js'); // Token ve sunucu ID'sini burada tanımlayabilirsin

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.DirectMessages,
    GatewayIntentBits.GuildVoiceStates // Ses kanallarını dinleyebilmek için eklendi
  ],
  partials: ['CHANNEL'] // DM'leri dinlemek için gerekli
});

// Bot aktif olduğunda
client.once(Events.ClientReady, () => {
  console.log('Bot aktif ve çalışıyor!');
});

// Slash komutlarını kaydet
const commands = [
  {
    name: 'dm-duyuru',
    description: 'Tüm kullanıcılara DM ile duyuru gönderir.',
    options: [
      {
        type: 3, // STRING
        name: 'mesaj',
        description: 'Gönderilecek duyuru mesajı',
        required: true,
      },
    ],
  },
  {
    name: 'sesliye-gir',
    description: 'Belirtilen ses kanalına girer.',
    options: [
      {
        type: 3, // STRING
        name: 'id',
        description: 'Ses kanalı ID\'si',
        required: true,
      },
    ],
  }
];

// Komutları Discord API'sine kaydet
const rest = new REST({ version: '9' }).setToken(config.token);

(async () => {
  try {
    console.log('Başarılı bir şekilde komutları güncelleyip kaydediyoruz...');
    await rest.put(Routes.applicationCommands(config.clientId), { body: commands });
    console.log('Komutlar başarıyla kaydedildi!');
  } catch (error) {
    console.error(error);
  }
})();

// Mesajları dinle
client.on(Events.InteractionCreate, async (interaction) => {
  if (!interaction.isCommand()) return; // Sadece komutları dinle

  const { commandName } = interaction;

  // DM duyurusu komutu
  if (commandName === 'dm-duyuru') {
    const duyuruMesaji = interaction.options.getString('mesaj');

    // Embed oluşturma
    const duyuruEmbed = new EmbedBuilder()
      .setColor('#00ff00') // Renk
      .setTitle('📢 Yeni Duyuru!')
      .setDescription(duyuruMesaji)
      .setTimestamp()
      .setFooter({ text: 'Duyuru botu' });

    // Sunucudaki tüm kullanıcılara DM gönder
    try {
      const members = await interaction.guild.members.fetch(); // Tüm üyeleri getir
      members.forEach(member => {
        if (!member.user.bot) {
          member.send({ embeds: [duyuruEmbed] }).catch(err => {
            console.log(`Mesaj gönderilemedi: ${member.user.tag} - Hata: ${err.message}`);
          });
        }
      });
      await interaction.reply('Duyuru başarıyla gönderildi!');
    } catch (error) {
      console.error('Üyeleri getirirken hata oluştu:', error);
      await interaction.reply('DM duyurusu gönderilirken bir hata oluştu.');
    }
  }

  // Sesli kanala girme komutu
  if (commandName === 'sesliye-gir') {
    const channelId = interaction.options.getString('id');
    const channel = await interaction.guild.channels.fetch(channelId);

    if (!channel || channel.type !== 2) { // 2, ses kanalı tipini belirtir
      return interaction.reply('Geçersiz ses kanalı ID\'si.');
    }

    try {
      // Sesli kanala bağlanma
      joinVoiceChannel({
        channelId: channel.id,
        guildId: interaction.guild.id,
        adapterCreator: interaction.guild.voiceAdapterCreator
      });

      await interaction.reply(`Bot başarıyla ses kanalına katıldı: ${channel.name}`);
    } catch (error) {
      console.error('Ses kanalına katılırken hata oluştu:', error);
      await interaction.reply('Bot ses kanalına katılamadı.');
    }
  }
});

// Botu başlat
client.login(config.token);
