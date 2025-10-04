import { AppDataSource } from "../src/db/dataSource";
import { AdminUser } from "../src/domain/entities/AdminUser";
import * as readline from "readline";
import { randomBytes } from "crypto";
import * as bycrpt from "bcrypt" 
import { hashPassword } from "../src/utils/password";

async function prompt(question: string): Promise<string> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) =>
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer.trim());
    })
  );
}

function generateRandomPassword(length: number = 32): string {
  // Base64 → elég hosszú és biztonságos
  return randomBytes(length).toString("base64").slice(0, length);
}

async function main() {
  await AppDataSource.initialize();
  const userRepo = AppDataSource.getRepository(AdminUser);

  const username = await prompt("Adj meg egy felhasználónevet: ");
  const email = await prompt("Adj meg egy email címet: ");

  const password = generateRandomPassword(32);

  const user = new AdminUser();
  user.username = username;
  user.email = email;
  user.passwordHash = await hashPassword(password); // setter automatikusan hash-eli

  await userRepo.save(user);

  console.log("✅ Admin user létrehozva!");
  console.log("Email:", email);
  console.log("Username:", username);
  console.log("Generated password:", password);

  await AppDataSource.destroy();
}

main()
