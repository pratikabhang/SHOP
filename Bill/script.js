// EmailJS Configuration
emailjs.init("user_cscPratik");

// DOM Elements
const customerNameInput = document.getElementById('customer-name');
const customerMobileInput = document.getElementById('customer-mobile');
const customerEmailInput = document.getElementById('customer-email');
const customMessageInput = document.getElementById('custom-message');
const addServiceButton = document.getElementById('add-service');
const servicesContainer = document.getElementById('services-container');
const serviceChargesDisplay = document.getElementById('service-charges');
const retailerChargesDisplay = document.getElementById('retailer-charges');
const totalAmountDisplay = document.getElementById('total-amount');
const paidStatusDisplay = document.getElementById('paid-status');
const generatePdfButton = document.getElementById('generate-pdf');
const resetFormButton = document.getElementById('reset-form');
const invoicePreview = document.getElementById('invoice-preview');
const closePreviewButton = document.getElementById('close-preview');
const previewContent = document.getElementById('preview-content');
const downloadPdfButton = document.getElementById('download-pdf');
const sendWhatsappButton = document.getElementById('send-whatsapp');
const sendEmailButton = document.getElementById('send-email');
const sendAllButton = document.getElementById('send-all');
const shareWhatsappImageButton = document.getElementById('share-whatsapp-image');
const remainingAmountSection = document.getElementById('remaining-amount-section');
const remainingAmountInput = document.getElementById('remaining-amount');
const loadingOverlay = document.getElementById('loading-overlay');
const successNotification = document.getElementById('success-notification');
const errorNotification = document.getElementById('error-notification');

// Constants
const RETAILER_CHARGES_PERCENTAGE = 0.1; // 10% retailer charges

// Global variables
let isFormDirty = false;
let currentPdfBlob = null;
let currentInvoiceId = '';
let currentPdfUrl = '';
let currentImageUrl = '';

// Initialize application
document.addEventListener('DOMContentLoaded', function() {
    console.log('Invoice Generator Initialized');
    
    initializeEventListeners();
    addService(); // Start with one service
    calculateTotal();
    updatePaymentStatus();
});

function initializeEventListeners() {
    // Form event listeners
    addServiceButton.addEventListener('click', addService);
    generatePdfButton.addEventListener('click', generateInvoice);
    resetFormButton.addEventListener('click', resetForm);
    
    // Preview event listeners
    closePreviewButton.addEventListener('click', closePreview);
    downloadPdfButton.addEventListener('click', downloadPdf);
    sendWhatsappButton.addEventListener('click', sendViaWhatsApp);
    sendEmailButton.addEventListener('click', sendViaEmail);
    sendAllButton.addEventListener('click', sendAll);
    shareWhatsappImageButton.addEventListener('click', shareImageViaWhatsApp);
    
    // Payment status radio buttons
    document.querySelectorAll('input[name="payment-status"]').forEach(radio => {
        radio.addEventListener('change', updatePaymentStatus);
    });
    
    // Dynamic service management
    servicesContainer.addEventListener('click', function(e) {
        if (e.target.classList.contains('remove-service') || e.target.closest('.remove-service')) {
            const serviceItem = e.target.closest('.service-item');
            removeService(serviceItem);
        }
    });
    
    servicesContainer.addEventListener('input', function(e) {
        if (e.target.classList.contains('service-amount') || e.target.classList.contains('service-name')) {
            calculateTotal();
            markFormAsDirty();
        }
    });
    
    // Form dirty state tracking
    const formInputs = document.querySelectorAll('input, textarea');
    formInputs.forEach(input => {
        input.addEventListener('input', markFormAsDirty);
    });
    
    // Notification close buttons
    document.querySelectorAll('.close-notification').forEach(button => {
        button.addEventListener('click', function() {
            this.closest('.notification').classList.remove('show');
        });
    });
    
    // Prevent loss of data
    window.addEventListener('beforeunload', function(e) {
        if (isFormDirty) {
            e.preventDefault();
            e.returnValue = 'You have unsaved changes. Are you sure you want to leave?';
        }
    });
}

function showNotification(notification, message) {
    const messageElement = notification.querySelector('span');
    messageElement.textContent = message;
    notification.classList.add('show');
    
    setTimeout(() => {
        notification.classList.remove('show');
    }, 5000);
}

function markFormAsDirty() {
    isFormDirty = true;
}

function resetFormDirtyState() {
    isFormDirty = false;
}

function addService() {
    const serviceItem = document.createElement('div');
    serviceItem.className = 'service-item';
    serviceItem.innerHTML = `
        <div class="service-details">
            <input type="text" class="service-name" placeholder="Service description" required>
            <input type="number" class="service-amount" placeholder="Amount" min="0" step="0.01" required>
        </div>
        <button type="button" class="remove-service btn btn-danger"><i class="fas fa-trash"></i></button>
    `;
    servicesContainer.appendChild(serviceItem);
    serviceItem.querySelector('.service-name').focus();
    markFormAsDirty();
}

function removeService(serviceItem) {
    if (servicesContainer.children.length > 1) {
        serviceItem.remove();
        calculateTotal();
        markFormAsDirty();
    } else {
        showNotification(errorNotification, 'You need at least one service item.');
    }
}

function calculateTotal() {
    let serviceTotal = 0;
    const serviceAmountInputs = document.querySelectorAll('.service-amount');
    
    serviceAmountInputs.forEach(input => {
        const amount = parseFloat(input.value) || 0;
        serviceTotal += amount;
    });
    
    const retailerCharges = serviceTotal * RETAILER_CHARGES_PERCENTAGE;
    const totalAmount = serviceTotal + retailerCharges;
    
    serviceChargesDisplay.textContent = `₹${serviceTotal.toFixed(2)}`;
    retailerChargesDisplay.textContent = `₹${retailerCharges.toFixed(2)}`;
    totalAmountDisplay.textContent = `₹${totalAmount.toFixed(2)}`;
    
    // Update remaining amount if half-paid
    updateRemainingAmount(totalAmount);
}

function updatePaymentStatus() {
    const paymentStatus = document.querySelector('input[name="payment-status"]:checked').value;
    
    // Show/hide remaining amount section
    if (paymentStatus === 'half-paid') {
        remainingAmountSection.style.display = 'block';
        const totalAmount = parseFloat(totalAmountDisplay.textContent.replace('₹', '')) || 0;
        remainingAmountInput.value = (totalAmount / 2).toFixed(2);
    } else {
        remainingAmountSection.style.display = 'none';
        remainingAmountInput.value = '';
    }
    
    // Update status display
    switch(paymentStatus) {
        case 'pending':
            paidStatusDisplay.textContent = 'Payment Pending';
            paidStatusDisplay.className = 'status-pending';
            break;
        case 'half-paid':
            paidStatusDisplay.textContent = 'Half Paid';
            paidStatusDisplay.className = 'status-half-paid';
            break;
        case 'paid':
            paidStatusDisplay.textContent = 'Paid';
            paidStatusDisplay.className = 'status-paid';
            break;
    }
    
    markFormAsDirty();
}

function updateRemainingAmount(totalAmount) {
    const paymentStatus = document.querySelector('input[name="payment-status"]:checked').value;
    if (paymentStatus === 'half-paid') {
        remainingAmountInput.value = (totalAmount / 2).toFixed(2);
    }
}

function generateInvoiceId() {
    const now = new Date();
    const year = now.getFullYear().toString().slice(-2);
    const month = (now.getMonth() + 1).toString().padStart(2, '0');
    const day = now.getDate().toString().padStart(2, '0');
    const hours = now.getHours().toString().padStart(2, '0');
    const minutes = now.getMinutes().toString().padStart(2, '0');
    const seconds = now.getSeconds().toString().padStart(2, '0');
    
    return `INV-${year}${month}${day}-${hours}${minutes}${seconds}`;
}

function generateInvoice() {
    if (!validateForm()) {
        return;
    }
    
    currentInvoiceId = generateInvoiceId();
    
    // Create preview first
    createInvoicePreview();
    
    setLoadingState(true);
    
    // Generate PDF and Image
    Promise.all([generatePdfBlob(), generateImageBlob()])
        .then(([pdfBlob, imageBlob]) => {
            currentPdfBlob = pdfBlob;
            currentPdfUrl = URL.createObjectURL(pdfBlob);
            currentImageUrl = URL.createObjectURL(imageBlob);
            
            invoicePreview.style.display = 'flex';
            setLoadingState(false);
            showNotification(successNotification, 'Invoice generated successfully!');
        })
        .catch(error => {
            console.error('Error generating invoice:', error);
            setLoadingState(false);
            showNotification(errorNotification, 'Error generating invoice. Please try again.');
        });
}

function createInvoicePreview() {
    const serviceItems = document.querySelectorAll('.service-item');
    let servicesHtml = '';
    
    serviceItems.forEach((item, index) => {
        const serviceName = item.querySelector('.service-name').value || 'Service';
        const serviceAmount = parseFloat(item.querySelector('.service-amount').value) || 0;
        
        servicesHtml += `
            <tr>
                <td>${index + 1}</td>
                <td>${serviceName}</td>
                <td>₹${serviceAmount.toFixed(2)}</td>
            </tr>
        `;
    });
    
    const serviceTotal = calculateServiceTotal();
    const retailerCharges = serviceTotal * RETAILER_CHARGES_PERCENTAGE;
    const totalAmount = serviceTotal + retailerCharges;
    
    const paymentMode = document.querySelector('input[name="payment-mode"]:checked').value;
    const paymentStatus = document.querySelector('input[name="payment-status"]:checked').value;
    const remainingAmount = remainingAmountInput.value || '0.00';
    
    const previewHtml = `
        <div class="invoice-preview-content" id="pdf-content">
            <div class="invoice-header">
                <h1>Pratech (CSC)</h1>
                <p><i class="fas fa-user"></i> Pratik A. Bhang | <i class="fas fa-map-marker-alt"></i> Shrirampur</p>
                <p><i class="fas fa-phone"></i> 9874561230 | <i class="fas fa-envelope"></i> csc.pratikabhang@gmail.com</p>
                <h2>INVOICE</h2>
            </div>
            
            <div class="invoice-details">
                <div class="customer-info">
                    <h3>Customer Details</h3>
                    <p><strong>Name:</strong> ${customerNameInput.value}</p>
                    <p><strong>Mobile:</strong> +91 ${customerMobileInput.value}</p>
                    <p><strong>Email:</strong> ${customerEmailInput.value || 'Not provided'}</p>
                </div>
                
                <div class="invoice-info">
                    <h3>Invoice Details</h3>
                    <p><strong>Date:</strong> ${new Date().toLocaleDateString('en-IN')}</p>
                    <p><strong>Invoice ID:</strong> ${currentInvoiceId}</p>
                    <p><strong>Payment Mode:</strong> ${paymentMode}</p>
                </div>
            </div>
            
            <table class="services-table">
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
                    <span>Total Amount:</span>
                    <span>₹${totalAmount.toFixed(2)}</span>
                </div>
            </div>
            
            <div class="payment-details">
                <div class="payment-status-preview">
                    <span>Payment Status:</span>
                    <span class="status-${paymentStatus}">
                        ${paymentStatus === 'pending' ? 'Pending' : paymentStatus === 'half-paid' ? 'Half Paid' : 'Paid'}
                    </span>
                </div>
                ${paymentStatus === 'half-paid' ? `
                <div class="payment-status-preview">
                    <span>Remaining Amount:</span>
                    <span>₹${remainingAmount}</span>
                </div>
                ` : ''}
            </div>
            
            ${customMessageInput.value ? `
            <div class="custom-message-preview">
                <p><strong>Note:</strong> ${customMessageInput.value}</p>
            </div>
            ` : ''}
            
            <div class="footer-note">
                <p>Thank you for your business! We look forward to serving you again.</p>
            </div>
        </div>
    `;
    
    previewContent.innerHTML = previewHtml;
}

function calculateServiceTotal() {
    let serviceTotal = 0;
    const serviceAmountInputs = document.querySelectorAll('.service-amount');
    
    serviceAmountInputs.forEach(input => {
        const amount = parseFloat(input.value) || 0;
        serviceTotal += amount;
    });
    
    return serviceTotal;
}

function generatePdfBlob() {
    return new Promise((resolve, reject) => {
        const element = document.getElementById('pdf-content');
        if (!element) {
            reject(new Error('PDF content not found'));
            return;
        }

        // Wait for DOM to render completely
        setTimeout(() => {
            try {
                const options = {
                    scale: 2,
                    useCORS: true,
                    logging: true,
                    backgroundColor: '#ffffff',
                    width: element.scrollWidth,
                    height: element.scrollHeight
                };

                console.log('Starting html2canvas capture...');
                
                html2canvas(element, options)
                    .then(canvas => {
                        console.log('html2canvas capture successful');
                        
                        try {
                            const imgData = canvas.toDataURL('image/jpeg', 0.9);
                            
                            // Check if jsPDF is available
                            if (typeof jspdf === 'undefined') {
                                reject(new Error('jsPDF library not loaded'));
                                return;
                            }
                            
                            console.log('Creating PDF with jsPDF...');
                            
                            // Create PDF using jsPDF - SIMPLIFIED VERSION
                            const pdf = new jspdf.jsPDF({
                                orientation: 'portrait',
                                unit: 'mm',
                                format: 'a4'
                            });

                            const imgWidth = 210; // A4 width in mm
                            const pageHeight = 297; // A4 height in mm
                            const imgHeight = (canvas.height * imgWidth) / canvas.width;
                            
                            // Calculate position to center the image
                            const position = 0;
                            
                            // Add image to PDF - SIMPLIFIED without scaling issues
                            pdf.addImage({
                                imageData: imgData,
                                format: 'JPEG',
                                x: 0,
                                y: position,
                                width: imgWidth,
                                height: imgHeight
                            });

                            const pdfBlob = pdf.output('blob');
                            console.log('PDF blob created successfully');
                            resolve(pdfBlob);
                        } catch (pdfError) {
                            console.error('Error in PDF creation:', pdfError);
                            // Try fallback method
                            generatePdfFallback().then(resolve).catch(reject);
                        }
                    })
                    .catch(canvasError => {
                        console.error('Error in html2canvas:', canvasError);
                        reject(canvasError);
                    });
            } catch (error) {
                console.error('Error in PDF generation setup:', error);
                reject(error);
            }
        }, 1000); // Wait 1 second for DOM to render completely
    });
}

function generateImageBlob() {
    return new Promise((resolve, reject) => {
        const element = document.getElementById('pdf-content');
        if (!element) {
            reject(new Error('Invoice content not found'));
            return;
        }

        setTimeout(() => {
            const options = {
                scale: 2,
                useCORS: true,
                logging: false,
                backgroundColor: '#ffffff'
            };

            html2canvas(element, options)
                .then(canvas => {
                    canvas.toBlob(blob => {
                        if (blob) {
                            resolve(blob);
                        } else {
                            reject(new Error('Failed to create image blob'));
                        }
                    }, 'image/jpeg', 0.9);
                })
                .catch(reject);
        }, 500);
    });
}

function downloadPdf() {
    if (!currentPdfBlob) {
        showNotification(errorNotification, 'Please generate the invoice first.');
        return;
    }
    
    try {
        const url = URL.createObjectURL(currentPdfBlob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `invoice_${currentInvoiceId}.pdf`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        showNotification(successNotification, 'PDF downloaded successfully!');
    } catch (error) {
        console.error('Error downloading PDF:', error);
        showNotification(errorNotification, 'Error downloading PDF.');
    }
}

function sendViaWhatsApp() {
    if (!validateForm()) return;
    
    if (!customerMobileInput.value) {
        showNotification(errorNotification, 'Please enter customer mobile number.');
        return;
    }
    
    const serviceTotal = calculateServiceTotal();
    const retailerCharges = serviceTotal * RETAILER_CHARGES_PERCENTAGE;
    const totalAmount = serviceTotal + retailerCharges;
    const paymentStatus = document.querySelector('input[name="payment-status"]:checked').value;
    const remainingAmount = remainingAmountInput.value || '0.00';
    
    let message = `Hello ${customerNameInput.value}, your invoice from Pratech (CSC) is ready!\n\n`;
    message += `*Invoice Details:*\n`;
    message += `Invoice ID: ${currentInvoiceId}\n`;
    message += `Date: ${new Date().toLocaleDateString('en-IN')}\n`;
    message += `Service Charges: ₹${serviceTotal.toFixed(2)}\n`;
    message += `Retailer Charges (10%): ₹${retailerCharges.toFixed(2)}\n`;
    message += `Total Amount: ₹${totalAmount.toFixed(2)}\n`;
    message += `Payment Status: ${paymentStatus === 'pending' ? 'Pending' : paymentStatus === 'half-paid' ? 'Half Paid' : 'Paid'}\n`;
    
    if (paymentStatus === 'half-paid') {
        message += `Remaining Amount: ₹${remainingAmount}\n`;
    }
    
    message += `Payment Mode: ${document.querySelector('input[name="payment-mode"]:checked').value}\n\n`;
    
    if (customMessageInput.value) {
        message += `Note: ${customMessageInput.value}\n\n`;
    }
    
    message += 'Thank you for your business!';
    
    const encodedMessage = encodeURIComponent(message);
    const whatsappUrl = `https://wa.me/91${customerMobileInput.value}?text=${encodedMessage}`;
    
    window.open(whatsappUrl, '_blank');
    showNotification(successNotification, 'WhatsApp opened! Send the message.');
}

function shareImageViaWhatsApp() {
    if (!validateForm()) return;
    
    if (!customerMobileInput.value) {
        showNotification(errorNotification, 'Please enter customer mobile number.');
        return;
    }
    
    if (!currentImageUrl) {
        showNotification(errorNotification, 'Please generate invoice first.');
        return;
    }
    
    const serviceTotal = calculateServiceTotal();
    const totalAmount = serviceTotal + (serviceTotal * RETAILER_CHARGES_PERCENTAGE);
    const paymentStatus = document.querySelector('input[name="payment-status"]:checked').value;
    
    let message = `Hello ${customerNameInput.value}, your invoice from Pratech (CSC) is ready!\n\n`;
    message += `*Invoice Summary:*\n`;
    message += `Invoice ID: ${currentInvoiceId}\n`;
    message += `Total Amount: ₹${totalAmount.toFixed(2)}\n`;
    message += `Payment Status: ${paymentStatus === 'pending' ? 'Pending' : paymentStatus === 'half-paid' ? 'Half Paid' : 'Paid'}\n\n`;
    message += 'Please check the attached invoice image for details.';
    
    const encodedMessage = encodeURIComponent(message);
    
    showNotification(successNotification, 'WhatsApp will open. Please attach the downloaded image manually.');
    
    // Download the image first
    const url = currentImageUrl;
    const a = document.createElement('a');
    a.href = url;
    a.download = `invoice_${currentInvoiceId}.jpg`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    
    // Then open WhatsApp
    setTimeout(() => {
        const whatsappUrl = `https://wa.me/91${customerMobileInput.value}?text=${encodedMessage}`;
        window.open(whatsappUrl, '_blank');
    }, 1000);
}

function sendViaEmail() {
    if (!validateForm()) return;
    
    if (!customerEmailInput.value) {
        showNotification(errorNotification, 'Please enter customer email address.');
        return;
    }
    
    const serviceTotal = calculateServiceTotal();
    const retailerCharges = serviceTotal * RETAILER_CHARGES_PERCENTAGE;
    const totalAmount = serviceTotal + retailerCharges;
    const paymentStatus = document.querySelector('input[name="payment-status"]:checked').value;
    const paymentMode = document.querySelector('input[name="payment-mode"]:checked').value;
    const remainingAmount = remainingAmountInput.value || '0.00';
    
    let subject = `Invoice from Pratech (CSC) - ${currentInvoiceId}`;
    let body = `Dear ${customerNameInput.value},\n\n`;
    body += `Your invoice from Pratech (CSC) is ready.\n\n`;
    body += `Invoice Details:\n`;
    body += `- Invoice ID: ${currentInvoiceId}\n`;
    body += `- Date: ${new Date().toLocaleDateString('en-IN')}\n`;
    body += `- Service Charges: ₹${serviceTotal.toFixed(2)}\n`;
    body += `- Retailer Charges (10%): ₹${retailerCharges.toFixed(2)}\n`;
    body += `- Total Amount: ₹${totalAmount.toFixed(2)}\n`;
    body += `- Payment Status: ${paymentStatus === 'pending' ? 'Pending' : paymentStatus === 'half-paid' ? 'Half Paid' : 'Paid'}\n`;
    
    if (paymentStatus === 'half-paid') {
        body += `- Remaining Amount: ₹${remainingAmount}\n`;
    }
    
    body += `- Payment Mode: ${paymentMode}\n\n`;
    
    if (customMessageInput.value) {
        body += `Note: ${customMessageInput.value}\n\n`;
    }
    
    body += `Thank you for visiting. We look forward to serving you again!\n\n`;
    body += `Best regards,\n`;
    body += `Pratech (CSC)\n`;
    body += `Shrirampur\n`;
    body += `9874561230`;
    
    const encodedSubject = encodeURIComponent(subject);
    const encodedBody = encodeURIComponent(body);
    const mailtoUrl = `mailto:${customerEmailInput.value}?subject=${encodedSubject}&body=${encodedBody}`;
    
    window.open(mailtoUrl, '_blank');
    showNotification(successNotification, 'Email client opened! Attach the PDF and send.');
}

function sendAll() {
    if (!validateForm()) return;
    
    if (confirm('This will:\n1. Download PDF\n2. Open WhatsApp\n3. Open Email\n\nContinue?')) {
        downloadPdf();
        setTimeout(() => sendViaWhatsApp(), 1000);
        setTimeout(() => sendViaEmail(), 2000);
    }
}

function setLoadingState(loading) {
    if (loading) {
        loadingOverlay.style.display = 'flex';
        document.body.classList.add('loading');
    } else {
        loadingOverlay.style.display = 'none';
        document.body.classList.remove('loading');
    }
}

function resetForm() {
    if (isFormDirty && !confirm('Are you sure? All data will be lost.')) {
        return;
    }
    
    customerNameInput.value = '';
    customerMobileInput.value = '';
    customerEmailInput.value = '';
    customMessageInput.value = '';
    
    // Reset radio buttons
    document.querySelector('input[name="payment-mode"][value="UPI"]').checked = true;
    document.querySelector('input[name="payment-status"][value="pending"]').checked = true;
    
    remainingAmountSection.style.display = 'none';
    remainingAmountInput.value = '';
    
    while (servicesContainer.children.length > 1) {
        servicesContainer.removeChild(servicesContainer.lastChild);
    }
    
    const firstService = servicesContainer.querySelector('.service-item');
    if (firstService) {
        firstService.querySelector('.service-name').value = '';
        firstService.querySelector('.service-amount').value = '';
    }
    
    calculateTotal();
    updatePaymentStatus();
    resetFormDirtyState();
    
    showNotification(successNotification, 'Form reset successfully!');
}

function closePreview() {
    invoicePreview.style.display = 'none';
    
    if (currentPdfUrl) URL.revokeObjectURL(currentPdfUrl);
    if (currentImageUrl) URL.revokeObjectURL(currentImageUrl);
    
    currentPdfUrl = '';
    currentImageUrl = '';
    currentPdfBlob = null;
    currentInvoiceId = '';
}

function validateForm() {
    if (!customerNameInput.value.trim()) {
        showNotification(errorNotification, 'Please enter customer name.');
        customerNameInput.focus();
        return false;
    }
    
    if (!customerMobileInput.value.trim()) {
        showNotification(errorNotification, 'Please enter mobile number.');
        customerMobileInput.focus();
        return false;
    }
    
    if (customerMobileInput.value.length !== 10 || !/^\d+$/.test(customerMobileInput.value)) {
        showNotification(errorNotification, 'Please enter valid 10-digit mobile number.');
        customerMobileInput.focus();
        return false;
    }
    
    if (customerEmailInput.value.trim() && !isValidEmail(customerEmailInput.value)) {
        showNotification(errorNotification, 'Please enter valid email address.');
        customerEmailInput.focus();
        return false;
    }
    
    let validService = false;
    const serviceItems = document.querySelectorAll('.service-item');
    
    for (let item of serviceItems) {
        const serviceName = item.querySelector('.service-name').value.trim();
        const serviceAmount = item.querySelector('.service-amount').value;
        
        if (serviceName && serviceAmount && parseFloat(serviceAmount) > 0) {
            validService = true;
            break;
        }
    }
    
    if (!validService) {
        showNotification(errorNotification, 'Please add at least one service with description and amount > 0.');
        return false;
    }
    
    const paymentStatus = document.querySelector('input[name="payment-status"]:checked').value;
    if (paymentStatus === 'half-paid' && (!remainingAmountInput.value || parseFloat(remainingAmountInput.value) <= 0)) {
        showNotification(errorNotification, 'Please enter valid remaining amount for half-paid status.');
        remainingAmountInput.focus();
        return false;
    }
    
    return true;
}

function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

// FALLBACK PDF GENERATION METHOD
function generatePdfFallback() {
    return new Promise((resolve, reject) => {
        try {
            console.log('Using fallback PDF generation method...');
            
            const { jsPDF } = window.jspdf;
            const pdf = new jsPDF();
            
            // Set initial position
            let yPosition = 20;
            
            // Add header
            pdf.setFontSize(20);
            pdf.text('Pratech (CSC) Invoice', 20, yPosition);
            yPosition += 15;
            
            pdf.setFontSize(10);
            pdf.text('Pratik A. Bhang | Shrirampur', 20, yPosition);
            yPosition += 5;
            pdf.text('9874561230 | csc.pratikabhang@gmail.com', 20, yPosition);
            yPosition += 10;
            
            pdf.setFontSize(16);
            pdf.text('INVOICE', 20, yPosition);
            yPosition += 15;
            
            // Add invoice details
            pdf.setFontSize(12);
            pdf.text(`Invoice ID: ${currentInvoiceId}`, 20, yPosition);
            yPosition += 8;
            pdf.text(`Date: ${new Date().toLocaleDateString('en-IN')}`, 20, yPosition);
            yPosition += 8;
            pdf.text(`Customer: ${customerNameInput.value}`, 20, yPosition);
            yPosition += 8;
            pdf.text(`Mobile: +91 ${customerMobileInput.value}`, 20, yPosition);
            yPosition += 8;
            pdf.text(`Email: ${customerEmailInput.value || 'Not provided'}`, 20, yPosition);
            yPosition += 15;
            
            // Add services table header
            pdf.setFontSize(12);
            pdf.text('#', 20, yPosition);
            pdf.text('Service Description', 30, yPosition);
            pdf.text('Amount (₹)', 150, yPosition);
            yPosition += 8;
            
            // Draw line
            pdf.line(20, yPosition, 190, yPosition);
            yPosition += 10;
            
            // Add services
            const serviceItems = document.querySelectorAll('.service-item');
            let serviceTotal = 0;
            
            serviceItems.forEach((item, index) => {
                if (yPosition > 250) {
                    pdf.addPage();
                    yPosition = 20;
                }
                
                const serviceName = item.querySelector('.service-name').value || 'Service';
                const serviceAmount = parseFloat(item.querySelector('.service-amount').value) || 0;
                serviceTotal += serviceAmount;
                
                pdf.text(`${index + 1}`, 20, yPosition);
                pdf.text(serviceName.length > 40 ? serviceName.substring(0, 37) + '...' : serviceName, 30, yPosition);
                pdf.text(`₹${serviceAmount.toFixed(2)}`, 150, yPosition);
                yPosition += 8;
            });
            
            yPosition += 10;
            
            // Add summary
            const retailerCharges = serviceTotal * RETAILER_CHARGES_PERCENTAGE;
            const totalAmount = serviceTotal + retailerCharges;
            const paymentStatus = document.querySelector('input[name="payment-status"]:checked').value;
            const paymentMode = document.querySelector('input[name="payment-mode"]:checked').value;
            
            pdf.text(`Service Charges: ₹${serviceTotal.toFixed(2)}`, 20, yPosition);
            yPosition += 8;
            pdf.text(`Retailer Charges (10%): ₹${retailerCharges.toFixed(2)}`, 20, yPosition);
            yPosition += 8;
            pdf.setFontSize(14);
            pdf.text(`Total Amount: ₹${totalAmount.toFixed(2)}`, 20, yPosition);
            yPosition += 12;
            
            pdf.setFontSize(12);
            pdf.text(`Payment Status: ${paymentStatus === 'pending' ? 'Pending' : paymentStatus === 'half-paid' ? 'Half Paid' : 'Paid'}`, 20, yPosition);
            yPosition += 8;
            pdf.text(`Payment Mode: ${paymentMode}`, 20, yPosition);
            
            if (paymentStatus === 'half-paid') {
                yPosition += 8;
                pdf.text(`Remaining Amount: ₹${remainingAmountInput.value || '0.00'}`, 20, yPosition);
            }
            
            yPosition += 15;
            
            // Add custom message if exists
            if (customMessageInput.value) {
                pdf.text(`Note: ${customMessageInput.value}`, 20, yPosition);
                yPosition += 10;
            }
            
            // Add footer
            yPosition += 10;
            pdf.setFontSize(10);
            pdf.text('Thank you for your business! We look forward to serving you again.', 20, yPosition);
            
            const pdfBlob = pdf.output('blob');
            console.log('Fallback PDF created successfully');
            resolve(pdfBlob);
        } catch (error) {
            console.error('Error in fallback PDF generation:', error);
            reject(error);
        }
    });
}

// Global error handler
window.addEventListener('error', function(e) {
    console.error('Application error:', e.error);
});