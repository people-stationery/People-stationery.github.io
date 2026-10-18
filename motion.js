/* ========================================
   Studio People — scroll-driven motion
   Motion follows downward scrolling and never reverses.
======================================== */
(function () {
    "use strict";

    function initMotion() {
        var body = document.body;
        if (!body) return;

        body.classList.add("motion-enabled");

        /* Scroll progress line */
        var progress = document.createElement("div");
        progress.className = "scroll-progress";
        progress.setAttribute("aria-hidden", "true");
        body.appendChild(progress);

        var selectors = [
            ".youtube-area",
            ".home-quicklink",
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
            item.style.setProperty("--scroll-reveal-progress", "0");
            revealItems.push({ element: item, progress: 0, done: false });
        });

        var reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        if (reducedMotion) {
            revealItems.forEach(function (item) {
                item.element.classList.add("is-visible");
            });
        }

        var ticking = false;

        function clamp(value, min, max) {
            return Math.max(min, Math.min(max, value));
        }

        function updateMotion(allowReveal) {
            var root = document.documentElement;
            var maxScroll = root.scrollHeight - window.innerHeight;
            var amount = maxScroll > 0 ? window.scrollY / maxScroll : 0;
            progress.style.transform = "scaleX(" + clamp(amount, 0, 1) + ")";
            
            if (!reducedMotion && allowReveal) {
                revealItems.forEach(function (item) {
                    if (item.done) return;

                    var rect = item.element.getBoundingClientRect();
                    /* Starts as the element enters the viewport, completes after
                       moving through the first 55% of viewport height. */
                    var next = clamp((window.innerHeight * 0.92 - rect.top) /
                        (window.innerHeight * 0.55), 0, 1);

                    /* Keep the furthest progress reached: upward scrolling never
                       makes an element move backward. */
                    item.progress = Math.max(item.progress, next);
                    item.element.style.setProperty(
                        "--scroll-reveal-progress",
                        String(item.progress)
                    );

                    if (item.progress >= 1) {
                        item.done = true;
                        item.element.classList.add("is-visible");
                        item.element.style.removeProperty("--scroll-reveal-progress");
                        item.element.style.removeProperty("opacity");
                        item.element.style.removeProperty("transform");
                    }
                });
            }

            ticking = false;
        }

        function requestUpdate() {
            if (ticking) return;
            ticking = true;
            window.requestAnimationFrame(updateMotion);
        }

        window.addEventListener("scroll", requestUpdate, { passive: true });
        window.addEventListener("resize", function () { updateMotion(false); });
        updateMotion(false);
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", initMotion, { once: true });
    } else {
        initMotion();
    }
})();
