// EmailJS Configuration
// REPLACE THESE WITH YOUR ACTUAL EmailJS CREDENTIALS
emailjs.init("user_cscPratik"); // Replace with your actual EmailJS user ID

// DOM Elements
const customerNameInput = document.getElementById('customer-name');
const customerMobileInput = document.getElementById('customer-mobile');
const customerEmailInput = document.getElementById('customer-email');
const customMessageInput = document.getElementById('custom-message');
const paymentModeSelect = document.getElementById('payment-mode');
const paymentConfirmationSelect = document.getElementById('payment-confirmation');
const addServiceButton = document.getElementById('add-service');
const servicesContainer = document.getElementById('services-container');
const serviceChargesDisplay = document.getElementById('service-charges');
const retailerChargesDisplay = document.getElementById('retailer-charges');
const totalAmountDisplay = document.getElementById('total-amount');
const invoiceIdDisplay = document.getElementById('invoice-id');
const paymentStatusDisplay = document.getElementById('payment-status-display');
const generatePdfButton = document.getElementById('generate-pdf');
const sendWhatsappButton = document.getElementById('send-whatsapp');
const sendEmailButton = document.getElementById('send-email');
const invoicePreview = document.getElementById('invoice-preview');
const closePreviewButton = document.getElementById('close-preview');
const previewContent = document.getElementById('preview-content');
const notification = document.getElementById('notification');
const notificationText = document.getElementById('notification-text');

// Constants
const RETAILER_CHARGES_PERCENTAGE = 0.1; // 10% retailer charges
const MONTH_TOKENS = {
    1: 'JA', 2: 'FE', 3: 'MR', 4: 'AP', 5: 'MY', 6: 'JN',
    7: 'JL', 8: 'AU', 9: 'SE', 10: 'OC', 11: 'NO', 12: 'DE'
};

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    // Generate initial invoice ID
    generateInvoiceId();
    
    // Add event listeners
    addServiceButton.addEventListener('click', addService);
    paymentConfirmationSelect.addEventListener('change', updatePaymentStatus);
    generatePdfButton.addEventListener('click', generatePdf);
    sendWhatsappButton.addEventListener('click', sendViaWhatsApp);
    sendEmailButton.addEventListener('click', sendViaEmail);
    closePreviewButton.addEventListener('click', closePreview);
    
    // Add event delegation for dynamically added remove buttons
    servicesContainer.addEventListener('click', function(e) {
        if (e.target.classList.contains('remove-service')) {
            const serviceRow = e.target.closest('tr');
            removeService(serviceRow);
        }
    });
    
    // Add input event listeners for service amounts to recalculate total
    servicesContainer.addEventListener('input', function(e) {
        if (e.target.classList.contains('service-amount') || e.target.classList.contains('service-name')) {
            calculateTotal();
        }
    });
    
    // Initialize with one service
    addService();
    
    // Calculate initial total
    calculateTotal();
});

// Generate invoice ID in format: MHAHSH-YYMMT-HHMMSS
function generateInvoiceId() {
    const now = new Date();
    const year = now.getFullYear().toString().slice(-2); // YY
    const month = now.getMonth() + 1; // 1-12
    const monthToken = MONTH_TOKENS[month]; // MMT
    const hours = now.getHours().toString().padStart(2, '0'); // HH
    const minutes = now.getMinutes().toString().padStart(2, '0'); // MM
    const seconds = now.getSeconds().toString().padStart(2, '0'); // SS
    
    const invoiceId = `MHAHSH-${year}${monthToken}${hours}${minutes}${seconds}`;
    invoiceIdDisplay.textContent = invoiceId;
    return invoiceId;
}

// Add a new service row
function addService() {
    const serviceRow = document.createElement('tr');
    serviceRow.className = 'service-row';
    serviceRow.innerHTML = `
        <td>
            <input type="text" class="service-name" placeholder="Service description" required>
        </td>
        <td>
            <input type="number" class="service-amount" placeholder="0.00" min="0" step="0.01" required>
        </td>
        <td>
            <button type="button" class="remove-service btn btn-danger">
                <i class="fas fa-trash"></i> Remove
            </button>
        </td>
    `;
    servicesContainer.appendChild(serviceRow);
    
    // Focus on the new service name input
    serviceRow.querySelector('.service-name').focus();
}

// Remove a service row
function removeService(serviceRow) {
    // Don't remove if it's the only service
    if (servicesContainer.children.length > 1) {
        serviceRow.remove();
        calculateTotal();
        showNotification('Service removed successfully');
    } else {
        showNotification('You need at least one service item.', true);
    }
}

// Calculate total amount
function calculateTotal() {
    let serviceTotal = 0;
    
    // Get all service amount inputs
    const serviceAmountInputs = document.querySelectorAll('.service-amount');
    
    // Sum up all service amounts
    serviceAmountInputs.forEach(input => {
        const amount = parseFloat(input.value) || 0;
        serviceTotal += amount;
    });
    
    // Calculate retailer charges (10% of service total)
    const retailerCharges = serviceTotal * RETAILER_CHARGES_PERCENTAGE;
    
    // Calculate total amount (service total + retailer charges)
    const totalAmount = serviceTotal + retailerCharges;
    
    // Update displays with rupee symbol
    serviceChargesDisplay.textContent = `₹${serviceTotal.toFixed(2)}`;
    retailerChargesDisplay.textContent = `₹${retailerCharges.toFixed(2)}`;
    totalAmountDisplay.textContent = `₹${totalAmount.toFixed(2)}`;
}

// Update payment status display
function updatePaymentStatus() {
    const status = paymentConfirmationSelect.value;
    const paymentMode = paymentModeSelect.value;
    
    if (status === 'confirmed' && paymentMode) {
        paymentStatusDisplay.classList.remove('hidden');
        showNotification('Payment status updated to confirmed');
    } else {
        paymentStatusDisplay.classList.add('hidden');
    }
}

// Show notification
function showNotification(message, isError = false) {
    notificationText.textContent = message;
    
    if (isError) {
        notification.classList.add('error');
        notification.querySelector('i').className = 'fas fa-exclamation-circle';
    } else {
        notification.classList.remove('error');
        notification.querySelector('i').className = 'fas fa-check-circle';
    }
    
    notification.classList.add('show');
    
    setTimeout(() => {
        notification.classList.remove('show');
    }, 3000);
}

// Generate PDF invoice
function generatePdf() {
    // Validate form
    if (!validateForm()) return;
    
    // Create invoice preview
    createInvoicePreview();
    
    // Show preview
    invoicePreview.style.display = 'flex';
    
    // Use html2canvas and jsPDF to generate PDF
    html2canvas(previewContent, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff'
    }).then(canvas => {
        const imgData = canvas.toDataURL('image/png');
        const pdf = new jspdf.jsPDF('p', 'mm', 'a4');
        const imgWidth = 210; // A4 width in mm
        const pageHeight = 295; // A4 height in mm
        const imgHeight = canvas.height * imgWidth / canvas.width;
        let heightLeft = imgHeight;
        let position = 0;
        
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
        
        // Add additional pages if needed
        while (heightLeft >= 0) {
            position = heightLeft - imgHeight;
            pdf.addPage();
            pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
            heightLeft -= pageHeight;
        }
        
        // Save the PDF
        const fileName = `invoice_${customerNameInput.value.replace(/\s+/g, '_')}_${generateInvoiceId()}.pdf`;
        pdf.save(fileName);
        showNotification('PDF generated successfully!');
    });
}

// Create invoice preview for PDF generation
function createInvoicePreview() {
    const serviceRows = document.querySelectorAll('.service-row');
    let servicesHtml = '';
    
    // Generate services HTML
    serviceRows.forEach((row, index) => {
        const serviceName = row.querySelector('.service-name').value || 'Service';
        const serviceAmount = parseFloat(row.querySelector('.service-amount').value) || 0;
        
        servicesHtml += `
            <tr>
                <td>${index + 1}</td>
                <td>${serviceName}</td>
                <td>₹${serviceAmount.toFixed(2)}</td>
            </tr>
        `;
    });
    
    // Calculate totals
    const serviceTotal = calculateServiceTotal();
    const retailerCharges = serviceTotal * RETAILER_CHARGES_PERCENTAGE;
    const totalAmount = serviceTotal + retailerCharges;
    
    // Get payment status
    const isPaid = paymentConfirmationSelect.value === 'confirmed' && paymentModeSelect.value;
    
    // Generate preview HTML
    const previewHtml = `
        <div class="invoice-preview-content">
            <div class="invoice-header">
                <h1>Pratech (csc)</h1>
                <p><strong>Owner:</strong> Pratik | <strong>Contact:</strong> +91 9876543210</p>
                <p><strong>Location:</strong> Shrirampur, Ahilyanagar, Maharashtra</p>
                <h2>INVOICE</h2>
            </div>
            
            <div class="invoice-details">
                <div class="customer-info">
                    <h3>Customer Details</h3>
                    <p><strong>Name:</strong> ${customerNameInput.value}</p>
                    <p><strong>Mobile:</strong> ${customerMobileInput.value}</p>
                    <p><strong>Email:</strong> ${customerEmailInput.value}</p>
                </div>
                
                <div class="invoice-info">
                    <h3>Invoice Details</h3>
                    <p><strong>Date:</strong> ${new Date().toLocaleDateString()}</p>
                    <p><strong>Invoice ID:</strong> ${generateInvoiceId()}</p>
                    <p><strong>Payment Mode:</strong> ${paymentModeSelect.value}</p>
                </div>
            </div>
            
            <table class="services-table-preview">
                <thead>
                    <tr>
                        <th>#</th>
                        <th>Service Description</th>
                        <th>Amount (₹)</th>
                    </tr>
                </thead>
                <tbody>
                    ${servicesHtml}
                </tbody>
            </table>
            
            <div class="invoice-summary">
                <div class="summary-row-preview">
                    <span>Service Charges:</span>
                    <span>₹${serviceTotal.toFixed(2)}</span>
                </div>
                <div class="summary-row-preview">
                    <span>Retailer Charges (10%):</span>
                    <span>₹${retailerCharges.toFixed(2)}</span>
                </div>
                <div class="summary-row-preview total">
                    <span>Total (incl. service + retailer charges):</span>
                    <span>₹${totalAmount.toFixed(2)}</span>
                </div>
            </div>
            
            <div class="payment-details">
                <div class="payment-status-preview">
                    <span>Payment Status:</span>
                    <span class="status-completed">
                        ${isPaid ? '✔ Paid' : 'Pending'}
                    </span>
                </div>
                <div class="payment-status-preview">
                    <span>Received Status:</span>
                    <span class="status-completed">
                        ${isPaid ? '✔ Received' : 'Not Received'}
                    </span>
                </div>
            </div>
            
            ${customMessageInput.value ? `
            <div class="custom-message-preview">
                <p><strong>Note:</strong> ${customMessageInput.value}</p>
            </div>
            ` : ''}
        </div>
    `;
    
    previewContent.innerHTML = previewHtml;
}

// Calculate service total
function calculateServiceTotal() {
    let serviceTotal = 0;
    const serviceAmountInputs = document.querySelectorAll('.service-amount');
    
    serviceAmountInputs.forEach(input => {
        const amount = parseFloat(input.value) || 0;
        serviceTotal += amount;
    });
    
    return serviceTotal;
}

// Send invoice via WhatsApp
function sendViaWhatsApp() {
    // Validate form
    if (!validateForm()) return;
    
    // Check if mobile number is provided
    if (!customerMobileInput.value || customerMobileInput.value === '+91') {
        showNotification('Please enter customer mobile number with country code to send via WhatsApp.', true);
        return;
    }
    
    // Create message text
    const serviceTotal = calculateServiceTotal();
    const retailerCharges = serviceTotal * RETAILER_CHARGES_PERCENTAGE;
    const totalAmount = serviceTotal + retailerCharges;
    
    let message = `Hello ${customerNameInput.value}, your invoice from Pratech (csc) is ready!\n\n`;
    message += `Invoice ID: ${generateInvoiceId()}\n`;
    message += `Total Amount: ₹${totalAmount.toFixed(2)} (Includes 10% retailer charges)\n`;
    message += `Payment Status: ${paymentConfirmationSelect.value === 'confirmed' ? 'Confirmed' : 'Pending'}\n\n`;
    
    if (customMessageInput.value) {
        message += `Note: ${customMessageInput.value}\n\n`;
    }
    
    message += 'Thank you for your business!';
    
    // Encode message for URL
    const encodedMessage = encodeURIComponent(message);
    
    // Create WhatsApp URL
    // REPLACE THE WHATSAPP LINK TEMPLATE IF NEEDED
    const phoneNumber = customerMobileInput.value.replace(/\s+/g, '');
    const whatsappUrl = `https://api.whatsapp.com/send?phone=${phoneNumber}&text=${encodedMessage}`;
    
    // Open WhatsApp in new tab
    window.open(whatsappUrl, '_blank');
    showNotification('WhatsApp message prepared!');
}

// Send invoice via Email
function sendViaEmail() {
    // Validate form
    if (!validateForm()) return;
    
    // Check if email is provided
    if (!customerEmailInput.value) {
        showNotification('Please enter customer email address to send via email.', true);
        return;
    }
    
    // Create invoice preview for email
    createInvoicePreview();
    
    // Use html2canvas to create image of invoice
    html2canvas(previewContent, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff'
    }).then(canvas => {
        const imgData = canvas.toDataURL('image/png');
        
        // Prepare email parameters
        const serviceTotal = calculateServiceTotal();
        const retailerCharges = serviceTotal * RETAILER_CHARGES_PERCENTAGE;
        const totalAmount = serviceTotal + retailerCharges;
        
        const templateParams = {
            to_name: customerNameInput.value,
            to_email: customerEmailInput.value,
            from_name: 'Pratech (csc)',
            message: `Your invoice from Pratech (csc) is attached. Total Amount: ₹${totalAmount.toFixed(2)} (Includes 10% retailer charges). ${customMessageInput.value ? `Note: ${customMessageInput.value}` : ''}`,
            invoice_image: imgData,
            invoice_id: generateInvoiceId()
        };
        
        // Send email using EmailJS
        // REPLACE THESE WITH YOUR ACTUAL EmailJS SERVICE AND TEMPLATE IDs
        emailjs.send('service_csc', 'template_csc', templateParams)
            .then(function(response) {
                showNotification('Invoice sent successfully via email!');
            }, function(error) {
                console.error('Email sending failed:', error);
                showNotification('Failed to send email. Please try again.', true);
            });
    });
}

// Close invoice preview
function closePreview() {
    invoicePreview.style.display = 'none';
}

// Validate form before generating invoice
function validateForm() {
    if (!customerNameInput.value) {
        showNotification('Please enter customer name.', true);
        customerNameInput.focus();
        return false;
    }
    
    if (!customerMobileInput.value || customerMobileInput.value === '+91') {
        showNotification('Please enter customer mobile number with country code.', true);
        customerMobileInput.focus();
        return false;
    }
    
    // Check if at least one service has a description and amount
    let validService = false;
    const serviceRows = document.querySelectorAll('.service-row');
    
    for (let row of serviceRows) {
        const serviceName = row.querySelector('.service-name').value;
        const serviceAmount = row.querySelector('.service-amount').value;
        
        if (serviceName && serviceAmount) {
            validService = true;
            break;
        }
    }
    
    if (!validService) {
        showNotification('Please add at least one service with description and amount.', true);
        return false;
    }
    
    if (!paymentModeSelect.value) {
        showNotification('Please select payment mode.', true);
        paymentModeSelect.focus();
        return false;
    }
    
    return true;
}