const admin = require('firebase-admin');

// 1. Read the raw secret JSON securely from the Action Environment
const serviceAccountRaw = process.env.SERVICE_ACCOUNT_JSON;
if (!serviceAccountRaw) {
    console.error("FATAL ERROR: SERVICE_ACCOUNT_JSON secret is missing from GitHub Environment!");
    process.exit(1);
}

// 2. Safely parse the Service Account Config
let serviceAccount;
try {
    serviceAccount = JSON.parse(serviceAccountRaw);
} catch (error) {
    console.error("FATAL ERROR: Failed to parse SERVICE_ACCOUNT_JSON. Make sure the secret contains valid JSON text.");
    process.exit(1);
}

// 3. Initialize Firebase Admin SDK purely using credentials
admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
});

// 4. Retrieve Dispatch Payload elements sent securely from HTML Admin
const title = process.env.NOTIF_TITLE;
const body = process.env.NOTIF_BODY || "You have a new message from the administrator.";
const token = process.env.NOTIF_TOKEN;
const topic = process.env.NOTIF_TOPIC;

console.log(`Preparing to send message. Title: "${title || '(none)'}", Body: "${body}"`);

const message = {
    notification: {
        body: body
    }
};

if (title && title.trim().length > 0) {
    message.notification.title = title.trim();
}

// Evaluate routing: Either Token Targeted or Broadcast Topic
if (token && token.trim() !== '') {
    console.log(`ROUTE: Direct Token targeting active: [${token.substring(0, 10)}...]`);
    message.token = token.trim();
} else if (topic && topic.trim() !== '') {
    console.log(`ROUTE: Broadcast Topic targeting active: /topics/${topic.trim()}`);
    message.topic = topic.trim();
} else {
    console.error("FATAL ERROR: Neither Token nor Topic was provided. Unable to route notification.");
    process.exit(1);
}

// 5. Fire the actual FCM Delivery via Google APIs
admin.messaging().send(message)
    .then((response) => {
        console.log("SUCCESS: Successfully dispatched FCM push notification:", response);
        process.exit(0);
    })
    .catch((error) => {
        console.error("ERROR: Failed delivering FCM push notification:", error);
        process.exit(1);
    });
