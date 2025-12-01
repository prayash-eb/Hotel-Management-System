interface VerificationEmailParams {
  name: string;
  email: string;
  verificationUrl: string;
}

export function generateEmailVerificationTemplate({
  name,
  email,
  verificationUrl,
}: VerificationEmailParams): string {
  return `
  <!DOCTYPE html>
  <html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Email Verification</title>
    <style>
      body {
        font-family: Arial, Helvetica, sans-serif;
        background: #f6f7fb;
        margin: 0;
        padding: 0;
      }
      .container {
        max-width: 600px;
        margin: 40px auto;
        background: #ffffff;
        border-radius: 10px;
        padding: 30px;
        box-shadow: 0 4px 10px rgba(0,0,0,0.1);
      }
      .header {
        text-align: center;
        margin-bottom: 40px;
      }
      .header h1 {
        margin: 0;
        font-size: 22px;
        color: #333;
      }
      .content {
        font-size: 16px;
        color: #444;
        line-height: 1.6;
      }
      .btn {
        display: inline-block;
        margin-top: 20px;
        background: #4f46e5;
        color: #fff !important;
        padding: 12px 20px;
        text-decoration: none;
        border-radius: 6px;
        font-weight: bold;
      }
      .footer {
        margin-top: 40px;
        font-size: 13px;
        text-align: center;
        color: #888;
      }
    </style>
  </head>

  <body>
    <div class="container">
      
      <div class="header">
        <h1>Verify Your Email</h1>
      </div>

      <div class="content">
        <p>Hi <strong>${name}</strong>,</p>

        <p>Thanks for signing up using <strong>${email}</strong>.</p>

        <p>
          Please verify your email address by clicking the button below.  
          This helps us ensure your account security.
        </p>

        <p style="text-align: center;">
          <a href="${verificationUrl}" class="btn">Verify Email</a>
        </p>

        <p>If the button above doesn’t work, copy and paste this link:</p>
        <p style="word-break: break-all;">${verificationUrl}</p>

        <p>If you did not create this account, you can safely ignore this email.</p>
      </div>

      <div class="footer">
        <p>© ${new Date().getFullYear()} Your Company. All rights reserved.</p>
      </div>

    </div>
  </body>
  </html>
  `;
}
