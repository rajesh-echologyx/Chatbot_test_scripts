// npm install node-fetch ws

import fetch from 'node-fetch';
import WebSocket from 'ws';

const SESSION_CREATE_URL =
  'https://stghood.elxchatbot.ai/api/v1.0/session/create/?domain=daals-staging.myshopify.com';

const BOT_ID = 'c377adb1-7213-4740-af2b-04755ef4c977';
const TIME_ZONE = 'Asia/Dhaka';

const NUM_SESSIONS = 10;
const MESSAGE_DELAY_MS = 10000;

// ============================================
// CONVERSATIONAL TEST SCENARIOS
// ============================================

const CONVERSATIONS = [
  // Footstool Journey
  [
    'Hi',
    'I need a footstool under £120',
    'Show me the available footstools',
    'I like the grey one',
    'Do you have other colours?',
    'What are the dimensions?',
    'Will it match a grey sofa?',
    'Can you recommend one?',
    'How long is delivery?'
  ],

  // Sofa Journey
  [
    'I need a sofa',
    'Grey colour',
    'I have a family of 5',
    'What would you recommend?',
    'Can you show larger sofas?',
    'Do you have corner versions?',
    'Any green options?',
    'Which one is most popular?',
    'What is the price?'
  ],

  // Sofa + Footstool
  [
    'I am looking at sofas',
    'I like the first grey sofa',
    'Do you have matching footstools?',
    'Can you show them?',
    'What is the total price together?',
    'Do you offer bundle discounts?',
    'How soon can they be delivered?'
  ],

  // Bedroom Journey
  [
    'I need a bed',
    'King size',
    'Grey fabric',
    'What options do you have?',
    'Do you have matching bedside furniture?',
    'What bedding would work with this?',
    'Show me king size duvet sets',
    'Which duvet set is most popular?'
  ],

  // Dining Journey
  [
    'I am furnishing a dining room',
    'I need a table for 6 people',
    'Can you show dining sets?',
    'Do they include chairs?',
    'What colour options are available?',
    'Do you have extendable tables?',
    'Which is your bestseller?'
  ],

  // Lounge Journey
  [
    'I need furniture for my lounge',
    'I prefer modern styles',
    'Grey colour palette',
    'Can you recommend a sofa?',
    'What coffee tables match it?',
    'Do you have TV units?',
    'Can you show matching furniture?'
  ],

  // Drinks Trolley
  [
    'I am looking for a drinks trolley',
    'Something modern',
    'Do you have gold finishes?',
    'Can you show other options?',
    'What are the dimensions?',
    'Can it be used as a bar cart?',
    'Do customers leave reviews?'
  ],

  // Small Apartment
  [
    'I have a small apartment',
    'Can you recommend furniture?',
    'I need a compact sofa',
    'Maybe a corner sofa',
    'Storage would be useful',
    'Do you have matching tables?',
    'What would you recommend overall?'
  ],

  // Customer Service
  [
    'What is your return policy?',
    'How long do I have to return an item?',
    'Who pays return shipping?',
    'Do you offer exchanges?',
    'What if the item arrives damaged?',
    'How do I contact support?'
  ],

  // Brand Journey
  [
    'Tell me about Daals',
    'Where are your products designed?',
    'Do you manufacture your own furniture?',
    'What makes your sofas different?',
    'Do you offer custom furniture?',
    'Can businesses order in bulk?',
    'Do you have a showroom?'
  ],

  // Context Switching
  [
    'I need a grey corner sofa',
    'Show me available options',
    'What is the price?',
    'By the way, what is your delivery policy?',
    'Going back to the sofa',
    'Do you have matching footstools?',
    'Can you show me those?',
    'Do you have them in green?'
  ],

  // Out-of-stock Handling
  [
    'I am looking for a king size bed',
    'Show me grey options',
    'That one appears out of stock',
    'Can you suggest similar products?',
    'Do you have matching bedding?',
    'What is your estimated restock time?'
  ]
];

// ============================================
// HELPERS
// ============================================

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function getRandomConversation() {
  return CONVERSATIONS[
    Math.floor(Math.random() * CONVERSATIONS.length)
  ];
}

// ============================================
// SESSION CREATION
// ============================================

async function createSession(userIdx) {
  const payload = {
    bot_id: BOT_ID,
    user_meta_data: {
      time_zone: TIME_ZONE
    },
    user_name: `LoadTestUser${userIdx}`,
    user_email: `loadtestuser${userIdx}@example.com`
  };

  const response = await fetch(SESSION_CREATE_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  });

  const json = await response.json();

  if (
    !json.success ||
    !json.data ||
    !json.data.session_id
  ) {
    throw new Error(
      `Failed to create session for User${userIdx}: ${JSON.stringify(json)}`
    );
  }

  return json.data.session_id;
}

// ============================================
// CHAT EXECUTION
// ============================================

async function runConversation(sessionId, userIdx, messages) {
  return new Promise((resolve, reject) => {
    const wsUrl =
      `wss://stghood.elxchatbot.ai/ws/chat/${sessionId}/`;

    const ws = new WebSocket(wsUrl, {
      headers: {
        Origin: 'https://daals-staging.myshopify.com',
        'User-Agent': 'Mozilla/5.0',
        'Content-Type': 'application/json'
      }
    });

    const responses = [];

    ws.on('open', async () => {
      console.log(
        `[User${userIdx}] Connected | Session=${sessionId}`
      );

      try {
        for (let i = 0; i < messages.length; i++) {
          const userMessage = messages[i];

          console.log(
            `[User${userIdx}] Sending (${i + 1}/${messages.length}): ${userMessage}`
          );

          ws.send(
            JSON.stringify({
              chat_data: {
                msg: userMessage,
                recorded_audio_msg_link: null,
                images_link: [],
                files_link: []
              },
              event_type: 'message',
              user_type: 'user'
            })
          );

          // Wait 10 seconds before next user message
          if (i < messages.length - 1) {
            await delay(MESSAGE_DELAY_MS);
          }
        }

        // Wait for final responses
        await delay(15000);

        if (ws.readyState === WebSocket.OPEN) {
          ws.close();
        }
      } catch (err) {
        reject(err);
      }
    });

    ws.on('message', data => {
      try {
        const response = JSON.parse(data.toString());

        responses.push(response);

        console.log(
          `[User${userIdx}] Bot Response:`,
          JSON.stringify(response, null, 2)
        );
      } catch (err) {
        console.error(
          `[User${userIdx}] Parse Error`,
          err
        );
      }
    });

    ws.on('error', err => {
      console.error(
        `[User${userIdx}] WebSocket Error`,
        err
      );
      reject(err);
    });

    ws.on('close', () => {
      console.log(
        `[User${userIdx}] Session Complete`
      );

      resolve(responses);
    });
  });
}

// ============================================
// SINGLE USER FLOW
// ============================================

async function runSingleUser(userIdx) {
  try {
    const sessionId = await createSession(userIdx);

    console.log(
      `[User${userIdx}] Session Created: ${sessionId}`
    );

    const conversation = getRandomConversation();

    console.log(
      `[User${userIdx}] Selected Conversation Length: ${conversation.length}`
    );

    await runConversation(
      sessionId,
      userIdx,
      conversation
    );
  } catch (err) {
    console.error(
      `[User${userIdx}] Failed`,
      err
    );
  }
}

// ============================================
// LOAD TEST
// ============================================

async function runLoadTest() {
  console.log(
    `Starting ${NUM_SESSIONS} concurrent chatbot sessions`
  );

  const tasks = [];

  for (let i = 1; i <= NUM_SESSIONS; i++) {
    tasks.push(runSingleUser(i));

    // Small stagger to avoid all users starting at exact same millisecond
    await delay(500);
  }

  await Promise.all(tasks);

  console.log('All sessions completed.');
}

runLoadTest();