import { z } from "zod";

export const formSchema = z.object({
	userId: z.string().min(2).max(50),
	password: z.string().min(6).max(256),
});

export type FormSchema = typeof formSchema;
