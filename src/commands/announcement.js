const {
    EmbedBuilder,
    ApplicationCommandOptionType,
    MessageFlags,
    Colors,
} = require("discord.js");

module.exports = {
    name: "announcement",
    description: "Faire une annonce (sous forme d'embed)",
    options: [
        {
            name: "titre",
            description: "Titre de l'annonce",
            type: ApplicationCommandOptionType.String,
            required: true,
        },
        {
            name: "description",
            description: "Description de l'annonce",
            type: ApplicationCommandOptionType.String,
            required: true,
        },
        {
            name: "anonyme",
            description: "Faut-il vous annoncer ?",
            type: ApplicationCommandOptionType.Boolean,
            required: true,
        },
        {
            name: "couleur",
            description: "Couleur de l'embed (défaut bleu)",
            type: ApplicationCommandOptionType.String,
            required: false,
            choices: [
                { name: "Information - Bleu", value: "#0000FF" },
                { name: "Alerte - Rouge", value: "#FF0000" },
                { name: "Validation - Vert", value: "#00FF00" },
                { name: "Attention - Jaune", value: "#FFFF00" },
                { name: "Update - Violet", value: "#800080" },
                { name: "Warn - Orange", value: "#FFA500" },
                { name: "Event - Cyan", value: "#00FFFF" },
                { name: "Maintenance - Gris", value: "#808080" },
            ]
        },
    ],
    restricted: true,

    runSlash: async (client, interaction) => {
        let user = {
            username: null,
            displayAvatarURL: null,
        };

        if (!interaction.options.getBoolean("anonyme")) {
            user.username = interaction.user.username;
            user.displayAvatarURL = interaction.user.displayAvatarURL();
        } else {
            user.username = "Ecole Directe Plus";
            user.displayAvatarURL =
                "https://pbs.twimg.com/profile_images/1680302515097673729/x1cHA0q5_400x400.png";
        }

        const announcementEmbedContent = {
            title: interaction.options.getString("titre"),
            description: interaction.options.getString("description"),
            color: interaction.options.getString("couleur") || "#0080FF",
            author: {
                name: user.username,
                iconUrl: user.displayAvatarURL,
            },
        };

        const announcementEmbed = new EmbedBuilder()
            .setTitle(announcementEmbedContent.title)
            .setDescription(announcementEmbedContent.description)
            .setColor(announcementEmbedContent.Colors.color)
            .setAuthor({
                name: announcementEmbedContent.author.name,
                iconURL: announcementEmbedContent.author.iconUrl,
            });

        console.log(
            `[ANNOUNCEMENT] - Annonce de ${user.username} : "${announcementEmbedContent.title}", envoyée avec succès.`
        );
        await interaction.channel.send({ embeds: [announcementEmbed] });
        await interaction.reply({
            content: "Annonce envoyée avec succès.",
            flags: MessageFlags.Ephemeral,
        });
    },
};
