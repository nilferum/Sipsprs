// https://developer.mozilla.org/ja/docs/Web/JavaScript
// https://gsap.com/docs/v3/Eases/
gsap.registerPlugin(ScrollTrigger, ScrollToPlugin);

const   drawerToggle      = document.querySelector('.menu-toggle');
const   drawer            = document.querySelector('.drawer');
const   galleryStage      = document.querySelector('.gallery__stage');
const   galleryHeading    = document.querySelector('.gallery__heading');

const   isDesktop         = window.matchMedia('(min-width: 769px)');
const   rootFontSize      = parseFloat(getComputedStyle(document.documentElement).fontSize);
const   viewHeight        = window.innerHeight / 100;

// スクロールのオフセット
const   scrollOffsets     = {
    '#gallery': '20vh',
    '#faq':     '-4rem',
};

function scrollToSection(targetID) {
    const target        =   document.querySelector(targetID);
    if (!target)            return;
    const offset        =   parseOffset(scrollOffsets[targetID] ?? '0');
    window.scrollTo({top: target.getBoundingClientRect().top + window.scrollY + offset,});
}

function parseOffset(offsetString) {
    if (offsetString.endsWith('vh'))  return parseFloat(offsetString) * viewHeight;
    if (offsetString.endsWith('rem')) return parseFloat(offsetString) * rootFontSize;
    return parseFloat(offsetString);
}

document.querySelectorAll('[href^="#"]').forEach(link => {
    link.addEventListener('click', e => {
        e.preventDefault();
        scrollToSection(link.getAttribute('href'));
    });
});

// ドロワーナビゲーションの挙動
if (drawer) {
    const drawerAllLinks    = drawer.querySelectorAll('a');

    function openDrawer() {
        drawer.classList.add('is-open');
        drawer.setAttribute('aria-hidden', false);
        drawerToggle.setAttribute('aria-expanded', true);
        drawerToggle.setAttribute('aria-label', 'メニューを閉じる');
    }

    function closeDrawer() {
        drawer.classList.remove('is-open');
        drawer.setAttribute('aria-hidden', true);
        drawerToggle.setAttribute('aria-expanded', false);
        drawerToggle.setAttribute('aria-label', 'メニューを開く');
    }

    function toggleDrawer() {
        drawer.classList.contains('is-open') ? closeDrawer() : openDrawer();
    }

    drawerToggle.addEventListener('click', toggleDrawer);

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && drawer.classList.contains('is-open')) {
            closeDrawer();
        }
    });

    document.addEventListener('click', (e) => {
        if (drawer.classList.contains('is-open')
            && !drawer.contains(e.target)
            && !drawerToggle.contains(e.target)) {
            closeDrawer();
        }
    });

    drawerAllLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            closeDrawer();
        });
    });
}

// ギャラリーの挙動
if (galleryStage) {
    const   couples         = gsap.utils.toArray('[class*="gallery__couple--"]');
    let     currentIndex    = -1;
    let     headingFadedOut = false;
    const   INITIALIZATION  = gsap.killTweensOf;

    const fadein = {
        opacity:    1,
        duration:   1 - 1 / 6,
        delay:      1 / 6,
        y:          '-1lvh',
        ease:       'power1.in',    // t^2として近似
    }

    const fadeout = {
        opacity:    0,
        duration:   1 - 2 / 6,
        delay:      2 / 6,
        y:          '7.86lvh',      // 積分区間をdelay -> delay + duration、被積分関数をease、時間を積分変数として4倍したものを有効数字三桁にした。
        ease:       'expo.out',     // 1-2^(-10t)として近似
    }

    const immediately = {
        duration:   0.5,
        delay:      0,
        y:          0,
        ease:       'power4.inOut',
    }

    ScrollTrigger.create({
        trigger:        galleryStage,
        pin:            true,
        start:          'top top',
        end: isDesktop.matches
            ? `+=${couples.length * 75}%`
            : `+=${couples.length * 65}%`,
        onEnter:        () => gsap.to   (galleryHeading,    {...fadein, ...immediately}),
        onLeaveBack:    () => {
            INITIALIZATION(galleryStage);
            gsap.set  (galleryHeading,    {opacity:0});
            },
        onEnterBack:    () => gsap.set  (galleryStage,      {opacity:1}),
        onUpdate:       (self) => {
            if (self.progress >= 0.1 && !headingFadedOut) {
                gsap.to(galleryHeading, {...fadeout, ...immediately});
                headingFadedOut = true;
            }

            if (self.progress < 0.1 && headingFadedOut) {
                gsap.to(galleryHeading, {...fadein, ...immediately});
                headingFadedOut = false;
            }

            const   newIndex    = Math.min(Math.floor(self.progress * couples.length), couples.length -1);

            if (newIndex !== currentIndex) {
                if (currentIndex >= 0) {
                    INITIALIZATION  (couples[currentIndex]);
                    gsap.to         (couples[currentIndex], {...fadeout});
                }
                    INITIALIZATION  (couples[newIndex]);
                    gsap.to         (couples[newIndex], {...fadein});
                    currentIndex = newIndex;       
            }
        }
    });
}