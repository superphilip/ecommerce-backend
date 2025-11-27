import nodemailer from "nodemailer";
import dotenv from "dotenv";

dotenv.config();

type TransportConfig = {
    host: string;
    port: number;
    auth: {
        user: string;
        pass: string;
    };
}

const config = () : TransportConfig => {
    return {
        host: process.env.EMAIL_HOST as string,
        port: Number(process.env.EMAIL_PORT),
        auth: {
            user: process.env.EMAIL_USER as string,
            pass: process.env.EMAIL_PASS as string
        }
    }
}

export const transport = nodemailer.createTransport(config());