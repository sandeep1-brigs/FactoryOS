/***************************************************************
 * WebSocket Manager (Capacitor Version)
 * -------------------------------------------------------------
 * Handles:
 *   - Token fetching for WebSocket authentication
 *   - Automatic reconnection on disconnect/error
 *   - Exponential backoff for retry delays
 *   - Automatic topic resubscription
 *   - Graceful disconnect handling
 ***************************************************************/

import { Http } from '@capacitor-community/http';
import SockJS from "sockjs-client/dist/sockjs.min.js";
import { Client } from "@stomp/stompjs";

import { shared , s3PrivateUrl , s3PublicUrl  } from "./globals.js";
import { displaySection , showConfirmDialog , buildRequestOptions , isValidResponse , RequestOptions  } from "./capacitor-welcome.js";
import { showDialog , highlightHeaderTabMenu , fixModuleHeight , constructUrl , getSignedUrl , pauseVideos , initPinchZoom , getGeoPosition} from "./utility.js";
import { getMenuBar ,getNewToken } from "./settings.js";
import { exitModules , viewContent } from "./content.js";
import { createList } from "./list.js";
import { apiRequestFailed } from "./auth.js";
import { viewPdfFile } from "./pdfviewer.js";
import { getStyleAttributeInStyles } from "./ert.js";

// --- Global Variables ---
let wsToken = '';
let stompClient = null;
let reconnectAttempts = 0;
let reconnectTimer = null;




/****************************************************************
 * Initialize WebSocket Connection
 ****************************************************************/
export function initWebSocket(inSerial, outSerial) {
  console.log('Initializing websocket');
  getWebSocketToken()
    .then(token => {
      wsToken = token;
      console.log('WS Token received:', wsToken);
      connectWebSocket(inSerial, outSerial, wsToken);
    })
    .catch(err => {
      console.error('Failed to initialize WebSocket:', err);
      scheduleReconnect(inSerial, outSerial);
    });
}

/****************************************************************
 * Get WebSocket Token (via Capacitor HTTP)
 ****************************************************************/
function getWebSocketToken() {
  const data = { deviceSerial: shared.deviceSerialNumber };

  return new Promise((resolve, reject) => {
    buildRequestOptions(constructUrl('/wsocket/getwstoken'), 'GET', data)
      .then(request => {
        Http.request(request)
          .then(res => {
            if (isValidResponse(res, 'getwstoken') && res.data?.token) {
              resolve(res.data.token);
            } else {
              reject(res.data?.error || 'Invalid token response');
            }
          })
          .catch(err => {
            console.error('Token request failed:', err);
            reject('Token request failed');
          });
      })
      .catch(err => {
        console.warn('Request aborted due to missing requestOptions.', err);
        reject('Request option build failed');
      });
  });
}

/****************************************************************
 * Connect to WebSocket and Subscribe to Topics
 ****************************************************************/
function connectWebSocket(inSerial, outSerial, token) {
  console.log('Connecting WebSocket...');

  const socket = new SockJS('https://bveu.in/ws');
  stompClient = Stomp.over(socket);
  stompClient.debug = null;
  stompClient.heartbeat.outgoing = 60000;
  stompClient.heartbeat.incoming = 60000;

  stompClient.connect(
    { Authorization: 'Bearer ' + token },
    frame => {
      console.log('WebSocket connected:', frame);
      reconnectAttempts = 0;

      const topics = [
        `/topic/hikattendance/${inSerial}`,
        '/topic/ertstat',
        '/topic/public',
        '/topic/pong'
      ];

      if (inSerial !== outSerial) {
        topics.push(`/topic/hikattendance/${outSerial}`);
      }

      console.log('Subscribing to topics:', topics);

      topics.forEach(topic => {
        stompClient.subscribe(topic, msg => {
          console.log(`Received message from ${topic}:`, msg.body);

          if (topic.includes('/topic/hikattendance/')) {
            updateErtMemberStatesFromWebsocket(msg.body);
          }
        });
      });

      stompClient.send('/app/hello', {}, 'Hello after login!');
    },
    error => {
      console.warn('WebSocket connection closed or failed:', error);
      handleDisconnect(inSerial, outSerial);
    }
  );

  socket.onclose = () => {
    console.warn('SockJS connection closed');
    handleDisconnect(inSerial, outSerial);
  };
}

/****************************************************************
 * Handle WebSocket Disconnect
 ****************************************************************/
function handleDisconnect(inSerial, outSerial) {
  if (stompClient && stompClient.connected) {
    try {
      stompClient.disconnect(() => console.log('Disconnected cleanly.'));
    } catch (e) {
      console.warn('Error during disconnect cleanup:', e);
    }
  }

  scheduleReconnect(inSerial, outSerial);
}

/****************************************************************
 * Schedule Reconnect Attempt (with Exponential Backoff)
 ****************************************************************/
function scheduleReconnect(inSerial, outSerial) {
  const delay = Math.min(30000, 2000 * Math.pow(2, reconnectAttempts));
  reconnectAttempts++;

  console.log(`Reconnecting in ${delay / 1000}s (attempt ${reconnectAttempts})...`);

  clearTimeout(reconnectTimer);
  reconnectTimer = setTimeout(() => {
    getWebSocketToken()
      .then(token => {
        wsToken = token;
        connectWebSocket(inSerial, outSerial, token);
      })
      .catch(err => {
        console.error('Reconnection failed:', err);
        scheduleReconnect(inSerial, outSerial);
      });
  }, delay);
}

/****************************************************************
 * Periodic Connection Health Check
 ****************************************************************/
setInterval(() => {
  if (stompClient && stompClient.connected) {
    stompClient.send('/app/ping', {}, 'ping');
    console.log('Sent ping');
  }
}, 60000);

/****************************************************************
 * Example API Helper: Get System Configuration (for context)
 ****************************************************************/
function getSystemConfigurationFromServer(infoFileName) {
  const data = { serialno: shared.deviceSerialNumber };

  buildRequestOptions(constructUrl('/api/restgetdevicesetting'), 'GET', data)
    .then(request => {
      Http.request(request)
        .then(res => {
          if (isValidResponse(res, 'restgetdevicesetting') && res.data) {
            shared.systemConfiguration = JSON.parse(
              (typeof res.data === 'string' ? JSON.parse(res.data) : res.data).data
            );
            return createSystemConfiguration(infoFileName);
          }
        })
        .catch(err => console.error('System config settings failed from server!', err));
    })
    .catch(err => console.warn('Request aborted due to missing requestOptions.', err));
}
