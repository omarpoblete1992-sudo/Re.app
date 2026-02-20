import { z } from "zod";

export const RegisterSchema = z.object({
    email: z.string().email({ message: "Email inválido" }),
    password: z.string().min(8, { message: "La contraseña debe tener al menos 8 caracteres" }),
    nickname: z.string().min(3, { message: "El apodo debe tener al menos 3 caracteres" }),
    birthDate: z.string().refine((date) => new Date(date).toString() !== 'Invalid Date', { message: "Fecha inválida" }),
    gender: z.enum(["male", "female", "non-binary", "other"], { required_error: "Selecciona tu género" }),
    interestedIn: z.enum(["male", "female", "everyone"], { required_error: "Selecciona tu interés" }),
});

export type RegisterSchemaType = z.infer<typeof RegisterSchema>;
