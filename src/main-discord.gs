const PROFILES = [
  {
    token: "ltoken_v2=v2_######; ltuid_v2=42######;",
    genshin: false,
    honkai_star_rail: false,
    honkai_3: false,
    tears_of_themis: false,
    zenless_zone_zero: true,
    discordID: "23######",
  },
  
];

const DISCORD_NOTIFY = true;
const MY_DISCORD_ID = "1265475285902557226"; // Role
const DISCORD_WEBHOOK =
  "https://discord.com/api/webhooks/1265471414643982396/zwwUrF3H0zEQOUIJtste-SszgFykxwhfSNyktv1IaFNaow270jmsFv1dE1d19R2Wij4H";

/** The above is the config. Please refer to the instructions on https://github.com/canaria3406/hoyolab-auto-sign for configuration. **/
/** The following is the script code. Please DO NOT modify. **/

const GAME_CONFIGS = [
  {
    name: "Genshin_Impact",
    url: "https://sg-hk4e-api.hoyolab.com/event/sol/sign?lang=en-us&act_id=e202102251931481",
    header: {},
  },
  {
    name: "Honkai_Star_Rail",
    url: "https://sg-public-api.hoyolab.com/event/luna/os/sign?lang=en-us&act_id=e202303301540311",
    header: {},
  },
  {
    name: "Honkai_3",
    url: "https://sg-public-api.hoyolab.com/event/mani/sign?lang=en-us&act_id=e202110291205111",
    header: {},
  },
  {
    name: "Tears_of_Themis",
    url: "https://sg-public-api.hoyolab.com/event/luna/os/sign?lang=en-us&act_id=e202308141137581",
    header: {},
  },
  {
    name: "Zenless_Zone_Zero",
    url: "https://sg-public-api.hoyolab.com/event/luna/zzz/os/sign?lang=en-us&act_id=e202406031448091",
    header: {
      "x-rpc-signgame": "zzz",
    },
  },
];

async function main() {
  const embeds = await Promise.all(PROFILES.map(autoSignFunction));

  if (DISCORD_NOTIFY && DISCORD_WEBHOOK) {
    postWebhook(embeds);
  }
}

function discordPing(id) {
  return id ? `<@${id}> ` : "";
}

function autoSignFunction({
  token,
  genshin = false,
  honkai_star_rail = false,
  honkai_3 = false,
  tears_of_themis = false,
  zenless_zone_zero = false,
  discordID,
}) {
  const gamesToSign = {
    Genshin_Impact: genshin,
    Honkai_Star_Rail: honkai_star_rail,
    Honkai_3: honkai_3,
    Tears_of_Themis: tears_of_themis,
    Zenless_Zone_Zero: zenless_zone_zero,
  };

  const baseHeader = {
    Cookie: token,
    Accept: "application/json, text/plain, */*",
    "Accept-Encoding": "gzip, deflate, br",
    Connection: "keep-alive",
    "x-rpc-app_version": "2.34.1",
    "User-Agent":
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36",
    "x-rpc-client_type": "4",
    Referer: "https://act.hoyolab.com/",
    Origin: "https://act.hoyolab.com",
  };

  let hasError = false;
  const fields = [];

  fields.push({
    name: "Username",
    value: `${discordPing(discordID)}`,
    inline: false,
  });

  let sleepTime = 0;
  const httpResponses = [];

  // Loop through each game config
  for (const config of GAME_CONFIGS) {
    if (gamesToSign[config.name]) {
      Utilities.sleep(sleepTime);

      const options = {
        method: "POST",
        headers: { ...baseHeader, ...config.header },
        muteHttpExceptions: true,
      };

      httpResponses.push({
        name: config.name,
        response: UrlFetchApp.fetch(config.url, options),
      });

      sleepTime = 1000;
    }
  }

  // Parse the responses for Discord embeds
  let hasCheckInError = false;

  for (const { response, name } of httpResponses) {
    const { message: checkInResult, data } = JSON.parse(response);
    const gameName = name.replace(/_/g, " ");
    const isError = checkInResult !== "OK";
    const isBanned = data?.gt_result?.is_risk ?? false;
    hasCheckInError = hasCheckInError || isBanned || isError;

    fields.push({
      name: gameName,
      value: isBanned
        ? `Auto check-in failed due to CAPTCHA blocking.`
        : checkInResult,
    });
  }

  return {
    color: hasError ? 16711680 : 65382,
    fields,
  };
}

function postWebhook(embeds) {
  let payload = JSON.stringify({
    username: "Butlerboo",
    avatar_url: "https://i.imgur.com/SVowWyB.png",
    content: "Check-in successfully completed, Master.",
    embeds: embeds,
  });

  const options = {
    method: "POST",
    contentType: "application/json",
    payload: payload,
    muteHttpExceptions: true,
  };

  UrlFetchApp.fetch(DISCORD_WEBHOOK, options);
}
