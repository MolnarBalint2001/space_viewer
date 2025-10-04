import { z } from 'zod';


export const AdminLoginDto = z.object({
    email: z.string().email(),
    password: z.string().min(1),
});

export type AdminLoginRequest = z.infer<typeof AdminLoginDto>;