const { sendWeeklyReport } = require('./weeklyReport');
const { notifySlackOnNewRequest } = require('./slackNotification');

// Export all functions
exports.sendWeeklyReport = sendWeeklyReport;
exports.notifySlackOnNewRequest = notifySlackOnNewRequest; 