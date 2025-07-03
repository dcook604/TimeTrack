"use client";

// Email notification service for vacation requests
// This would integrate with a real email service in production

export interface EmailNotificationData {
  to: string;
  subject: string;
  request: {
    id: string;
    employeeName: string;
    startDate: string;
    endDate: string;
    type: string;
    daysRequested: number;
    reason?: string;
  };
  rejectionReason?: string;
}

export class EmailNotificationService {
  private static adminEmails = ["admin@company.com", "hr@company.com"];

  static async sendNewRequestNotification(request: any) {
    const emailData: EmailNotificationData = {
      to: this.adminEmails.join(","),
      subject: `New Vacation Request from ${request.employeeName}`,
      request,
    };

    console.log("📧 Sending new request notification:", emailData);

    // In production, this would call your email service API
    // Example integrations:
    // - SendGrid: await sendgrid.send(emailTemplate)
    // - AWS SES: await ses.sendEmail(params)
    // - Nodemailer: await transporter.sendMail(mailOptions)

    return this.mockEmailSend(emailData);
  }

  static async sendApprovalNotification(request: any) {
    const emailData: EmailNotificationData = {
      to: request.employeeEmail,
      subject: "Vacation Request Approved",
      request,
    };

    console.log("✅ Sending approval notification:", emailData);
    return this.mockEmailSend(emailData);
  }

  static async sendRejectionNotification(
    request: any,
    rejectionReason: string,
  ) {
    const emailData: EmailNotificationData = {
      to: request.employeeEmail,
      subject: "Vacation Request Rejected",
      request,
      rejectionReason,
    };

    console.log("❌ Sending rejection notification:", emailData);
    return this.mockEmailSend(emailData);
  }

  static async sendReminderNotification(request: any) {
    const emailData: EmailNotificationData = {
      to: this.adminEmails.join(","),
      subject: `Reminder: Vacation Request Pending Approval - ${request.employeeName}`,
      request,
    };

    console.log("⏰ Sending reminder notification:", emailData);
    return this.mockEmailSend(emailData);
  }

  private static async mockEmailSend(
    emailData: EmailNotificationData,
  ): Promise<boolean> {
    // Simulate email sending delay
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // Mock success response
    console.log("📬 Email sent successfully:", {
      to: emailData.to,
      subject: emailData.subject,
      timestamp: new Date().toISOString(),
    });

    return true;
  }

  // Email templates for different notification types
  static getEmailTemplate(
    type: "new_request" | "approved" | "rejected" | "reminder",
    data: EmailNotificationData,
  ): string {
    const { request } = data;
    const dateRange = `${new Date(request.startDate).toLocaleDateString()} - ${new Date(request.endDate).toLocaleDateString()}`;

    switch (type) {
      case "new_request":
        return `
          <h2>New Vacation Request</h2>
          <p><strong>Employee:</strong> ${request.employeeName}</p>
          <p><strong>Dates:</strong> ${dateRange}</p>
          <p><strong>Days Requested:</strong> ${request.daysRequested}</p>
          <p><strong>Type:</strong> ${request.type}</p>
          ${request.reason ? `<p><strong>Reason:</strong> ${request.reason}</p>` : ""}
          <p>Please review and approve/reject this request in the admin panel.</p>
        `;

      case "approved":
        return `
          <h2>Vacation Request Approved</h2>
          <p>Hi ${request.employeeName},</p>
          <p>Your vacation request has been approved!</p>
          <p><strong>Dates:</strong> ${dateRange}</p>
          <p><strong>Days:</strong> ${request.daysRequested}</p>
          <p>Enjoy your time off!</p>
        `;

      case "rejected":
        return `
          <h2>Vacation Request Rejected</h2>
          <p>Hi ${request.employeeName},</p>
          <p>Unfortunately, your vacation request has been rejected.</p>
          <p><strong>Dates:</strong> ${dateRange}</p>
          <p><strong>Days:</strong> ${request.daysRequested}</p>
          ${data.rejectionReason ? `<p><strong>Reason:</strong> ${data.rejectionReason}</p>` : ""}
          <p>Please contact HR if you have any questions.</p>
        `;

      case "reminder":
        return `
          <h2>Vacation Request Pending Approval</h2>
          <p>This is a reminder that a vacation request is still pending approval:</p>
          <p><strong>Employee:</strong> ${request.employeeName}</p>
          <p><strong>Dates:</strong> ${dateRange}</p>
          <p><strong>Days Requested:</strong> ${request.daysRequested}</p>
          <p>Please review this request in the admin panel.</p>
        `;

      default:
        return "";
    }
  }
}

export default EmailNotificationService;
