const {
    Events,
    EmbedBuilder,
    ButtonBuilder,
    ActionRowBuilder,
    ButtonStyle,
    MessageFlags,
} = require("discord.js");
const fs = require("fs");
const axios = require("axios");
const path = require("path");
const ctx = new (require("../global/context"))();

const jsonConfigPath = path.join(__dirname, "../../config.json");
const logger = require("../helpers/logger");

const sendSecurityDM = async (user, guildName, channelName, content) => {
    try {
        const securityEmbed = new EmbedBuilder()
            .setAuthor({ name: "Ecole Directe Plus Security", iconURL: "https://www.ecole-directe.plus/favicon.ico" })
            .setTitle("⛔ Comportement Inapproprié ⛔")
            .setDescription(
                `Nous avons détecté un abus de vocabulaire violent ou inapproprié dans un de tes précédents messages sur **${guildName}** (salon #${channelName}).\n\n` +
                "Ce type de langage est inacceptable et va à l'encontre de nos règles de conduite.\n\n" +
                "• 🛑 **Rappel** : Le respect et la courtoisie sont essentiels dans nos échanges.\n\n" +
                "Si ce comportement persiste, des mesures disciplinaires pourraient être prises, y compris la suspension de ton accès à la plateforme. 🔒\n\n" +
                "Nous te conseillons vivement de réfléchir à tes mots et de faire preuve de respect envers les autres utilisateurs. 🤝\n\n" +
                "Merci de ta compréhension ! 🙏"
            )
            .addFields({ name: "📝 Message concerné", value: `\`\`\`${content.substring(0, 100)}\`\`\`` })
            .setColor("#ff0000")
            .setTimestamp();

        await user.send({ embeds: [securityEmbed] });
        return true;
    } catch (e) {
        logger.warn(`[SECURITY] - Impossible d'envoyer le DM à ${user.tag}`);
        return false;
    }
};

const linkFiltering = async (message, config) => {
    if (message.author.bot) return false;
    const inviteRegex = /discord(?:app\.com\/invite|\.gg)\/([\w-]{2,255})/gi;
    const match = inviteRegex.exec(message.content);
    if (match) {
        const fullLink = match[0].toLowerCase();
        const whitelist = config.link_whitelist || [];
        const isWhitelisted = whitelist.some(w => fullLink.includes(w.toLowerCase()));
        if (!isWhitelisted) {
            try {
                await message.delete();
                const securityEmbed = new EmbedBuilder()
                    .setAuthor({ name: "EDP Security Team", iconURL: message.guild.iconURL() })
                    .setTitle("🛡️ Protection Anti-Pub")
                    .setDescription(`Désolé ${message.author}, les invitations Discord externes sont interdites ici.`)
                    .setColor("#e74c3c")
                    .setTimestamp();
                const warnMsg = await message.channel.send({ embeds: [securityEmbed] });
                setTimeout(() => warnMsg.delete().catch(() => {}), 10000);
                return true;
            } catch (err) { logger.error("[LINK_FILTER] - Erreur suppression :", err); }
        }
    }
    return false;
};

const iaDetectionAndModeration = async (_, message) => {
    if (message.author.bot) return;

    const freshConfig = JSON.parse(fs.readFileSync(jsonConfigPath, "utf8"));
    const config = freshConfig.real && freshConfig.real.mod_role !== "[ID_MOD_ROLE]" ? freshConfig.real : freshConfig;
    
    if (await linkFiltering(message, config)) return;

    const modRoleID = config.mod_role;
    const automodConfig = config.automod || { mode: "notify" };

    // DÉTECTION BLINDÉE : On vérifie la collection de mentions OU la présence de l'ID dans le texte
    const hasRoleMention = message.mentions.roles.has(modRoleID) || message.content.includes(modRoleID);
    const isReportByReply = message.reference && hasRoleMention;
    
    if (!isReportByReply) return;

    // Log pour confirmer le déclenchement
    logger.info(`[AUTOMOD] - Déclenchement détecté via: "${message.content}"`);

    let targetMessage;
    try {
        targetMessage = await message.channel.messages.fetch(message.reference.messageId);
    } catch (err) { return; }

    if (!targetMessage || targetMessage.author.bot) return;

    const analyze = async (msgContent, systemPrompt) => {
        try {
            const response = await axios.post("https://openrouter.ai/api/v1/chat/completions", {
                model: process.env.OPENROUTER_MODEL || "google/gemini-2.0-flash-lite-preview-02-05:free",
                messages: [{ role: "system", content: systemPrompt }, { role: "user", content: msgContent }]
            }, {
                headers: { "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`, "Content-Type": "application/json" },
                timeout: 10000
            });
            return response.data.choices[0]?.message?.content?.toLowerCase().trim();
        } catch (error) { return "pass"; }
    };

    const aiDetection = await analyze(targetMessage.content, freshConfig.prompt);

    if (aiDetection && aiDetection.includes("block")) {
        const mode = automodConfig.mode;
        const modChannel = await message.guild.channels.fetch(config.mod_channel).catch(() => null);

        if (mode === "delete" || mode === "ai") {
            let punishment = "delete";
            if (mode === "ai") punishment = await analyze(targetMessage.content, freshConfig.punishment_prompt);

            try {
                await sendSecurityDM(targetMessage.author, message.guild.name, targetMessage.channel.name, targetMessage.content);
                if (punishment.includes("mute")) await targetMessage.member.timeout(600000, "AutoMod AI Decision");
                await targetMessage.delete();
                await message.delete();

                if (modChannel) {
                    const logEmbed = new EmbedBuilder()
                        .setTitle(`🛡️ AutoMod - Action: ${mode.toUpperCase()}`)
                        .setDescription(`Utilisateur **${targetMessage.author.tag}** sanctionné automatiquement.`)
                        .addFields(
                            { name: "⚡ Sanction", value: punishment.toUpperCase(), inline: true },
                            { name: "📝 Message", value: `\`\`\`${targetMessage.content}\`\`\`` }
                        )
                        .setColor("#ffcc00").setTimestamp();
                    await modChannel.send({ embeds: [logEmbed] });
                }
            } catch (e) { logger.error("[AUTOMOD] - Erreur action auto :", e); }
            return;
        }

        if (modChannel) {
            const modWarnEmbed = new EmbedBuilder()
                .setTitle("🛡️ AutoMod - Signalement Prioritaire 🚨")
                .setDescription(`Signalé par **${message.author.tag}**.\nL'IA confirme l'infraction.`)
                .addFields(
                    { name: "👤 Auteur", value: `${targetMessage.author.tag}`, inline: true },
                    { name: "💬 Salon", value: `<#${targetMessage.channelId}>`, inline: true },
                    { name: "📝 Contenu", value: `\`\`\`${targetMessage.content}\`\`\`` }
                )
                .setColor("#b00000").setTimestamp();

            const row = new ActionRowBuilder().addComponents(
                new ButtonBuilder().setCustomId("deleteMessage").setLabel("Supprimer").setEmoji("🗑️").setStyle(ButtonStyle.Danger),
                new ButtonBuilder().setCustomId("warnUser").setLabel("Avertir DM").setEmoji("⚠️").setStyle(ButtonStyle.Secondary),
                new ButtonBuilder().setCustomId("ignoreReport").setLabel("Ignorer").setEmoji("✅").setStyle(ButtonStyle.Success)
            );

            const modMsg = await modChannel.send({ content: `<@&${modRoleID}>`, embeds: [modWarnEmbed], components: [row] });
            const collector = modMsg.createMessageComponentCollector({ time: 3600000 });

            collector.on("collect", async (interaction) => {
                if (interaction.customId === "deleteMessage") {
                    try {
                        const msg = await targetMessage.channel.messages.fetch(targetMessage.id);
                        await msg.delete();
                        await interaction.reply({ content: "✅ Message supprimé.", flags: MessageFlags.Ephemeral });
                    } catch (e) { await interaction.reply({ content: "❌ Déjà supprimé.", flags: MessageFlags.Ephemeral }); }
                    await modMsg.edit({ components: [] });
                } else if (interaction.customId === "warnUser") {
                    const sent = await sendSecurityDM(targetMessage.author, message.guild.name, targetMessage.channel.name, targetMessage.content);
                    await interaction.reply({ content: sent ? "✅ DM envoyé." : "❌ Impossible d'envoyer le DM.", flags: MessageFlags.Ephemeral });
                } else if (interaction.customId === "ignoreReport") {
                    await interaction.reply({ content: "✅ Signalement ignoré.", flags: MessageFlags.Ephemeral });
                    await modMsg.edit({ components: [] });
                }
            });
        }
    }
};

module.exports = {
    name: Events.MessageCreate,
    async execute(client, message) {
        iaDetectionAndModeration(client, message);
    },
};
