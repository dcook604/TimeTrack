import nodemailer from 'nodemailer'

// Email configuration
const emailConfig = {
  host: process.env.SMTP_HOST || 'localhost',
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: process.env.SMTP_SECURE === 'true', // true for 465, false for other ports
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
}

// Create reusable transporter object using SMTP transport
const transporter = nodemailer.createTransporter(emailConfig)

// Email templates
const emailTemplates = {
  timesheetSubmitted: {
    subject: 'New Timesheet Submitted for Review',
    html: (data: any) => `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">New Timesheet Submitted</h2>
        <p>A new timesheet has been submitted and requires your review.</p>
        
        <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
          <h3 style="margin-top: 0;">Timesheet Details:</h3>
          <p><strong>Employee:</strong> ${data.employeeName} (${data.employeeEmail})</p>
          <p><strong>Week Ending:</strong> ${data.weekEnding}</p>
          <p><strong>Total Hours:</strong> ${data.totalHours}</p>
          <p><strong>Submitted:</strong> ${data.submittedAt}</p>
        </div>
        
        <p>Please log in to the Timetracker system to review and approve this timesheet.</p>
        
        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; color: #666; font-size: 12px;">
          <p>This is an automated message from the Timetracker system.</p>
        </div>
      </div>
    `
  },

  timesheetApproved: {
    subject: 'Timesheet Approved',
    html: (data: any) => `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #28a745;">Timesheet Approved</h2>
        <p>Your timesheet has been approved by your manager.</p>
        
        <div style="background-color: #d4edda; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #28a745;">
          <h3 style="margin-top: 0;">Timesheet Details:</h3>
          <p><strong>Week Ending:</strong> ${data.weekEnding}</p>
          <p><strong>Total Hours:</strong> ${data.totalHours}</p>
          <p><strong>Approved By:</strong> ${data.approverName}</p>
          <p><strong>Approved On:</strong> ${data.approvedAt}</p>
          ${data.approverComments ? `<p><strong>Comments:</strong> ${data.approverComments}</p>` : ''}
        </div>
        
        <p>Your timesheet is now finalized and will be processed for payroll.</p>
        
        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; color: #666; font-size: 12px;">
          <p>This is an automated message from the Timetracker system.</p>
        </div>
      </div>
    `
  },

  timesheetRejected: {
    subject: 'Timesheet Requires Revision',
    html: (data: any) => `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #dc3545;">Timesheet Requires Revision</h2>
        <p>Your timesheet has been returned for revision by your manager.</p>
        
        <div style="background-color: #f8d7da; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #dc3545;">
          <h3 style="margin-top: 0;">Timesheet Details:</h3>
          <p><strong>Week Ending:</strong> ${data.weekEnding}</p>
          <p><strong>Total Hours:</strong> ${data.totalHours}</p>
          <p><strong>Reviewed By:</strong> ${data.approverName}</p>
          <p><strong>Reviewed On:</strong> ${data.reviewedAt}</p>
          ${data.approverComments ? `<p><strong>Comments:</strong> ${data.approverComments}</p>` : ''}
        </div>
        
        <p>Please review the comments above, make the necessary corrections, and resubmit your timesheet.</p>
        
        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; color: #666; font-size: 12px;">
          <p>This is an automated message from the Timetracker system.</p>
        </div>
      </div>
    `
  },

  vacationRequestSubmitted: {
    subject: 'New Vacation Request Submitted',
    html: (data: any) => `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">New Vacation Request</h2>
        <p>A new vacation request has been submitted and requires your review.</p>
        
        <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
          <h3 style="margin-top: 0;">Request Details:</h3>
          <p><strong>Employee:</strong> ${data.employeeName} (${data.employeeEmail})</p>
          <p><strong>Request Type:</strong> ${data.requestType}</p>
          <p><strong>Start Date:</strong> ${data.startDate}</p>
          <p><strong>End Date:</strong> ${data.endDate}</p>
          <p><strong>Days Requested:</strong> ${data.daysRequested}</p>
          <p><strong>Submitted:</strong> ${data.submittedAt}</p>
          ${data.reason ? `<p><strong>Reason:</strong> ${data.reason}</p>` : ''}
        </div>
        
        <p>Please log in to the Timetracker system to review and approve this vacation request.</p>
        
        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; color: #666; font-size: 12px;">
          <p>This is an automated message from the Timetracker system.</p>
        </div>
      </div>
    `
  },

  vacationRequestApproved: {
    subject: 'Vacation Request Approved',
    html: (data: any) => `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #28a745;">Vacation Request Approved</h2>
        <p>Your vacation request has been approved by your manager.</p>
        
        <div style="background-color: #d4edda; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #28a745;">
          <h3 style="margin-top: 0;">Request Details:</h3>
          <p><strong>Request Type:</strong> ${data.requestType}</p>
          <p><strong>Start Date:</strong> ${data.startDate}</p>
          <p><strong>End Date:</strong> ${data.endDate}</p>
          <p><strong>Days Approved:</strong> ${data.daysRequested}</p>
          <p><strong>Approved By:</strong> ${data.approverName}</p>
          <p><strong>Approved On:</strong> ${data.approvedAt}</p>
          ${data.reviewComments ? `<p><strong>Comments:</strong> ${data.reviewComments}</p>` : ''}
        </div>
        
        ${data.newVacationBalance !== undefined ? 
          `<p><strong>Remaining Vacation Balance:</strong> ${data.newVacationBalance} days</p>` : ''
        }
        
        <p>Your vacation request is now approved. Please coordinate with your team regarding coverage during your absence.</p>
        
        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; color: #666; font-size: 12px;">
          <p>This is an automated message from the Timetracker system.</p>
        </div>
      </div>
    `
  },

  vacationRequestRejected: {
    subject: 'Vacation Request Declined',
    html: (data: any) => `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #dc3545;">Vacation Request Declined</h2>
        <p>Your vacation request has been declined by your manager.</p>
        
        <div style="background-color: #f8d7da; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #dc3545;">
          <h3 style="margin-top: 0;">Request Details:</h3>
          <p><strong>Request Type:</strong> ${data.requestType}</p>
          <p><strong>Start Date:</strong> ${data.startDate}</p>
          <p><strong>End Date:</strong> ${data.endDate}</p>
          <p><strong>Days Requested:</strong> ${data.daysRequested}</p>
          <p><strong>Reviewed By:</strong> ${data.approverName}</p>
          <p><strong>Reviewed On:</strong> ${data.reviewedAt}</p>
          ${data.reviewComments ? `<p><strong>Comments:</strong> ${data.reviewComments}</p>` : ''}
        </div>
        
        <p>If you have questions about this decision, please speak with your manager directly.</p>
        
        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; color: #666; font-size: 12px;">
          <p>This is an automated message from the Timetracker system.</p>
        </div>
      </div>
    `
  }
}

// Email sending functions
export async function sendTimesheetSubmittedNotification(
  managerEmail: string,
  timesheetData: {
    employeeName: string
    employeeEmail: string
    weekEnding: string
    totalHours: number
    submittedAt: string
  }
) {
  try {
    const template = emailTemplates.timesheetSubmitted
    
    await transporter.sendMail({
      from: process.env.SMTP_FROM || 'noreply@timetracker.com',
      to: managerEmail,
      subject: template.subject,
      html: template.html(timesheetData)
    })
    
    console.log('Timesheet submitted notification sent to:', managerEmail)
  } catch (error) {
    console.error('Failed to send timesheet submitted notification:', error)
    throw error
  }
}

export async function sendTimesheetStatusNotification(
  employeeEmail: string,
  status: 'APPROVED' | 'REJECTED',
  timesheetData: {
    weekEnding: string
    totalHours: number
    approverName: string
    approvedAt?: string
    reviewedAt?: string
    approverComments?: string
  }
) {
  try {
    const template = status === 'APPROVED' 
      ? emailTemplates.timesheetApproved 
      : emailTemplates.timesheetRejected
    
    await transporter.sendMail({
      from: process.env.SMTP_FROM || 'noreply@timetracker.com',
      to: employeeEmail,
      subject: template.subject,
      html: template.html(timesheetData)
    })
    
    console.log(`Timesheet ${status.toLowerCase()} notification sent to:`, employeeEmail)
  } catch (error) {
    console.error(`Failed to send timesheet ${status.toLowerCase()} notification:`, error)
    throw error
  }
}

export async function sendVacationRequestSubmittedNotification(
  managerEmail: string,
  requestData: {
    employeeName: string
    employeeEmail: string
    requestType: string
    startDate: string
    endDate: string
    daysRequested: number
    submittedAt: string
    reason?: string
  }
) {
  try {
    const template = emailTemplates.vacationRequestSubmitted
    
    await transporter.sendMail({
      from: process.env.SMTP_FROM || 'noreply@timetracker.com',
      to: managerEmail,
      subject: template.subject,
      html: template.html(requestData)
    })
    
    console.log('Vacation request submitted notification sent to:', managerEmail)
  } catch (error) {
    console.error('Failed to send vacation request submitted notification:', error)
    throw error
  }
}

export async function sendVacationRequestStatusNotification(
  employeeEmail: string,
  status: 'APPROVED' | 'REJECTED',
  requestData: {
    requestType: string
    startDate: string
    endDate: string
    daysRequested: number
    approverName: string
    approvedAt?: string
    reviewedAt?: string
    reviewComments?: string
    newVacationBalance?: number
  }
) {
  try {
    const template = status === 'APPROVED' 
      ? emailTemplates.vacationRequestApproved 
      : emailTemplates.vacationRequestRejected
    
    await transporter.sendMail({
      from: process.env.SMTP_FROM || 'noreply@timetracker.com',
      to: employeeEmail,
      subject: template.subject,
      html: template.html(requestData)
    })
    
    console.log(`Vacation request ${status.toLowerCase()} notification sent to:`, employeeEmail)
  } catch (error) {
    console.error(`Failed to send vacation request ${status.toLowerCase()} notification:`, error)
    throw error
  }
}

// Test email configuration
export async function testEmailConfiguration() {
  try {
    await transporter.verify()
    console.log('Email configuration is valid')
    return true
  } catch (error) {
    console.error('Email configuration error:', error)
    return false
  }
}