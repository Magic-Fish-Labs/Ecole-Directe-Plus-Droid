const { Events, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");
const fs = require("fs");
const path = require("path");
const ctx = new (require("../global/context"))();
const jsonConfig = require("../../config.json");
const logger = require("../helpers/logger");

const handleBotThreats = async (member) => {
    const warnDMBottingEmbedData = JSON.parse(
        fs.readFileSync(path.join(__dirname, "../embeds/warnDMBotting.json"), "utf8")
    );

    const warnDMBottingEmbed = new EmbedBuilder()
        .setTitle(warnDMBottingEmbedData.title)
        .setDescription(warnDMBottingEmbedData.description)
        .setColor(warnDMBottingEmbedData.color)
        .setAuthor({
            name: warnDMBottingEmbedData.author.name,
            url: warnDMBottingEmbedData.author.url || "https://www.ecole-directe.plus/",
            iconURL: warnDMBottingEmbedData.author.icon_url,
        });
    
    const modChannel = member.guild.channels.cache.find(
        (channel) => channel.id === jsonConfig.mod_channel
    );

    const modRole = member.guild.roles.cache.find(
        (role) => role.id === jsonConfig.mod_role
    );

    const warnModBottingEmbedData = JSON.parse(
        fs.readFileSync(path.join(__dirname, "../embeds/warnModBotting.json"), "utf8")
    );

    const warnModBottingEmbed = new EmbedBuilder()
        .setTitle(warnModBottingEmbedData.title)
        .setDescription(warnModBottingEmbedData.description
            .replace("{memberThreat}", `<@${member.user.id}>`)
        )
        .setColor(warnModBottingEmbedData.color)
        .setAuthor({
            name: warnModBottingEmbedData.author.name,
            url: warnModBottingEmbedData.author.url || "https://www.ecole-directe.plus/",
        });

    const actions = new ActionRowBuilder()
        .addComponents(
            new ButtonBuilder()
                .setCustomId('unmute')
                .setStyle(ButtonStyle.Success)
                .setLabel('Unmute'),

            new ButtonBuilder()
                .setCustomId('ban')
                .setStyle(ButtonStyle.Danger)
                .setLabel('Ban')
        );

    if (member.user.bot) {
        const rolesToRemove = member.roles.cache.filter(role => role.name !== "@everyone");
        for (const role of rolesToRemove.values()) {
            await member.roles.remove(role);
        }

        let mutedRole = member.guild.roles.cache.find(role => role.name === "Muted");
        if (!mutedRole) {
            mutedRole = await member.guild.roles.create({
                name: "Muted",
                color: "#808080",
                permissions: [],
                reason: "Permanent mute for bot threat",
            });

            for (const channel of member.guild.channels.cache.values()) {
                if (channel.isTextBased()) {
                    await channel.permissionOverwrites.edit(mutedRole, {
                        SendMessages: false,
                        AddReactions: false,
                        Speak: false,
                        Connect: false,
                    });
                }
            }
        }

        await member.roles.add(mutedRole);

        await member.send({
            embeds: [warnDMBottingEmbed],
            content: `|| <@${member.user.id}> ||`,
        });

        if (modChannel) {
            const sentMsg = await modChannel.send({
                embeds: [warnModBottingEmbed],
                content: `|| <@${modRole}> ||`,
                components: [actions],
            });

            const filter = (interaction) =>
                ['unmute', 'ban'].includes(interaction.customId) &&
                interaction.member.roles.cache.has(modRole.id);

            const collector = sentMsg.createMessageComponentCollector({ filter, time: 60000 });

            collector.on('collect', async (interaction) => {
                if (interaction.customId === 'unmute') {
                    await member.roles.remove(mutedRole);
                    await interaction.reply({ content: `Le bot <@${member.user.id}> a été unmute.`, ephemeral: true });
                } else if (interaction.customId === 'ban') {
                    await member.ban({ reason: "Bot threat - action par modérateur" });
                    await interaction.reply({ content: `Le bot <@${member.user.id}> a été banni.`, ephemeral: true });
                }
            });
        }
    }
};

module.exports = {
    name: Events.GuildMemberAdd,
    async execute(client, guildMember) {
        handleBotThreats(guildMember);
        const channel = guildMember.guild.channels.cache.get(
            jsonConfig.welcome_channel
        );

        const embedDataMP = JSON.parse(
            fs.readFileSync(
                path.join(__dirname, "../embeds/welcome.json"),
                "utf8"
            )
        );

        const description = embedDataMP.description
            .replace("{memberCount}", guildMember.guild.memberCount)
            .replace("{member}", guildMember.user.globalName);

        const welcomingEmbedMP = new EmbedBuilder()
            .setTitle(embedDataMP.title)
            .setDescription(description)
            .setColor(embedDataMP.color)
            .setAuthor({
                name: embedDataMP.author.name,
                url:
                    embedDataMP.author.url || "https://www.ecole-directe.plus/",
                iconURL: embedDataMP.author.icon_url,
            });
        const embedData = JSON.parse(
            fs.readFileSync(
                path.join(__dirname, "../embeds/comWelcomeAlert.json"),
                "utf8"
            )
        );

        const comDescription = embedData.description
            .replace("{member.name}", guildMember.user.globalName)
            .replace("{guild.member.count}", guildMember.guild.memberCount);

        const comWelcomingEmbed = new EmbedBuilder()
            .setTitle(embedData.title)
            .setDescription(comDescription)
            .setColor(embedData.color)
            .setAuthor({
                name: embedData.author.name,
                url: embedData.author.url || "https://www.ecole-directe.plus/",
                iconURL: embedData.author.icon_url,
            })
            .setImage(guildMember.user.displayAvatarURL());
        try {
            if (channel && channel.isTextBased()) {
                const sentMessage = await channel.send({
                    embeds: [comWelcomingEmbed],
                    content: `|| <@${guildMember.user.id}> ||`,
                });
                setTimeout(async () => {
                    await sentMessage.edit({
                        embeds: [comWelcomingEmbed],
                        content: "",
                    });
                }, 1000);
            }
            const sentMessage = await guildMember.send({
                embeds: [welcomingEmbedMP],
                content: `|| <@${guildMember.user.id}> ||`,
            });

            setTimeout(async () => {
                await sentMessage.edit({
                    embeds: [welcomingEmbedMP],
                    content: "",
                });
            }, 1000);
        } catch (error) {
            logger.error(
                `Action denied: couldn't send a message to ${client.user.tag}`
            );
        }
    },
};
