import fetch from "node-fetch";
import WebSocket from "ws";

const SESSION_CREATE_URL =
  "https://stghood.elxchatbot.ai/api/v1.0/session/create/?domain=cocoweb.com";

const BOT_ID = "50a5961e-4fd0-423a-9013-babf3d600ad9";
const TIME_ZONE = "Asia/Dhaka";

// Number of concurrent users
const NUM_SESSIONS = 20;

// Delay between user messages
const MESSAGE_DELAY = 10000;

// ==========================================
// CONVERSATIONAL TEST SCENARIOS
// ==========================================

const CONVERSATIONS = [
  [
    "Hi",
    "I am looking for a light for my living room",
    "Something modern",
    "The room is around 15 feet by 20 feet",
    "I prefer warm lighting",
    "Do you have any recommendations?",
    "Can you show me another option?",
    "Which one is more energy efficient?",
    "Do these come in black finish?",
    "What is the price?",
    "Do you ship to Canada?",
    "What is the delivery time?",
    "Can I place an order online?"
  ],

  [
    "I recently bought a painting",
    "I want to install a picture light",
    "The artwork is 36 inches wide",
    "How do I determine the correct light size?",
    "Do you have a calculator for that?",
    "Can you give me the direct link?",
    "Which picture light would you recommend?",
    "Do you have it in brass finish?",
    "Can I see another option?",
    "Which one is brighter?"
  ],

  [
    "Hello",
    "I am an interior designer",
    "Do you have a trade program?",
    "What benefits do I get?",
    "Is there a discount?",
    "How do I apply?",
    "How long does approval take?",
    "Can I use the discount on custom orders?",
    "Can you send me the signup link?"
  ],

  [
    "I am deciding between barn lights and gallery lights",
    "What is the difference?",
    "Which one is better for artwork?",
    "Can they both be used indoors?",
    "Do you have LED versions?",
    "Which one consumes less power?",
    "What would you recommend for a hallway?",
    "Can you show me a popular model?"
  ],

  [
    "I have an upright piano",
    "I need lighting for it",
    "Do you sell piano lights?",
    "What options do you have?",
    "I prefer warm white light",
    "Do they have dimming support?",
    "Which model is your bestseller?",
    "Can it be mounted permanently?",
    "What is the warranty?"
  ],

  [
    "Do you ship internationally?",
    "I am located in Australia",
    "How much does shipping usually cost?",
    "Do you charge customs duties?",
    "How long does delivery take?",
    "Can I track the shipment?",
    "What carrier do you use?",
    "Do you offer expedited shipping?"
  ],

  [
    "I need a custom lighting solution",
    "It is for a hotel project",
    "We need around 120 fixtures",
    "Can you customize finishes?",
    "Do you offer custom dimensions?",
    "What is the lead time?",
    "Can I get a quote?",
    "Who should I contact?",
    "Can I upload specifications?"
  ],

  [
    "I placed an order recently",
    "I want to check the status",
    "The order number is 74239",
    "I think it was placed last week",
    "Can you tell me if it has shipped?",
    "Can I change the shipping address?",
    "What if I need to cancel the order?",
    "Can I speak to customer support?"
  ],

  [
    "I received a light yesterday",
    "I want to return it",
    "What is your return policy?",
    "Do I have to pay return shipping?",
    "How many days do I have?",
    "Can I exchange it instead?",
    "How long does the refund take?"
  ],

  [
    "I need a picture light",
    "The artwork is 48 inches wide",
    "What size would you recommend?",
    "By the way, do you ship to Hawaii?",
    "What is the shipping cost?",
    "Going back to the picture light recommendation",
    "Which finish is most popular?",
    "Do you have customer reviews?",
    "Can you show another option?"
  ],

  [
    "Tell me about the Vintage Indoor LED Barn Pendant Light Mahogany Bronze 14 inch",
    "What are the dimensions?",
    "What color temperature does it use?",
    "Can I use it in a dining room?",
    "How much power does it consume?",
    "Is it dimmable?",
    "What is the warranty?",
    "Can I order multiple units?"
  ],

  [
    "Hi",
    "Need light",
    "for painting",
    "large painting",
    "around 40 inch",
    "actually maybe 36",
    "what do you suggest",
    "too expensive",
    "cheaper option?",
    "another one",
    "do you ship to canada",
    "how long",
    "ok thanks"
  ]
];

// ==========================================
// HELPERS
// ==========================================

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function getRandomConversation() {
  return CONVERSATIONS[
    Math.floor(Math.random() * CONVERSATIONS.length)
  ];
}

async function createSession(userIdx) {
  const payload = {
    bot_id: BOT_ID,
    user_meta_data: {
      time_zone: TIME_ZONE,
    },
    user_name: `LoadTestUser${userIdx}`,
    user_email: `loadtest${userIdx}@example.com`,
  };

  const response = await fetch(SESSION_CREATE_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  const data = await response.json();

  if (!data?.success || !data?.data?.session_id) {
    throw new Error(
      `Failed to create session for user ${userIdx}: ${JSON.stringify(data)}`
    );
  }

  return data.data.session_id;
}

async function sendConversation(sessionId, userIdx, messages) {
  return new Promise((resolve, reject) => {
    const wsUrl = `wss://stghood.elxchatbot.ai/ws/chat/${sessionId}/`;

    const ws = new WebSocket(wsUrl);

    const receivedMessages = [];

    ws.on("open", async () => {
      console.log(
        `[User ${userIdx}] Connected - ${messages.length} messages`
      );

      try {
        for (let i = 0; i < messages.length; i++) {
          const payload = {
            chat_data: {
              msg: messages[i],
              recorded_audio_msg_link: null,
              images_link: [],
              files_link: []
            },
            event_type: "message",
            user_type: "user"
          };

          console.log(
            `[User ${userIdx}] Sending (${i + 1}/${messages.length}):`,
            messages[i]
          );

          ws.send(JSON.stringify(payload));

          await delay(MESSAGE_DELAY);
        }

        setTimeout(() => {
          ws.close();
        }, 15000);

      } catch (err) {
        reject(err);
      }
    });

    ws.on("message", (data) => {
      try {
        const parsed = JSON.parse(data.toString());

        receivedMessages.push(parsed);

        console.log(
          `[User ${userIdx}] Bot Response:`,
          JSON.stringify(parsed, null, 2)
        );

      } catch (err) {
        console.error(
          `[User ${userIdx}] Parse Error`,
          err
        );
      }
    });

    ws.on("error", (err) => {
      console.error(
        `[User ${userIdx}] WebSocket Error`,
        err
      );
      reject(err);
    });

    ws.on("close", () => {
      console.log(
        `[User ${userIdx}] Session Finished`
      );

      resolve(receivedMessages);
    });
  });
}

async function runSingleUser(userIdx) {
  try {
    const sessionId = await createSession(userIdx);

    console.log(
      `[User ${userIdx}] Session Created: ${sessionId}`
    );

    const conversation = getRandomConversation();

    await sendConversation(
      sessionId,
      userIdx,
      conversation
    );

  } catch (err) {
    console.error(
      `[User ${userIdx}] Failed`,
      err
    );
  }
}

async function runLoadTest() {
  console.log(
    `Starting ${NUM_SESSIONS} concurrent chatbot sessions...`
  );

  const users = [];

  for (let i = 1; i <= NUM_SESSIONS; i++) {
    users.push(runSingleUser(i));

    await delay(500);
  }

  await Promise.all(users);

  console.log(
    "All chatbot sessions completed."
  );
}

runLoadTest();