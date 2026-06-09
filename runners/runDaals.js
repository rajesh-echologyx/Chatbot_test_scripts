import config from "../config/daals.js";

import sofa from "../conversations/daals/sofa.js";
import bedroom from "../conversations/daals/bedroom.js";
import dining from "../conversations/daals/dining.js";

import { createSession }
  from "../core/createSession.js";

import { runConversation }
  from "../core/websocketRunner.js";

const conversations = [
  sofa,
  bedroom,
  dining
];

function randomConversation() {
  return conversations[
    Math.floor(
      Math.random() * conversations.length
    )
  ];
}

export async function runDaals(
  users = 10
) {
  const jobs = [];

  for (let i = 1; i <= users; i++) {
    jobs.push(
      (async () => {
        const sessionId =
          await createSession(config, i);

        const conversation =
          randomConversation();

        await runConversation(
          config,
          sessionId,
          i,
          conversation
        );
      })()
    );
  }

  await Promise.all(jobs);
}