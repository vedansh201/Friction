import "./prism.js";
import "./style.css";
import gsap from "gsap";

const doors = document.querySelectorAll(".door");
const transition = document.querySelector("#transition");
const transitionTitle = document.querySelector("#transitionTitle");
const transitionNumber = document.querySelector("#transitionNumber");
const aboutButton = document.querySelector("#aboutButton");
const aboutOverlay = document.querySelector("#aboutOverlay");
const closeAbout = document.querySelector("#closeAbout");
const themeButton = document.querySelector("#themeButton");
const themePanel = document.querySelector("#themePanel");
const closeTheme = document.querySelector("#closeTheme");
const themeOptions = document.querySelectorAll(".theme-option");
const cursorDot = document.querySelector(".cursor-dot");
const cursorRing = document.querySelector(".cursor-ring");
const openingScreen = document.querySelector("#openingScreen");
const openingText = document.querySelector(".opening-content span");
const returnMessage = document.querySelector("#returnMessage");
const returnContent = document.querySelector(".return-message-content");
const returnNumber = document.querySelector("#returnNumber");
const returnText = document.querySelector("#returnText");
const returnShow = document.querySelector("#returnShow");


let isTransitioning = false;
doors.forEach((door) => {
  const title = document.createElement("span");
  title.className = "door-title";
  title.textContent = door.dataset.show;
  door.appendChild(title);

});


if (themeButton && themePanel) {

  themeButton.addEventListener("click", () => {

    themePanel.classList.add("active");

  });

}

if (closeTheme && themePanel) {
  closeTheme.addEventListener("click", () => {


    themePanel.classList.remove("active");
  });

}


if (themePanel) {
  themePanel.addEventListener("click", (event) => {
    if (event.target === themePanel) {
      themePanel.classList.remove("active");
    }
  });
}

themeOptions.forEach((option) => {
  option.addEventListener("click", () => {

    const selectedTheme = option.dataset.theme;

    document.documentElement.dataset.theme =
      selectedTheme;


    themeOptions.forEach((item) => {
      item.classList.remove("active");

    });

    option.classList.add("active");


    localStorage.setItem(
      "friction-theme",
      selectedTheme
    );

  });

});


const savedTheme =
  localStorage.getItem("friction-theme");


if (savedTheme) {
  document.documentElement.dataset.theme =
    savedTheme;

  themeOptions.forEach((option) => {

    option.classList.toggle(
      "active",
      option.dataset.theme === savedTheme
    );

  });

} else {

  document.documentElement.dataset.theme =
    "dark";

}

let mouseX = 0;
let mouseY = 0;

let ringX = 0;
let ringY = 0;


window.addEventListener("mousemove", (event) => {

  mouseX = event.clientX;
  mouseY = event.clientY;


  if (cursorDot) {

    gsap.set(cursorDot, {

      x: mouseX,
      y: mouseY

    });

  }

});


function animateCursor() {

  ringX +=(mouseX - ringX) * 0.18;

  ringY +=(mouseY - ringY) * 0.18;


  if (cursorRing) {

    gsap.set(cursorRing, {

      x: ringX,
      y: ringY

    });

  }


  requestAnimationFrame(
    animateCursor
  );

}

animateCursor();


document.addEventListener("mouseleave", () => {

  gsap.to(
    [cursorDot, cursorRing],
    {
      opacity: 0,
      duration: 0.2
    }
  );

});


document.addEventListener("mouseenter", () => {

  gsap.to(
    [cursorDot, cursorRing],
    {
      opacity: 1,
      duration: 0.2
    }
  );

});

window.history.scrollRestoration ="manual";


window.addEventListener("load", () => {

  window.scrollTo(0, 0);

});

window.addEventListener("mousemove", (event) => {

  const x =event.clientX -window.innerWidth / 2;

  const y =event.clientY -window.innerHeight / 2;


  document.documentElement.style.setProperty(
    "--mouse-x",
    x * 0.02
  );

  document.documentElement.style.setProperty(
    "--mouse-y",
    y * 0.02
  );

});


window.addEventListener("load", () => {

  gsap.set(
    [
      ".navbar",
      ".intro .eyebrow",
      ".intro h1",
      ".description",
      ".door",
      ".footer"
    ],
    {
      clearProps: "transform"
    }
  );

  const timeline =
    gsap.timeline();
  timeline

    .from(".navbar", {

      y: -20,
      opacity: 0,
      duration: 0.8,
      ease: "power3.out"

    })

    .from(".intro .eyebrow", {

      y: 15,
      opacity: 0,
      duration: 0.5,
      ease: "power3.out"

    }, "-=0.4")

    .from(".intro h1", {

      y: 35,
      opacity: 0,
      duration: 0.8,
      ease: "power4.out"
    }, "-=0.2")

    .from(".description", {

      y: 15,
      opacity: 0,
      duration: 0.6,
      ease: "power3.out"

    }, "-=0.4")

    .from(".door", {

      y: 30,
      opacity: 0,
      duration: 0.7,
      stagger: 0.06,

      
      ease: "power3.out"

    }, "-=0.25")

    .from(".footer", {

      opacity: 0,
      duration: 0.5

    }, "-=0.35");

});


window.addEventListener("load", () => {

  if (!openingScreen || !openingText) {
    return;
  }
  const openingTimeline =
    gsap.timeline();
  openingTimeline
    .to(openingText, {

      opacity: 1,
      y: 0,
      duration: 1,
      ease: "power3.out"

    })

    .to({}, {

      duration: 0.6

    })

    .to(openingScreen, {
      opacity: 0,
      duration: 1.2,
      ease: "power2.inOut",
      onComplete: () => {
        openingScreen.style.visibility =
          "hidden";

        openingScreen.style.pointerEvents =
          "none";

      }

    });

});

doors.forEach((door) => {
  door.addEventListener("mouseenter", () => {
    if (isTransitioning) {return;}
    gsap.to(door, {
      scale: 1.015,
      duration: 0.5,
      ease: "power3.out"
    });

    const accent =
      getComputedStyle(door)
        .getPropertyValue("--door-accent")
        .trim();
    if (accent) {

      document.documentElement.style.setProperty(
        "--cursor-door-color",
        accent
      );
    }

    if (cursorRing) {cursorRing.classList.add("cursor-ring-active");}
    if (cursorDot) {cursorDot.classList.add("cursor-dot-active");

    }

  });
  door.addEventListener("mouseleave", () => {

    gsap.to(door, {
      scale: 1,
      duration: 0.5,
      ease: "power3.out"
    });
    document.documentElement.style.removeProperty(
      "--cursor-door-color"
    );


    if (cursorRing) {

      cursorRing.classList.remove(
        "cursor-ring-active"
      );

    }


    if (cursorDot) {

      cursorDot.classList.remove(
        "cursor-dot-active"
      );

    }
  });
});

doors.forEach((door, index) => {
  door.addEventListener("click", () => {
    if (isTransitioning) {
      return;
    }
    isTransitioning = true;
    const showName =
      door.dataset.show;
    const number =
      String(index + 1).padStart(2, "0");
    if (transitionTitle) {
      transitionTitle.textContent =
        showName.toUpperCase();
    }
    if (transitionNumber) {
      transitionNumber.textContent =number;
    }
    gsap.set(
      ".transition-content",
      {
        opacity: 0,
        y: 20
      }
    );
    const timeline =
      gsap.timeline();
    timeline
      .set(transition, {
        visibility: "visible",
        pointerEvents: "all"
      })
      .to(transition, {
        opacity: 1,
        duration: 0.7,
        ease: "power2.inOut"
      })
      .to(".transition-content", {
        y: 0,
        opacity: 1,
        duration: 0.8,
        ease: "power3.out"
      }, "-=0.2")
      .to({}, {
        duration: 1
      })
      .to(".transition-content", {
        opacity: 0,
        y: -20,
        duration: 0.5,
        ease: "power3.in"
      })
      .call(() => {
        console.log(
          `Entering ${showName}`
        );
        if (transitionTitle) {
          transitionTitle.textContent =
            `${showName.toUpperCase()} COMING SOON`;
        }
        if (transitionNumber) {
          transitionNumber.textContent =
            "—";
        }
      })
      .to(".transition-content", {
        opacity: 1,
        y: 0,
        duration: 0.6,
        ease: "power3.out"
      })
      .to({}, {
        duration: 1.5
      })
      .to(".transition-content", {
        opacity: 0,
        y: -20,
        duration: 0.5,
        ease: "power3.in"
      })

      .to(transition, {
        opacity: 0,
        duration: 0.8,
        ease: "power2.inOut"
      })
      .set(transition, {
        visibility: "hidden",
        pointerEvents: "none"
      })
      .call(() => {
        isTransitioning = false;
      });
  });
});

if (aboutButton && aboutOverlay) {

  aboutButton.addEventListener("click", () => {
    const timeline =
      gsap.timeline();
    timeline
      .set(aboutOverlay, {
        visibility: "visible",
        pointerEvents: "all"
      })
      .to(aboutOverlay, {
        opacity: 1,
        duration: 0.6,
        ease: "power2.inOut"
      })
      .from(".about-content", {
        y: 40,
        opacity: 0,
        duration: 0.8,
        ease: "power3.out"
      }, "-=0.2");

  });
}



if (closeAbout && aboutOverlay) {
  closeAbout.addEventListener("click", () => {
    gsap.to(aboutOverlay, {
      opacity: 0,
      duration: 0.5,
      ease: "power2.inOut",
      onComplete: () => {
        aboutOverlay.style.visibility =
          "hidden";
        aboutOverlay.style.pointerEvents =
          "none";
      }
    });
  });
}
const roomExitMessages = {
  "Dexter": {
    number: "01",
    text: "YOU MADE IT OUT.",
    show: "DEXTER"
  },
  "Friends": {
    number: "02",
    text: "BACK TO REALITY.",
    show: "FRIENDS"
  },
  "How I Met Your Mother": {
    number: "03",
    text: "SO... HOW DID THAT GO?",
    show: "HOW I MET YOUR MOTHER"
  },
  "The Mentalist": {
    number: "04",
    text: "DID YOU NOTICE EVERYTHING?",
    show: "THE MENTALIST"
  },
  "Breaking Bad": {
    number: "05",
    text: "THAT GOT COMPLICATED.",
    show: "BREAKING BAD"
  },
  "Psych": {
    number: "06",
    text: "YOU ACTUALLY MADE IT.",
    show: "PSYCH"
  },
  "Suits": {
    number: "07",
    text: "BACK TO BUSINESS.",
    show: "SUITS"
  },
  "House": {
    number: "08",
    text: "STILL STANDING.",
    show: "HOUSE"
  },
  "Peaky Blinders": {
    number: "09",
    text: "BACK WHERE YOU BELONG.",
    show: "PEAKY BLINDERS"
  }
};

function showRoomExit(showName) {
  if (
    !returnMessage ||
    !returnContent ||
    !returnNumber ||
    !returnText ||
    !returnShow
  ) {
    return;
  }
  const message =
    roomExitMessages[showName];

  if (!message) {
    return;
  }

  returnNumber.textContent =
    message.number;
  returnText.textContent =
    message.text;
  returnShow.textContent =
    message.show;
  gsap.set(returnContent, {
    opacity: 0,
    y: 30
  });
  const timeline =gsap.timeline();

  timeline

    .set(returnMessage, {
      visibility: "visible",
      pointerEvents: "all"
    })

    .to(returnMessage, {
      opacity: 1,
      duration: 0.8,
      ease: "power2.inOut"
    })
    .to(returnContent, {
      opacity: 1,
      y: 0,
      duration: 0.9,
      ease: "power3.out"
    }, "-=0.3")

    .to({}, {
      duration: 1.8
    })

    .to(returnContent, {
      opacity: 0,
      y: -20,
      duration: 0.6,
      ease: "power3.in"
    })

    .to(returnMessage, {
      opacity: 0,
      duration: 0.8,
      ease: "power2.inOut"

    })

    .set(returnMessage, {
      visibility: "hidden",
      pointerEvents: "none"
    });

}

document.addEventListener("keydown", (event) => {

  if (event.key !== "Escape") {
    return;
  }
  if (
    themePanel &&
    themePanel.classList.contains("active")
  ) {
    themePanel.classList.remove("active");
  }

  if (
    aboutOverlay &&
    aboutOverlay.style.visibility === "visible"
  ) {
    gsap.to(aboutOverlay, {
      opacity: 0,
      duration: 0.4,
      onComplete: () => {
        aboutOverlay.style.visibility ="hidden";
        aboutOverlay.style.pointerEvents ="none";
      }
    });
  }

});

const marvelTribute = document.getElementById("marvel-tribute");
const marvelVideo = document.getElementById("marvel-video");
const marvelVideoWrapper = document.querySelector(".marvel-video-wrapper");

if (marvelTribute) {
  document.body.appendChild(marvelTribute);
}

let marvelShown = false;

async function playMarvelTribute() {
  if (!marvelTribute || !marvelVideo || !marvelVideoWrapper) return;

  marvelShown = true;

  document.body.classList.add("marvel-active");
  marvelTribute.style.visibility = "visible";
  marvelTribute.style.pointerEvents = "auto";
  marvelVideo.currentTime = 0;
  marvelVideo.pause();
  gsap.to(marvelTribute, {
    opacity: 1,
    duration: 0.8,
    ease: "power2.out"
  });
  gsap.fromTo(
    marvelVideoWrapper,
    {
      opacity: 0,
      scale: 0.94
    },
    {
      opacity: 1,
      scale: 1,
      duration: 1.1,
      ease: "power4.out",
      onComplete: async () => {

        try {
          marvelVideo.muted = false;
          await marvelVideo.play();
          console.log("Marvel tribute playback started.");

        } catch (error) {

          console.error(
            "Marvel tribute playback was blocked:",
            error
          );

        }
      }
    }
  );
}

marvelVideo?.addEventListener("ended", () => {
  gsap.to(marvelVideoWrapper, {
    opacity: 0,
    scale: 0.97,
    duration: 0.7,
    ease: "power2.in"
  });
  gsap.to(marvelTribute, {
    opacity: 0,
    duration: 0.9,
    delay: 0.15,
    ease: "power2.out",
    onComplete: () => {
      document.body.classList.remove("marvel-active");
      marvelTribute.style.visibility = "hidden";
      marvelTribute.style.pointerEvents = "none";
      marvelVideo.pause();
      marvelVideo.currentTime = 0;
    }
  });

});

if (!sessionStorage.getItem("frictionMarvelShown")) {

  let activeTime = 0;
  let lastTime = performance.now();

  function trackActiveTime(currentTime) {

    const delta = currentTime - lastTime;

    lastTime = currentTime;

    if (!document.hidden && !marvelShown) {

      activeTime += delta;
      if (activeTime >= 60000) {
        sessionStorage.setItem(
          "frictionMarvelShown",
          "1"
        );

        playMarvelTribute();
        return;
      }
    }

    requestAnimationFrame(trackActiveTime);
  }
  requestAnimationFrame(trackActiveTime);
  document.addEventListener("visibilitychange", () => {

    lastTime = performance.now();

  });

}

let marvelAudioUnlocked = false;

function unlockMarvelAudio() {
  if (marvelAudioUnlocked || !marvelVideo) return;

  marvelAudioUnlocked = true;
  marvelVideo.muted = true;

  const unlockPromise = marvelVideo.play();

  if (unlockPromise !== undefined) {
    unlockPromise
      .then(() => {
        marvelVideo.pause();
        marvelVideo.currentTime = 0;
        marvelVideo.muted = false;

        console.log("Marvel video audio unlocked.");
      })
      .catch(() => {
        marvelAudioUnlocked = false;
      });
  }
}
document.addEventListener("pointerdown", unlockMarvelAudio, {
  once: true
});

document.addEventListener("keydown", unlockMarvelAudio, {
  once: true
});