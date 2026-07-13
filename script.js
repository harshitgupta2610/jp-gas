/* ============================================
   JP GAS - Premium Industrial Gas Website
   script.js
   ============================================ */

(function () {
  'use strict';

  // ======== PRELOADER ========
  window.addEventListener('load', () => {
    const preloader = document.getElementById('preloader');
    setTimeout(() => {
      preloader.classList.add('hidden');
    }, 1200);
  });

  // ======== SCROLL PROGRESS BAR ========
  function updateScrollProgress() {
    const scrollTop = window.scrollY;
    const docHeight = document.documentElement.scrollHeight - window.innerHeight;
    const scrollPercent = (scrollTop / docHeight) * 100;
    document.getElementById('scrollProgress').style.width = scrollPercent + '%';
  }

  // ======== NAVBAR ========
  const navbar = document.getElementById('navbar');
  const navMenu = document.getElementById('navMenu');
  const navHamburger = document.getElementById('navHamburger');
  const navLinks = document.querySelectorAll('.nav-link');

  // Sticky Navbar
  function handleNavbarScroll() {
    if (window.scrollY > 50) {
      navbar.classList.add('scrolled');
    } else {
      navbar.classList.remove('scrolled');
    }
  }

  // Hamburger Toggle
  navHamburger.addEventListener('click', () => {
    navHamburger.classList.toggle('active');
    navMenu.classList.toggle('active');
    document.body.style.overflow = navMenu.classList.contains('active') ? 'hidden' : '';
  });

  // Close menu on link click
  navLinks.forEach(link => {
    link.addEventListener('click', () => {
      navHamburger.classList.remove('active');
      navMenu.classList.remove('active');
      document.body.style.overflow = '';
    });
  });

  // Active nav link on scroll
  function updateActiveNav() {
    const sections = document.querySelectorAll('section[id]');
    const scrollPos = window.scrollY + 120;

    sections.forEach(section => {
      const top = section.offsetTop;
      const height = section.offsetHeight;
      const id = section.getAttribute('id');

      if (scrollPos >= top && scrollPos < top + height) {
        navLinks.forEach(link => {
          link.classList.remove('active');
          if (link.getAttribute('href') === '#' + id) {
            link.classList.add('active');
          }
        });
      }
    });
  }



  // ======== SCROLL ANIMATIONS ========
  function handleScrollAnimations() {
    const elements = document.querySelectorAll('.fade-up, .fade-left, .fade-right');
    const triggerPoint = window.innerHeight * 0.88;

    elements.forEach(el => {
      const rect = el.getBoundingClientRect();
      if (rect.top < triggerPoint) {
        el.classList.add('visible');
      }
    });
  }

  // ======== BACK TO TOP ========
  const backToTop = document.getElementById('backToTop');

  function handleBackToTop() {
    if (window.scrollY > 500) {
      backToTop.classList.add('visible');
    } else {
      backToTop.classList.remove('visible');
    }
  }

  backToTop.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });

  // ======== COUNTER ANIMATION ========
  let countersAnimated = false;

  function animateCounters() {
    if (countersAnimated) return;

    const countersSection = document.getElementById('counters');
    if (!countersSection) return;

    const rect = countersSection.getBoundingClientRect();
    if (rect.top < window.innerHeight && rect.bottom > 0) {
      countersAnimated = true;

      const counters = countersSection.querySelectorAll('.counter-number');
      counters.forEach(counter => {
        const target = parseInt(counter.getAttribute('data-target'));
        const duration = 2000;
        const increment = target / (duration / 16);
        let current = 0;

        const updateCounter = () => {
          current += increment;
          if (current < target) {
            counter.textContent = Math.floor(current).toLocaleString() + '+';
            requestAnimationFrame(updateCounter);
          } else {
            counter.textContent = target.toLocaleString() + '+';
          }
        };
        requestAnimationFrame(updateCounter);
      });
    }
  }

  // ======== PRODUCT SEARCH ========
  const productSearch = document.getElementById('productSearch');
  const productCards = document.querySelectorAll('.product-card');

  productSearch.addEventListener('input', (e) => {
    const query = e.target.value.toLowerCase().trim();

    productCards.forEach(card => {
      const name = card.getAttribute('data-name').toLowerCase();
      const category = card.getAttribute('data-category').toLowerCase();
      const description = card.querySelector('.product-description').textContent.toLowerCase();

      if (name.includes(query) || category.includes(query) || description.includes(query)) {
        card.classList.remove('hidden');
      } else {
        card.classList.add('hidden');
      }
    });
  });

  // ======== PRODUCT CATEGORY FILTER ========
  const filterBtns = document.querySelectorAll('.filter-btn');

  filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      // Update active state
      filterBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      const filter = btn.getAttribute('data-filter');

      productCards.forEach(card => {
        const category = card.getAttribute('data-category');
        if (filter === 'all' || category === filter) {
          card.classList.remove('hidden');
        } else {
          card.classList.add('hidden');
        }
      });

      // Clear search
      productSearch.value = '';
    });
  });

  // ======== FAQ ACCORDION ========
  const faqItems = document.querySelectorAll('.faq-item');

  faqItems.forEach(item => {
    const question = item.querySelector('.faq-question');
    const answer = item.querySelector('.faq-answer');

    question.addEventListener('click', () => {
      const isActive = item.classList.contains('active');

      // Close all
      faqItems.forEach(i => {
        i.classList.remove('active');
        i.querySelector('.faq-answer').style.maxHeight = null;
        i.querySelector('.faq-question').setAttribute('aria-expanded', 'false');
      });

      // Open clicked (if it wasn't active)
      if (!isActive) {
        item.classList.add('active');
        answer.style.maxHeight = answer.scrollHeight + 'px';
        question.setAttribute('aria-expanded', 'true');
      }
    });
  });

  // ======== WHATSAPP INQUIRY ========
  window.enquireWhatsApp = function (productName) {
    const message = `Hello JP GAS,

I would like to enquire about:

Product: ${productName}

Please share pricing, availability and delivery details.

Thank you.`;

    const encoded = encodeURIComponent(message);
    window.open(`https://wa.me/917827544653?text=${encoded}`, '_blank');
  };

  // ======== COPY TO CLIPBOARD ========
  window.copyToClipboard = function (text, btn) {
    navigator.clipboard.writeText(text).then(() => {
      btn.classList.add('copied');
      const original = btn.innerHTML;
      btn.innerHTML = 'âœ… Copied!';
      showToast('Copied to clipboard!');

      setTimeout(() => {
        btn.classList.remove('copied');
        btn.innerHTML = original;
      }, 2000);
    }).catch(() => {
      // Fallback for older browsers
      const textarea = document.createElement('textarea');
      textarea.value = text;
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);

      btn.classList.add('copied');
      const original = btn.innerHTML;
      btn.innerHTML = 'âœ… Copied!';
      showToast('Copied to clipboard!');

      setTimeout(() => {
        btn.classList.remove('copied');
        btn.innerHTML = original;
      }, 2000);
    });
  };

  // ======== TOAST NOTIFICATION ========
  function showToast(message) {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    toast.classList.add('show');

    setTimeout(() => {
      toast.classList.remove('show');
    }, 2500);
  }

  // ======== BUTTON RIPPLE EFFECT ========
  document.querySelectorAll('.btn, .product-whatsapp-btn, .cta-btn').forEach(btn => {
    btn.addEventListener('click', function (e) {
      const ripple = document.createElement('span');
      ripple.classList.add('ripple');

      const rect = this.getBoundingClientRect();
      const size = Math.max(rect.width, rect.height);
      ripple.style.width = ripple.style.height = size + 'px';
      ripple.style.left = (e.clientX - rect.left - size / 2) + 'px';
      ripple.style.top = (e.clientY - rect.top - size / 2) + 'px';

      this.appendChild(ripple);

      setTimeout(() => ripple.remove(), 600);
    });
  });

  // ======== SMOOTH SCROLL FOR ANCHOR LINKS ========
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
      const targetId = this.getAttribute('href');
      if (targetId === '#') return;

      e.preventDefault();
      const target = document.querySelector(targetId);
      if (target) {
        target.scrollIntoView({ behavior: 'smooth' });
      }
    });
  });

  // ======== COMBINED SCROLL HANDLER ========
  let ticking = false;

  function onScroll() {
    if (!ticking) {
      requestAnimationFrame(() => {
        handleNavbarScroll();
        updateScrollProgress();
        handleScrollAnimations();
        handleBackToTop();
        updateActiveNav();
        animateCounters();
        ticking = false;
      });
      ticking = true;
    }
  }

  window.addEventListener('scroll', onScroll, { passive: true });

  // ======== VISITOR COUNTER ========
  function initVisitorCounter() {
    const counterEl = document.getElementById('visitorCounter');
    const countEl = document.getElementById('visitorCount');
    if (!counterEl || !countEl) return;

    const namespace = 'jpgas.in';
    const key = 'visits';
    const isNewSession = !sessionStorage.getItem('jpgas_visited');
    
    // Using Abacus API (CORS-friendly for both GET and HIT)
    const endpoint = isNewSession
      ? `https://abacus.jasoncameron.dev/hit/${namespace}/${key}`
      : `https://abacus.jasoncameron.dev/get/${namespace}/${key}`;

    // Helper to format number with commas
    const formatNumber = (num) => {
      return parseInt(num).toLocaleString();
    };

    // Helper to show the counter element with a smooth fade-in
    const showCounter = (value) => {
      countEl.textContent = formatNumber(value);
      counterEl.style.display = 'inline-flex';
      counterEl.style.opacity = '0';
      setTimeout(() => {
        counterEl.style.opacity = '1';
      }, 50);
    };

    fetch(endpoint)
      .then(response => {
        if (!response.ok) {
          throw new Error('API response not ok');
        }
        return response.json();
      })
      .then(data => {
        // Abacus returns data in the format: { "value": X }
        const countValue = data && typeof data.value !== 'undefined' ? data.value : undefined;
        if (typeof countValue !== 'undefined') {
          showCounter(countValue);
          if (isNewSession) {
            sessionStorage.setItem('jpgas_visited', 'true');
          }
        } else {
          throw new Error('Invalid data format');
        }
      })
      .catch(error => {
        console.warn('Visitor visitor API failed. Using local fallback.', error);
        
        // Fallback: Use localStorage to keep track of a local count for offline/failure cases
        let localHits = localStorage.getItem('jpgas_local_hits');
        if (!localHits) {
          localHits = 0; // Starting from 0 so first visit is 1
        } else {
          localHits = parseInt(localHits);
        }

        if (isNewSession) {
          localHits += 1;
          localStorage.setItem('jpgas_local_hits', localHits);
          sessionStorage.setItem('jpgas_visited', 'true');
        }

        showCounter(localHits);
      });
  }

  // Initial calls
  handleScrollAnimations();
  handleNavbarScroll();
  updateScrollProgress();
  initVisitorCounter();

})();
