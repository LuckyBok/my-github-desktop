# Slack Webhook Integration for Lecture Requests

This integration sends a notification to a Slack channel whenever a new lecture request is submitted through the portfolio page.

## How It Works

1. When a new document is created in the Firestore `requests` collection, a Firebase Cloud Function is triggered
2. The function formats the request data (name, email, topic, message) into a readable Slack message
3. It sends the message to a configured Slack webhook URL
4. The message appears in your Slack channel with formatting and an email reply button

## Configuration

Before deploying the function, you need to create a Slack webhook and configure Firebase:

### Step 1: Create a Slack Webhook

1. Go to your Slack workspace → Settings & Administration → Manage Apps
2. Search for "Incoming Webhooks" and add it to your workspace
3. Create a new webhook for a specific channel where you want to receive notifications
4. Copy the webhook URL (it should look like `https://hooks.slack.com/services/T00000000/B00000000/XXXXXXXXXXXXXXXXXXXXXXXX`)

### Step 2: Configure Firebase Functions

Run the following command to set the webhook URL as a Firebase environment variable:

```bash
firebase functions:config:set slack.webhook_url="YOUR_WEBHOOK_URL"
```

Replace `YOUR_WEBHOOK_URL` with the actual webhook URL you copied from Slack.

### Step 3: Deploy the Functions

Deploy the updated functions to Firebase:

```bash
cd functions
npm run deploy
```

## Testing the Integration

To test the integration:

1. Go to your portfolio page and submit a lecture request form
2. Check your configured Slack channel for the notification
3. You should see a nicely formatted message with all the request details

## Troubleshooting

If notifications aren't coming through:

1. Check Firebase Functions logs in the Firebase Console
2. Verify the webhook URL is correct in your Firebase config
3. Ensure the Slack app/webhook is still active in your workspace

You can view the configuration values with:

```bash
firebase functions:config:get
``` 