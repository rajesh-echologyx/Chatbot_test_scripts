import WebSocket from "ws";
import { delay } from "./delay.js";

export async function runConversation(
  config,
  sessionId,
  userIdx,
  messages
) {
  return new Promise((resolve, reject) => {
    const ws = new WebSocket(
      `wss://stghood.elxchatbot.ai/ws/chat/${sessionId}/`,
      {
        headers: {
          Origin: config.origin,
          "User-Agent": "Mozilla/5.0",
          "Content-Type": "application/json"
        }
      }
    );

    ws.on("open", async () => {
      try {
        console.log(
          `[User${userIdx}] Connected`
        );

        for (const msg of messages) {
          console.log(
            `[User${userIdx}] => ${msg}`
          );

          ws.send(
            JSON.stringify({
              chat_data: {
                msg,
                recorded_audio_msg_link: null,
                images_link: [],
                files_link: []
              },
              event_type: "message",
              user_type: "user"
            })
          );

          await delay(config.messageDelay);
        }

        await delay(10000);

        ws.close();

      } catch (err) {
        reject(err);
      }
    });

    ws.on("message", data => {
      console.log(
        `[User${userIdx}] <=`,
        JSON.parse(data.toString())
      );
    });

    ws.on("error", reject);

    ws.on("close", resolve);
  });
}