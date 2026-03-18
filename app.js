/** @typedef {"mecaz" | "anlam" | "soz"} Category */

/**
 * @typedef {Object} ArtType
 * @property {string} name
 * @property {string} tooltip
 */

/**
 * @typedef {Object} Card
 * @property {Category} cat
 * @property {ArtType} answer
 * @property {string} text
 * @property {string} hint
 */

/**
 * @typedef {Object} AppState
 * @property {ReadonlyArray<Card>} cards
 * @property {number} idx
 * @property {boolean} flipped
 * @property {number} known
 */

/**
 * @typedef {Object} DomCache
 * @property {HTMLElement} flipCard
 * @property {HTMLElement} flipContainer
 * @property {HTMLElement} catFront
 * @property {HTMLElement} catBack
 * @property {HTMLElement} cardText
 * @property {HTMLElement} cardAnswer
 * @property {HTMLElement} cardHint
 * @property {HTMLButtonElement} btnPrev
 * @property {HTMLButtonElement} btnNext
 * @property {HTMLButtonElement} btnKnown
 * @property {HTMLElement} knownCount
 */

/** @type {AppState} */
let state = Object.freeze({cards: /** @type {ReadonlyArray<Card>} */ ([]), idx: 0, flipped: false, known: 0});

/** @type {(selector: string) => HTMLElement | null} */
const $ = (selector) => document.querySelector(selector);

/** @type {Readonly<Record<Category, string>>} */
const CAT_LABELS = Object.freeze({mecaz: "Mecaz", anlam: "Anlam", soz: "Söz"});

/** @type {Readonly<DomCache>} */
const dom = Object.freeze({
    flipCard: $("#flip-card"),
    flipContainer: $("#flip-container"),
    catFront: $("#q-cat-front"),
    catBack: $("#q-cat-back"),
    cardText: $("#card-text"),
    cardAnswer: $("#card-answer"),
    cardHint: $("#card-hint"),
    btnPrev: $("#btn-prev"),
    btnNext: $("#btn-next-card"),
    btnKnown: $("#btn-known"),
    knownCount: $("#known-count"),
});

/**
 * @template T
 * @param {ReadonlyArray<T>} source
 * @returns {Readonly<T[]>}
 */
function shuffle(source) {
    const copy = [...source];
    for (let i = copy.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return Object.freeze(copy);
}

/** @param {Partial<AppState>} patch */
function updateState(patch) {
    state = Object.freeze({...state, ...patch});
}

/** @returns {void} */
function buildDeck() {
    updateState({cards: shuffle(DATA), idx: 0, flipped: false, known: 0});
    dom.knownCount.textContent = "0";
}

/** @returns {void} */
function renderCard() {
    const card = state.cards[state.idx];
    updateState({flipped: false});
    dom.flipCard.classList.remove("flipped");

    const catLabel = CAT_LABELS[card.cat];
    dom.catFront.textContent = catLabel;
    dom.catBack.textContent = catLabel;
    dom.cardText.textContent = card.text;
    dom.cardAnswer.textContent = "";
    const nameNode = document.createTextNode(card.answer.name);
    const tooltipEl = document.createElement("span");
    tooltipEl.className = "wiki-tooltip";
    tooltipEl.textContent = card.answer.tooltip;
    dom.cardAnswer.appendChild(nameNode);
    dom.cardAnswer.appendChild(tooltipEl);
    dom.cardHint.textContent = card.hint;

    dom.btnPrev.disabled = state.idx === 0;
    dom.btnNext.disabled = state.idx >= state.cards.length - 1;
    dom.btnKnown.disabled = true;
}

/** @returns {void} */
function flipCard() {
    const flipped = !state.flipped;
    updateState({flipped});
    dom.flipCard.classList.toggle("flipped", flipped);
    dom.btnKnown.disabled = !flipped;
}

/** @param {number} newIdx */
function goToCard(newIdx) {
    if (!state.flipped) {
        updateState({idx: newIdx});
        renderCard();
        return;
    }
    updateState({flipped: false});
    dom.flipCard.classList.remove("flipped");
    setTimeout(() => {
        updateState({idx: newIdx});
        renderCard();
    }, 100);
}

/** @returns {void} */
function nextCard() {
    if (state.idx >= state.cards.length - 1) {
        return;
    }
    goToCard(state.idx + 1);
}

/** @returns {void} */
function prevCard() {
    if (state.idx <= 0) {
        return;
    }
    goToCard(state.idx - 1);
}

/** @returns {void} */
function markKnown() {
    if (!state.flipped) {
        return;
    }
    updateState({known: state.known + 1});
    dom.knownCount.textContent = String(state.known);
    nextCard();
}

dom.flipContainer.addEventListener("click", flipCard);
dom.btnNext.addEventListener("click", nextCard);
dom.btnPrev.addEventListener("click", prevCard);
dom.btnKnown.addEventListener("click", markKnown);

/** @type {Readonly<Record<string, (e: KeyboardEvent) => void>>} */
const KEY_ACTIONS = Object.freeze({
    " ": (e) => {
        e.preventDefault();
        flipCard();
    },
    "Enter": (e) => {
        e.preventDefault();
        flipCard();
    },
    "ArrowRight": () => {
        nextCard();
    },
    "d": () => {
        nextCard();
    },
    "ArrowLeft": () => {
        prevCard();
    },
    "a": () => {
        prevCard();
    },
    "k": () => {
        markKnown();
    },
});

document.addEventListener("keydown", (e) => {
    const action = KEY_ACTIONS[e.key];
    if (!action) {
        return;
    }
    action(e);
});

/** @param {HTMLElement} container */
((container) => {
    /** @type {number} */
    let startX = 0;
    /** @type {number} */
    const SWIPE_THRESHOLD = 50;

    container.addEventListener("touchstart", (e) => {
        startX = e.changedTouches[0].clientX;
    }, {passive: true});

    container.addEventListener("touchend", (e) => {
        const diff = e.changedTouches[0].clientX - startX;
        if (Math.abs(diff) < SWIPE_THRESHOLD) {
            return;
        }
        if (diff < 0) {
            nextCard();
            return;
        }
        prevCard();
    }, {passive: true});
})(dom.flipContainer);

buildDeck();
renderCard();
