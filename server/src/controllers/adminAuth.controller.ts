// src/controllers/adminAuth.controller.ts
import { Request, Response } from "express";
import jwt from "jsonwebtoken";
import { env } from "../config/env";
import { AdminLoginRequest } from "../domain/dtos/adminAuth.dto";
import { AppDataSource } from "../db/dataSource";
import { AdminUser } from "../domain/entities/AdminUser";
import { logger } from "../utils/logger";
import { verifyPassword } from "../utils/password";
import { Unauthorized } from "../utils/error";


const adminUserRepo = AppDataSource.getRepository(AdminUser);
/**
 * Admin login endpoint
 * Body: { email: string, password: string }
 */
export async function login (req: Request, res: Response) {
    const { email, password } = req.body as AdminLoginRequest;


    const adminUser = await adminUserRepo.findOneBy({ email });

    if (!adminUser) {
        logger.error("Hibás email cím!", {email})
         throw Unauthorized("Hibás belépési adatok");
    }

    if(!(await verifyPassword(password, adminUser.passwordHash))){
         logger.error("Hibás jelszó")
         throw Unauthorized("Hibás belépési adatok");
    }


    const token = jwt.sign(
        {
            id: adminUser.id,
            userId: adminUser.id, // kompatibilitás a régi kliensekkel
            email,
        },
        env.ADMIN_JWT_SECRET,
        { expiresIn: env.ADMIN_JWT_EXPIRES_IN as any, algorithm: "HS384" }
    );

    return res.json({ token, message: "Sikeres belépés" });
}
