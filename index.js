import {
  Client,
  GatewayIntentBits,
  SlashCommandBuilder,
  REST,
  Routes,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ChannelType,
  PermissionFlagsBits,
} from "discord.js";
import "dotenv/config";

const { DISCORD_TOKEN, CLIENT_ID, CATEGORY_ID, SUPPORT_ROLE_ID } = process.env;

const client = new Client({
  intents: [GatewayIntentBits.Guilds],
});

const commands = [
  new SlashCommandBuilder()
    .setName("setup-ticket")
    .setDescription("สร้างปุ่มเปิด Ticket")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels),
].map((cmd) => cmd.toJSON());

client.once("ready", async () => {
  const rest = new REST({ version: "10" }).setToken(DISCORD_TOKEN);
  try {
    await rest.put(Routes.applicationCommands(CLIENT_ID), { body: commands });
    console.log(`✅ บอทออนไลน์แล้วในชื่อ: ${client.user.tag}`);
    console.log("✅ ลงทะเบียนคำสั่ง /setup-ticket เรียบร้อยแล้ว");
  } catch (err) {
    console.error("❌ ลงทะเบียนคำสั่งไม่สำเร็จ:", err);
  }
});

client.on("interactionCreate", async (interaction) => {
  if (interaction.isChatInputCommand() && interaction.commandName === "setup-ticket") {
    const embed = new EmbedBuilder()
      .setTitle("ระบบเปิด Ticket")
      .setDescription("กดปุ่มด้านล่างเพื่อเปิดห้องพูดคุยกับทีมงาน")
      .setColor(0x5865f2);

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId("open_ticket")
        .setLabel("เปิด Ticket")
        .setStyle(ButtonStyle.Primary)
    );

    await interaction.reply({ embeds: [embed], components: [row] });
  }

  if (interaction.isButton() && interaction.customId === "open_ticket") {
    const channel = await interaction.guild.channels.create({
      name: `ticket-${interaction.user.username}`.toLowerCase(),
      type: ChannelType.GuildText,
      parent: CATEGORY_ID || null,
      permissionOverwrites: [
        {
          id: interaction.guild.roles.everyone.id,
          deny: [PermissionFlagsBits.ViewChannel],
        },
        {
          id: interaction.user.id,
          allow: [
            PermissionFlagsBits.ViewChannel,
            PermissionFlagsBits.SendMessages,
            PermissionFlagsBits.ReadMessageHistory,
          ],
        },
        ...(SUPPORT_ROLE_ID
          ? [
              {
                id: SUPPORT_ROLE_ID,
                allow: [
                  PermissionFlagsBits.ViewChannel,
                  PermissionFlagsBits.SendMessages,
                  PermissionFlagsBits.ReadMessageHistory,
                ],
              },
            ]
          : []),
      ],
    });

    const closeRow = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId("close_ticket")
        .setLabel("ปิด Ticket")
        .setStyle(ButtonStyle.Danger)
    );

    await channel.send({
      content: `<@${interaction.user.id}>${SUPPORT_ROLE_ID ? ` <@&${SUPPORT_ROLE_ID}>` : ""}`,
      embeds: [
        new EmbedBuilder()
          .setTitle("Ticket เปิดแล้ว")
          .setDescription("แจ้งรายละเอียดที่ต้องการความช่วยเหลือได้เลยครับ")
          .setColor(0x57f287),
      ],
      components: [closeRow],
    });

    await interaction.reply({
      content: `✅ สร้างห้อง Ticket แล้ว: ${channel}`,
      ephemeral: true,
    });
  }

  if (interaction.isButton() && interaction.customId === "close_ticket") {
    await interaction.reply({ content: "กำลังปิด Ticket..." });
    setTimeout(() => {
      interaction.channel.delete().catch(() => {});
    }, 1500);
  }
});

client.login(DISCORD_TOKEN);