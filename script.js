// ---------- Newsletter Subscription (Google Sheets) ----------
document.getElementById('newsletter-form').addEventListener('submit', function(e){
    e.preventDefault();

    const name = document.getElementById('name').value;
    const email = document.getElementById('email').value;

    // Send data to Google Apps Script
    fetch('https://script.google.com/macros/s/AKfycbwGvCZuDpuV7T60mUMcePUt0SN5d7MUhQ9xQ3Lmmivj33lSKo6Csn9xv1IPhOOVT4li/exec', {
        method: 'POST',
        body: JSON.stringify({name: name, email: email})
    })
    .then(response => response.json())
    .then(data => {
        document.getElementById('newsletter-msg').textContent = "Subscribed successfully!";
        document.getElementById('newsletter-form').reset();

        // Optional: send EmailJS notification
        emailjs.send('service_8fe6yij', 'template_wxvjwg9', {
            from_name: name,
            from_email: email,
            message: "New newsletter subscription"
        });
    })
    .catch(error => {
        document.getElementById('newsletter-msg').textContent = "Subscription failed. Try again.";
        console.error(error);
    });
});

// ---------- Star Ratings ----------
const stars = document.querySelectorAll('.star-rating span');
stars.forEach(star => {
    star.addEventListener('click', () => {
        const rating = star.dataset.value;
        localStorage.setItem('post1-rating', rating);
        document.getElementById('rating-msg').textContent = `Thanks for rating: ${rating}⭐`;
    });
});

// Load saved rating on page load
const savedRating = localStorage.getItem('post1-rating');
if (savedRating) {
    document.getElementById('rating-msg').textContent = `Your previous rating: ${savedRating}⭐`;
}

// ---------- Initialize EmailJS ----------
(function(){
    emailjs.init("Ow9sGUE6hSO-EpF_T"); // Your EmailJS public key
})();

// ---------- Contact Form using EmailJS ----------
document.getElementById('contact-form').addEventListener('submit', function(e){
    e.preventDefault();

    const name = document.getElementById('contact-name').value;
    const email = document.getElementById('contact-email').value;
    const message = document.getElementById('contact-message').value;

    emailjs.send('service_8fe6yij', 'template_wxvjwg9', {
        from_name: name,
        from_email: email,
        message: message
    })
    .then(() => {
        document.getElementById('contact-msg').textContent = "Message sent!";
        document.getElementById('contact-form').reset();
    }, (err) => {
        document.getElementById('contact-msg').textContent = "Failed to send message.";
        console.error("EmailJS error:", err);
    });
});
