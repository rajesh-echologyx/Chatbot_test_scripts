// Daals furniture chatbot test queries
const MESSAGE_TEXTS = [
  'I need a footstool under £120.',
  'Show me the available footstools.',
  'Sofa in grey.',
  'I need a larger sofa.',
  'Do you have a footstool to match?',
  'What is the price of the footstool and the larger sofa together?',
  'Do you have any beds?',
  'I prefer a grey bed and king size.',
  'Do you have bedding in king size?',
  'These are out of stock.',
  'I\'m also looking at dining table and chairs. I require a table that accommodates 6 people. What options do you have?',
  'Do these come with chairs?',
  'Ok and I would like some duvet sets.',
  'I want a drinks trolley.',
  'I would also like a corner sofa in green, what options do you have?',
  'Do you have any others?',
  'Do you have any blue options also?',
  'Do you have corner versions?',
  'I need a grey sofa for my lounge, preferably a corner sofa. Do you have any?',
  'I like the first one, do you have any matching sofa options?',
  'Can you show me these?',
  // Additional queries for Daals brand and product context
  'What makes Daals furniture stylish and affordable?',
  'Are your products designed in the UK?',
  'Do you offer business solutions or bulk discounts?',
  'Can I customize my order?',
  'What is your delivery policy?',
  'Do you offer assembly service?',
  'What payment methods do you accept?',
  'Can I get a quote for a large project?',
  'Do you have any current promotions?',
  'Where can I see customer reviews?',
  'What is the difference between your sofa collections?',
  'Can you recommend furniture for a small apartment?',
  'How do I contact customer support?',
  'What is Daals’s return policy?',
  'What is the lead time for custom orders?',
  'Do you ship outside the UK?',
  'Can I get a sample fabric?',
  'What is the best sofa for a family?',
  'How do I clean Daals furniture?',
  'Can I visit your showroom?',
  'What is the website URL?',
  'Tell me about Daals.'
];

// Node.js script for chatbot session and WebSocket test
// Requires: npm install node-fetch ws


import fetch from 'node-fetch';
import WebSocket from 'ws';

const SESSION_CREATE_URL = 'https://stghood-agent.elxchatbot.ai:8443/api/v1.0/session/create/?domain=daals-staging.myshopify.com';
const BOT_ID = '21663ba8-e412-4b4d-b722-f7e31b31647a';
const TIME_ZONE = 'Asia/Dhaka';

const NUM_SESSIONS = 1; // Number of sessions to create

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
    const ws = new WebSocket(wsUrl,
      {
        headers: {
          'Origin': 'https://daals-staging.myshopify.com',
          'User-Agent': 'Mozilla/5.0',
          'Content-Type': 'application/json',
        }
      }
    );
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
