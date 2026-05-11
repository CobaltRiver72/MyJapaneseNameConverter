// Contact form handling
document.getElementById('contactForm').addEventListener('submit', function(e) {
    e.preventDefault();

    const name = document.getElementById('contactName').value.trim();
    const email = document.getElementById('contactEmail').value.trim();
    const message = document.getElementById('contactMessage').value.trim();
    const messageEl = document.getElementById('formMessage');

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

    // Construct mailto link — opened synchronously inside the user-gesture
    // handler so popup blockers and mobile email clients accept it.
    const subject = encodeURIComponent('Contact from ' + name + ' via My Japanese Name Translator');
    const body = encodeURIComponent('Name: ' + name + '\nEmail: ' + email + '\n\nMessage:\n' + message);
    window.location.href = 'mailto:contact@myjapanesenametranslator.com?subject=' + subject + '&body=' + body;

    messageEl.innerHTML = 'Opening your email client. If nothing happens, email us directly at <a href="mailto:contact@myjapanesenametranslator.com">contact@myjapanesenametranslator.com</a>.';
    messageEl.className = 'form-message success';
    messageEl.style.display = 'block';
});
