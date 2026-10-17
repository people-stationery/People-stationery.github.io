/* ========================================
   Studio People — motion system
   Soft reveals, tactile feedback, scroll progress
======================================== */
(function () {
    "use strict";

    function initMotion() {
        var body = document.body;
        if (!body) return;

        body.classList.add("motion-enabled");

        /* A slim progress line that tracks page scrolling. */
        var progress = document.createElement("div");
        progress.className = "scroll-progress";
        progress.setAttribute("aria-hidden", "true");
        body.appendChild(progress);

        var ticking = false;
        function updateProgress() {
            var root = document.documentElement;
            var maxScroll = root.scrollHeight - window.innerHeight;
            var amount = maxScroll > 0 ? window.scrollY / maxScroll : 0;
            progress.style.transform = "scaleX(" + Math.max(0, Math.min(1, amount)) + ")";
            ticking = false;
        }
        function onScroll() {
            if (!ticking) {
                window.requestAnimationFrame(updateProgress);
                ticking = true;
            }
        }
        window.addEventListener("scroll", onScroll, { passive: true });
        window.addEventListener("resize", updateProgress);
        updateProgress();

        /* Reveal meaningful content gently as it enters the viewport. */
        var selectors = [
            ".hero > *",
            ".youtube-area",
            ".articles h2",
            ".article-card",
            ".series-section",
            ".stationery-card",
            ".catalog-tabs-wrap",
            ".catalog-panel",
            ".about > *",
            ".article > *"
        ];

        var candidates = document.querySelectorAll(selectors.join(","));
        var revealItems = [];
        candidates.forEach(function (item) {
            if (item.classList.contains("motion-reveal")) return;
            item.classList.add("motion-reveal");
            revealItems.push(item);
        });

        if ("IntersectionObserver" in window &&
            !window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
            var observer = new IntersectionObserver(function (entries) {
                entries.forEach(function (entry) {
                    if (!entry.isIntersecting) return;
                    entry.target.classList.add("is-visible");
                    observer.unobserve(entry.target);
                });
            }, {
                threshold: 0.08,
                rootMargin: "0px 0px -36px 0px"
            });

            revealItems.forEach(function (item, index) {
                item.style.setProperty("--motion-delay", Math.min(index % 5, 4) * 55 + "ms");
                observer.observe(item);
            });
        } else {
            revealItems.forEach(function (item) {
                item.classList.add("is-visible");
            });
        }
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", initMotion, { once: true });
    } else {
        initMotion();
    }
})();
