import fetch from "node-fetch";

export async function createSession(config, userIdx) {
  const payload = {
    bot_id: config.botId,
    user_meta_data: {
      time_zone: config.timeZone
    },
    user_name: `LoadUser${userIdx}`,
    user_email: `loaduser${userIdx}@example.com`
  };

  const response = await fetch(config.sessionUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(payload)
  });

  const json = await response.json();

  if (!json?.data?.session_id) {
    throw new Error(
      `Session creation failed: ${JSON.stringify(json)}`
    );
  }

  return json.data.session_id;
}