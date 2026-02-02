
// Node.js script for chatbot session and WebSocket test
// Requires: npm install node-fetch ws


import fetch from 'node-fetch';
import WebSocket from 'ws';

const SESSION_CREATE_URL = 'https://stghood-agent.elxchatbot.ai:8443/api/v1.0/session/create/?domain=chinti-parker-staging.myshopify.com';
const BOT_ID = '63334cc9-a2c7-4072-b804-cd8e890cf6c6';

// const SESSION_CREATE_URL = 'https://admin.elxchatbot.ai/api/v1.0/session/create/?domain=chinti-parker-staging.myshopify.com';
// const BOT_ID = '43af157a-0794-405e-b664-3def098bfda1';

const TIME_ZONE = 'Asia/Dhaka';

const NUM_SESSIONS = 1; // Number of sessions to create
const MESSAGE_TEXTS = [
  // Knitwear & Sweaters
  'Can you suggest some black knitwear?',
  // 'Do you have any green knitwear options?',
  // 'I need a red cashmere sweater for men. Can you suggest some?',
  // 'Show me red sweaters.',
  // 'Any green sweaters available?',
  // 'I need a red sweater.',
  // 'Do you have the Cream Wool-Cashmere Charlie\'s Poker Pals Sweater?',
  // 'Do you have XS of Cream Wool-Cashmere Charlie\'s Poker Pals Sweater?',
  // 'I need a merry christmas sweater.',

  // // T-Shirts
  // 'Can you suggest some t-shirts in XL size?',
  // 'I need a red t-shirt.',

  // // Jackets
  // 'Can you show me some red jackets?',

  // // Trousers
  // 'Do you have any trousers?',

  // // Skirts
  // 'Do you sell skirts?',
  // 'Can I still get the Mulberry midi skirt?',
  // 'I would like to order a Mulberry midi skirt, size XS.',

  // // Orders & Order Status
  // 'I want to know my order details. My order id is #GBP155215 and my email is abir@echologyx.com.',
  // 'I have an order, how can I check its status?',

  // // Product Availability & General
  // 'Any green options available?',
  // 'Show me the red one also.',

  // // Italian queries (translated for clarity)
  // 'Good afternoon.',
  // 'I would like to know if the sweater that is on sale for €147.50 in grey and white will be available again in size XS.',
  // 'Pullover.',
  // 'I mean the one from the Peanuts collection.',
  // 'Yes, this one.',

  // Existing queries (for reference, can be kept or removed as needed)
  // ...existing code...
];

async function createSession(userIdx) {
  const payload = {
    bot_id: BOT_ID,
    user_meta_data: { time_zone: TIME_ZONE },
    user_name: `User${userIdx}`,
    user_email: `user${userIdx}@example.com`,
  };
  const sessionRes = await fetch(SESSION_CREATE_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const sessionJson = await sessionRes.json();
  if (!sessionJson.success || !sessionJson.data || !sessionJson.data.session_id) {
    console.error(`Session creation failed for user ${userIdx}:`, sessionJson);
    return null;
  }
  return sessionJson.data.session_id;
}


function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function sendMessagesOnWebSocket(sessionId, userIdx, messages) {
  return new Promise((resolve, reject) => {
    const wsUrl = `wss://stghood-agent.elxchatbot.ai:8443/ws/chat/${sessionId}/`;
    const ws = new WebSocket(wsUrl);
    let responses = [];

    ws.on('open', async () => {
      for (let msgIdx = 0; msgIdx < messages.length; msgIdx++) {
        const message = {
          chat_data: {
            msg: messages[msgIdx],
            recorded_audio_msg_link: null,
            images_link: [],
            files_link: [],
          },
          event_type: 'message',
          user_type: 'user',
        };
        ws.send(JSON.stringify(message));
        if (msgIdx < messages.length - 1) {
          await delay(20000); // 20 seconds delay between messages
        }
      }
    });

    ws.on('message', (data) => {
      try {
        const response = JSON.parse(data);
        responses.push(response);
        console.log(`[Session ${sessionId} | User${userIdx}] Received:`, response);
      } catch (e) {
        console.error(`[Session ${sessionId} | User${userIdx}] Error parsing response:`, e);
      }
    });

    ws.on('error', (err) => {
      console.error(`[Session ${sessionId} | User${userIdx}] WebSocket error:`, err);
      reject(err);
    });

    ws.on('close', () => {
      resolve(responses);
    });

    // Close the websocket after the last message is sent and a short wait for responses
    setTimeout(() => {
      if (ws.readyState === WebSocket.OPEN) ws.close();
    }, messages.length * 21000); // 21s per message to allow for last response
  });
}

async function runMultipleSessions() {
  const sessionPromises = [];
  for (let i = 1; i <= NUM_SESSIONS; i++) {
    sessionPromises.push((async () => {
      const sessionId = await createSession(i);
      if (!sessionId) return;
      console.log(`[User${i}] Session created: ${sessionId}`);
      await sendMessagesOnWebSocket(sessionId, i, MESSAGE_TEXTS);
    })());
  }
  await Promise.all(sessionPromises);
  console.log('All sessions complete.');
}

runMultipleSessions();
