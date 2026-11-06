/* Checkpoint: фильтр, сортировка, выбор игры, кнопка «Наверх» */
(function () {
    "use strict";

    var filterBar = document.querySelector("[data-filter-bar]");
    var sortBar = document.querySelector("[data-sort-bar]");
    if (filterBar) {
        var cards = Array.prototype.slice.call(document.querySelectorAll("#done .game-card[data-status]"));
        var groups = Array.prototype.slice.call(document.querySelectorAll("#done .franchise"));
        var buttons = Array.prototype.slice.call(filterBar.querySelectorAll("[data-filter]"));
        var flatMode = false;

        var count = function (status) {
            return cards.filter(function (c) {
                return status === "all" || c.dataset.status === status;
            }).length;
        };

        var updateGroups = function () {
            groups.forEach(function (g) {
                g.hidden = flatMode || !g.querySelector(".game-card:not([hidden])");
            });
        };

        buttons.forEach(function (btn) {
            btn.textContent += " (" + count(btn.dataset.filter) + ")";
            btn.addEventListener("click", function () {
                var status = btn.dataset.filter;
                cards.forEach(function (c) {
                    c.hidden = status !== "all" && c.dataset.status !== status;
                });
                updateGroups();
                buttons.forEach(function (b) {
                    var active = b === btn;
                    b.classList.toggle("is-active", active);
                    b.setAttribute("aria-pressed", String(active));
                });
            });
        });
        filterBar.hidden = false;

        if (sortBar && groups.length) {
            var home = cards.map(function (c) { return { card: c, parent: c.parentNode }; });
            var flat = document.createElement("div");
            flat.className = "cards cards--flat";
            flat.hidden = true;
            groups[0].parentNode.insertBefore(flat, groups[0]);

            var num = function (c, key) {
                var v = parseFloat(c.dataset[key]);
                return isNaN(v) ? -1 : v;
            };
            var byTitle = function (a, b) {
                return a.dataset.title.localeCompare(b.dataset.title, "ru");
            };
            var comparators = {
                rating: function (a, b) { return num(b, "rating") - num(a, "rating") || byTitle(a, b); },
                title: byTitle,
                year: function (a, b) { return num(b, "year") - num(a, "year") || byTitle(a, b); }
            };

            var sortButtons = Array.prototype.slice.call(sortBar.querySelectorAll("[data-sort]"));
            sortButtons.forEach(function (btn) {
                btn.addEventListener("click", function () {
                    var mode = btn.dataset.sort;
                    flatMode = mode !== "series";
                    if (flatMode) {
                        cards.slice().sort(comparators[mode]).forEach(function (c) { flat.appendChild(c); });
                    } else {
                        home.forEach(function (h) { h.parent.appendChild(h.card); });
                    }
                    flat.hidden = !flatMode;
                    updateGroups();
                    sortButtons.forEach(function (b) {
                        var active = b === btn;
                        b.classList.toggle("is-active", active);
                        b.setAttribute("aria-pressed", String(active));
                    });
                });
            });
            sortBar.hidden = false;
        }
    }

    var pickButton = document.querySelector("[data-pick-button]");
    var pickResult = document.querySelector("[data-pick-result]");
    if (pickButton && pickResult) {
        var plans = Array.prototype.slice.call(document.querySelectorAll(".plan-card"));
        var last = -1;
        var timer = null;
        var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

        var show = function (index) {
            var card = plans[index];
            var name = card.textContent.trim();
            var series = card.dataset.group;
            pickResult.textContent = "Попробуй: " + name + (series ? " (серия " + series + ")" : "");
            card.classList.add("is-picked");
            card.scrollIntoView({ block: "center", behavior: reduce ? "auto" : "smooth" });
            pickButton.disabled = false;
        };

        var choose = function () {
            var index;
            do {
                index = Math.floor(Math.random() * plans.length);
            } while (plans.length > 1 && index === last);
            return index;
        };

        if (plans.length) {
            pickButton.addEventListener("click", function () {
                clearInterval(timer);
                plans.forEach(function (c) { c.classList.remove("is-picked"); });
                var target = choose();
                last = target;
                if (reduce) {
                    show(target);
                    return;
                }
                pickButton.disabled = true;
                var step = 0;
                timer = setInterval(function () {
                    plans.forEach(function (c) { c.classList.remove("is-picked"); });
                    step += 1;
                    if (step >= 12) {
                        clearInterval(timer);
                        show(target);
                    } else {
                        plans[Math.floor(Math.random() * plans.length)].classList.add("is-picked");
                    }
                }, 90);
            });
            pickButton.hidden = false;
        }
    }
    var toTop = document.querySelector(".to-top");
    if (toTop) {
        toTop.addEventListener("click", function (event) {
            event.preventDefault();
            var calm = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
            window.scrollTo({ top: 0, behavior: calm ? "auto" : "smooth" });
        });
    }
})();
