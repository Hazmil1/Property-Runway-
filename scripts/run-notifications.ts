import "dotenv/config";
import { materialiseNotifications } from "../lib/services/notifications";
import { deliverQueuedEmails } from "../lib/services/delivery";
const materialised=await materialiseNotifications();
const delivered=await deliverQueuedEmails();
console.log(JSON.stringify({materialised,delivered}));
