const jsonConfig = require("../../config.json");
const { MessageFlags } = require("discord.js");
const logger = require("../helpers/logger");

const {
  handleButtonClick,
  handleCloseButtonClick,
  handleConfirmCloseButtonClick,
  handleCancelCloseButtonClick
} = require("../commands/setup-ticket");

const handleCommandsPermissions = async (Client, interaction) => {
  if (!interaction.isCommand()) return;

  const command = Client.commands.get(interaction.commandName);
  if (!command) return;

  if (!command.restricted) {
    try {
      return await command.runSlash(Client, interaction);
    } catch (error) {
      logger.error(error);
      await interaction.reply({
        content: "Une erreur est survenue lors de l'exécution de la commande. Inscrit dans les logs",
        flags: MessageFlags.Ephemeral,
      });
    }
  }

  const isBotDev = jsonConfig.bot_devs.includes(interaction.member.id);
  const hasModRole = interaction.member.roles.cache.some((role) =>
    jsonConfig.mod_role.includes(role.id)
  );

  if (!hasModRole && !isBotDev) {
    return interaction.reply({
      content: "❌ Vous n'avez pas les permissions nécessaires pour utiliser cette commande.",
      flags: MessageFlags.Ephemeral,
    });
  }

  try {
    await command.runSlash(Client, interaction);
  } catch (error) {
    logger.error(error);
    await interaction.reply({
      content: "Une erreur est survenue lors de l'exécution de la commande. Inscrit dans les logs",
      flags: MessageFlags.Ephemeral,
    });
  }
};

const handleComponents = async (Client, interaction) => {
  if (interaction.isButton()) {
    if (interaction.customId === 'create-ticket') {
      await handleButtonClick(interaction);
    } else if (interaction.customId === 'close-ticket') {
      await handleCloseButtonClick(interaction);
    } else if (interaction.customId === 'confirm-close-ticket') {
      await handleConfirmCloseButtonClick(interaction);
    } else if (interaction.customId === 'cancel-close-ticket') {
      await handleCancelCloseButtonClick(interaction);
    } else {
      const button = Client.buttons.get(interaction.customId);
      if (!button) return; // Silent return for local collectors
      button.runInteraction(Client, interaction);
    }
  } else if (interaction.isStringSelectMenu()) {
    const select = Client.selects.get(interaction.customId);
    if (!select) return interaction.reply("Ce menu de sélection n'existe pas");
    select.runInteraction(Client, interaction);
  } else if (interaction.isModalSubmit()) {
      const fs = require("fs");
      const path = require("path");
      const configPath = path.join(__dirname, "../../config.json");
      const config = JSON.parse(fs.readFileSync(configPath, "utf8"));
      
      if (interaction.customId === "modal_add_whitelist") {
          const newLink = interaction.fields.getTextInputValue("link_input").trim().toLowerCase();
          if (!config.real.link_whitelist.includes(newLink)) {
              config.real.link_whitelist.push(newLink);
              fs.writeFileSync(configPath, JSON.stringify(config, null, 4));
              await interaction.reply({ content: `✅ Le lien \`${newLink}\` a été ajouté à la whitelist.`, flags: MessageFlags.Ephemeral });
          } else {
              await interaction.reply({ content: "❌ Ce lien est déjà whiteliste.", flags: MessageFlags.Ephemeral });
          }
      } else if (interaction.customId === "modal_remove_whitelist") {
          const delLink = interaction.fields.getTextInputValue("link_remove_input").trim().toLowerCase();
          const index = config.real.link_whitelist.indexOf(delLink);
          if (index > -1) {
              config.real.link_whitelist.splice(index, 1);
              fs.writeFileSync(configPath, JSON.stringify(config, null, 4));
              await interaction.reply({ content: `✅ Le lien \`${delLink}\` a été supprimé de la whitelist.`, flags: MessageFlags.Ephemeral });
          } else {
              await interaction.reply({ content: "❌ Ce lien ne figure pas dans la whitelist.", flags: MessageFlags.Ephemeral });
          }
      }
  }
};

module.exports = {
  name: "interactionCreate",
  once: false,
  async execute(Client, interaction) {
    if (interaction.isCommand()) {
      await handleCommandsPermissions(Client, interaction);
    } else {
      await handleComponents(Client, interaction);
    }
  },
};
