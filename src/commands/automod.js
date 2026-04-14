const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, MessageFlags } = require("discord.js");
const fs = require("fs");
const path = require("path");
const configPath = path.join(__dirname, "../../config.json");

module.exports = {
    name: "automod",
    description: "Configurer le mode de l'AutoMod IA",
    restricted: true,

    async runSlash(client, interaction) {
        const config = JSON.parse(fs.readFileSync(configPath, "utf8"));
        const currentMode = config.real.automod?.mode || "notify";

        const embed = new EmbedBuilder()
            .setTitle("🤖 Configuration AutoMod IA")
            .setDescription("Choisissez comment l'IA doit réagir lorsqu'un message problématique est détecté via un signalement.")
            .addFields(
                { name: "📡 Mode Actuel", value: `\`${currentMode.toUpperCase()}\`` },
                { name: "\n📝 Modes disponibles :", value: 
                    "• **NOTIFY** : Prévient les modos avec un panel d'action.\n" +
                    "• **DELETE** : Supprime direct le message sans demander.\n" +
                    "• **AI** : L'IA choisit la sanction (Delete, Mute ou Warn)." 
                }
            )
            .setColor("#3498db")
            .setFooter({ text: "EDP Security System" });

        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId("set_mode_notify")
                .setLabel("Notify")
                .setStyle(currentMode === "notify" ? ButtonStyle.Success : ButtonStyle.Secondary),
            new ButtonBuilder()
                .setCustomId("set_mode_delete")
                .setLabel("Delete")
                .setStyle(currentMode === "delete" ? ButtonStyle.Success : ButtonStyle.Secondary),
            new ButtonBuilder()
                .setCustomId("set_mode_ai")
                .setLabel("IA Decision")
                .setStyle(currentMode === "ai" ? ButtonStyle.Success : ButtonStyle.Secondary)
        );

        await interaction.reply({ embeds: [embed], components: [row] });

        const collector = interaction.channel.createMessageComponentCollector({
            filter: i => i.user.id === interaction.user.id,
            time: 60000
        });

        collector.on("collect", async i => {
            const newMode = i.customId.replace("set_mode_", "");
            
            const freshConfig = JSON.parse(fs.readFileSync(configPath, "utf8"));
            freshConfig.real.automod.mode = newMode;
            fs.writeFileSync(configPath, JSON.stringify(freshConfig, null, 4));

            const successEmbed = new EmbedBuilder()
                .setTitle("✅ Mode mis à jour")
                .setDescription(`L'AutoMod est maintenant en mode **${newMode.toUpperCase()}**.`)
                .setColor("#2ecc71");

            await i.update({ embeds: [successEmbed], components: [] });
            collector.stop();
        });
    },
};
