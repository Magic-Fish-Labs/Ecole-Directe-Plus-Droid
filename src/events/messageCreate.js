const {
    Events,
    EmbedBuilder,
    ButtonBuilder,
    ActionRowBuilder,
    ButtonStyle,
    MessageFlags,
} = require("discord.js");
const fs = require("fs");

const Groq = require("groq-sdk");
const path = require("path");
const ctx = new (require("../global/context"))();

const jsonConfig = require("../../config.json");
const logger = require("../helpers/logger");

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

const iaDetectionAndModeration = async (_, message) => {
    if (
        message.author.bot ||
        (message.content.toLowerCase().endsWith(".safemsg") &&
            jsonConfig.bot_devs.includes(message.author.id))
    ) {
        const opEmbedData = JSON.parse(
            fs.readFileSync(
                path.join(__dirname, "../embeds/opBypass.json"),
                "utf8"
            )
        );

        const opEmbed = new EmbedBuilder()
            .setTitle(opEmbedData.title)
            .setDescription(opEmbedData.description)
            .setColor(opEmbedData.color)
            .setAuthor({
                name: opEmbedData.author.name,
                url:
                    opEmbedData.author.url || "https://www.ecole-directe.plus/",
                iconURL: opEmbedData.author.iconUrl,
            });

        try {
            if (message.author.bot) return;
            const replyMsg = await message.reply({
                embeds: [opEmbed],
                flags: MessageFlags.Ephemeral,
            });

            setTimeout(() => {
                replyMsg
                    .delete()
                    .catch((err) =>
                        logger.error(
                            "[AUTOMOD] - Erreur lors de la suppression du message :",
                            err
                        )
                    );
            }, 5000);
        } catch (error) {
            if (error.code === 50007) {
                console.log(
                    "[AUTOMOD] - Impossible d'envoyer un message privé à l'utilisateur."
                );
            }
        }
        return;
    }

    const modRole = message.guild.roles.cache.find(
        (role) => role.id === jsonConfig.mod_role
    );
    const modChannel = message.guild.channels.cache.find(
        (channel) => channel.id === jsonConfig.mod_channel
    );
    const generalChannel = message.guild.channels.cache.find(
        (channel) => channel.id === jsonConfig.general_channel
    );
    const content = message.content.toLowerCase();

    let aiDetection = "pass";
    async function getGroqChatCompletion() {
        try {
            return groq.chat.completions.create({
                messages: [
                    {
                        role: "system",
                        content: jsonConfig.prompt,
                    },
                    {
                        role: "user",
                        content: content,
                    },
                ],
                model: "llama3-70b-versatile",
                temperature: 0,
                /* eslint-disable camelcase */
                max_tokens: 1024,
                top_p: 0,
                /* eslint-enable camelcase */
            });
        } catch (error) {
            logger.error(
                "No tokens left for current model",
                error // Je mets ça comme ça mais je ne pense pas que le modèle puisse se vider de ses tokens si facilement -- ewalwi
            );
        }
    }

    const chatCompletion = await getGroqChatCompletion();
    aiDetection = chatCompletion.choices[0]?.message?.content;

    if (aiDetection === "block") {
        const member = message.member;
        ctx.set("MESSAGE_CREATE_GENERAL_CHANNEL", generalChannel); // I can't be bothered to export message in the buttons so... :) -> in french "flm"
        ctx.set("MESSAGE_CREATE_MEMBER", member);
        const modWarnEmbedContent = JSON.parse(
            fs.readFileSync(
                path.join(__dirname, "../embeds/warnMod.json"),
                "utf8"
            )
        );
        let description = modWarnEmbedContent.description
            .replace("{message.author}", member.user.globalName)
            .replace("{message.author.name}", member.user.username)
            .replace("{message.content}", message.content)
            .replace("{serverId}", message.guildId)
            .replace("{channelId}", message.channelId)
            .replace("{messageId}", message.id);

        const modWarnEmbed = new EmbedBuilder()
            .setTitle(modWarnEmbedContent.title)
            .setDescription(description)
            .setColor(modWarnEmbedContent.color);

        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId("warnCommunity")
                .setLabel("Prévenir la communauté")
                .setStyle(ButtonStyle.Danger),
            new ButtonBuilder()
                .setCustomId("reportUser")
                .setLabel("Signaler l'utilisateur")
                .setStyle(ButtonStyle.Danger),
            new ButtonBuilder()
                .setCustomId("deleteMessage")
                .setLabel("Supprimer le message")
                .setStyle(ButtonStyle.Danger)
        );
        const modMessage = await modChannel.send({
            embeds: [modWarnEmbed],
            components: [row],
            content: `${modRole}`,
        });

        modMessage["badMessageUserId"] = message.author.id;
        modMessage["badMessageLinkID"] =
            `https://discord.com/channels/${message.guildId}/${message.channelId}/${message.id}`;

        const filter = (i) =>
            i.customId === "warnCommunity" ||
            i.customId === "reportUser" ||
            i.customId === "deleteMessage";

        const collector = modMessage.createMessageComponentCollector({
            filter,
            time: 3600000,
        });

        collector.on("collect", async (collectorInteraction) => {
            await collectorInteraction.deferUpdate();

            const userMention = `<@${collectorInteraction.user.id}>`;
            let actionMessage;

            if (collectorInteraction.customId === "warnCommunity") {
                const previousContent =
                    modMessage.content === `<@&${jsonConfig.mod_role}>`
                        ? ""
                        : modMessage.content;
                actionMessage = `|| ${userMention} a prévenu la communauté". ||`;

                await collectorInteraction.followUp({
                    content: "La communauté a été prévenue.",
                    flags: MessageFlags.Ephemeral,
                });

                const newComponents = modMessage.components
                    .map((row) => {
                        const filteredComponents = row.components.filter(
                            (component) =>
                                component.customId !== "warnCommunity"
                        );

                        return filteredComponents.length > 0
                            ? new ActionRowBuilder().addComponents(
                                  filteredComponents
                              )
                            : null;
                    })
                    .filter(Boolean);
                const updatedContent =
                    `${previousContent}\n${actionMessage}`.trim();
                await modMessage.edit({
                    components: newComponents,
                    content: updatedContent,
                });
            } else if (collectorInteraction.customId === "reportUser") {
                const previousContent =
                    modMessage.content === `<@&${jsonConfig.mod_role}>`
                        ? ""
                        : modMessage.content;

                actionMessage = `|| ${userMention} a signalé l'utilisateur". ||`;

                try {
                    await collectorInteraction.followUp({
                        content: "L'utilisateur a été signalé.",
                        flags: MessageFlags.Ephemeral,
                    });

                    const newComponents = modMessage.components
                        .map((row) => {
                            const filteredComponents = row.components.filter(
                                (component) =>
                                    component.customId !== "reportUser"
                            );

                            return filteredComponents.length > 0
                                ? new ActionRowBuilder().addComponents(
                                      filteredComponents
                                  )
                                : null;
                        })
                        .filter(Boolean);
                    const updatedContent =
                        `${previousContent}\n${actionMessage}`.trim();
                    await modMessage.edit({
                        components: newComponents,
                        content: updatedContent,
                    });
                } catch (error) {
                    if (error.code === 50007) {
                        logger.log(
                            "[AUTOMOD] - Impossible d'envoyer un message privé à l'utilisateur.",
                            error
                        );
                    }
                }
            } else if (collectorInteraction.customId === "deleteMessage") {
                await collectorInteraction.followUp({
                    content: "Le message a été supprimé.",
                    flags: MessageFlags.Ephemeral,
                });

                const previousContent =
                    modMessage.content === `<@&${jsonConfig.mod_role}>`
                        ? ""
                        : modMessage.content;
                actionMessage = `|| ${userMention} a supprimé le message". ||`;

                const newComponents = modMessage.components
                    .map((row) => {
                        const filteredComponents = row.components.filter(
                            (component) =>
                                component.customId !== "deleteMessage"
                        );

                        return filteredComponents.length > 0
                            ? new ActionRowBuilder().addComponents(
                                  filteredComponents
                              )
                            : null;
                    })
                    .filter(Boolean);

                const updatedContent =
                    `${previousContent}\n${actionMessage}`.trim();

                await modMessage.edit({
                    components: newComponents,
                    content: updatedContent,
                });

                return;
            }
        });

        logger.info("[AUTOMOD] - Opération de modération effectuée.");
        return;
    }
};

module.exports = {
    name: Events.MessageCreate,
    async execute(client, message) {
        iaDetectionAndModeration(client, message);
    },
};

