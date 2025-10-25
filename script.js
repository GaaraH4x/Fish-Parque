document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('orderForm');
    const productSelect = document.getElementById('product');
    const quantityInput = document.getElementById('quantity');
    const quantityHelp = document.getElementById('quantityHelp');
    const messageDiv = document.getElementById('message');
    const submitButton = form.querySelector('.btn-submit');

    // Minimum quantities for each product
    const minQuantities = {
        'fish_feed': 10,
        'catfish': 1,
        'materials': 50
    };

    // Update quantity helper text when product changes
    productSelect.addEventListener('change', function() {
        const selectedProduct = this.value;
        
        if (selectedProduct) {
            const minQty = minQuantities[selectedProduct];
            quantityInput.min = minQty;
            quantityInput.value = minQty;
            quantityHelp.textContent = `Minimum order: ${minQty}kg`;
        } else {
            quantityHelp.textContent = '';
            quantityInput.value = '';
            quantityInput.min = 1;
        }
    });

    // Form validation and submission
    form.addEventListener('submit', function(e) {
        e.preventDefault();
        
        // Clear previous messages
        messageDiv.className = 'message';
        messageDiv.textContent = '';
        
        // Get form values
        const name = document.getElementById('name').value.trim();
        const address = document.getElementById('address').value.trim();
        const phone = document.getElementById('phone').value.trim();
        const product = productSelect.value;
        const quantity = parseFloat(quantityInput.value);
        const notes = document.getElementById('notes').value.trim();
        
        // Validate product selection
        if (!product) {
            showMessage('Please select a product', 'error');
            return;
        }
        
        // Validate minimum quantity
        const minQty = minQuantities[product];
        if (quantity < minQty) {
            showMessage(`Minimum order for this product is ${minQty}kg`, 'error');
            return;
        }
        
        // Disable submit button during processing
        submitButton.disabled = true;
        submitButton.textContent = 'Processing Order...';
        
        // Prepare order data
        const orderData = {
            name: name,
            address: address,
            phone: phone,
            product: product,
            quantity: quantity,
            notes: notes
        };
        
        // Send data to Vercel serverless function
        fetch('/api/order', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(orderData)
        })
        .then(response => {
            // Check if response is ok
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.text();
        })
        .then(text => {
            // Try to parse JSON
            try {
                const data = JSON.parse(text);
                if (data.success) {
                    showMessage(data.message, 'success');
                    form.reset();
                    quantityHelp.textContent = '';
                } else {
                    showMessage(data.message || 'An error occurred. Please try again.', 'error');
                }
            } catch (e) {
                console.error('JSON Parse Error:', e);
                console.error('Response text:', text);
                showMessage('Server error. Please try again or contact support.', 'error');
            }
        })
        .catch(error => {
            console.error('Fetch Error:', error);
            showMessage('Unable to connect to server. Please check your internet connection and try again.', 'error');
        })
        .finally(() => {
            // Re-enable submit button
            submitButton.disabled = false;
            submitButton.textContent = 'Place Order';
        });
    });
    
    // Helper function to display messages
    function showMessage(message, type) {
        messageDiv.textContent = message;
        messageDiv.className = `message ${type}`;
        
        // Scroll to message
        messageDiv.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        
        // Auto-hide success messages after 8 seconds
        if (type === 'success') {
            setTimeout(() => {
                messageDiv.className = 'message';
                messageDiv.textContent = '';
            }, 8000);
        }
    }
});