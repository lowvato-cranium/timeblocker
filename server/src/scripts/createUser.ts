import "../db/client.js";
import { authService } from "../domains/auth/auth.service.js";

const [, , username, password] = process.argv;
if (!username || !password) {
  console.error("Usage: npm run user:create -- <username> <password>");
  process.exit(1);
}

const user = authService.createUser(username, password);
console.log(`Created user "${user.username}" (id: ${user.id})`);
