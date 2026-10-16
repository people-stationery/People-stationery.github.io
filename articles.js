/* ========================================
   Studio People - 自動記事一覧
   1.html、2.html、3.html ... の連番を検出して表示
======================================== */
document.addEventListener("DOMContentLoaded", async function () {
    const list = document.getElementById("articleList");
    if (!list) return;

    const repoOwner = "people-stationery";
    const repoName = "People-stationery.github.io";
    const branch = "main";
    const apiUrl = `https://api.github.com/repos/${repoOwner}/${repoName}/contents/?per_page=100`;

    try {
        const response = await fetch(apiUrl, {
            headers: { "Accept": "application/vnd.github+json" }
        });
        if (!response.ok) throw new Error("記事一覧を取得できませんでした");

        const files = await response.json();
        const articleFiles = files
            .filter(file => file.type === "file" && /^\d+\.html$/i.test(file.name))
            .map(file => ({ ...file, number: Number(file.name.match(/^(\d+)\.html$/i)[1]) }))
            .sort((a, b) => b.number - a.number);

        if (articleFiles.length === 0) {
            list.textContent = "記事はまだありません。";
            return;
        }

        const articles = await Promise.all(articleFiles.map(async file => {
            const pageResponse = await fetch(
                `https://raw.githubusercontent.com/${repoOwner}/${repoName}/${branch}/${file.name}`
            );
            if (!pageResponse.ok) return null;

            const html = await pageResponse.text();
            const doc = new DOMParser().parseFromString(html, "text/html");
            const heading = doc.querySelector("main h1, h1");
            const pageTitle = (doc.title || "").replace(/\s*[|｜]\s*(人文房具|studio people).*$/i, "").trim();
            const title = (heading?.textContent || pageTitle || file.name)
                .replace(/\s+/g, " ")
                .trim();
            const dateText = doc.querySelector(".small-title")?.textContent || "";
            const dateMatch = dateText.match(/(\d{4})[./年-](\d{1,2})[./月-](\d{1,2})/);
            const date = dateMatch
                ? `${dateMatch[1]}/${Number(dateMatch[2])}/${Number(dateMatch[3])}`
                : "";
            return { href: file.name, title, date, number: file.number };
        }));

        const validArticles = articles.filter(Boolean);
        const limit = Number(list.dataset.articleLimit) || validArticles.length;
        const visibleArticles = validArticles.slice(0, limit);
        list.replaceChildren();

        visibleArticles.forEach((article, index) => {
            const card = document.createElement("a");
            card.href = article.href;
            card.className = "article-card";

            if (list.closest(".article-page")) {
                card.classList.add(["from-left", "from-bottom", "from-right"][index % 3]);
            }

            const category = document.createElement("p");
            category.className = "category";
            category.textContent = "BLOG";

            const heading = document.createElement("h3");
            heading.textContent = article.title;

            card.append(category, heading);

            if (article.date) {
                const date = document.createElement("p");
                date.className = "article-date";
                date.textContent = article.date;
                card.append(date);
            }

            list.append(card);
        });

        if (list.closest(".article-page")) {
            const cards = list.querySelectorAll(".article-card");
            if ("IntersectionObserver" in window) {
                const observer = new IntersectionObserver(entries => {
                    entries.forEach(entry => {
                        if (entry.isIntersecting) {
                            entry.target.classList.add("is-visible");
                            observer.unobserve(entry.target);
                        }
                    });
                }, { threshold: 0.15 });
                cards.forEach(card => observer.observe(card));
            } else {
                cards.forEach(card => card.classList.add("is-visible"));
            }
        }
    } catch (error) {
        console.error("Studio People: 記事の自動読み込みに失敗しました。", error);
        const message = document.createElement("p");
        message.textContent = "記事を読み込めませんでした。時間をおいて再度お試しください。";
        list.replaceChildren(message);
    }
});
