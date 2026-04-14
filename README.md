# Canard Droïd

Canard Droïd is the new **Discord bot** of **Ecole Directe Plus** platform!

---

## New Features 🎉

- 100% automatic moderation to prevent suspicious behaviors
- All Ecole Directe Plus statistics, member count, daily usage, best platforms, ...
- Beautiful welcome message sent to new users
- Own easy to use ticket system available to all members
- Easy panel to moderate more specifically
- Do announcements in one command with custom embed!
- A lot of other things...!

## How to use 📘

**Go to [Ecole Directe Plus Discord](https://discord.gg/AKAqXfTgvE) server**

Say Hello 👋 to other people and start to use the bot, start with `/help` command to see all available commands

## Contributing 🖇️

Contributions are always welcome!

To contribute to this discord.JS project, start by cloning this repo on your computer by following these steps:

- Clone the repo on your local machine

    > ```git clone https://github.com/Magic-Fishes/Ecole-Directe-Plus-Droid ```

- Run these commands
    > ``` cd Ecole-Directe-Plus-Droid```

    >```npm i```

    >```echo TOKEN=<YOUR PRIVATE TOKEN> > .env```

Now go to the [Discord Developer Portal](https://discord.com/developers/applications) and create a new app, go to the "Bot" section and click on "Reset Token" to get your token, copy it and **do not share it with anyone, it's PRIVATE!**

Now go back to your CLONE, go into the `.env` file, normally you will find a key named `TOKEN`, after `=`, paste your private discord bot token.

We're almost there...

Still in `.env`, paste these lines next to your `TOKEN`

```SOCKET_URL=wss://ecole-directe.plus/ws:7890
OPENROUTER_API_KEY=<YOUR openrouter API KEY>
OPENROUTER_MODEL=openai/gpt-oss-20b:free
NODE_ENV=developpment
MAIN_SERVER_ID=<YOUR SERVER ID>
```


Complete your Openrouter API key in the `OPENROUTER_API_KEY`.

To get your server ID, start by activating developer mode on your account by [following this guide](https://www.howtogeek.com/714348/how-to-enable-or-disable-developer-mode-on-discord/)
After that, go to your server, right-click on the top banner with your server name, and click "Copy Server ID" with the `ID` icon.

Paste it in the `MAIN_SERVER_ID` in your `.env`

Congrats  🎉 🎉 🎉

You can start editing files and run your bot by executing this in your project folder `npm run dev`!

## Environment Variables 🌳

To run this project, you will need to add the following environment variables to your .env file

`TOKEN` > Your discord bot token available in the [Discord Developer Portal](https://discord.com/developers/applications/)

`OPENROUTER_API_KEY` > Your Openrouter API Key to enable Auto-Moderation

`NODE_ENV` > Don't touch that

`MAIN_SERVER_ID` > Your discord server ID

## Support 📞

#### For support, go to the [Ecole Directe Plus Discord Server](https://discord.gg/AKAqXfTgvE) to get help, we will be happy to answer you!

#

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## Authors 🪶

[![License: MIT](https://img.shields.io/badge/As_de_Pique-@as2pick-3CB371)](https://github.com/as2pick)

[![License: MIT](https://img.shields.io/badge/Ewalwi-@ewalwi-00BFFF)](https://github.com/Ewalwi)
