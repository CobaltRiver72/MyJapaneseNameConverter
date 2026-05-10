    // Contact form handling
    document.getElementById('contactForm').addEventListener('submit', function(e) {
        e.preventDefault();

        const name = document.getElementById('contactName').value.trim();
        const email = document.getElementById('contactEmail').value.trim();
        const message = document.getElementById('contactMessage').value.trim();
        const messageEl = document.getElementById('formMessage');
        const submitBtn = document.getElementById('submitBtn');

        // Reset message
        messageEl.className = 'form-message';
        messageEl.style.display = 'none';

        // Honeypot spam check
        if (document.getElementById('website').value) {
            messageEl.textContent = 'Thank you for your message!';
            messageEl.className = 'form-message success';
            messageEl.style.display = 'block';
            return;
        }

        // Validation
        if (!name || !email || !message) {
            messageEl.textContent = 'Please fill in all required fields.';
            messageEl.className = 'form-message error';
            messageEl.style.display = 'block';
            return;
        }

        // Basic email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            messageEl.textContent = 'Please enter a valid email address.';
            messageEl.className = 'form-message error';
            messageEl.style.display = 'block';
            return;
        }

        // Simulate submission
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="animation:spin 1s linear infinite"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg> Sending...';

        // Construct mailto link as fallback
        const subject = encodeURIComponent('Contact from ' + name + ' via My Japanese Name Translator');
        const body = encodeURIComponent('Name: ' + name + '\nEmail: ' + email + '\n\nMessage:\n' + message);

        setTimeout(function() {
            // Open mailto as the form action
            window.location.href = 'mailto:contact@myjapanesenametranslator.com?subject=' + subject + '&body=' + body;

            messageEl.textContent = 'Thank you for your message! Your email client should open shortly. If it doesn\'t, please email us directly at contact@myjapanesenametranslator.com';
            messageEl.className = 'form-message success';
            messageEl.style.display = 'block';

            submitBtn.disabled = false;
            submitBtn.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m22 2-7 20-4-9-9-4Z"/><path d="M22 2 11 13"/></svg> Send Message';
        }, 800);
    });
