import "dotenv/config";

const BREVO_API_URL = "https://api.brevo.com/v3/smtp/email";

export const sendEmail = async ({
  to,
  subject,
  htmlContent,
  textContent
}) => {
  try {
    const apiKey = process.env.BREVO_API_KEY;
    const senderEmail = process.env.BREVO_SENDER_EMAIL;
    const senderName =
      process.env.BREVO_SENDER_NAME || "LearnDesk";

    if (!apiKey || !senderEmail) {
      throw new Error(
        "Brevo API configuration is missing"
      );
    }

    if (!to || !subject || !htmlContent) {
      throw new Error(
        "Recipient, subject and email content are required"
      );
    }

    const response = await fetch(BREVO_API_URL, {
      method: "POST",
      headers: {
        "accept": "application/json",
        "api-key": apiKey,
        "content-type": "application/json"
      },
      body: JSON.stringify({
        sender: {
          name: senderName,
          email: senderEmail
        },
        to: [
          {
            email: String(to).trim().toLowerCase()
          }
        ],
        subject,
        htmlContent,
        ...(textContent ? { textContent } : {})
      })
    });

    const responseData = await response.json();

    if (!response.ok) {
      console.error(
        "Brevo Email Error:",
        response.status,
        responseData
      );

      throw new Error(
        responseData.message ||
          "Brevo could not send the email"
      );
    }

    console.log(
      "Brevo accepted email:",
      responseData.messageId
    );

    return {
      success: true,
      messageId: responseData.messageId
    };
  } catch (error) {
    console.error(
      "Send Email Error:",
      error.message
    );

    throw error;
  }
};