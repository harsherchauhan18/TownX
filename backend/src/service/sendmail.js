import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env from backend root directory
dotenv.config({ path: path.resolve(__dirname, "../../.env") });

import nodemailer from "nodemailer";

const sendMail = async (req, res) => {
	res.send("Mail lelo bhaiya");
};

const transporter = nodemailer.createTransport({
	host: "smtp.gmail.com",
	port: 465,
	secure: true,
	auth: {
		user: process.env.USER_EMAIL,
		pass: process.env.USER_PASS,
	},
});

(async () => {
	// Check if credentials are loaded
	if (!process.env.USER_EMAIL || !process.env.USER_PASS) {
		console.error("❌ Error: USER_EMAIL and USER_PASS must be set in .env file");
		console.log("USER_EMAIL:", process.env.USER_EMAIL ? "✓ Set" : "✗ Missing");
		console.log("USER_PASS:", process.env.USER_PASS ? "✓ Set" : "✗ Missing");
		process.exit(1);
	}

	console.log("📧 Sending test email...");
	const info = await transporter.sendMail({
		from: process.env.USER_EMAIL,
		to: "harshmnnit2006@gmail.com",
		subject: "Hello ✔",
		text: "Hello world?", // plain‑text body
		html: "<b>Hello world?</b>", // HTML body
	});

	console.log("✅ Message sent:", info.messageId);
})();

export default sendMail;