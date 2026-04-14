const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, MessageFlags, ModalBuilder, TextInputBuilder, TextInputStyle } = require("discord.js");
const fs = require("fs");
const path = require("path");
const jsonConfigPath = path.join(__dirname, "../../config.json");

module.exports = {
    name: "whitelist",
    description: "Gérer la whitelist des invitations Discord",
    restricted: true,

    async runSlash(client, interaction) {
        const config = JSON.parse(fs.readFileSync(jsonConfigPath, "utf8"));
        const whitelist = config.real.link_whitelist || [];

        const embed = new EmbedBuilder()
            .setTitle("🛡️ Gestion de la Whitelist Discord")
            .setDescription("Gérez les invitations Discord autorisées sur le serveur.")
            .addFields({ 
                name: "🔗 Liens Autorisés", 
                value: whitelist.length > 0 ? whitelist.map(l => `• \`${l}\``).join("\n") : "Aucun lien whiteliste." 
            })
            .setColor("#3498db")
            .setFooter({ text: "EDP Security System" });

        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId("add_whitelist")
                .setLabel("Ajouter")
                .setEmoji("➕")
                .setStyle(ButtonStyle.Primary),
            new ButtonBuilder()
                .setCustomId("remove_whitelist")
                .setLabel("Supprimer")
                .setEmoji("➖")
                .setStyle(ButtonStyle.Danger)
        );

        await interaction.reply({ embeds: [embed], components: [row] });

        // Simple collector for the interaction
        const collector = interaction.channel.createMessageComponentCollector({
            filter: i => i.user.id === interaction.user.id,
            time: 60000
        });

        collector.on("collect", async i => {
            if (i.customId === "add_whitelist") {
                const modal = new ModalBuilder()
                    .setCustomId("modal_add_whitelist")
                    .setTitle("Ajouter un lien");
                
                const input = new TextInputBuilder()
                    .setCustomId("link_input")
                    .setLabel("Lien à ajouter (ex: discord.gg/code)")
                    .setStyle(TextInputStyle.Short)
                    .setRequired(true);

                modal.addComponents(new ActionRowBuilder().addComponents(input));
                await i.showModal(modal);
            } else if (i.customId === "remove_whitelist") {
                const modal = new ModalBuilder()
                    .setCustomId("modal_remove_whitelist")
                    .setTitle("Supprimer un lien");
                
                const input = new TextInputBuilder()
                    .setCustomId("link_remove_input")
                    .setLabel("Lien exact à supprimer")
                    .setStyle(TextInputStyle.Short)
                    .setRequired(true);

                modal.addComponents(new ActionRowBuilder().addComponents(input));
                await i.showModal(modal);
            }
        });
    },
};
