// ---------- Newsletter ----------
document.getElementById('newsletter-form').addEventListener('submit', function(e){
    e.preventDefault();
    const name = document.getElementById('name').value;
    const email = document.getElementById('email').value;

    fetch('https://script.google.com/u/0/home/projects/1Z4FA1Ljew6WSgLYw7lKUVdYYhQWcJjYF9JWnLNCULMjzVM6o-mYduNQY/edit', {
        method: 'POST',
        body: JSON.stringify({name: name, email: email})
    })
    .then(response => response.json())
    .then(data => {
        document.getElementById('newsletter-msg').textContent = "Subscribed successfully!";
        document.getElementById('newsletter-form').reset();
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
// Load saved rating
const savedRating = localStorage.getItem('post1-rating');
if (savedRating) {
    document.getElementById('rating-msg').textContent = `Your previous rating: ${savedRating}⭐`;
}

// ---------- Contact Form using EmailJS ----------
document.getElementById('contact-form').addEventListener('submit', function(e){
    e.preventDefault();
    const name = document.getElementById('contact-name').value;
    const email = document.getElementById('contact-email').value;
    const message = document.getElementById('contact-message').value;

    // EmailJS example
    emailjs.send('YOUR_SERVICE_ID','YOUR_TEMPLATE_ID',{
        from_name: name,
        from_email: email,
        message: message
    })
    .then(() => {
        document.getElementById('contact-msg').textContent = "Message sent!";
        document.getElementById('contact-form').reset();
    }, (err) => {
        document.getElementById('contact-msg').textContent = "Failed to send message.";
        console.error(err);
    });
});
