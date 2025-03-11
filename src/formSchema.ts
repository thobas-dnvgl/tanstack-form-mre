import { z } from "zod";

export const FormSchema = z.object({
  name: z
    .string({ message: "Name is required" })
    .trim() // Do not accept spaces around the value
    .min(3, { message: "Name must be at least 3 characters" }),
  email: z
    .string({ message: "Email address is required" })
    .email({ message: "Invalid email address" }),
  recaptchaCode: z
    .string({ message: "ReCAPTCHA is required" })
    .min(1, { message: "ReCAPTCHA is required" }), // Without this, zod considers an empty string as valid
});
