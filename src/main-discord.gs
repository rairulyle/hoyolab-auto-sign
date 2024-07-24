const profiles = [
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

const discord_notify = true
const discordWebhook = "https://discord.com/api/webhooks/###/######"

/** The above is the config. Please refer to the instructions on https://github.com/canaria3406/hoyolab-auto-sign for configuration. **/
/** The following is the script code. Please DO NOT modify. **/

const urlDict = {
  Genshin_Impact: 'https://sg-hk4e-api.hoyolab.com/event/sol/sign?lang=en-us&act_id=e202102251931481',
  Honkai_Star_Rail: 'https://sg-public-api.hoyolab.com/event/luna/os/sign?lang=en-us&act_id=e202303301540311',
  Honkai_3: 'https://sg-public-api.hoyolab.com/event/mani/sign?lang=en-us&act_id=e202110291205111',
  Tears_of_Themis: 'https://sg-public-api.hoyolab.com/event/luna/os/sign?lang=en-us&act_id=e202308141137581',
  Zenless_Zone_Zero: 'https://sg-act-nap-api.hoyolab.com/event/luna/zzz/os/sign?lang=en-us&act_id=e202406031448091'
};

async function main() {
  const embeds = await Promise.all(profiles.map(autoSignFunction));

  if (discord_notify && discordWebhook) {
    postWebhook(embeds);
  }
}

function discordPing(id) {
  return id ? `<@${id}> ` : '';
}

function autoSignFunction({
  token,
  genshin = false,
  honkai_star_rail = false,
  honkai_3 = false,
  tears_of_themis = false,
  zenless_zone_zero = false,
  discordID
}) {
  const urls = [];

  if (genshin) urls.push(urlDict.Genshin_Impact);
  if (honkai_star_rail) urls.push(urlDict.Honkai_Star_Rail);
  if (honkai_3) urls.push(urlDict.Honkai_3);
  if (tears_of_themis) urls.push(urlDict.Tears_of_Themis);
  if (zenless_zone_zero) urls.push(urlDict.Zenless_Zone_Zero);

  const header = {
    Cookie: token,
    'Accept': 'application/json, text/plain, */*',
    'Accept-Encoding': 'gzip, deflate, br',
    'Connection': 'keep-alive',
    'x-rpc-app_version': '2.34.1',
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36',
    'x-rpc-client_type': '4',
    'Referer': 'https://act.hoyolab.com/',
    'Origin': 'https://act.hoyolab.com'
  };

  const options = {
    method: 'POST',
    headers: header,
    muteHttpExceptions: true,
  };

  let hasError = false;
  const fields = [];

  fields.push({
    'name': 'Username',
    'value': `${discordPing(discordID)}`,
    'inline': false
  });

  var sleepTime = 0
  const httpResponses = []
  for (const url of urls) {
    Utilities.sleep(sleepTime);
    httpResponses.push(UrlFetchApp.fetch(url, options));
    sleepTime = 1000;
  }

  for (const [i, hoyolabResponse] of httpResponses.entries()) {
    const responseJson = JSON.parse(hoyolabResponse);
    const checkInResult = responseJson.message;
    const gameName = Object.keys(urlDict).find(key => urlDict[key] === urls[i])?.replace(/_/g, ' ');
    // const isError = checkInResult != "OK";
    const bannedCheck = responseJson.data?.gt_result?.is_risk;
    if(!hasError) hasError = Boolean(bannedCheck);

    if (bannedCheck) {
      fields.push({
        'name': gameName,
        'value': 'Auto check-in failed due to CAPTCHA blocking.',
      });
    } else {
      fields.push({
        'name': gameName,
        'value': checkInResult,
      });
    }
  }

  return {
    "color": hasError ? 16711680 : 65382,
    fields
  };
}

function postWebhook(embeds) {
  let payload = JSON.stringify({
    'username': 'Butlerboo',
    'avatar_url': 'https://i.imgur.com/SVowWyB.png',
    'content': 'Check-in successfully completed, Master.',
    'embeds': embeds
  });

  const options = {
    method: 'POST',
    contentType: 'application/json',
    payload: payload,
    muteHttpExceptions: true
  };

  UrlFetchApp.fetch(discordWebhook, options);
}
