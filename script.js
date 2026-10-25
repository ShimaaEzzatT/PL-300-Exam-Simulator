
/* =========================================================
   PL-300 Exam Simulator
   Application Logic and Interface State Management
   ========================================================= */

"use strict";

/* 1. Application Configuration */

const APP_CONFIG = Object.freeze({
    practiceQuestionCount: 60,
    practiceDurationMinutes: 100,
    caseStudyDurationMinutes: 20,
    skillDomainCount: 4,

    // Existing client-side practice access code.
    examAccessCode: "PL300-2026"
});

/*
 * The validated question bank must be connected before
 * the actual examination can start.
 *
 * Do not populate this object with invented questions.
 */
const QUESTION_BANK = null;


/* 2. DOM Element References */

const elements = {
    introductionView: document.getElementById("introduction-view"),
    entryView: document.getElementById("entry-view"),
    caseStudyView: document.getElementById("contoso-case-study"),
    caseStudyContent: document.getElementById("case-study-content"),
    caseNavigation: document.getElementById("case-study-navigation"),
    caseMenuToggle: document.getElementById("case-study-menu-toggle"),
    casePreviousButton: document.getElementById("case-previous"),
    caseNextButton: document.getElementById("case-next"),
    casePageIndicator: document.getElementById("case-page-indicator"),
    caseExitButton: document.getElementById("case-study-exit"),
    caseReviewStatus: document.getElementById("case-review-status"),
    caseReviewScore: document.getElementById("case-review-score"),
    caseTimer: document.getElementById("case-timer"),
    caseTimerDisplay: document.getElementById("case-timer-display"),
    caseTimerProgress: document.getElementById("case-timer-progress"),
    caseTimeoutOverlay: document.getElementById("case-timeout-overlay"),
    caseTimeoutContinue: document.getElementById("case-timeout-continue"),

    startButton: document.getElementById("start-button"),
    backButton: document.getElementById("back-button"),

    // Existing or optional navigation elements.
    entryBackButton: document.getElementById("entry-back-button"),

    // New Are You Ready? page buttons.
    readinessBackButton: document.getElementById(
        "back-to-introduction"
    ),

    confirmReadyButton: document.getElementById(
        "confirm-readiness"
    ),

    // Status message area.
    entryStatus: document.getElementById("entry-status"),

    mainContent: document.getElementById("main-content"),

    // Access Code Modal.
    accessCodeModal: document.getElementById("access-code-modal"),
    accessModalDialog: document.querySelector(
        "#access-code-modal .access-modal-dialog"
    ),
    accessModalTitle: document.getElementById("access-modal-title"),
    accessCodeForm: document.getElementById("access-code-form"),
    accessCodeInput: document.getElementById("exam-access-code"),
    accessCodeError: document.getElementById("access-code-error"),
    toggleAccessCodeButton: document.getElementById(
        "toggle-access-code"
    ),
    verifyAccessCodeButton: document.getElementById(
        "verify-access-code"
    ),
    cancelAccessCodeButton: document.getElementById(
        "cancel-access-code"
    ),
    accessModalCloseButton: document.getElementById(
        "access-modal-close"
    )
};


/* 3. Application State */

const applicationState = {
    currentView: "introduction",
    readinessConfirmed: false,

    accessModalPreviousFocus: null,
    accessModalPreviousOverflow: "",
    isVerifyingAccessCode: false,
    caseSection: "overview",
    caseTimerStarted: false,
    caseTimerExpired: false,
    caseTimerDeadline: null,
    caseTimerInterval: null,
    caseTimeoutDismissed: false,
 caseAnswers: { workspace: "", dataset: "" },
caseSubmitted: false,
caseScore: null,


    // Question 02 — Independent answer state
    case2Answers: { distribution: "", audience: "" },
    case2Submitted: false,
    case2Score: null,

    // Question 03 — Scheduled Refresh
    case3Answer: "",
    case3Submitted: false,
    case3Score: null,

    // Question 04 — Minimum Number of Datasets
    case4Answer: "",
    case4Submitted: false,
    case4Score: null,
    
    // Question 05 — Balance Sheet Relationships
    case5Answer: "",
    case5Submitted: false,
    case5Score: null,

    // Question 06 — Revenue Comparison Using Time Intelligence
    case6Answer: "",
    case6Submitted: false,
    case6Score: null

};



/* 4. General Helpers */

function getScrollBehavior() {
    const prefersReducedMotion = window.matchMedia(
        "(prefers-reduced-motion: reduce)"
    ).matches;

    return prefersReducedMotion ? "auto" : "smooth";
}

function scrollToTop() {
    window.scrollTo({
        top: 0,
        behavior: getScrollBehavior()
    });
}

function getFocusableElements(container) {
    if (!container) {
        return [];
    }

    return Array.from(
        container.querySelectorAll(
            'button:not([disabled]), ' +
            'input:not([disabled]), ' +
            'select:not([disabled]), ' +
            'textarea:not([disabled]), ' +
            'a[href], ' +
            '[tabindex]:not([tabindex="-1"])'
        )
    ).filter((element) => {
        return (
            !element.hidden &&
            element.getAttribute("aria-hidden") !== "true"
        );
    });
}


/* 5. Status Message Management */

function ensureEntryStatus() {
    if (elements.entryStatus) {
        return elements.entryStatus;
    }

    if (!elements.entryView) {
        return null;
    }

    const status = document.createElement("div");

    status.id = "entry-status";
    status.className = "entry-status";
    status.setAttribute("role", "status");
    status.setAttribute("aria-live", "polite");

    const readinessActions = elements.entryView.querySelector(
        ".readiness-actions"
    );

    if (readinessActions) {
        readinessActions.insertAdjacentElement("beforebegin", status);
    } else {
        elements.entryView.appendChild(status);
    }

    elements.entryStatus = status;

    return status;
}

function showEntryStatus(messageText, type = "info") {
    const status = ensureEntryStatus();

    if (!status) {
        console.warn(messageText);
        return;
    }

    status.replaceChildren();
    status.classList.remove("is-confirmed", "is-error");

    const icon = document.createElement("span");
    icon.setAttribute("aria-hidden", "true");

    const message = document.createElement("p");
    message.textContent = messageText;

    if (type === "success") {
        icon.textContent = "✓";
        status.classList.add("is-confirmed");
    } else if (type === "error") {
        icon.textContent = "!";
        status.classList.add("is-error");
    } else {
        icon.textContent = "i";
    }

    status.append(icon, message);
}

function clearEntryStatus() {
    const status = ensureEntryStatus();

    if (!status) {
        return;
    }

    status.classList.remove("is-confirmed", "is-error");
    status.replaceChildren();
}


/* 6. View Navigation */

function showIntroduction() {
    applicationState.currentView = "introduction";
    applicationState.readinessConfirmed = false;

    if (elements.entryView) {
        elements.entryView.hidden = true;
    }
    if (elements.caseStudyView) elements.caseStudyView.hidden = true;

    if (elements.introductionView) {
        elements.introductionView.hidden = false;
    }

    clearEntryStatus();
    scrollToTop();

    if (elements.startButton) {
        elements.startButton.focus({
            preventScroll: true
        });
    }
}

function showEntryView() {
    applicationState.currentView = "entry";
    applicationState.readinessConfirmed = false;

    if (elements.introductionView) {
        elements.introductionView.hidden = true;
    }

    if (elements.entryView) {
        elements.entryView.hidden = false;
    }

    clearEntryStatus();
    scrollToTop();

    if (elements.entryView) {
        elements.entryView.focus({
            preventScroll: true
        });
    }
}

function handleBackToIntroduction() {
    closeAccessCodeModal(false);
    showIntroduction();
}


/* 7. Access Code Modal */

function clearAccessCodeError() {
    if (elements.accessCodeError) {
        elements.accessCodeError.textContent = "";
        elements.accessCodeError.hidden = true;
    }

    if (elements.accessCodeInput) {
        elements.accessCodeInput.removeAttribute("aria-invalid");
    }
}

function showAccessCodeError(messageText) {
    if (elements.accessCodeError) {
        elements.accessCodeError.textContent = messageText;
        elements.accessCodeError.hidden = false;
    }

    if (elements.accessCodeInput) {
        elements.accessCodeInput.setAttribute(
            "aria-invalid",
            "true"
        );

        elements.accessCodeInput.focus();
    }
}

function openAccessCodeModal() {
    if (!elements.accessCodeModal) {
        console.error(
            "Access Code Modal was not found. " +
            "Check the modal HTML and its element IDs."
        );

        return;
    }

    if (
        elements.accessCodeModal.classList.contains("is-open")
    ) {
        return;
    }

    applicationState.accessModalPreviousFocus =
        document.activeElement;

    applicationState.accessModalPreviousOverflow =
        document.body.style.overflow;

    clearAccessCodeError();

    if (elements.accessCodeInput) {
        elements.accessCodeInput.value = "";
        elements.accessCodeInput.type = "password";
    }

    if (elements.toggleAccessCodeButton) {
        elements.toggleAccessCodeButton.setAttribute(
            "aria-pressed",
            "false"
        );
    }

    elements.accessCodeModal.hidden = false;
    elements.accessCodeModal.classList.add("is-open");

    document.body.style.overflow = "hidden";

    if (elements.accessCodeInput) {
        elements.accessCodeInput.focus();
    } else if (elements.accessModalCloseButton) {
        elements.accessModalCloseButton.focus();
    }
}

function closeAccessCodeModal(restoreFocus = true) {
    if (!elements.accessCodeModal) {
        return;
    }

    elements.accessCodeModal.classList.remove("is-open");
    elements.accessCodeModal.hidden = true;

    document.body.style.overflow =
        applicationState.accessModalPreviousOverflow;

    clearAccessCodeError();

    applicationState.isVerifyingAccessCode = false;

    if (
        elements.verifyAccessCodeButton &&
        "disabled" in elements.verifyAccessCodeButton
    ) {
        elements.verifyAccessCodeButton.disabled = false;
    }

    if (
        restoreFocus &&
        applicationState.accessModalPreviousFocus &&
        typeof applicationState.accessModalPreviousFocus.focus ===
            "function"
    ) {
        applicationState.accessModalPreviousFocus.focus({
            preventScroll: true
        });
    }
}

function handleAccessCodeSubmission(event) {
    event.preventDefault();

    if (applicationState.isVerifyingAccessCode) {
        return;
    }

    if (!elements.accessCodeInput) {
        showAccessCodeError(
            "The Access Code input field could not be found."
        );

        return;
    }

    const enteredCode = elements.accessCodeInput.value.trim();
    const configuredCode = String(APP_CONFIG.examAccessCode);

    clearAccessCodeError();

    if (!enteredCode) {
        showAccessCodeError(
            "Please enter your Access Code to continue."
        );

        return;
    }

    if (
        !configuredCode ||
        configuredCode === "EXAM_ACCESS_CODE"
    ) {
        showAccessCodeError(
            "Please configure your exam Access Code in script.js first."
        );

        console.error(
            "Set APP_CONFIG.examAccessCode to your intended access code."
        );

        return;
    }

    applicationState.isVerifyingAccessCode = true;

    if (elements.verifyAccessCodeButton) {
        elements.verifyAccessCodeButton.disabled = true;
    }

    if (enteredCode !== configuredCode) {
        applicationState.isVerifyingAccessCode = false;

        if (elements.verifyAccessCodeButton) {
            elements.verifyAccessCodeButton.disabled = false;
        }

        showAccessCodeError(
            "The Access Code is incorrect. Please try again."
        );

        return;
    }

    closeAccessCodeModal(false);
    showCaseStudyView();
}

function toggleAccessCodeVisibility() {
    if (!elements.accessCodeInput) {
        return;
    }

    const currentlyHidden =
        elements.accessCodeInput.type === "password";

    elements.accessCodeInput.type = currentlyHidden
        ? "text"
        : "password";

    if (elements.toggleAccessCodeButton) {
        elements.toggleAccessCodeButton.setAttribute(
            "aria-pressed",
            String(currentlyHidden)
        );

        elements.toggleAccessCodeButton.setAttribute(
            "aria-label",
            currentlyHidden ? "Hide access code" : "Show access code"
        );
    }

    elements.accessCodeInput.focus();
}

function handleAccessModalKeydown(event) {
    if (
        !elements.accessCodeModal ||
        !elements.accessCodeModal.classList.contains("is-open")
    ) {
        return;
    }

    if (event.key === "Escape") {
        event.preventDefault();
        closeAccessCodeModal();
        return;
    }

    if (event.key !== "Tab") {
        return;
    }

    const focusableElements = getFocusableElements(
        elements.accessModalDialog ||
        elements.accessCodeModal
    );

    if (focusableElements.length === 0) {
        event.preventDefault();
        return;
    }

    const firstElement = focusableElements[0];
    const lastElement = focusableElements[
        focusableElements.length - 1
    ];

    if (
        event.shiftKey &&
        document.activeElement === firstElement
    ) {
        event.preventDefault();
        lastElement.focus();
    } else if (
        !event.shiftKey &&
        document.activeElement === lastElement
    ) {
        event.preventDefault();
        firstElement.focus();
    }
}

function handleAccessModalBackdropClick(event) {
    if (
        elements.accessCodeModal &&
        event.target === elements.accessCodeModal
    ) {
        closeAccessCodeModal();
    }
}


/* 8. Contoso Case Study Workspace */
const CASE_SECTIONS = [
    "overview",
    "environment",
    "sources",
    "balance",
    "products",
    "issues",
    "requirements",
    "technical",
    "security",
    "reports",
    "date-table",
    "question",
    "question-2",
    "question-3",
    "question-4",
    "question-5",
    "question-6"
];
const CASE_TITLES = {
    overview: "Introductory Info Case Study",
    environment: "Existing Environment",
    sources: "Data and Sources",
    balance: "Balance Sheet Data",
    products: "Product Catalog Data",
    issues: "Business Issues",
    requirements: "Requirements",
    technical: "Technical Requirements",
    security: "Security Requirements",
    reports: "Report Requirements",
    "date-table": "Date Table",
    question: "Question 01",
    "question-2": "Question 02",
    review: "Review Status",
    "question-3": "Question 03",
    "question-4": "Question 04",
    "question-5": "Question 05",
    "question-6": "Question 06"

};
const BALANCE_ROWS = [
    ["Current assets", "Cash and cash equivalents", 3, 2020, "20,289"], ["Current assets", "Inventories", 3, 2020, "4,855"], ["Long-term liabilities", "Long-term debt", 3, 2020, "50,207"],
    ["Current assets", "Cash and cash equivalents", 2, 2020, "28,209"], ["Current assets", "Inventories", 2, 2020, "5,845"], ["Long-term liabilities", "Long-term debt", 2, 2020, "49,887"],
    ["Current assets", "Cash and cash equivalents", 1, 2020, "25,567"], ["Current assets", "Inventories", 1, 2020, "65,998"], ["Long-term liabilities", "Long-term debt", 1, 2020, "46,124"]
];
const PRODUCT_ROWS = [
    ["HL-U509-R", "Sport-100 Helmet, Red", "Universal fit, well-vented, lightweight, snap-on visor", "Accessories", "Unit A"],
    ["RA-H123", "Hitch Rack - 4-Bike", "Carries four bikes securely, steel construction, fits a 2-inch receiver hitch", "Accessories", "Unit A"],
    ["BK-M18S-40", "Mountain-500 Silver, 40", "Suitable for any type of riding, on- or off-road, fits any budget, smooth-shifting with a comfortable ride", "Bikes", "Unit B"],
    ["FD-2342", "Front Derailleur", "Wide-link design", "Components", "Unit A"]
];
const DATE_ROWS = [["Date", "Date", "4-Apr-2020"], ["Month", "Integer", "202004"], ["Month Name", "Text", "February"], ["Quarter", "Integer", "202002"], ["Year", "Integer", "2020"]];
function safeText(value) { return String(value).replace(/[&<>"']/g, ch => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[ch])); }
function renderCaseTable(headers, rows) {
    return `<div class="case-table-wrap" role="region" tabindex="0" aria-label="Scrollable data table"><table class="case-data-table"><thead><tr>${headers.map(h => `<th scope="col">${safeText(h)}</th>`).join("")}</tr></thead><tbody>${rows.map(row => `<tr>${row.map(cell => `<td>${safeText(cell)}</td>`).join("")}</tr>`).join("")}</tbody></table></div>`;
}
/* Case study countdown timer */
const CASE_STUDY_DURATION_SECONDS = APP_CONFIG.caseStudyDurationMinutes * 60;

function formatCaseTime(totalSeconds) {
    const safeSeconds = Math.max(0, Math.floor(totalSeconds));
    const minutes = String(Math.floor(safeSeconds / 60)).padStart(2, "0");
    const seconds = String(safeSeconds % 60).padStart(2, "0");
    return `${minutes}:${seconds}`;
}

function updateCaseTimerDisplay(secondsRemaining) {
    if (elements.caseTimerDisplay) {
        elements.caseTimerDisplay.textContent = formatCaseTime(secondsRemaining);
    }
    if (elements.caseTimerProgress) {
        const percentage = Math.max(0, Math.min(100,
            (secondsRemaining / CASE_STUDY_DURATION_SECONDS) * 100));
        elements.caseTimerProgress.style.width = `${percentage}%`;
    }
    if (elements.caseTimer) {
        elements.caseTimer.classList.toggle("is-warning", secondsRemaining <= 300 && secondsRemaining > 60);
        elements.caseTimer.classList.toggle("is-critical", secondsRemaining <= 60);
        elements.caseTimer.setAttribute("aria-label",
            `${Math.floor(secondsRemaining / 60)} minutes and ${secondsRemaining % 60} seconds remaining`);
    }
}

function showCaseTimeout() {
    if (applicationState.caseTimerExpired) return;
    applicationState.caseTimerExpired = true;
    applicationState.caseTimerDeadline = null;
    if (applicationState.caseTimerInterval) {
        window.clearInterval(applicationState.caseTimerInterval);
        applicationState.caseTimerInterval = null;
    }
    updateCaseTimerDisplay(0);
    if (elements.caseTimer) elements.caseTimer.classList.add("is-expired");
    if (elements.caseTimeoutOverlay) {
        elements.caseTimeoutOverlay.hidden = false;
        requestAnimationFrame(() => {
            elements.caseTimeoutOverlay.classList.add("is-visible");
            if (elements.caseTimeoutContinue) elements.caseTimeoutContinue.focus();
        });
    }
}

function tickCaseTimer() {
    if (!applicationState.caseTimerDeadline || applicationState.caseTimerExpired) return;
    const secondsRemaining = Math.max(0,
        Math.ceil((applicationState.caseTimerDeadline - Date.now()) / 1000));
    updateCaseTimerDisplay(secondsRemaining);
    if (secondsRemaining <= 0) showCaseTimeout();
}

function startCaseStudyTimer() {
    if (applicationState.caseTimerStarted) {
        tickCaseTimer();
        return;
    }
    applicationState.caseTimerStarted = true;
    applicationState.caseTimerDeadline = Date.now() + CASE_STUDY_DURATION_SECONDS * 1000;
    updateCaseTimerDisplay(CASE_STUDY_DURATION_SECONDS);
    applicationState.caseTimerInterval = window.setInterval(tickCaseTimer, 250);
}

function dismissCaseTimeout() {
    if (!elements.caseTimeoutOverlay) return;
    elements.caseTimeoutOverlay.classList.remove("is-visible");
    elements.caseTimeoutOverlay.hidden = true;
    applicationState.caseTimeoutDismissed = true;
    if (elements.caseStudyContent) elements.caseStudyContent.focus({ preventScroll: true });
}

function showCaseStudyView() {
    applicationState.currentView = "case-study";
    applicationState.caseSection = "overview";
    if (elements.introductionView) elements.introductionView.hidden = true;
    if (elements.entryView) elements.entryView.hidden = true;
    if (elements.caseStudyView) elements.caseStudyView.hidden = false;
    renderCaseSection("overview");
    startCaseStudyTimer();
    scrollToTop();
    if (elements.caseStudyContent) elements.caseStudyContent.focus({preventScroll:true});
}

function renderQuestion() {
    const submitted = applicationState.caseSubmitted;
    const answers = applicationState.caseAnswers;

    const options1 = [
        "Access permissions to an app",
        "The Member role to the workspace",
        "The Viewer role to the workspace"
    ];

    const options2 = ["Build", "Delete", "Reshare"];

    const selectField = (id, label, options, value, correct) => {
        const isCorrect = submitted && value === correct;

        const cls = submitted
            ? (isCorrect ? " answer-correct" : " answer-incorrect")
            : "";

        return `
            <div class="answer-row${cls}">
                <label for="${id}">${label}</label>
                <div class="answer-control">
                    <select id="${id}" name="${id}" ${submitted ? "disabled" : ""}>
                        <option value="">Select an answer</option>
                        ${options.map(option => `
                            <option value="${safeText(option)}" ${value === option ? "selected" : ""}>
                                ${safeText(option)}
                            </option>
                        `).join("")}
                    </select>
                    ${submitted ? `
                        <p class="answer-result ${isCorrect ? "is-correct" : "is-incorrect"}">
                            ${isCorrect ? "Correct" : "Incorrect"}.
                            Correct answer: <strong>${safeText(correct)}</strong>
                        </p>
                    ` : ""}
                </div>
            </div>
        `;
    };

    return `
        <div class="case-content-heading">
            <span class="case-content-kicker">CONTOSO · ACCESS CONTROL</span>
            <h2>Question 01 — Configure Analyst Access</h2>
            <span class="case-question-points">2 points</span>
        </div>

        <div class="case-question-prompt">
            <p>You need to grant access to the business unit analysts.</p>
            <p>What should you configure? To answer, select the appropriate options in the answer area.</p>
            <p><strong>NOTE:</strong> Each correct selection is worth one point.</p>
        </div>

        <form id="contoso-answer-form" class="case-answer-form" novalidate>
            <h3>Answer Area</h3>

            ${selectField(
                "answer-workspace",
                "Permissions required in powerbi.com",
                options1,
                answers.workspace,
                "The Viewer role to the workspace"
            )}

            ${selectField(
                "answer-dataset",
                "Permissions for the profit and loss dataset",
                options2,
                answers.dataset,
                "Build"
            )}

            <p id="case-answer-validation" class="case-validation" role="alert" hidden></p>

            <div class="case-submit-row">
                <button type="submit" class="button button-primary" ${submitted ? "disabled" : ""}>
                    ${submitted ? "Answer Submitted" : "Submit Answer"}
                </button>

                ${submitted
                    ? `<span class="case-score-pill">Score: ${applicationState.caseScore}/2</span>`
                    : ""}
            </div>
        </form>

        ${submitted ? `
            <section class="case-feedback" aria-live="polite">
                <div class="case-feedback-score">
                    <strong>${applicationState.caseScore}/2</strong>
                    <span>Latest submission score</span>
                </div>

                <h3>Explanation</h3>

                <div class="case-explanation">
                    <h4>Box 1: Viewer Role</h4>
                    <p>
                        The Viewer role provides read-only access to workspace content.
                        It is suitable for analysts who need to view reports without
                        receiving the editing and sharing permissions associated with
                        higher workspace roles.
                    </p>
                </div>

                <div class="case-explanation">
                    <h4>Box 2: Build Permission</h4>
                    <p>
                        Build permission allows analysts to create new reports based
                        on the profit and loss semantic model, subject to the
                        applicable access restrictions.
                    </p>
                </div>

                <div class="case-security-note">
                    <h4>Important security qualification</h4>
                    <ul>
                        <li>Row-level security or an appropriate equivalent must restrict profit and loss data to the analyst's business unit.</li>
                        <li>The balance sheet dataset must not grant analysts Build permission.</li>
                        <li>The board reporting package and analyst-created reports must be separated appropriately.</li>
                        <li>Sharing and workspace permissions must be configured according to the required security model.</li>
                    </ul>
                    <p>The two selected permissions do not, by themselves, enforce every security requirement.</p>
                </div>
            </section>
        ` : ""}
    `;
}

function renderQuestion2() {
    const submitted = applicationState.case2Submitted;
    const answers = applicationState.case2Answers;

    const options1 = [
        "Sharing individual reports",
        "Using a workspace membership",
        "Using an app"
    ];

    const options2 = [
        "A dynamic distribution list",
        "A mail-enabled security group in Azure Active Directory",
        "Individual user emails"
    ];

    const selectField = (id, label, options, value, correct) => {
        const isCorrect = submitted && value === correct;

        const cls = submitted
            ? (isCorrect ? " answer-correct" : " answer-incorrect")
            : "";

        return `
            <div class="answer-row${cls}">
                <label for="${id}">${label}</label>

                <div class="answer-control">
                    <select
                        id="${id}"
                        name="${id}"
                        ${submitted ? "disabled" : ""}
                    >
                        <option value="">Select an answer</option>

                        ${options.map(option => `
                            <option
                                value="${safeText(option)}"
                                ${value === option ? "selected" : ""}
                            >
                                ${safeText(option)}
                            </option>
                        `).join("")}
                    </select>

                    ${submitted ? `
                        <p class="answer-result ${
                            isCorrect ? "is-correct" : "is-incorrect"
                        }">
                            ${isCorrect ? "Correct" : "Incorrect"}.
                            Correct answer:
                            <strong>${safeText(correct)}</strong>
                        </p>
                    ` : ""}
                </div>
            </div>
        `;
    };

    return `
        <div class="case-content-heading">
            <span class="case-content-kicker">
                CONTOSO · REPORT DISTRIBUTION
            </span>

            <h2>Question 02 — Distributing Reports to the Board</h2>

            <span class="case-question-points">2 points</span>
        </div>

        <div class="case-question-prompt">
            <p>
                The reports must be updated with the latest data by
                5 AM each day.
            </p>

            <p>
                How should you distribute the reports to the board?
                To answer, select the appropriate options in the
                answer area.
            </p>

            <p>
                <strong>NOTE:</strong>
                Each correct selection is worth one point.
            </p>
        </div>

        <form id="contoso-answer-form-2"
              class="case-answer-form"
              novalidate>

            <h3>Answer Area</h3>

            ${selectField(
                "answer-distribution-2",
                "Grant access by:",
                options1,
                answers.distribution,
                "Using an app"
            )}

            ${selectField(
                "answer-audience-2",
                "Grant access to:",
                options2,
                answers.audience,
                "A mail-enabled security group in Azure Active Directory"
            )}

            <p id="case-answer-validation-2"
               class="case-validation"
               role="alert"
               hidden></p>

            <div class="case-submit-row">
                <button type="submit"
                        class="button button-primary"
                        ${submitted ? "disabled" : ""}>
                    ${submitted ? "Answer Submitted" : "Submit Answer"}
                </button>

                ${submitted ? `
                    <span class="case-score-pill">
                        Score: ${applicationState.case2Score}/2
                    </span>
                ` : ""}
            </div>
        </form>

        ${submitted ? `
            <section class="case-feedback" aria-live="polite">
                <div class="case-feedback-score">
                    <strong>${applicationState.case2Score}/2</strong>
                    <span>Submission score</span>
                </div>

                <h3>Explanation</h3>

                <p><strong>Correct Answers</strong></p>
                <p>1. Using an app</p>
                <p>
                    2. A mail-enabled security group in Azure Active Directory
                </p>

                <div class="case-explanation">
                    <h4>Box 1: Using an App</h4>

                    <p>
                        Power BI apps provide a convenient way to distribute
                        a curated collection of reports and dashboards to a
                        broad audience. They allow report owners to package
                        content for consumption without requiring every
                        recipient to become a member of the workspace.
                    </p>

                    <p>
                        In this scenario, the board needs a single,
                        organized package of reports with custom navigation
                        and links to supplementary information. A Power BI
                        app is appropriate for distributing that package
                        to the board.
                    </p>
                </div>

                <div class="case-explanation">
                    <h4>
                        Box 2: A Mail-Enabled Security Group in
                        Azure Active Directory
                    </h4>

                    <p>
                        A mail-enabled security group can be used to manage
                        access for a group of users rather than granting
                        access individually.
                    </p>

                    <p>
                        In this scenario, Contoso plans to use an
                        Azure Active Directory group to share information
                        with the board. Granting access through a group
                        simplifies administration because membership can
                        be managed centrally.
                    </p>

                    <p>
                        Azure Active Directory is now known as
                        Microsoft Entra ID.
                    </p>
                </div>

                <div class="case-explanation">
                    <h4>Why the Other Options Are Incorrect</h4>

                    <ul>
                        <li>
                            <strong>Sharing individual reports:</strong>
                            Managing access to individual reports separately
                            increases administrative effort and does not
                            provide the same centralized package experience
                            as an app.
                        </li>

                        <li>
                            <strong>Using a workspace membership:</strong>
                            Giving board members workspace membership
                            grants broader workspace access than necessary
                            for users who only need to consume the
                            published reports.
                        </li>

                        <li>
                            <strong>A dynamic distribution list:</strong>
                            A distribution list is primarily intended for
                            distributing email messages, not for granting
                            Power BI access permissions.
                        </li>

                        <li>
                            <strong>Individual user emails:</strong>
                            Sharing with individual users requires managing
                            access separately for each person, increasing
                            maintenance effort.
                        </li>
                    </ul>
                </div>

                <div class="case-security-note">
                    <h4>Important Note</h4>

                    <p>
                        Using an app and a security group simplifies report
                        distribution, but access must still be configured
                        correctly. The group must contain the intended
                        board members, and the app must be shared with the
                        appropriate audience. Data permissions and refresh
                        configuration must also satisfy the scenario's
                        requirements.
                    </p>
                </div>
            </section>
        ` : ""}
    `;
}

function renderQuestion3() {
    const submitted = applicationState.case3Submitted;
    const answer = applicationState.case3Answer;
    const correctAnswer = "C";

    const options = [
        {
            value: "A",
            text: "From each report in powerbi.com, select Refresh visuals."
        },
        {
            value: "B",
            text: "From Power BI Desktop, download the PBIX file and refresh the data."
        },
        {
            value: "C",
            text: "Configure a scheduled refresh without using an on-premises data gateway."
        },
        {
            value: "D",
            text: "Configure a scheduled refresh by using an on-premises data gateway."
        }
    ];

    return `
        <div class="case-content-heading">
            <span class="case-content-kicker">CONTOSO · DATA REFRESH</span>
            <h2>Question 03 — Scheduled Refresh</h2>
            <span class="case-question-points">1 point</span>
        </div>

        <div class="case-question-prompt">
            <p>The reports must be updated with the latest data by 5 AM each day.</p>
            <p>You need to ensure that the data is updated to meet the report requirements.</p>
            <p>What should you do?</p>
        </div>

        <form id="contoso-answer-form-3" class="case-answer-form" novalidate>
            <h3>Answer Area</h3>

            <div class="case-mcq-options">
                ${options.map(option => `
                    <label class="case-mcq-option ${submitted && option.value === correctAnswer ? "answer-correct" : ""} ${submitted && answer === option.value && answer !== correctAnswer ? "answer-incorrect" : ""}">
                        <input
                            type="radio"
                            name="answer-question-3"
                            value="${option.value}"
                            ${answer === option.value ? "checked" : ""}
                            ${submitted ? "disabled" : ""}
                        >
                        <span><strong>${option.value}.</strong> ${safeText(option.text)}</span>
                    </label>
                `).join("")}
            </div>

            <p id="case-answer-validation-3" class="case-validation" role="alert" hidden></p>

            <div class="case-submit-row">
                <button type="submit" class="button button-primary" ${submitted ? "disabled" : ""}>
                    ${submitted ? "Answer Submitted" : "Submit Answer"}
                </button>

                ${submitted ? `<span class="case-score-pill">Score: ${applicationState.case3Score}/1</span>` : ""}
            </div>
        </form>

        ${submitted ? `
            <section class="case-feedback" aria-live="polite">
                <div class="case-feedback-score">
                    <strong>${applicationState.case3Score}/1</strong>
                    <span>Submission score</span>
                </div>

                <h3>Explanation</h3>

                <div class="case-explanation">
                    <h4>Why C is correct</h4>
                    <p>
                        The data source in this scenario is an Azure SQL Database
                        that uses a public endpoint. Because the database is hosted
                        in Azure and is accessible through its public endpoint, an
                        on-premises data gateway is not required for this connection,
                        assuming the source is reachable and the connection
                        configuration supports cloud refresh.
                    </p>
                    <p>
                        Configure scheduled refresh in Power BI Service so the
                        reports use refreshed data before the required 5 AM deadline.
                    </p>
                </div>

                <div class="case-explanation">
                    <h4>Why the Other Options Are Incorrect</h4>
                    <ul>
                        <li><strong>A. Refresh visuals:</strong> Refreshing visuals is not the appropriate way to configure a daily scheduled refresh of the underlying dataset.</li>
                        <li><strong>B. Refresh in Power BI Desktop:</strong> This requires manual intervention and does not provide the required automated daily refresh.</li>
                        <li><strong>D. Use an on-premises data gateway:</strong> An on-premises gateway is not required for the Azure SQL Database described in this scenario, provided the cloud source can be accessed directly.</li>
                    </ul>
                </div>

                <div class="case-security-note">
                    <h4>Important Technical Note</h4>
                    <p>
                        Gateway requirements depend on the actual data source,
                        network accessibility, authentication method, and connection
                        configuration. The correct choice is based on the scenario's
                        Azure SQL Database with a public endpoint.
                    </p>
                </div>
            </section>
        ` : ""}
    `;
}

function renderQuestion4() {
    const submitted = applicationState.case4Submitted;
    const answer = applicationState.case4Answer;
    const correctAnswer = "B";

    const options = [
        {
            value: "A",
            text: "A single imported dataset."
        },
        {
            value: "B",
            text: "Two imported datasets."
        },
        {
            value: "C",
            text: "Two DirectQuery datasets."
        },
        {
            value: "D",
            text: "A single DirectQuery dataset."
        }
    ];

    return `
        <div class="case-content-heading">
            <span class="case-content-kicker">CONTOSO · DATA MODELING</span>
            <h2>Question 04 — Minimum Number of Datasets</h2>
            <span class="case-question-points">1 point</span>
        </div>

        <div class="case-question-prompt">
            <p>The reports must be updated with the latest data by 5 AM each day.</p>
            <p>What is the minimum number of Power BI datasets needed to support the reports?</p>
        </div>

        <form id="contoso-answer-form-4" class="case-answer-form" novalidate>
            <h3>Answer Area</h3>

            <div class="case-mcq-options">
                ${options.map(option => `
                    <label class="case-mcq-option ${submitted && option.value === correctAnswer ? "answer-correct" : ""} ${submitted && answer === option.value && answer !== correctAnswer ? "answer-incorrect" : ""}">
                        <input
                            type="radio"
                            name="answer-question-4"
                            value="${option.value}"
                            ${answer === option.value ? "checked" : ""}
                            ${submitted ? "disabled" : ""}
                        >
                        <span><strong>${option.value}.</strong> ${safeText(option.text)}</span>
                    </label>
                `).join("")}
            </div>

            <p id="case-answer-validation-4" class="case-validation" role="alert" hidden></p>

            <div class="case-submit-row">
                <button type="submit" class="button button-primary" ${submitted ? "disabled" : ""}>
                    ${submitted ? "Answer Submitted" : "Submit Answer"}
                </button>

                ${submitted ? `<span class="case-score-pill">Score: ${applicationState.case4Score}/1</span>` : ""}
            </div>
        </form>

        ${submitted ? `
            <section class="case-feedback" aria-live="polite">
                <div class="case-feedback-score">
                    <strong>${applicationState.case4Score}/1</strong>
                    <span>Submission score</span>
                </div>

                <h3>Explanation</h3>

                <div class="case-explanation">
                    <h4>Why B is correct</h4>
                    <p>
                        Two separate datasets are required because the balance
                        sheet data and the profit and loss data have different
                        access requirements.
                    </p>
                    <p>
                        Analysts must be able to create new reports from the
                        profit and loss dataset, but they must not be allowed to
                        create new reports using the balance sheet data.
                    </p>
                    <p>
                        Keeping the datasets separate allows different permissions
                        to be applied to each dataset. Analysts can receive Build
                        permission on the profit and loss dataset while being
                        denied Build permission on the balance sheet dataset.
                    </p>
                    <p>
                        The scenario also requires time-intelligence calculations,
                        including comparisons between quarterly revenue and the
                        same quarter in the previous year. Import mode supports
                        the required DAX calculations and provides a suitable
                        approach for the reporting solution.
                    </p>
                    <p>Therefore, the minimum required configuration is two imported datasets.</p>
                </div>

                <div class="case-explanation">
                    <h4>Why the Other Options Are Incorrect</h4>
                    <ul>
                        <li><strong>A. A single imported dataset:</strong> A single dataset would make it more difficult to enforce the required separation between Build permissions for profit and loss data and restrictions on the balance sheet data.</li>
                        <li><strong>C. Two DirectQuery datasets:</strong> DirectQuery is not required by the stated scenario. It introduces additional considerations and limitations for modeling, transformations, and DAX functionality.</li>
                        <li><strong>D. A single DirectQuery dataset:</strong> This does not provide the required separation of dataset permissions, and DirectQuery is not necessary for the described solution.</li>
                    </ul>
                </div>

                <div class="case-security-note">
                    <h4>Additional Context</h4>
                    <p>
                        The reporting solution must also support daily scheduled
                        refresh, consistent business logic, and the required
                        time-intelligence calculations. The choice of storage
                        mode should be based on the source systems, refresh
                        requirements, modeling needs, and security requirements.
                    </p>
                </div>
            </section>
        ` : ""}
    `;
}

function renderQuestion5() {
    const options = [
        {
            value: "A",
            text: "A one-to-one relationship between the Date table and the balance sheet table using the Date column."
        },
        {
            value: "B",
            text: "A many-to-one relationship from the balance sheet table to the Date table, using the last day of each month as the matching date."
        },
        {
            value: "C",
            text: "A many-to-many relationship between the Date table and the balance sheet table using the Month Name column."
        },
        {
            value: "D",
            text: "An inactive relationship between the Date table and the balance sheet table using the Year column."
        }
    ];

    const isSubmitted = applicationState.case5Submitted;
    const selectedAnswer = applicationState.case5Answer;
    const isCorrect = selectedAnswer === "B";

    return `
        <section class="case-question">
            <div class="case-question-header">
                <span class="case-section-label">QUESTION 05</span>
                <span class="case-question-points">1 Point</span>
            </div>

            <h2>Balance Sheet Relationships</h2>

            <p>
                You need to relate the balance sheet table to the Date table in Power BI.
            </p>
            <p>
                The balance sheet table contains the final monthly balance of each account.
                The Date table contains a unique row for each date.
            </p>
            <p>
                You must ensure that the model supports reporting the ending balance of each
                account for a selected quarter and the previous quarter.
            </p>
            <p>
                <strong>
                    Which relationship should you create between the Date table and the
                    balance sheet table?
                </strong>
            </p>

            <form id="contoso-answer-form-5">
                <div class="case-mcq-options">
                    ${options.map(option => {
                        const optionCorrect = option.value === "B";
                        const optionSelected = selectedAnswer === option.value;

                        let optionClass = "case-mcq-option";

                        if (isSubmitted && optionCorrect) {
                            optionClass += " answer-correct";
                        } else if (isSubmitted && optionSelected && !isCorrect) {
                            optionClass += " answer-incorrect";
                        }

                        return `
                            <label class="${optionClass}">
                                <input
                                    type="radio"
                                    name="answer-question-5"
                                    value="${option.value}"
                                    ${optionSelected ? "checked" : ""}
                                    ${isSubmitted ? "disabled" : ""}
                                >
                                <span class="case-option-letter">${option.value}.</span>
                                <span>${option.text}</span>
                            </label>
                        `;
                    }).join("")}
                </div>

                <p
                    id="case-answer-validation-5"
                    class="case-answer-validation"
                    role="alert"
                ></p>

                ${
                    isSubmitted
                        ? `
                            <div class="case-answer-feedback">
                                <h3>${isCorrect ? "Correct Answer!" : "Incorrect Answer"}</h3>
                                <p><strong>Score: ${applicationState.case5Score}/1</strong></p>

                                <h4>Why B is correct</h4>
                                <p>
                                    The balance sheet table stores monthly ending balances,
                                    while the Date table contains individual dates. Create a
                                    date column in the balance sheet table representing the
                                    last day of each month.
                                </p>
                                <p>
                                    Multiple balance sheet records can relate to the same
                                    month-end date, while the Date table has one unique row
                                    for that date. This supports a many-to-one relationship
                                    from the balance sheet table to the Date table.
                                </p>
                                <p>
                                    Using consistent month-end dates allows reporting of
                                    ending balances for a selected quarter and comparison
                                    with the previous quarter.
                                </p>

                                <h4>Why the other options are incorrect</h4>
                                <ul>
                                    <li><strong>A.</strong> Multiple accounts can share the same month-end date, so the relationship is not one-to-one.</li>
                                    <li><strong>C.</strong> Month names repeat across years and do not uniquely identify dates.</li>
                                    <li><strong>D.</strong> Connecting only by Year does not support the required daily calendar filtering and month-end reporting.</li>
                                </ul>
                            </div>
                        `
                        : `
                            <button type="submit" class="button button-primary">
                                Submit Answer
                            </button>
                        `
                }
            </form>
        </section>
    `;
}

function renderQuestion6() {
    const options = [
        {
            value: "A",
            text: "PREVIOUSMONTH()"
        },
        {
            value: "B",
            text: "SAMEPERIODLASTYEAR()"
        },
        {
            value: "C",
            text: "TOTALYTD()"
        },
        {
            value: "D",
            text: "DATE()"
        }
    ];

    const isSubmitted = applicationState.case6Submitted;
    const selectedAnswer = applicationState.case6Answer;
    const isCorrect = selectedAnswer === "B";

    return `
        <section class="case-question">
            <div class="case-question-header">
                <span class="case-section-label">QUESTION 06</span>
                <span class="case-question-points">1 Point</span>
            </div>

            <h2>Revenue Comparison Using Time Intelligence</h2>

            <p>
                Contoso's board requires a comparison of quarterly revenue with the
                revenue from the same quarter in the previous year.
            </p>
            <p>
                The model contains a properly configured Date table related to the revenue
                data, and the Date table is marked as a date table.
            </p>
            <p>
                <strong>
                    Which DAX time-intelligence function should you use to retrieve the
                    dates from the same period in the previous year?
                </strong>
            </p>

            <form id="contoso-answer-form-6">
                <div class="case-mcq-options">
                    ${options.map(option => {
                        const optionCorrect = option.value === "B";
                        const optionSelected = selectedAnswer === option.value;

                        let optionClass = "case-mcq-option";

                        if (isSubmitted && optionCorrect) {
                            optionClass += " answer-correct";
                        } else if (isSubmitted && optionSelected && !isCorrect) {
                            optionClass += " answer-incorrect";
                        }

                        return `
                            <label class="${optionClass}">
                                <input
                                    type="radio"
                                    name="answer-question-6"
                                    value="${option.value}"
                                    ${optionSelected ? "checked" : ""}
                                    ${isSubmitted ? "disabled" : ""}
                                >
                                <span class="case-option-letter">${option.value}.</span>
                                <code>${option.text}</code>
                            </label>
                        `;
                    }).join("")}
                </div>

                <p
                    id="case-answer-validation-6"
                    class="case-answer-validation"
                    role="alert"
                ></p>

                ${
                    isSubmitted
                        ? `
                            <div class="case-answer-feedback">
                                <h3>${isCorrect ? "Correct Answer!" : "Incorrect Answer"}</h3>
                                <p><strong>Score: ${applicationState.case6Score}/1</strong></p>

                                <h4>Why B is correct</h4>
                                <p>
                                    <code>SAMEPERIODLASTYEAR()</code> returns a date range
                                    shifted one year back from the current date context.
                                    When used with <code>CALCULATE()</code>, it supports
                                    comparing revenue for the selected quarter with revenue
                                    from the corresponding quarter in the previous year.
                                </p>

                                <p>Example DAX measure:</p>
                                <pre><code>Revenue Previous Year =
CALCULATE(
    [Total Revenue],
    SAMEPERIODLASTYEAR('Date'[Date])
)</code></pre>

                                <h4>Why the other options are incorrect</h4>
                                <ul>
                                    <li><strong>A. PREVIOUSMONTH()</strong> returns the previous month's date range, not the same period in the previous year.</li>
                                    <li><strong>C. TOTALYTD()</strong> calculates a year-to-date result.</li>
                                    <li><strong>D. DATE()</strong> constructs a date from year, month, and day values; it does not shift the date context by one year.</li>
                                </ul>
                            </div>
                        `
                        : `
                            <button type="submit" class="button button-primary">
                                Submit Answer
                            </button>
                        `
                }
            </form>
        </section>
    `;
}

function renderCaseSection(section) {
    if (!CASE_SECTIONS.includes(section)) {
        section = "overview";
    }

    applicationState.caseSection = section;

    let content = "";

    switch (section) {

        case "overview":
            content = `
                <span class="case-content-kicker">CASE STUDY INTRODUCTION</span>
                <h2>Introductory Info Case Study</h2>

                <div class="case-prose">
                    <p>
                        This is a case study. Case studies are not timed separately.
                        You can use as much exam time as you would like to complete
                        each case. However, there may be additional case studies and
                        sections on this exam. You must manage your time to ensure
                        that you are able to complete all questions included on this
                        exam in the time provided.
                    </p>

                    <p>
                        To answer the questions included in a case study, you will
                        need to reference information that is provided in the case
                        study. Case studies might contain exhibits and other resources
                        that provide more information about the scenario that is
                        described in the case study. Each question is independent
                        of the other questions in this case study.
                    </p>

                    <p>
                        At the end of this case study, a review screen will appear.
                        This screen allows you to review your answers and to make
                        changes before you move to the next section of the exam.
                        After you begin a new section, you cannot return to this section.
                    </p>
                </div>

                <div class="case-instructions-card">
                    <h3>To Start the Case Study</h3>

                    <p>
                        To display the first question in this case study, click the
                        Next button. Use the buttons in the left pane to explore the
                        content of the case study before you answer the questions.
                        Clicking these buttons displays information such as business
                        requirements, the existing environment, and problem statements.
                    </p>

                    <p>
                        When you are ready to answer a question, click the Question
                        button to return to the question.
                    </p>

                    <button
                        type="button"
                        class="button button-primary"
                        data-case-section="question"
                    >
                        Open Question 01 →
                    </button>
                </div>
            `;
            break;

        case "environment":
            content = `
                <h2>Existing Environment</h2>

                <p>
                    Contoso, Ltd. is a manufacturing company that produces
                    sports equipment.
                </p>

                <p>
                    Contoso holds quarterly board meetings for which financial
                    analysts manually prepare Microsoft Excel reports, including
                    balance sheets and profit and loss statements for each of
                    the company's four business units.
                </p>

                <h3>Data Granularity</h3>

                <ul>
                    <li>Revenue data is provided at the date and product level.</li>
                    <li>Expense data is provided at the date and department level.</li>
                    <li>Balance sheet data is provided at the account and month level.</li>
                    <li>Product catalog data describes products, product categories, and business units.</li>
                </ul>
            `;
            break;

        case "sources":
            content = `
                <h2>Data and Sources</h2>

                ${renderCaseTable(
                    ["Data Source", "Description"],
                    [
                        [
                            "Azure SQL Database",
                            "Detailed revenue, cost, and expense data. Uses a public endpoint."
                        ],
                        [
                            "Microsoft Dynamics 365 Business Central",
                            "Summary balance sheet data and product catalog data."
                        ]
                    ]
                )}

                <p class="case-callout">
                    The balance sheet data is unrelated to the profit and loss
                    results other than that both relate to dates.
                </p>
            `;
            break;

        case "balance":
            content = `
                <h2>Balance Sheet Data</h2>

                <p>
                    The balance sheet data is imported and includes the final
                    monthly balances of each account.
                </p>

                ${renderCaseTable(
                    ["AccountCategory", "Account", "Month", "Year", "BalanceAmount"],
                    BALANCE_ROWS
                )}

                <p class="case-callout">
                    The balance sheet data always includes a row for each account
                    for each month.
                </p>
            `;
            break;

        case "products":
            content = `
                <h2>Product Catalog Data</h2>

                <p>
                    The product catalog shows how products roll up to product
                    categories, which roll up to business units.
                </p>

                ${renderCaseTable(
                    [
                        "Product ID",
                        "Product name",
                        "Product description",
                        "Product category",
                        "Business unit"
                    ],
                    PRODUCT_ROWS
                )}
            `;
            break;

        case "issues":
            content = `
                <h2>Business Issues</h2>

                <div class="case-prose">
                    <p>
                        Historically, it has taken two analysts a week to prepare
                        the reports for the quarterly board meetings. Also, there
                        is usually at least one issue each quarter where a value
                        in a report is wrong because of a bad cell reference in
                        an Excel formula.
                    </p>

                    <p>
                        On occasion, there are conflicting results in the reports
                        because the products and departments that roll up to each
                        business unit are not defined consistently.
                    </p>
                </div>

                <h3>Planned Changes</h3>

                <p>
                    Contoso plans to automate and standardize the quarterly
                    reporting process by using Power BI. The company wants to
                    reduce how long it takes to populate the reports to less
                    than two days.
                </p>

                <p>
                    The company wants to create common logic for the business
                    units, products, and departments. The logic will be used
                    across all reports, including but not limited to the
                    quarterly reporting for the board.
                </p>
            `;
            break;

        case "requirements":
            content = `
                <h2>Requirements</h2>

                <h3>Technical Requirements</h3>

                <ul>
                    <li>Reports and datasets must refresh with minimum manual effort.</li>
                    <li>The board needs a single package of reports containing custom navigation and links to supplementary information.</li>
                    <li>Maintenance, including manually updating data and access, must be minimized.</li>
                </ul>

                <h3>Security Requirements</h3>

                <ul>
                    <li>Reports must be available to the board through Power BI Service.</li>
                    <li>A Microsoft Entra ID group, formerly Azure Active Directory, will be used to share information with the board.</li>
                    <li>Analysts must access all balance sheet and product catalog data.</li>
                    <li>Analysts must access only the profit and loss data for their respective business units.</li>
                    <li>Analysts must be able to create new reports from the profit and loss dataset.</li>
                    <li>Analyst-created reports must not be included in the quarterly board reporting package.</li>
                    <li>Analysts must not share the quarterly reports with anyone.</li>
                    <li>Analysts must not create reports using the balance sheet data.</li>
                </ul>
            `;
            break;

        case "technical":
            content = `
                <h2>Technical Requirements</h2>

                <ul>
                    <li>Reports and datasets must refresh with minimum manual effort.</li>
                    <li>The board needs a single package of reports containing custom navigation and links to supplementary information.</li>
                    <li>Maintenance, including manually updating data and access, must be minimized.</li>
                </ul>
            `;
            break;

        case "security":
            content = `
                <h2>Security Requirements</h2>

                <ul>
                    <li>Reports must be available to the board through Power BI Service.</li>
                    <li>A Microsoft Entra ID group, formerly Azure Active Directory, will be used to share information with the board.</li>
                    <li>Analysts must access all balance sheet and product catalog data.</li>
                    <li>Analysts must access only the profit and loss data for their respective business units.</li>
                    <li>Analysts must be able to create new reports from the profit and loss dataset.</li>
                    <li>Analyst-created reports must not be included in the quarterly board reporting package.</li>
                    <li>Analysts must not share the quarterly reports with anyone.</li>
                    <li>Analysts must not create reports using the balance sheet data.</li>
                </ul>
            `;
            break;

        case "reports":
            content = `
                <h2>Report Requirements</h2>

                <p>
                    The balance sheet table must relate to a Date table in Power BI
                    through a many-to-one relationship based on the last day of each month.
                </p>

                <h3>Quarterly balance sheet report</h3>

                <ul>
                    <li>Ending balances for the quarter.</li>
                    <li>Ending balances for the previous quarter.</li>
                </ul>

                <h3>The board must be able to obtain</h3>

                <ul>
                    <li>Revenue trends over time.</li>
                    <li>Ending balances of each account.</li>
                    <li>Changes in long-term liabilities from the previous quarter.</li>
                    <li>The percentage of total revenue contributed by each product category.</li>
                    <li>A comparison of quarterly revenue against the same quarter in the previous year.</li>
                </ul>

                <p class="case-callout">
                    Reports must be refreshed with the latest data by 5:00 AM each day.
                </p>
            `;
            break;

        case "date-table":
            content = `
                <h2>Date Table</h2>

                ${renderCaseTable(
                    ["Column name", "Data type", "Sample value"],
                    DATE_ROWS
                )}

                <p class="case-data-note">
                    <strong>Source verification note:</strong>
                    The displayed Month Name and Quarter sample values should
                    be verified against the original source before they are
                    used as operational data.
                </p>
            `;
            break;

        case "question":
            content = renderQuestion();
            break;

        case "question-2":
            content = renderQuestion2();
            break;
            
case "question-3":
    content = renderQuestion3();
    break;

case "question-4":
    content = renderQuestion4();
    break;

case "question-5":
    content = renderQuestion5();
    break;

case "question-6":
    content = renderQuestion6();
    break;


        default:
            content = `
                <h2>${safeText(CASE_TITLES[section] || "Case Study")}</h2>
            `;
            break;
    }

    if (elements.caseStudyContent) {
        elements.caseStudyContent.innerHTML = content;
    }

    if (elements.casePageIndicator) {
        elements.casePageIndicator.textContent =
            CASE_TITLES[section] || "Case Study";
    }

    if (elements.caseNavigation) {
        elements.caseNavigation
            .querySelectorAll("[data-case-section]")
            .forEach(btn => {
                btn.classList.toggle(
                    "is-active",
                    btn.dataset.caseSection === section
                );
            });
    }

    updateCaseReviewStatus();

    if (elements.casePreviousButton) {
        elements.casePreviousButton.disabled =
            CASE_SECTIONS.indexOf(section) === 0;
    }


if (elements.caseNextButton) {
    const isLastQuestion = section === "question-6";

    elements.caseNextButton.textContent =
        isLastQuestion ? "View Results" : "Next";

    elements.caseNextButton.disabled = false;
}


    if (elements.caseMenuToggle) {
        elements.caseMenuToggle.setAttribute("aria-expanded", "false");

        if (
            window.matchMedia("(max-width: 760px)").matches &&
            elements.caseNavigation
        ) {
            elements.caseNavigation.classList.remove("is-open");
        }
    }
}

function updateCaseReviewStatus() {
    if (elements.caseReviewStatus) {
        const submittedCount = [
            applicationState.caseSubmitted,
            applicationState.case2Submitted,
            applicationState.case3Submitted,
            applicationState.case4Submitted,
            applicationState.case5Submitted,
            applicationState.case6Submitted
        ].filter(Boolean).length;

        elements.caseReviewStatus.textContent =
            `${submittedCount} of 6 questions submitted`;
    }

    updateFinalCaseScore();
}


function updateFinalCaseScore() {
    const scores = [
        applicationState.caseScore,
        applicationState.case2Score,
        applicationState.case3Score,
        applicationState.case4Score,
        applicationState.case5Score,
        applicationState.case6Score
    ];

    const totalScore = scores.reduce(
        (total, score) => total + (score ?? 0),
        0
    );

    const submittedCount = [
        applicationState.caseSubmitted,
        applicationState.case2Submitted,
        applicationState.case3Submitted,
        applicationState.case4Submitted,
        applicationState.case5Submitted,
        applicationState.case6Submitted
    ].filter(Boolean).length;

    if (elements.caseReviewScore) {
        elements.caseReviewScore.textContent =
            `Final Score: ${totalScore} / 8`;
    }

    if (elements.caseReviewStatus) {
        elements.caseReviewStatus.textContent =
            `${submittedCount} of 6 questions submitted`;
    }
}

function handleCaseAnswerSubmit(event) {
    if (event) event.preventDefault();

    // Prevent changing the answer after the first submission.
    if (applicationState.caseSubmitted) {
        return;
    }

    const workspace = document.getElementById("answer-workspace");
    const dataset = document.getElementById("answer-dataset");
    if (!workspace || !dataset) return;
    applicationState.caseAnswers.workspace = workspace.value;
    applicationState.caseAnswers.dataset = dataset.value;
    const validation = document.getElementById("case-answer-validation");
    if (!workspace.value || !dataset.value) {
        if (validation) { validation.textContent = "Please select an answer for both fields before submitting."; validation.hidden = false; }
        [workspace, dataset].forEach(el => { if (!el.value) el.setAttribute("aria-invalid", "true"); else el.removeAttribute("aria-invalid"); });
        return;
    }
    if (validation) validation.hidden = true;
    workspace.removeAttribute("aria-invalid"); dataset.removeAttribute("aria-invalid");
    applicationState.caseSubmitted = true;
applicationState.caseScore =
    (workspace.value === "The Viewer role to the workspace" ? 1 : 0) +
    (dataset.value === "Build" ? 1 : 0);

updateFinalCaseScore();
renderCaseSection("question");
}
function handleCaseAnswerSubmit2(event) {
    event.preventDefault();

    // Prevent a second submission.
    if (applicationState.case2Submitted) {
        return;
    }

    const distributionField = document.getElementById(
        "answer-distribution-2"
    );

    const audienceField = document.getElementById(
        "answer-audience-2"
    );

    const validationMessage = document.getElementById(
        "case-answer-validation-2"
    );

    if (!distributionField || !audienceField || !validationMessage) {
        return;
    }

    const distribution = distributionField.value;
    const audience = audienceField.value;

    // Require both answers before evaluation.
    if (!distribution || !audience) {
        validationMessage.textContent =
            "Please select an answer for both fields before submitting.";

        validationMessage.hidden = false;

        [distributionField, audienceField].forEach(field => {
            if (!field.value) {
                field.setAttribute("aria-invalid", "true");
            } else {
                field.removeAttribute("aria-invalid");
            }
        });

        return;
    }

    validationMessage.hidden = true;

    distributionField.removeAttribute("aria-invalid");
    audienceField.removeAttribute("aria-invalid");

    // Save Question 02 answers independently.
    applicationState.case2Answers.distribution = distribution;
    applicationState.case2Answers.audience = audience;

    // Award one point for each correct answer.
    let score = 0;

    if (distribution === "Using an app") {
        score++;
    }

    if (
        audience ===
        "A mail-enabled security group in Azure Active Directory"
    ) {
        score++;
    }

    // Lock this question after the first valid submission.
    applicationState.case2Score = score;
    applicationState.case2Submitted = true;
    updateFinalCaseScore();
    // Re-render to show feedback and disable both dropdowns.
    renderCaseSection("question-2");
}

function handleCaseAnswerSubmit3(event) {
    event.preventDefault();

    if (applicationState.case3Submitted) return;

    const selectedAnswer = document.querySelector(
        'input[name="answer-question-3"]:checked'
    );

    const validation = document.getElementById(
        "case-answer-validation-3"
    );

    if (!selectedAnswer) {
        if (validation) {
            validation.textContent = "Please select an answer before submitting.";
        }
        return;
    }

    applicationState.case3Answer = selectedAnswer.value;
    applicationState.case3Submitted = true;
    applicationState.case3Score =
        selectedAnswer.value === "C" ? 1 : 0;
updateFinalCaseScore();
    renderCaseSection("question-3");
}

function handleCaseAnswerSubmit4(event) {
    event.preventDefault();

    if (applicationState.case4Submitted) return;

    const selectedAnswer = document.querySelector(
        'input[name="answer-question-4"]:checked'
    );

    const validation = document.getElementById(
        "case-answer-validation-4"
    );

    if (!selectedAnswer) {
        if (validation) {
            validation.textContent = "Please select an answer before submitting.";
        }
        return;
    }

    applicationState.case4Answer = selectedAnswer.value;
    applicationState.case4Submitted = true;
    applicationState.case4Score =
        selectedAnswer.value === "B" ? 1 : 0;
updateFinalCaseScore();
    renderCaseSection("question-4");
}

function handleCaseAnswerSubmit5(event) {
    event.preventDefault();

    if (applicationState.case5Submitted) return;

    const selectedAnswer = document.querySelector(
        'input[name="answer-question-5"]:checked'
    );

    const validation = document.getElementById("case-answer-validation-5");

    if (!selectedAnswer) {
        if (validation) {
            validation.textContent = "Please select an answer before submitting.";
        }
        return;
    }

    applicationState.case5Answer = selectedAnswer.value;
    applicationState.case5Submitted = true;
    applicationState.case5Score = selectedAnswer.value === "B" ? 1 : 0;
updateFinalCaseScore();
    renderCaseSection("question-5");
}

function handleCaseAnswerSubmit6(event) {
    event.preventDefault();

    if (applicationState.case6Submitted) return;

    const selectedAnswer = document.querySelector(
        'input[name="answer-question-6"]:checked'
    );

    const validation = document.getElementById("case-answer-validation-6");

    if (!selectedAnswer) {
        if (validation) {
            validation.textContent = "Please select an answer before submitting.";
        }
        return;
    }

    applicationState.case6Answer = selectedAnswer.value;
    applicationState.case6Submitted = true;
    applicationState.case6Score = selectedAnswer.value === "B" ? 1 : 0;
updateFinalCaseScore();
    renderCaseSection("question-6");
}

function handleCaseWorkspaceClick(event) {
    const sectionButton = event.target.closest("[data-case-section]");
    if (sectionButton) { renderCaseSection(sectionButton.dataset.caseSection); return; }
    if (event.target.closest("#contoso-answer-form")) return;
}
function handleCaseWorkspaceChange(event) {
    if (event.target.id === "answer-workspace") applicationState.caseAnswers.workspace = event.target.value;
    if (event.target.id === "answer-dataset") applicationState.caseAnswers.dataset = event.target.value;
    updateCaseReviewStatus();
    
if (event.target.name === "answer-question-5" && !applicationState.case5Submitted) {
    applicationState.case5Answer = event.target.value;
}

if (event.target.name === "answer-question-6" && !applicationState.case6Submitted) {
    applicationState.case6Answer = event.target.value;
}

}


function handleCasePager(direction) {
    if (
        direction === 1 &&
        applicationState.caseSection === "question-6"
    ) {
        renderFinalCaseResults();
        return;
    }

    const index = CASE_SECTIONS.indexOf(applicationState.caseSection);
    const nextIndex = index + direction;

    if (nextIndex >= 0 && nextIndex < CASE_SECTIONS.length) {
        renderCaseSection(CASE_SECTIONS[nextIndex]);
    }
}



function registerCaseStudyListeners() {
    if (!elements.caseStudyView) return;

    elements.caseStudyView.addEventListener("click", handleCaseWorkspaceClick);
    elements.caseStudyView.addEventListener("change", handleCaseWorkspaceChange);

    elements.caseStudyView.addEventListener("submit", event => {
        if (event.target.id === "contoso-answer-form") {
            handleCaseAnswerSubmit(event);
        }

        if (event.target.id === "contoso-answer-form-2") {
            handleCaseAnswerSubmit2(event);
        }

        if (event.target.id === "contoso-answer-form-3") {
            handleCaseAnswerSubmit3(event);
        }

        if (event.target.id === "contoso-answer-form-4") {
            handleCaseAnswerSubmit4(event);
        }
        
        if (event.target.id === "contoso-answer-form-5") {
            handleCaseAnswerSubmit5(event);
        }

        if (event.target.id === "contoso-answer-form-6") {
            handleCaseAnswerSubmit6(event);
        }

    });

    if (elements.casePreviousButton) {
        elements.casePreviousButton.addEventListener("click", () => {
            handleCasePager(-1);
        });
    }

    if (elements.caseNextButton) {
        elements.caseNextButton.addEventListener("click", () => {
            handleCasePager(1);
        });
    }

    if (elements.caseExitButton) {
        elements.caseExitButton.addEventListener("click", showIntroduction);
    }

    if (elements.caseTimeoutContinue) {
        elements.caseTimeoutContinue.addEventListener("click", dismissCaseTimeout);
    }

    if (elements.caseTimeoutOverlay) {
        elements.caseTimeoutOverlay.addEventListener("click", event => {
            if (event.target === elements.caseTimeoutOverlay) dismissCaseTimeout();
        });
    }

    if (elements.caseMenuToggle) {
        elements.caseMenuToggle.addEventListener("click", () => {
            const open = elements.caseNavigation.classList.toggle("is-open");
            elements.caseMenuToggle.setAttribute("aria-expanded", String(open));
        });
    }
}


/* 9. Readiness Page */

function handleReadinessConfirmation() {
    applicationState.readinessConfirmed = true;

    showEntryStatus(
        "You're ready to continue. Select Start Exam to proceed.",
        "success"
    );

    return true;
}


/* 9. Question Bank Validation */

function isQuestionBankAvailable() {
    return (
        Array.isArray(QUESTION_BANK) &&
        QUESTION_BANK.length > 0
    );
}

function validateQuestionBank() {
    /*
     * The question bank must contain real, validated
     * questions and answers before the exam can begin.
     *
     * No questions, answers, or results are fabricated here.
     */
    return isQuestionBankAvailable();
}


/* 10. Exam Workflow Entry Point */

function initializeExamWorkflow() {
    if (!validateQuestionBank()) {
        return {
            ready: false,
            message:
                "The validated question bank is not connected yet. " +
                "Please connect the question bank before starting the exam."
        };
    }

    /*
     * Future implementation:
     *
     * 1. Validate question records.
     * 2. Initialize exam and answer state.
     * 3. Render the first question.
     * 4. Start the timer when the exam begins.
     * 5. Enable navigation, review, submission, and scoring.
     *
     * The actual exam workflow has not been implemented yet.
     */
    return {
        ready: false,
        message:
            "The question bank is available, but the exam workflow " +
            "must be implemented before the simulation can begin."
    };
}


/* 11. Simulation Navigation */


function handleStartSimulation() {
    openAccessCodeModal();
}


function handleConfirmedReadiness() {
    if (!applicationState.readinessConfirmed) {
        handleReadinessConfirmation();
        return;
    }

    const result = initializeExamWorkflow();

    if (result.ready) {
        /*
         * Navigate to the exam question view here when
         * the actual examination interface is implemented.
         */
        return;
    }

    showEntryStatus(result.message, "info");
}


/* 12. Event Listeners */

function registerEventListeners() {
    if (elements.startButton) {
        elements.startButton.addEventListener(
            "click",
            handleStartSimulation
        );
    }

    if (elements.backButton) {
        elements.backButton.addEventListener(
            "click",
            showIntroduction
        );
    }

    if (elements.entryBackButton) {
        elements.entryBackButton.addEventListener(
            "click",
            handleBackToIntroduction
        );
    }

    if (elements.readinessBackButton) {
        elements.readinessBackButton.addEventListener(
            "click",
            handleBackToIntroduction
        );
    }

    if (elements.confirmReadyButton) {
        elements.confirmReadyButton.addEventListener(
            "click",
            handleConfirmedReadiness
        );
    }

    if (elements.accessCodeForm) {
        elements.accessCodeForm.addEventListener(
            "submit",
            handleAccessCodeSubmission
        );
    }

    if (elements.toggleAccessCodeButton) {
        elements.toggleAccessCodeButton.addEventListener(
            "click",
            toggleAccessCodeVisibility
        );
    }

    if (elements.cancelAccessCodeButton) {
        elements.cancelAccessCodeButton.addEventListener(
            "click",
            () => closeAccessCodeModal()
        );
    }

    if (elements.accessModalCloseButton) {
        elements.accessModalCloseButton.addEventListener(
            "click",
            () => closeAccessCodeModal()
        );
    }

    if (elements.accessCodeModal) {
        elements.accessCodeModal.addEventListener(
            "click",
            handleAccessModalBackdropClick
        );
    }

    document.addEventListener(
        "keydown",
        handleAccessModalKeydown
    );
}


/* 13. Application Initialization */

function initializeApplication() {
    const requiredElements = [
        elements.introductionView,
        elements.entryView,
        elements.caseStudyView,
        elements.startButton
    ];

    const missingElements = requiredElements.filter(
        (element) => !element
    );

    if (missingElements.length > 0) {
        console.error(
            "PL-300 Simulator initialization failed. " +
            "Required introduction or entry elements are missing."
        );

        return;
    }

    registerEventListeners();
    registerCaseStudyListeners();

    applicationState.currentView = "introduction";
    applicationState.readinessConfirmed = false;

    elements.introductionView.hidden = false;
    elements.entryView.hidden = true;
    if (elements.caseStudyView) elements.caseStudyView.hidden = true;

    if (elements.accessCodeModal) {
        elements.accessCodeModal.hidden = true;
        elements.accessCodeModal.classList.remove("is-open");
    }

    console.info("PL-300 Exam Simulator initialized.", {
        practiceQuestionCount: APP_CONFIG.practiceQuestionCount,
        practiceDurationMinutes: APP_CONFIG.practiceDurationMinutes,
        skillDomainCount: APP_CONFIG.skillDomainCount,
        questionBankConnected: isQuestionBankAvailable()
    });
}



function renderFinalCaseResults() {
    // Prevent duplicate result windows.
    if (document.getElementById("final-results-overlay")) {
        return;
    }

    const scores = [
        applicationState.caseScore,
        applicationState.case2Score,
        applicationState.case3Score,
        applicationState.case4Score,
        applicationState.case5Score,
        applicationState.case6Score
    ];

    const submitted = [
        applicationState.caseSubmitted,
        applicationState.case2Submitted,
        applicationState.case3Submitted,
        applicationState.case4Submitted,
        applicationState.case5Submitted,
        applicationState.case6Submitted
    ];

    const submittedCount = submitted.filter(Boolean).length;

    const finalScore = scores.reduce(
        (total, score) => total + (score ?? 0),
        0
    );

    const isPerfect = submittedCount === 6 && finalScore === 8;

    const overlay = document.createElement("div");
    overlay.id = "final-results-overlay";

    overlay.className =
        `final-results-overlay ${isPerfect ? "is-success" : "is-failed"}`;

    overlay.setAttribute("role", "dialog");
    overlay.setAttribute("aria-modal", "true");
    overlay.setAttribute("aria-labelledby", "final-results-title");

    const title = isPerfect
        ? "Congratulations!"
        : "Case Study Completed!";

    const subtitle = isPerfect
        ? "You got a perfect score!"
        : "Keep going! You can improve your score.";

    const message = isPerfect
        ? "Excellent work! You've successfully completed the Contoso case study with a perfect score. Keep up the great progress!"
        : "Don't give up! Review your answers, learn from your mistakes, and keep improving your Power BI skills.";

    overlay.innerHTML = `
        <section class="final-results-modal">

            <button
                type="button"
                class="final-results-close"
                data-close-results
                aria-label="Close results"
            >&times;</button>

            <div class="final-results-confetti" aria-hidden="true">
                <span>✦</span>
                <span></span>
                <span>✦</span>
                <span>✦</span>
                <span>✦</span>
            </div>

            <div class="final-results-layout">

                <div class="final-results-art">
                    <img
                        class="final-results-boy"
                        src="${isPerfect
                            ? "images/boy-celebration.png"
                            : "images/student-disappointed.png"}"
                        alt="${isPerfect
                            ? "A student celebrating success"
                            : "A disappointed student reviewing exam results"}"
                    >
                </div>

                <div class="final-results-details">

                    ${isPerfect ? `
                        <img
                            class="final-results-trophy"
                            src="images/trophy.png"
                            alt="Golden trophy"
                        >
                    ` : ""}

                    <div class="final-results-eyebrow">
                        CONTOSO CASE STUDY
                    </div>

                    <h2
                        class="final-results-title"
                        id="final-results-title"
                    >
                        ${title}
                    </h2>

                    <p class="final-results-subtitle">
                        ${subtitle}
                    </p>

                    <div class="final-results-score-card">

                        <div class="final-results-score-block">
                            <span class="final-results-score-label">
                                Final Score
                            </span>

                            <strong class="final-results-score-value">
                                ${finalScore} / 8
                            </strong>
                        </div>

                        <div class="final-results-score-block">
                            <div class="final-results-submitted">
                                <strong>${submittedCount} of 6</strong>
                                <br>
                                questions submitted
                            </div>
                        </div>

                    </div>

                    <p class="final-results-message">
                        ${message}
                    </p>

                    <div class="final-results-actions">
                        <button
                            type="button"
                            class="final-results-done"
                            data-close-results
                        >
                            Back to Case Study
                        </button>
                    </div>

                </div>
            </div>
        </section>
    `;

    document.body.appendChild(overlay);

    requestAnimationFrame(() => {
        overlay.classList.add("is-visible");
    });

    function closeResults() {
        overlay.classList.remove("is-visible");

        window.setTimeout(() => {
            overlay.remove();
            document.removeEventListener("keydown", handleEscape);
        }, 300);
    }

    overlay.querySelectorAll("[data-close-results]").forEach(button => {
        button.addEventListener("click", closeResults);
    });

    overlay.addEventListener("click", event => {
        if (event.target === overlay) {
            closeResults();
        }
    });

    function handleEscape(event) {
        if (event.key === "Escape") {
            closeResults();
        }
    }

    document.addEventListener("keydown", handleEscape);

    if (elements.caseReviewStatus) {
        elements.caseReviewStatus.textContent =
            `${submittedCount} of 6 questions submitted`;
    }

    if (elements.caseReviewScore) {
        elements.caseReviewScore.textContent =
            `Final Score: ${finalScore} / 8`;
    }
}


/* 14. Start the Application */

initializeApplication();
