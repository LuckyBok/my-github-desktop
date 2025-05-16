const functions = require('firebase-functions');
const admin = require('firebase-admin');
const https = require('https');
const url = require('url');

// Initialize Firebase if not already initialized
if (!admin.apps.length) {
  admin.initializeApp();
}

// Get Slack webhook URL from environment configuration
// In production, set this with: firebase functions:config:set slack.webhook_url="https://hooks.slack.com/services/YOUR/WEBHOOK/URL"
const SLACK_WEBHOOK_URL = functions.config().slack?.webhook_url || 'https://hooks.slack.com/services/YOUR/WEBHOOK/URL';

/**
 * Format the lecture request data for Slack
 * @param {Object} request - The lecture request data
 * @returns {Object} - Formatted Slack message payload
 */
function formatSlackMessage(request) {
  // Create a friendly timestamp
  let timestamp = 'Unknown time';
  if (request.createdAt && request.createdAt.toDate) {
    timestamp = request.createdAt.toDate().toLocaleString();
  }

  return {
    blocks: [
      {
        type: "header",
        text: {
          type: "plain_text",
          text: "📚 New Lecture Request",
          emoji: true
        }
      },
      {
        type: "section",
        fields: [
          {
            type: "mrkdwn",
            text: `*Topic:*\n${request.topic}`
          },
          {
            type: "mrkdwn",
            text: `*From:*\n${request.name}`
          }
        ]
      },
      {
        type: "section",
        fields: [
          {
            type: "mrkdwn",
            text: `*Email:*\n${request.email}`
          },
          {
            type: "mrkdwn",
            text: `*Requested:*\n${timestamp}`
          }
        ]
      },
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text: `*Message:*\n${request.message}`
        }
      },
      {
        type: "actions",
        elements: [
          {
            type: "button",
            text: {
              type: "plain_text",
              text: "Reply via Email",
              emoji: true
            },
            url: `mailto:${request.email}?subject=RE: Lecture Request - ${encodeURIComponent(request.topic)}`
          }
        ]
      },
      {
        type: "divider"
      }
    ]
  };
}

/**
 * Send a message to Slack webhook
 * @param {Object} payload - The message payload to send
 * @returns {Promise<void>}
 */
function sendSlackNotification(payload) {
  return new Promise((resolve, reject) => {
    const webhookUrl = url.parse(SLACK_WEBHOOK_URL);
    
    const requestOptions = {
      hostname: webhookUrl.hostname,
      path: webhookUrl.path,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    };

    const req = https.request(requestOptions, (res) => {
      if (res.statusCode < 200 || res.statusCode >= 300) {
        reject(new Error(`Status Code: ${res.statusCode}`));
        return;
      }

      res.on('data', () => {});
      res.on('end', () => {
        resolve();
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.write(JSON.stringify(payload));
    req.end();
  });
}

// Firebase function that triggers on new document creation in requests collection
exports.notifySlackOnNewRequest = functions.firestore
  .document('requests/{requestId}')
  .onCreate(async (snapshot, context) => {
    try {
      const requestData = snapshot.data();
      const slackMessage = formatSlackMessage(requestData);
      
      // Log that we're sending a notification (useful for debugging)
      console.log(`Sending Slack notification for new lecture request: ${requestData.topic}`);
      
      // Send notification to Slack
      await sendSlackNotification(slackMessage);
      
      console.log('Slack notification sent successfully');
      return null;
    } catch (error) {
      console.error('Error sending Slack notification:', error);
      throw error;
    }
  }); 