/* --- GURUMANTRA MAIN JAVASCRIPT --- */


document.addEventListener("DOMContentLoaded", function () {
  initAOS();
  initCarousels();
  navbarScroll();
  initScrollBar();
  initCardHover();
  initRipple();
});


document.addEventListener("DOMContentLoaded", function () {
  // 1. AOS Init
  if (typeof AOS !== "undefined") {
    AOS.init({
      duration: 1000,
      once: true,
      offset: 120,
      easing: "ease-in-out",
    });
  }

  // 2. Sliders Init
  const heroCarousel = document.querySelector("#heroCarousel");
  if (heroCarousel) {
    new bootstrap.Carousel(heroCarousel, {
      interval: 2000,
      ride: "carousel",
      pause: "hover",
    });
  }

  const adSlider = document.querySelector("#adSlider");
  if (adSlider) {
    new bootstrap.Carousel(adSlider, {
      interval: 3000,
      ride: "carousel",
      pause: "hover",
    });
  }

  // 3. Navbar Shadow Effect
  window.addEventListener("scroll", function () {
    const nav = document.querySelector(".navbar");
    if (nav && window.scrollY > 50) {
      nav.style.boxShadow = "0 10px 30px rgba(0,0,0,0.1)";
    } else if (nav) {
      nav.style.boxShadow = "none";
    }
  });

  // 4. Smooth Fade-in for Extra Tests (Mobile Fix)
  const showBtn = document.getElementById("showAllTests");
  if (showBtn) {
    showBtn.addEventListener("click", function (e) {
      e.preventDefault();
      document.querySelectorAll(".extra-test").forEach((test) => {
        test.classList.remove("d-none");
        test.style.animation = "fadeInUp 0.6s ease forwards";
      });
      this.style.display = "none";
    });
  }
});

// Animation Styles
if (!document.getElementById("js-animations")) {
  const style = document.createElement("style");
  style.id = "js-animations";
  style.innerHTML = `
        @keyframes fadeInUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        .bg-orange { background-color: #ff6600 !important; }
    `;
  document.head.appendChild(style);
}

// Isme aapka purana code upar rahega... 

document.addEventListener("DOMContentLoaded", function () {
  // Share Blog Functionality
  const shareBtns = document.querySelectorAll('.bi-share');
  shareBtns.forEach(btn => {
    btn.addEventListener('click', function() {
      if (navigator.share) {
        navigator.share({
          title: 'Gurumantra Blog',
          url: window.location.href
        }).catch(console.error);
      } else {
        alert("Link Copied to Clipboard!");
      }
    });
  });

  // Filter logic (Placeholder)
  const filterBtn = document.querySelector('.bi-funnel');
  if(filterBtn) {
    filterBtn.addEventListener('click', () => {
      console.log("Category filter opened");
    });
  }
});


// ====== Explore All / Show Less Toggle ======
document.addEventListener("DOMContentLoaded", function() {
  const toggleBtn = document.querySelector('.text-orange.fw-bold.text-decoration-none');
  const extraTests = document.querySelectorAll('.extra-test');

  if (!toggleBtn || extraTests.length === 0) return;

  // Initially hide extra tests
  extraTests.forEach(test => test.style.display = 'none');

  // Toggle on click
  toggleBtn.addEventListener('click', function(e) {
    e.preventDefault(); // prevent href redirect

    const isHidden = extraTests[0].style.display === 'none';

    extraTests.forEach(test => {
      test.style.display = isHidden ? 'block' : 'none';
    });

    toggleBtn.innerHTML = isHidden 
      ? 'Show Less <i class="bi bi-arrow-right"></i>' 
      : 'Explore All <i class="bi bi-arrow-right"></i>';
  });
});


// ===== Current Affairs Search Toggle =====
document.addEventListener("DOMContentLoaded", function () {
  const searchIcon = document.getElementById("searchToggle");
  const searchInput = document.getElementById("searchInput");

  if (searchIcon && searchInput) {
    searchIcon.addEventListener("click", () => {
      searchInput.classList.toggle("d-none");
      searchInput.focus();
    });
  }
});

/* ================= PROFILE OTP LOGIC ================= */
document.addEventListener("DOMContentLoaded", function () {
  const otpInputs = document.querySelectorAll('.otp-input-container input');

  otpInputs.forEach((input, index) => {
    // Jab user type kare
    input.addEventListener('input', (e) => {
      if (e.target.value.length === 1 && index < otpInputs.length - 1) {
        otpInputs[index + 1].focus(); // Next box pe jao
      }
    });

    // Jab user backspace dabaye
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Backspace' && e.target.value.length === 0 && index > 0) {
        otpInputs[index - 1].focus(); // Pichle box pe jao
      }
    });
  });
});

// ===== PROFILE TAB SWITCH =====
document.querySelectorAll(".profile-menu .list-group-item").forEach(item => {
  item.addEventListener("click", function () {

    document.querySelectorAll(".profile-menu .list-group-item")
      .forEach(i => i.classList.remove("active"));

    document.querySelectorAll(".profile-tab")
      .forEach(tab => tab.classList.remove("active"));

    this.classList.add("active");
    document.getElementById(this.dataset.tab).classList.add("active");
  });
});

// PASSWORD SHOW / HIDE
document.querySelectorAll(".toggle-password").forEach(icon => {
  icon.addEventListener("click", () => {
    const inputId = icon.getAttribute("data-target");
    const input = document.getElementById(inputId);

    if (input.type === "password") {
      input.type = "text";
      icon.classList.remove("bi-eye-slash");
      icon.classList.add("bi-eye");
    } else {
      input.type = "password";
      icon.classList.remove("bi-eye");
      icon.classList.add("bi-eye-slash");
    }
  });
});

// Toggle edit sections
document.querySelectorAll(".toggle-btn").forEach(btn => {
  btn.addEventListener("click", () => {
    const target = btn.getAttribute("data-target");

    document.querySelectorAll(".edit-box").forEach(box => {
      if (box.id === target) {
        box.classList.toggle("active");
      } else {
        box.classList.remove("active");
      }
    });
  });
});

// Password eye toggle
document.querySelectorAll(".toggle-password").forEach(icon => {
  icon.addEventListener("click", () => {
    const input = icon.previousElementSibling;
    if (input.type === "password") {
      input.type = "text";
      icon.classList.replace("bi-eye-slash", "bi-eye");
    } else {
      input.type = "password";
      icon.classList.replace("bi-eye", "bi-eye-slash");
    }
  });
});

/* ===== EMAIL OTP VERIFICATION LOGIC ===== */

document.addEventListener("DOMContentLoaded", function () {

  const sendOtpBtn = document.getElementById("sendOtpBtn");
  const verifyOtpBtn = document.getElementById("verifyOtpBtn");
  const otpSection = document.getElementById("otpSection");
  const emailStatus = document.getElementById("emailStatus");
  const otpInputs = document.querySelectorAll(".otp-input");

  let demoOtp = "123456"; // 🔥 demo ke liye

  // SEND OTP
  sendOtpBtn.addEventListener("click", function () {
    const email = document.getElementById("newEmail").value;

    if (!email) {
      alert("Please enter email first");
      return;
    }

    // OTP section open
    otpSection.classList.remove("d-none");

    emailStatus.innerHTML =
      `<i class="bi bi-clock-fill"></i> OTP sent to email`;
    emailStatus.classList.remove("status-verified");
    emailStatus.classList.add("status-pending");

    alert("Demo OTP: 123456");
  });

  // OTP INPUT AUTO MOVE
  otpInputs.forEach((input, index) => {
    input.addEventListener("input", () => {
      if (input.value && index < otpInputs.length - 1) {
        otpInputs[index + 1].focus();
      }
    });

    input.addEventListener("keydown", (e) => {
      if (e.key === "Backspace" && !input.value && index > 0) {
        otpInputs[index - 1].focus();
      }
    });
  });

  // VERIFY OTP
verifyOtpBtn.addEventListener("click", function () {
  let enteredOtp = "";
  otpInputs.forEach(input => enteredOtp += input.value);

  if (enteredOtp === demoOtp) {

    const newEmail = document.getElementById("newEmail").value;

    // ✅ STATUS UPDATE
    emailStatus.innerHTML =
      `<i class="bi bi-check-circle-fill"></i> Email verified successfully`;
    emailStatus.classList.remove("status-pending");
    emailStatus.classList.add("status-verified");

    // ✅ UPDATE EMAIL IN ACCOUNT INFO
    document.querySelectorAll(".info-row")[2]
      .querySelector(".fw-semibold").innerText = newEmail;

    // ✅ CLOSE EDIT BOX
    document.getElementById("emailBox").classList.remove("active");

    // ✅ HIDE OTP SECTION
    otpSection.classList.add("d-none");

  } else {
    alert("Invalid OTP");
  }
});


});

/* ===== MOBILE OTP VERIFICATION LOGIC ===== */

document.addEventListener("DOMContentLoaded", function () {

  const sendMobileOtpBtn = document.getElementById("sendMobileOtpBtn");
  const verifyMobileOtpBtn = document.getElementById("verifyMobileOtpBtn");
  const mobileOtpSection = document.getElementById("mobileOtpSection");
  const mobileStatus = document.getElementById("mobileStatus");
  const mobileOtpInputs = document.querySelectorAll(".mobile-otp-input");
  const mobileDisplay = document.querySelector(
    ".info-row .fw-semibold"
  ); // jo +91 XXXXX dikha raha

  let demoMobileOtp = "654321"; // 🔥 demo OTP

  // SEND OTP
  sendMobileOtpBtn.addEventListener("click", function () {
    const mobile = document.getElementById("newMobile").value.trim();

    if (!mobile || mobile.length < 10) {
      alert("Enter valid mobile number");
      return;
    }

    mobileOtpSection.classList.remove("d-none");

    mobileStatus.innerHTML =
      `<i class="bi bi-clock-fill"></i> OTP sent to mobile`;
    mobileStatus.classList.remove("status-verified");
    mobileStatus.classList.add("status-pending");

    alert("Demo Mobile OTP: 654321");
  });

  // AUTO MOVE OTP INPUT
  mobileOtpInputs.forEach((input, index) => {
    input.addEventListener("input", () => {
      if (input.value && index < mobileOtpInputs.length - 1) {
        mobileOtpInputs[index + 1].focus();
      }
    });

    input.addEventListener("keydown", (e) => {
      if (e.key === "Backspace" && !input.value && index > 0) {
        mobileOtpInputs[index - 1].focus();
      }
    });
  });

  // VERIFY OTP
  verifyMobileOtpBtn.addEventListener("click", function () {
    let enteredOtp = "";
    mobileOtpInputs.forEach(input => enteredOtp += input.value);

    if (enteredOtp === demoMobileOtp) {

      const newMobile = document.getElementById("newMobile").value;

      // ✅ UI UPDATE
      mobileStatus.innerHTML =
        `<i class="bi bi-check-circle-fill"></i> Mobile verified successfully`;
      mobileStatus.classList.remove("status-pending");
      mobileStatus.classList.add("status-verified");

      // 🔥 Save & reflect new mobile
      document.querySelectorAll(".info-row")[1]
        .querySelector(".fw-semibold").innerText =
        `+91 ${newMobile}`;

      // Close box
      mobileOtpSection.classList.add("d-none");
      document.getElementById("mobileBox").classList.remove("active");

    } else {
      alert("Invalid OTP");
    }
  });

});





/* ===== PASSWORD EMAIL OTP VERIFICATION ===== */

document.addEventListener("DOMContentLoaded", function () {

  const updateBtn = document.querySelector("#passwordBox .btn-dark");
  const otpSection = document.getElementById("passwordOtpSection");
  const otpInputs = document.querySelectorAll(".password-otp");
  const verifyBtn = document.getElementById("verifyPasswordOtpBtn");

  let demoPasswordOtp = "789456"; // 🔥 demo OTP

  // UPDATE & VERIFY CLICK
  updateBtn.addEventListener("click", function () {

    // Basic validation
    const inputs = document.querySelectorAll("#passwordBox input[type='password']");
    if ([...inputs].some(input => !input.value)) {
      alert("Please fill all password fields");
      return;
    }

    // OTP section open
    otpSection.classList.remove("d-none");

    alert("Demo Password OTP sent to email: 789456");
  });

  // AUTO MOVE OTP
  otpInputs.forEach((input, index) => {
    input.addEventListener("input", () => {
      if (input.value && index < otpInputs.length - 1) {
        otpInputs[index + 1].focus();
      }
    });

    input.addEventListener("keydown", (e) => {
      if (e.key === "Backspace" && !input.value && index > 0) {
        otpInputs[index - 1].focus();
      }
    });
  });

  // VERIFY OTP
  verifyBtn.addEventListener("click", function () {
    let enteredOtp = "";
    otpInputs.forEach(input => enteredOtp += input.value);

    if (enteredOtp === demoPasswordOtp) {

      alert("Password updated & email verified successfully");

      // Reset + close
      document.getElementById("passwordBox").classList.remove("active");
      otpSection.classList.add("d-none");

      otpInputs.forEach(i => i.value = "");

    } else {
      alert("Invalid OTP");
    }
  });

});




// ====== DASHBOARD DROPDOWNS (Optimized) ======
document.addEventListener("DOMContentLoaded", function () {
  const coinToggle = document.getElementById("coinToggle");
  const coinDropdown = document.getElementById("coinDropdown");
  const activityToggle = document.getElementById("activityToggle");
  const activityDropdown = document.getElementById("activityDropdown");

  // Coin Dropdown Toggle
  coinToggle?.addEventListener("click", function (e) {
    e.stopPropagation();
    coinDropdown?.classList.toggle("d-none");
    activityDropdown?.classList.add("d-none"); // Dusra band karein
  });

  // Activity Dropdown Toggle
  activityToggle?.addEventListener("click", function (e) {
    e.stopPropagation();
    activityDropdown?.classList.toggle("d-none");
    coinDropdown?.classList.add("d-none"); // Dusra band karein
  });

  // Bahar click karne par dono band ho jaye
  document.addEventListener("click", () => {
    coinDropdown?.classList.add("d-none");
    activityDropdown?.classList.add("d-none");
  });
});



// PDF Test Logic: Questions free, Answer paid
function openPdfMenu() {
    let check = confirm("Questions Download karein? (FREE)\n\nAnswer Key ke liye Package join karein.");
    if(check) {
        window.open('free-questions.pdf', '_blank'); // Aapka free pdf link
    } else {
        alert("Answer Key dekhne ke liye please package subscribe karein.");
        // window.location.href = "package.html"; 
    }
}

// Live/Practice Language Popup Logic
function startTest(type, lang) {
    alert(type + " shuru ho raha hai " + lang + " bhasha mein!");
    // Yahan test open karne ka logic aayega
}


function initScrollBar() {
  window.addEventListener("scroll", () => {
    let scrolled =
      (window.scrollY /
        (document.body.scrollHeight - window.innerHeight)) * 100;
    document.getElementById("scrollBar").style.width = scrolled + "%";
  });
}
function initCardHover() {
  document
    .querySelectorAll(".nav-tile, .test-card, .coin-card")
    .forEach(card => {
      card.addEventListener("mousemove", e => {
        const r = card.getBoundingClientRect();
        const x = e.clientX - r.left;
        const y = e.clientY - r.top;

        card.style.transform =
          `perspective(800px)
           rotateX(${(y / r.height - 0.5) * 8}deg)
           rotateY(${(x / r.width - 0.5) * -8}deg)
           scale(1.03)`;
      });

      card.addEventListener("mouseleave", () => {
        card.style.transform = "scale(1)";
      });
    });
}
function initRipple() {
  document.querySelectorAll(".btn").forEach(btn => {
    btn.addEventListener("click", function (e) {
      let circle = document.createElement("span");
      circle.className = "ripple";
      this.appendChild(circle);

      let x = e.offsetX;
      let y = e.offsetY;
      circle.style.left = x + "px";
      circle.style.top = y + "px";

      setTimeout(() => circle.remove(), 600);
    });
  });
}
