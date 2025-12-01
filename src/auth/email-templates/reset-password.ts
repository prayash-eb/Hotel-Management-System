interface ResetPasswordEmailParams {
  name: string;
  resetUrl: string;
}

export function generateResetPasswordTemplate({
  name,
  resetUrl,
}: ResetPasswordEmailParams): string {
  return `
  <!DOCTYPE html>
  <html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Reset Password</title>
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
        background: #dc2626;
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
        <h1>Reset Your Password</h1>
      </div>

      <div class="content">
        <p>Hi <strong>${name}</strong>,</p>

        <p>We received a request to reset your password. If you didn't make this request, you can safely ignore this email.</p>

        <p>
          Click the button below to reset your password. This link will expire in 1 hour.
        </p>

        <p style="text-align: center;">
          <a href="${resetUrl}" class="btn">Reset Password</a>
        </p>

        <p>If the button above doesn’t work, copy and paste this link:</p>
        <p style="word-break: break-all;">${resetUrl}</p>
      </div>

      <div class="footer">
        <p>© ${new Date().getFullYear()} Your Company. All rights reserved.</p>
      </div>

    </div>
  </body>
  </html>
  `;
}
