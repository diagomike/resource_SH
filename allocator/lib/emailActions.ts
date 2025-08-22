"use server";

import nodemailer from "nodemailer";
import { toast } from "sonner"; // Assuming sonner is available in server actions or a similar logging mechanism

interface SendPreferenceEmailProps {
  scheduleInstanceId: string;
  personnelId: string;
  email: string;
  preferenceToken: string;
  userName: string;
}

export async function sendPreferenceEmail({
  scheduleInstanceId,
  personnelId,
  email,
  preferenceToken,
  userName,
}: SendPreferenceEmailProps) {
  try {
    // Configure Nodemailer transporter with your Gmail credentials
    // IMPORTANT: In a production environment, you should use environment variables
    // for credentials, not hardcode them directly.
    let transporter = nodemailer.createTransport({
      service: "Gmail",
      auth: {
        user: "asturesourceallocator@gmail.com", // Your Gmail address
        pass: "lxhw bkpb euan zwcb", // Your Gmail app password or regular password if less secure apps are allowed
      },
    });

    const preferenceLink = `${
      process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
    }/preferences/${scheduleInstanceId}?token=${preferenceToken}`;

    const mailOptions = {
      from: "asturesourceallocator@gmail.com",
      to: email,
      subject: `Your Preference Link for Schedule Instance: ${scheduleInstanceId}`,
      html: `
        <p>Dear ${userName},</p>
        <p>Please use the following link to fill out your preferences for the schedule:</p>
        <p><a href="${preferenceLink}">${preferenceLink}</a></p>
        <p>Thank you!</p>
      `,
    };

    await transporter.sendMail(mailOptions);
    console.log(`Email sent successfully to ${email}`);
    return { success: true, message: `Preference link sent to ${email}.` };
  } catch (error) {
    console.error(`Error sending email to ${email}:`, error);
    // You might want to log the error more comprehensively in a real app
    return { success: false, message: `Failed to send email to ${email}.` };
  }
}
