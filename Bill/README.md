# Invoice Generator - Pratech (CSC)

A professional invoice generator application with WhatsApp and Email integration.

## Features

- Create professional invoices with customer details
- Add multiple services with descriptions and amounts
- Custom message for customers
- Payment mode and status tracking
- Generate PDF invoices
- Send invoices via WhatsApp
- Send invoices via Email
- Responsive design for all devices

## Setup Instructions

### EmailJS Setup

1. Sign up for a free account at [EmailJS](https://www.emailjs.com/)
2. Create an email service (Gmail, Outlook, etc.)
3. Create an email template
4. Get your:
   - Public Key
   - Service ID
   - Template ID

5. Replace the placeholder values in `script.js`:
   - `YOUR_PUBLIC_KEY` with your EmailJS public key
   - `YOUR_SERVICE_ID` with your EmailJS service ID
   - `YOUR_TEMPLATE_ID` with your EmailJS template ID

### WhatsApp Integration

The WhatsApp integration opens a chat window with the customer's number and pre-filled message. For sending PDF files via WhatsApp, you would need to use the WhatsApp Business API.

## Usage

1. Fill in customer details
2. Add services with descriptions and amounts
3. Add a custom message (optional)
4. Select payment mode and status
5. Generate PDF to preview the invoice
6. Download PDF or send via WhatsApp/Email

## File Structure

- `index.html` - Main HTML file
- `style.css` - Styling for the application
- `script.js` - JavaScript functionality
- `README.md` - This file

## Technologies Used

- HTML5
- CSS3
- JavaScript
- jsPDF for PDF generation
- html2canvas for capturing HTML as image
- EmailJS for email functionality
- Font Awesome for icons
- Google Fonts (Poppins)

## Browser Compatibility

Works on all modern browsers including:
- Chrome
- Firefox
- Safari
- Edge