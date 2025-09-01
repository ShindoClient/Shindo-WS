import "dotenv/config";
import { initFirebase } from "./firebase.js";
import { createGateway } from "./gateway.js";

initFirebase();
createGateway();
