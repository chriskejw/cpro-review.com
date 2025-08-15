document.addEventListener("DOMContentLoaded", () => {
  // --------------------- Load Header & Footer ---------------------
  loadPart("header-placeholder", "header.html");
  loadPart("footer-placeholder", "footer.html");

  // --------------------- Blog Cards ---------------------
  const cardContainer = document.querySelector(".card-grid");
  let allCards = [];
  let cardsPerPage = 3;
  let currentIndex = 0;

  if (cardContainer) {
    fetch("cards.json")
      .then(res => res.json())
      .then(cards => {
        allCards = cards;
        loadMoreCards(); // Load first batch

        if (cards.length > cardsPerPage) {
          const loadMoreBtn = document.createElement("button");
          loadMoreBtn.textContent = "Load More Posts";
          loadMoreBtn.id = "loadMoreBtn";
          loadMoreBtn.style.margin = "1rem 0";
          cardContainer.after(loadMoreBtn);
          loadMoreBtn.addEventListener("click", loadMoreCards);
        }
      })
      .catch(err => console.error("Error loading cards:", err));
  }

  function loadMoreCards() {
    const nextIndex = currentIndex + cardsPerPage;
    const cardsToLoad = allCards.slice(currentIndex, nextIndex);

    cardsToLoad.forEach(card => {
      const cardEl = document.createElement("article");
      cardEl.className = "card";
      cardEl.innerHTML = `
        <h3><a href="${card.link}">${card.title}</a></h3>
        <small>${card.date}</small>
        <p>${card.description}</p>
        <a class="read-more" href="${card.link}">Read More →</a>
      `;
      cardContainer.appendChild(cardEl);

      setTimeout(() => {
        cardEl.classList.add("visible");
        cardEl.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 50);
    });

    currentIndex = nextIndex;

    if (currentIndex >= allCards.length) {
      const btn = document.getElementById("loadMoreBtn");
      if (btn) btn.style.display = "none";
    }
  }

  // --------------------- Newsletter ---------------------
  const subscribeForm = document.getElementById("subscribeForm");
  if (subscribeForm) {
    subscribeForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const name = document.getElementById("name").value.trim();
      const email = document.getElementById("email").value.trim();
      const msgEl = document.getElementById("msg");

      try {
        const response = await fetch(
          "https://script.google.com/macros/s/YOUR_GOOGLE_SCRIPT_ID/exec",
          { method: "POST", body: JSON.stringify({ name, email }) }
        );
        await response.json();
        msgEl.textContent = "Subscribed successfully!";
        subscribeForm.reset();
      } catch {
        msgEl.textContent = "Error subscribing. Try again.";
      }
    });
  }

  // --------------------- Contact Form ---------------------
  const contactForm = document.getElementById("contactForm");
  if (contactForm) {
    contactForm.addEventListener("submit", (e) => {
      e.preventDefault();
      emailjs
        .send(
          "service_8fe6yij",
          "template_wxvjwg9",
          {
            from_name: document.getElementById("contactName").value,
            from_email: document.getElementById("contactEmail").value,
            message: document.getElementById("contactMessage").value
          }
        )
        .then(() => {
          document.getElementById("contactMsg").textContent =
            "Message sent successfully!";
          contactForm.reset();
        })
        .catch((err) => {
          document.getElementById("contactMsg").textContent =
            "Failed to send message.";
          console.error(err);
        });
    });
  }
});

// --------------------- Utility: Load Header/Footer ---------------------
function loadPart(placeholderId, file) {
  fetch(file)
    .then(res => res.text())
    .then(data => {
      document.getElementById(placeholderId).innerHTML = data;
    })
    .catch(err => console.error("Error loading file:", file, err));
}
