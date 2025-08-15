// ------------------- Newsletter Subscription -------------------
document.querySelectorAll('#newsletter-form').forEach(form => {
    form.addEventListener('submit', function(e) {
        e.preventDefault();
        const name = this.querySelector('#name').value;
        const email = this.querySelector('#email').value;
        const msgEl = this.nextElementSibling; // newsletter-msg <p>

        // Send to Google Sheets
        fetch('https://script.google.com/macros/s/AKfycbwGvCZuDpuV7T60mUMcePUt0SN5d7MUhQ9xQ3Lmmivj33lSKo6Csn9xv1IPhOOVT4li/exec', {
            method: 'POST',
            body: JSON.stringify({name: name, email: email})
        })
        .then(response => response.json())
        .then(data => {
            msgEl.textContent = "Subscribed successfully!";
            this.reset();

            // Send EmailJS notification
            emailjs.send('service_8fe6yij', 'template_wxvjwg9', {
                from_name: name,
                from_email: email,
                message: "New newsletter subscription"
            });
        })
        .catch(error => {
            msgEl.textContent = "Subscription failed. Try again.";
            console.error(error);
        });
    });
});

// ------------------- Star Ratings -------------------
const starsContainers = document.querySelectorAll('.star-rating');

starsContainers.forEach(container => {
    const stars = container.querySelectorAll('span');
    const postId = container.closest('article') ? container.closest('article').id : 'post1'; // fallback

    let currentRating = localStorage.getItem(`${postId}-rating`) || 0;

    function updateStars(rating) {
        stars.forEach(star => {
            star.classList.remove('selected');
            if (star.dataset.value <= rating) {
                star.classList.add('selected');
            }
        });
    }

    updateStars(currentRating);

    stars.forEach(star => {
        star.addEventListener('click', () => {
            currentRating = star.dataset.value;
            localStorage.setItem(`${postId}-rating`, currentRating);
            const msgEl = container.nextElementSibling; // rating-msg <p>
            if (msgEl) msgEl.textContent = `Thanks for rating: ${currentRating}⭐`;
            updateStars(currentRating);
        });
    });
});

// ------------------- Initialize EmailJS -------------------
(function() {
    emailjs.init("Ow9sGUE6hSO-EpF_T");
})();

// ------------------- Contact Form -------------------
document.querySelectorAll('#contact-form').forEach(form => {
    form.addEventListener('submit', function(e){
        e.preventDefault();
        const name = this.querySelector('#contact-name').value;
        const email = this.querySelector('#contact-email').value;
        const message = this.querySelector('#contact-message').value;
        const msgEl = this.nextElementSibling; // contact-msg <p>

        emailjs.send('service_8fe6yij', 'template_wxvjwg9', {
            from_name: name,
            from_email: email,
            message: message
        })
        .then(() => {
            msgEl.textContent = "Message sent!";
            this.reset();
        }, (err) => {
            msgEl.textContent = "Failed to send message.";
            console.error("EmailJS error:", err);
        });
    });
});
