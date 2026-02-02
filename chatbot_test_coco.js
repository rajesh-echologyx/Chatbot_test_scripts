
// Node.js script for chatbot session and WebSocket test
// Requires: npm install node-fetch ws


import fetch from 'node-fetch';
import WebSocket from 'ws';

const SESSION_CREATE_URL = 'https://stghood.elxchatbot.ai/api/v1.0/session/create/?domain=cocoweb.com';
const BOT_ID = '50a5961e-4fd0-423a-9013-babf3d600ad9';
const TIME_ZONE = 'Asia/Dhaka';

const NUM_SESSIONS = 1; // Number of sessions to create
const MESSAGE_TEXTS = [
  // Art & Paintings
  'Do you sell art?',
  'Do you sell paintings?',
  'Do you sell photography?',
  'Can I get Yosemite National Park photography?',
  'Do you have any wildlife pictures?',
  'I asked for general wildlife category. I don\'t need any specific product.',
  // Lighting Products
  'Does Cocoweb only sell lighting products?',
  'Do you sell LED lights?',
  'What kind of LED color do you offer?',
  'I am asking about LED temperature.',
  'How about 3500K?',
  'Do you offer post lights?',
  'Do you have any other options?',
  'Do you have piano lights?',
  // Trade & Shipping
  'Is there a trade program available?',
  'Where do I sign up?',
  'What is the cost to ship internationally?',
  'What about Hawaii?',
  // Other Products
  'Do you sell faucets?',
  'Do you sell kitchen hardware?',
  'Do you have barn lights?',
  'Do you have gallery lights?',
  'Do you have custom lighting options?',
  // Picture Light & Calculator
  'I need to get a picture light but how do I calculate the size of picture light for my artwork?',
  'Where can I find the picture light calculator?',
  'Is there a direct link?',
  // Order/Support
  'Can you check order 74239 for nithyat@cocoweb.com?',
  'How do I track my order?',
  'Can I return a product?',
  // Website/General
  'What makes Cocoweb lights eco-friendly?',
  'Are your products made in the USA?',
  'Can I customize my order?',
  'What is your warranty policy?',
  'Do you offer installation support?',
  'What payment methods do you accept?',
  'Can I get a quote for a large project?',
  'Do you have any current promotions?',
  'Where can I see customer reviews?',
  'What is the difference between your barn and gallery lights?',
  'Can you recommend lighting for a piano room?',
  'How do I contact customer support?',
  'What is Cocoweb’s return policy?',
  'What is the lead time for custom orders?',
  'Do you ship to Canada?',
  'Can I get a sample finish?',
  'What is the best light for artwork?',
  'How do I clean Cocoweb lights?',
  'Do you offer bulk discounts?',
  'Can I visit your showroom?',
  'What is the difference between LED and incandescent lighting?',
  'How long do Cocoweb LED lights last?',
  'What is the website URL?',
  'Tell me about Cocoweb.'
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
    const wsUrl = `wss://stghood.elxchatbot.ai/ws/chat/${sessionId}/`;
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
          await delay(20000); // 10 seconds delay between messages
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
