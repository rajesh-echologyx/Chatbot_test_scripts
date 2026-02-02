// Hook website chatbot test queries
const MESSAGE_TEXTS = [
  'I need coins.',
  'I need velcro coins with 1 inch hook.',
  'Show me some more coins options with different sizes.',
  'Do you have this in black?',
  'I need some straps.',
  'Give me some hooks.',
  'I want to know my order details. My order id is 100074209 and my email is magnarelliclergy@gmail.com.',
  'How many coins are there in a roll?',
  'What is velcro?',
  'Red velcro.',
  'I\'m also looking for some 2\" red webbing.',
  'What is a back strap? Can you explain the kinds of straps to me and what they\'re used for?',
  'Any other products that are red?',
  'I\'m looking for red velcro.',
  'dg10rdhs',
  'Show me the other side.',
  'I\'m looking for 10 inch wide Velcro hook with a really strong self adhesive backing. Do you have something like this?',
  'I need to stick some heavy tools on wall. What do you suggest me for this?',
  'I\'m interested in a 1\" x 12\" strap with a ring. I only need 8 straps.',
  'I also need some straps, but I\'m not sure where to start. Can you help me?',
  'I want to loop side of 191051.',
  '1\" black hook with adhesive.',
  'What is dg10blhs?',
  'What are some good 1\" wide hook options with acrylic adhesive?',
  'Which products are best for sticking to aluminum window frames?',
  '2\" wide please.',
  'I need red color.',
  'I need more strong.',
  'I need coins on hook.',
  'I need order details, my order id is 10002485 and my email is mahmud@gmail.com.',
  'Sorry, I need order details, my order id is 10002485 and my email is mahmud@gmail.com.',
  'How many coins are there in a roll?',
  'I need brown loop.',
  'Give me some more products similar to 2nd product.',
  'Give me hook side of 2nd product.',
  'No, I want loop side of 5.8 inch hook.',
  'Give me hook side of this.',
  'I need straps.',
  'I need black hook.',
  'Give me loop for this.',
  'Give me red option.'
];


// Node.js script for chatbot session and WebSocket test
// Requires: npm install node-fetch ws


import fetch from 'node-fetch';
import WebSocket from 'ws';

const SESSION_CREATE_URL = 'https://stghood.elxchatbot.ai/api/v1.0/session/create/?domain=dev.hookandloop.com';
const BOT_ID = 'ee28ac14-c6cc-4048-9171-13525b0407aa';
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
