const { EmbedBuilder, MessageFlags } = require("discord.js");
const fs = require("fs");
const path = require("path");
const configPath = path.join(__dirname, "../../config.json");

module.exports = {
    name: "settings",
    description: "Configurer les paramètres du bot (Mod Role & Channel)",
    options: [
        {
            name: "mod_role",
            description: "Le nouveau rôle Modérateur",
            type: 8, // ROLE
            required: false,
        },
        {
            name: "mod_channel",
            description: "Le nouveau salon de modération",
            type: 7, // CHANNEL
            required: false,
        }
    ],
    restricted: true,

    async runSlash(client, interaction) {
        const config = JSON.parse(fs.readFileSync(configPath, "utf8"));
        const newRole = interaction.options.getRole("mod_role");
        const newChannel = interaction.options.getChannel("mod_channel");

        let changes = [];

        if (newRole) {
            config.real.mod_role = newRole.id;
            changes.push(`• Rôle Modérateur : <@&${newRole.id}>`);
        }

        if (newChannel) {
            config.real.mod_channel = newChannel.id;
            changes.push(`• Salon Modération : <#${newChannel.id}>`);
        }

        if (changes.length === 0) {
            return interaction.reply({ content: "❌ Aucun changement spécifié.", flags: MessageFlags.Ephemeral });
        }

        fs.writeFileSync(configPath, JSON.stringify(config, null, 4));

        const embed = new EmbedBuilder()
            .setTitle("⚙️ Paramètres Mis à Jour")
            .setDescription(`Les modifications suivantes ont été enregistrées :\n\n${changes.join("\n")}`)
            .setColor("#3498db")
            .setTimestamp()
            .setFooter({ text: "EDP Security System" });

        await interaction.reply({ embeds: [embed] });
    },
};
