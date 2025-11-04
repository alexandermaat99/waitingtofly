import { resend } from './resend';

interface OrderConfirmationEmailData {
  to: string;
  customerName: string;
  orderId: string;
  bookTitle: string;
  bookFormat: string;
  quantity: number;
  subtotal: number;
  taxAmount: number;
  shippingAmount: number;
  totalAmount: number;
  shippingAddress: {
    firstName: string;
    lastName: string;
    addressLine1: string;
    addressLine2?: string;
    city: string;
    state?: string;
    postalCode: string;
    country: string;
  };
  checkoutSessionId?: string;
}

export async function sendOrderConfirmationEmail(data: OrderConfirmationEmailData) {
  if (!process.env.RESEND_API_KEY) {
    console.warn('RESEND_API_KEY not set, skipping email send');
    return { success: false, error: 'Email service not configured' };
  }

  const fromEmail = process.env.RESEND_FROM_EMAIL || 'noreply@yourdomain.com';
  const fromName = process.env.RESEND_FROM_NAME || 'Waiting to Fly';

  try {
    // Format shipping address
    const shippingAddressText = `
${data.shippingAddress.firstName} ${data.shippingAddress.lastName}
${data.shippingAddress.addressLine1}
${data.shippingAddress.addressLine2 ? data.shippingAddress.addressLine2 + '\n' : ''}${data.shippingAddress.city}, ${data.shippingAddress.state || ''} ${data.shippingAddress.postalCode}
${data.shippingAddress.country}
    `.trim();

    // Format currency
    const formatCurrency = (amount: number) => `$${amount.toFixed(2)}`;

    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Order Confirmation - ${data.bookTitle}</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f5f5f5;">
  <div style="background-color: #ffffff; border-radius: 8px; padding: 40px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
    
    <!-- Header -->
    <div style="text-align: center; margin-bottom: 30px; border-bottom: 2px solid #16a34a; padding-bottom: 20px;">
      <h1 style="color: #16a34a; margin: 0; font-size: 28px; font-weight: bold;">Waiting to Fly</h1>
      <p style="color: #666; margin: 5px 0 0 0; font-size: 14px;">Order Confirmation</p>
    </div>

    <!-- Thank You Message -->
    <div style="margin-bottom: 30px;">
      <h2 style="color: #333; font-size: 22px; margin: 0 0 10px 0;">Thank you for your preorder, ${data.customerName}!</h2>
      <p style="color: #666; margin: 0; font-size: 16px;">Your order has been confirmed and we're preparing it for you.</p>
    </div>

    <!-- Order Details -->
    <div style="background-color: #f9fafb; border-radius: 6px; padding: 20px; margin-bottom: 30px;">
      <h3 style="color: #333; font-size: 18px; margin: 0 0 15px 0; border-bottom: 1px solid #e5e7eb; padding-bottom: 10px;">Order Details</h3>
      
      <div style="margin-bottom: 15px;">
        <strong style="color: #666; font-size: 14px;">Order ID:</strong>
        <span style="color: #333; font-size: 14px; margin-left: 10px;">${data.orderId}</span>
      </div>
      
      <div style="margin-bottom: 15px;">
        <strong style="color: #666; font-size: 14px;">Book:</strong>
        <span style="color: #333; font-size: 14px; margin-left: 10px;">${data.bookTitle}</span>
      </div>
      
      <div style="margin-bottom: 15px;">
        <strong style="color: #666; font-size: 14px;">Format:</strong>
        <span style="color: #333; font-size: 14px; margin-left: 10px;">${data.bookFormat}</span>
      </div>
      
      ${data.quantity > 1 ? `
      <div style="margin-bottom: 15px;">
        <strong style="color: #666; font-size: 14px;">Quantity:</strong>
        <span style="color: #333; font-size: 14px; margin-left: 10px;">${data.quantity}</span>
      </div>
      ` : ''}
    </div>

    <!-- Shipping Address -->
    <div style="background-color: #f9fafb; border-radius: 6px; padding: 20px; margin-bottom: 30px;">
      <h3 style="color: #333; font-size: 18px; margin: 0 0 15px 0; border-bottom: 1px solid #e5e7eb; padding-bottom: 10px;">Shipping Address</h3>
      <p style="color: #333; font-size: 14px; margin: 0; white-space: pre-line;">${shippingAddressText}</p>
    </div>

    <!-- Order Summary -->
    <div style="background-color: #f9fafb; border-radius: 6px; padding: 20px; margin-bottom: 30px;">
      <h3 style="color: #333; font-size: 18px; margin: 0 0 15px 0; border-bottom: 1px solid #e5e7eb; padding-bottom: 10px;">Order Summary</h3>
      
      <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
        <span style="color: #666; font-size: 14px;">Subtotal:</span>
        <span style="color: #333; font-size: 14px;">${formatCurrency(data.subtotal)}</span>
      </div>
      
      ${data.taxAmount > 0 ? `
      <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
        <span style="color: #666; font-size: 14px;">Tax:</span>
        <span style="color: #333; font-size: 14px;">${formatCurrency(data.taxAmount)}</span>
      </div>
      ` : ''}
      
      ${data.shippingAmount > 0 ? `
      <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
        <span style="color: #666; font-size: 14px;">Shipping:</span>
        <span style="color: #333; font-size: 14px;">${formatCurrency(data.shippingAmount)}</span>
      </div>
      ` : ''}
      
      <div style="display: flex; justify-content: space-between; margin-top: 15px; padding-top: 15px; border-top: 2px solid #e5e7eb;">
        <strong style="color: #333; font-size: 16px;">Total:</strong>
        <strong style="color: #16a34a; font-size: 18px;">${formatCurrency(data.totalAmount)}</strong>
      </div>
    </div>

    <!-- Next Steps -->
    <div style="background-color: #ecfdf5; border-left: 4px solid #16a34a; border-radius: 4px; padding: 15px; margin-bottom: 30px;">
      <h3 style="color: #16a34a; font-size: 16px; margin: 0 0 10px 0;">What's Next?</h3>
      <ul style="color: #333; font-size: 14px; margin: 0; padding-left: 20px;">
        <li style="margin-bottom: 8px;">You'll receive an email when your order ships</li>
        <li style="margin-bottom: 8px;">Track your order status at any time</li>
        <li style="margin-bottom: 0;">Expected release: Check your confirmation page for details</li>
      </ul>
    </div>

    <!-- Footer -->
    <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
      <p style="color: #666; font-size: 12px; margin: 0 0 10px 0;">
        If you have any questions, please contact us at ${fromEmail}
      </p>
      <p style="color: #999; font-size: 11px; margin: 0;">
        © ${new Date().getFullYear()} Dr. Samly Maat. All rights reserved.
      </p>
    </div>
  </div>
</body>
</html>
    `.trim();

    const text = `
Waiting to Fly - Order Confirmation

Thank you for your preorder, ${data.customerName}!

Your order has been confirmed and we're preparing it for you.

ORDER DETAILS
Order ID: ${data.orderId}
Book: ${data.bookTitle}
Format: ${data.bookFormat}
${data.quantity > 1 ? `Quantity: ${data.quantity}\n` : ''}

SHIPPING ADDRESS
${shippingAddressText}

ORDER SUMMARY
Subtotal: ${formatCurrency(data.subtotal)}
${data.taxAmount > 0 ? `Tax: ${formatCurrency(data.taxAmount)}\n` : ''}${data.shippingAmount > 0 ? `Shipping: ${formatCurrency(data.shippingAmount)}\n` : ''}Total: ${formatCurrency(data.totalAmount)}

WHAT'S NEXT?
- You'll receive an email when your order ships
- Track your order status at any time
- Expected release: Check your confirmation page for details

If you have any questions, please contact us at ${fromEmail}

© ${new Date().getFullYear()} Dr. Samly Maat. All rights reserved.
    `.trim();

    const result = await resend.emails.send({
      from: `${fromName} <${fromEmail}>`,
      to: data.to,
      subject: `Order Confirmation - ${data.bookTitle}`,
      html,
      text,
    });

    console.log('✅ Order confirmation email sent:', {
      email: data.to,
      orderId: data.orderId,
      resendId: result.data?.id,
    });

    return { success: true, data: result.data };
  } catch (error) {
    console.error('❌ Failed to send order confirmation email:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}

export async function sendAdminOrderNotificationEmail(data: OrderConfirmationEmailData) {
  const adminEmail = process.env.ADMIN_EMAIL;
  
  if (!adminEmail) {
    console.warn('ADMIN_EMAIL not set, skipping admin notification email');
    return { success: false, error: 'Admin email not configured' };
  }

  if (!process.env.RESEND_API_KEY) {
    console.warn('RESEND_API_KEY not set, skipping admin notification email');
    return { success: false, error: 'Email service not configured' };
  }

  const fromEmail = process.env.RESEND_FROM_EMAIL || 'noreply@yourdomain.com';
  const fromName = process.env.RESEND_FROM_NAME || 'Waiting to Fly';

  try {
    // Format shipping address
    const shippingAddressText = `
${data.shippingAddress.firstName} ${data.shippingAddress.lastName}
${data.shippingAddress.addressLine1}
${data.shippingAddress.addressLine2 ? data.shippingAddress.addressLine2 + '\n' : ''}${data.shippingAddress.city}, ${data.shippingAddress.state || ''} ${data.shippingAddress.postalCode}
${data.shippingAddress.country}
    `.trim();

    // Format currency
    const formatCurrency = (amount: number) => `$${amount.toFixed(2)}`;

    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>New Order Notification - ${data.bookTitle}</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f5f5f5;">
  <div style="background-color: #ffffff; border-radius: 8px; padding: 40px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
    
    <!-- Header -->
    <div style="text-align: center; margin-bottom: 30px; border-bottom: 2px solid #dc2626; padding-bottom: 20px;">
      <h1 style="color: #dc2626; margin: 0; font-size: 28px; font-weight: bold;">🔔 New Order Received</h1>
      <p style="color: #666; margin: 5px 0 0 0; font-size: 14px;">Waiting to Fly - Order Notification</p>
    </div>

    <!-- Alert Message -->
    <div style="background-color: #fef2f2; border-left: 4px solid #dc2626; border-radius: 4px; padding: 15px; margin-bottom: 30px;">
      <p style="color: #dc2626; margin: 0; font-size: 16px; font-weight: bold;">A new order has been placed and payment has been confirmed.</p>
    </div>

    <!-- Customer Information -->
    <div style="background-color: #f9fafb; border-radius: 6px; padding: 20px; margin-bottom: 30px;">
      <h3 style="color: #333; font-size: 18px; margin: 0 0 15px 0; border-bottom: 1px solid #e5e7eb; padding-bottom: 10px;">Customer Information</h3>
      
      <div style="margin-bottom: 15px;">
        <strong style="color: #666; font-size: 14px;">Name:</strong>
        <span style="color: #333; font-size: 14px; margin-left: 10px;">${data.customerName}</span>
      </div>
      
      <div style="margin-bottom: 15px;">
        <strong style="color: #666; font-size: 14px;">Email:</strong>
        <span style="color: #333; font-size: 14px; margin-left: 10px;">${data.to}</span>
      </div>
      
      <div style="margin-bottom: 15px;">
        <strong style="color: #666; font-size: 14px;">Order ID:</strong>
        <span style="color: #333; font-size: 14px; margin-left: 10px; font-family: monospace;">${data.orderId}</span>
      </div>
      
      ${data.checkoutSessionId ? `
      <div style="margin-bottom: 0;">
        <strong style="color: #666; font-size: 14px;">Checkout Session ID:</strong>
        <span style="color: #333; font-size: 14px; margin-left: 10px; font-family: monospace; word-break: break-all;">${data.checkoutSessionId}</span>
      </div>
      ` : ''}
    </div>

    <!-- Order Details -->
    <div style="background-color: #f9fafb; border-radius: 6px; padding: 20px; margin-bottom: 30px;">
      <h3 style="color: #333; font-size: 18px; margin: 0 0 15px 0; border-bottom: 1px solid #e5e7eb; padding-bottom: 10px;">Order Details</h3>
      
      <div style="margin-bottom: 15px;">
        <strong style="color: #666; font-size: 14px;">Book:</strong>
        <span style="color: #333; font-size: 14px; margin-left: 10px;">${data.bookTitle}</span>
      </div>
      
      <div style="margin-bottom: 15px;">
        <strong style="color: #666; font-size: 14px;">Format:</strong>
        <span style="color: #333; font-size: 14px; margin-left: 10px;">${data.bookFormat}</span>
      </div>
      
      ${data.quantity > 1 ? `
      <div style="margin-bottom: 15px;">
        <strong style="color: #666; font-size: 14px;">Quantity:</strong>
        <span style="color: #333; font-size: 14px; margin-left: 10px;">${data.quantity}</span>
      </div>
      ` : ''}
    </div>

    <!-- Shipping Address -->
    <div style="background-color: #f9fafb; border-radius: 6px; padding: 20px; margin-bottom: 30px;">
      <h3 style="color: #333; font-size: 18px; margin: 0 0 15px 0; border-bottom: 1px solid #e5e7eb; padding-bottom: 10px;">Shipping Address</h3>
      <p style="color: #333; font-size: 14px; margin: 0; white-space: pre-line;">${shippingAddressText}</p>
    </div>

    <!-- Order Summary -->
    <div style="background-color: #f9fafb; border-radius: 6px; padding: 20px; margin-bottom: 30px;">
      <h3 style="color: #333; font-size: 18px; margin: 0 0 15px 0; border-bottom: 1px solid #e5e7eb; padding-bottom: 10px;">Order Summary</h3>
      
      <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
        <span style="color: #666; font-size: 14px;">Subtotal:</span>
        <span style="color: #333; font-size: 14px;">${formatCurrency(data.subtotal)}</span>
      </div>
      
      ${data.taxAmount > 0 ? `
      <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
        <span style="color: #666; font-size: 14px;">Tax:</span>
        <span style="color: #333; font-size: 14px;">${formatCurrency(data.taxAmount)}</span>
      </div>
      ` : ''}
      
      ${data.shippingAmount > 0 ? `
      <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
        <span style="color: #666; font-size: 14px;">Shipping:</span>
        <span style="color: #333; font-size: 14px;">${formatCurrency(data.shippingAmount)}</span>
      </div>
      ` : ''}
      
      <div style="display: flex; justify-content: space-between; margin-top: 15px; padding-top: 15px; border-top: 2px solid #e5e7eb;">
        <strong style="color: #333; font-size: 16px;">Total:</strong>
        <strong style="color: #dc2626; font-size: 18px;">${formatCurrency(data.totalAmount)}</strong>
      </div>
    </div>

    <!-- Footer -->
    <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
      <p style="color: #666; font-size: 12px; margin: 0;">
        This is an automated notification from the Waiting to Fly order system.
      </p>
      <p style="color: #999; font-size: 11px; margin: 10px 0 0 0;">
        Order received at ${new Date().toLocaleString()}
      </p>
    </div>
  </div>
</body>
</html>
    `.trim();

    const text = `
🔔 NEW ORDER RECEIVED - Waiting to Fly

A new order has been placed and payment has been confirmed.

CUSTOMER INFORMATION
Name: ${data.customerName}
Email: ${data.to}
Order ID: ${data.orderId}
${data.checkoutSessionId ? `Checkout Session ID: ${data.checkoutSessionId}\n` : ''}

ORDER DETAILS
Book: ${data.bookTitle}
Format: ${data.bookFormat}
${data.quantity > 1 ? `Quantity: ${data.quantity}\n` : ''}

SHIPPING ADDRESS
${shippingAddressText}

ORDER SUMMARY
Subtotal: ${formatCurrency(data.subtotal)}
${data.taxAmount > 0 ? `Tax: ${formatCurrency(data.taxAmount)}\n` : ''}${data.shippingAmount > 0 ? `Shipping: ${formatCurrency(data.shippingAmount)}\n` : ''}Total: ${formatCurrency(data.totalAmount)}

---
Order received at ${new Date().toLocaleString()}
This is an automated notification from the Waiting to Fly order system.
    `.trim();

    const result = await resend.emails.send({
      from: `${fromName} <${fromEmail}>`,
      to: adminEmail,
      subject: `🔔 New Order: ${data.bookTitle} - ${formatCurrency(data.totalAmount)}`,
      html,
      text,
    });

    console.log('✅ Admin order notification email sent:', {
      adminEmail,
      orderId: data.orderId,
      resendId: result.data?.id,
    });

    return { success: true, data: result.data };
  } catch (error) {
    console.error('❌ Failed to send admin order notification email:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}



