import "../db/client.js";
import { authService } from "../domains/auth/auth.service.js";

const [, , username, password] = process.argv;
if (!username || !password) {
  console.error("Usage: npm run user:reset-password -- <username> <new-password>");
  process.exit(1);
}

const user = authService.resetPassword(username, password);
console.log(`Reset password for "${user.username}" (id: ${user.id})`);
