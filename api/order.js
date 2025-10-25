// Vercel Serverless Function for handling orders
const nodemailer = require('nodemailer');

// Minimum quantities
const minQuantities = {
    'fish_feed': 10,
    'catfish': 1,
    'materials': 50
};

// Product names
const productNames = {
    'fish_feed': 'Fish Feed',
    'catfish': 'Catfish',
    'materials': 'Materials'
};

module.exports = async (req, res) => {
    // Enable CORS
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
    res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

    // Handle OPTIONS request
    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    // Only allow POST requests
    if (req.method !== 'POST') {
        return res.status(405).json({
            success: false,
            message: 'Method not allowed'
        });
    }

    try {
        const { name, address, phone, product, quantity, notes } = req.body;

        // Validate required fields
        if (!name || !address || !phone || !product) {
            return res.status(400).json({
                success: false,
                message: 'All required fields must be filled'
            });
        }

        // Validate product type
        if (!minQuantities[product]) {
            return res.status(400).json({
                success: false,
                message: 'Invalid product selected'
            });
        }

        // Validate quantity
        const qty = parseFloat(quantity);
        if (isNaN(qty) || qty < minQuantities[product]) {
            return res.status(400).json({
                success: false,
                message: `Quantity does not meet minimum requirement for ${productNames[product]} (Min: ${minQuantities[product]}kg)`
            });
        }

        // Generate order number and date
        const orderDate = new Date().toISOString().replace('T', ' ').substring(0, 19);
        const orderNumber = 'FP' + Date.now() + Math.floor(Math.random() * 1000);

        // Prepare order data
        const orderData = {
            orderNumber,
            date: orderDate,
            name,
            phone,
            address,
            product: productNames[product],
            quantity: qty,
            notes: notes || 'None'
        };

        // Send email notification
        // IMPORTANT: Set up environment variables in Vercel dashboard:
        // EMAIL_USER = your gmail address
        // EMAIL_PASS = your gmail app password
        // EMAIL_TO = email to receive orders
        
        if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
            try {
                const transporter = nodemailer.createTransport({
                    service: 'gmail',
                    auth: {
                        user: process.env.EMAIL_USER,
                        pass: process.env.EMAIL_PASS
                    }
                });

                const mailOptions = {
                    from: process.env.EMAIL_USER,
                    to: process.env.EMAIL_TO || process.env.EMAIL_USER,
                    subject: `New Fish Parque Order - ${orderNumber}`,
                    html: `
                        <h2>New Order Received</h2>
                        <p><strong>Order Number:</strong> ${orderData.orderNumber}</p>
                        <p><strong>Date:</strong> ${orderData.date}</p>
                        <hr>
                        <h3>Customer Information</h3>
                        <p><strong>Name:</strong> ${orderData.name}</p>
                        <p><strong>Phone:</strong> ${orderData.phone}</p>
                        <p><strong>Address:</strong> ${orderData.address}</p>
                        <hr>
                        <h3>Order Details</h3>
                        <p><strong>Product:</strong> ${orderData.product}</p>
                        <p><strong>Quantity:</strong> ${orderData.quantity}kg</p>
                        <p><strong>Notes:</strong> ${orderData.notes}</p>
                    `
                };

                await transporter.sendMail(mailOptions);
            } catch (emailError) {
                console.error('Email error:', emailError);
                // Don't fail the order if email fails
            }
        }

        // Success response
        return res.status(200).json({
            success: true,
            message: `Thank you! Your order #${orderNumber} has been placed successfully. We will contact you shortly.`
        });

    } catch (error) {
        console.error('Server error:', error);
        return res.status(500).json({
            success: false,
            message: 'An error occurred. Please try again.'
        });
    }
};
