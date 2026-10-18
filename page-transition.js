/* Studio People: shared page transition */
(function () {
    let isLeaving = false;

    document.addEventListener("click", function (event) {
        const link = event.target && event.target.closest
            ? event.target.closest("a[href]")
            : null;
        if (!link || isLeaving) return;

        if (
            event.button !== 0 ||
            event.metaKey || event.ctrlKey ||
            event.shiftKey || event.altKey ||
            link.target === "_blank" ||
            link.hasAttribute("download")
        ) return;

        let destination;
        try {
            destination = new URL(link.href, window.location.href);
        } catch (_) {
            return;
        }

        if (destination.origin !== window.location.origin) return;

        const current = new URL(window.location.href);
        if (destination.pathname === current.pathname &&
            destination.search === current.search) return;

        event.preventDefault();
        event.stopImmediatePropagation();
        isLeaving = true;

        const body = document.body;
        const reduceMotion = window.matchMedia(
            "(prefers-reduced-motion: reduce)"
        ).matches || body.classList.contains("sp-reduce-motion");

        if (reduceMotion || typeof body.animate !== "function") {
            window.location.assign(destination.href);
            return;
        }

        const currentOpacity = getComputedStyle(body).opacity;
        const fade = body.animate(
            [{ opacity: currentOpacity }, { opacity: 0 }],
            { duration: 800, easing: "ease", fill: "forwards" }
        );

        fade.finished.then(function () {
            window.location.assign(destination.href);
        }).catch(function () {
            window.location.assign(destination.href);
        });
    }, true);
})();
