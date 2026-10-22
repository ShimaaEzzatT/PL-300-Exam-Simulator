/* =========================================================
   PL-300 Exam Simulator
   Application logic and interface state management
   ========================================================= */

"use strict";

/* 1. Application Configuration */
const APP_CONFIG = Object.freeze({
    practiceQuestionCount: 60,
    practiceDurationMinutes: 100,
    skillDomainCount: 4
});

/*
 * Future integration point:
 * Connect the validated question bank and examination engine here.
 * Do not populate this object with invented questions or answers.
 */
const QUESTION_BANK = null;

/* 2. DOM Element References */
const elements = {
    introductionView: document.getElementById("introduction-view"),
    entryView: document.getElementById("entry-view"),

    startButton: document.getElementById("start-button"),
    backButton: document.getElementById("back-button"),
    entryBackButton: document.getElementById("entry-back-button"),
    confirmReadyButton: document.getElementById("confirm-ready-button"),

    readyTimeCheckbox: document.getElementById("ready-time"),
    readyInstructionsCheckbox: document.getElementById("ready-instructions"),

    entryStatus: document.getElementById("entry-status"),
    mainContent: document.getElementById("main-content")
};

/* 3. Application State */
const applicationState = {
    currentView: "introduction",
    readinessConfirmed: false
};

/* 4. View Navigation */
function showIntroduction() {
    applicationState.currentView = "introduction";
    applicationState.readinessConfirmed = false;

    elements.entryView.hidden = true;
    elements.introductionView.hidden = false;

    resetEntryState();

    window.scrollTo({
        top: 0,
        behavior: getScrollBehavior()
    });

    elements.startButton.focus({
        preventScroll: true
    });
}

function showEntryView() {
    applicationState.currentView = "entry";

    elements.introductionView.hidden = true;
    elements.entryView.hidden = false;

    window.scrollTo({
        top: 0,
        behavior: getScrollBehavior()
    });

    elements.entryView.focus({
        preventScroll: true
    });
}

/* 5. Accessibility Helpers */
function getScrollBehavior() {
    const prefersReducedMotion = window.matchMedia(
        "(prefers-reduced-motion: reduce)"
    ).matches;

    return prefersReducedMotion ? "auto" : "smooth";
}

/* 6. Entry State Management */
function resetEntryState() {
    elements.readyTimeCheckbox.checked = false;
    elements.readyInstructionsCheckbox.checked = false;

    elements.readyTimeCheckbox.removeAttribute("aria-invalid");
    elements.readyInstructionsCheckbox.removeAttribute("aria-invalid");

    elements.entryStatus.classList.remove("is-confirmed");
    elements.entryStatus.replaceChildren();

    const icon = document.createElement("span");
    icon.setAttribute("aria-hidden", "true");
    icon.textContent = "i";

    const message = document.createElement("p");
    message.textContent =
        "The question bank has not been connected yet. No exam questions " +
        "or answers have been fabricated. This entry screen is ready for " +
        "integration with your validated question bank.";

    elements.entryStatus.append(icon, message);
}

function areReadinessRequirementsComplete() {
    return (
        elements.readyTimeCheckbox.checked &&
        elements.readyInstructionsCheckbox.checked
    );
}

/* 7. Readiness Confirmation */
function handleReadinessConfirmation() {
    if (!areReadinessRequirementsComplete()) {
        applicationState.readinessConfirmed = false;

        elements.entryStatus.classList.remove("is-confirmed");
        elements.entryStatus.replaceChildren();

        const icon = document.createElement("span");
        icon.setAttribute("aria-hidden", "true");
        icon.textContent = "!";

        const message = document.createElement("p");
        message.textContent =
            "Please confirm both readiness statements before continuing.";

        elements.entryStatus.append(icon, message);

        elements.readyTimeCheckbox.setAttribute("aria-invalid", "true");
        elements.readyInstructionsCheckbox.setAttribute(
            "aria-invalid",
            "true"
        );

        const firstUncheckedCheckbox = [
            elements.readyTimeCheckbox,
            elements.readyInstructionsCheckbox
        ].find((checkbox) => !checkbox.checked);

        if (firstUncheckedCheckbox) {
            firstUncheckedCheckbox.focus();
        }

        return false;
    }

    elements.readyTimeCheckbox.removeAttribute("aria-invalid");
    elements.readyInstructionsCheckbox.removeAttribute("aria-invalid");

    applicationState.readinessConfirmed = true;

    elements.entryStatus.classList.add("is-confirmed");
    elements.entryStatus.replaceChildren();

    const icon = document.createElement("span");
    icon.setAttribute("aria-hidden", "true");
    icon.textContent = "✓";

    const message = document.createElement("p");
    message.textContent =
        "Readiness confirmed. The examination has not started because " +
        "the validated question bank and exam workflow are not connected yet.";

    elements.entryStatus.append(icon, message);

    return true;
}

/* 8. Future Question Bank Integration */
function isQuestionBankAvailable() {
    return (
        Array.isArray(QUESTION_BANK) &&
        QUESTION_BANK.length > 0
    );
}

function validateQuestionBank() {
    /*
     * This initial implementation intentionally does not create
     * questions, answers, scoring data, or fabricated exam results.
     *
     * Add question schema validation here when the real question bank
     * is supplied.
     */
    return isQuestionBankAvailable();
}

/* 9. Future Exam Workflow Entry Point */
function initializeExamWorkflow() {
    if (!validateQuestionBank()) {
        return {
            ready: false,
            message:
                "The validated question bank is not available yet."
        };
    }

    /*
     * Future implementation:
     * 1. Validate the supplied question records.
     * 2. Initialize the selected practice configuration.
     * 3. Initialize answer and review state.
     * 4. Start the countdown only when the exam actually begins.
     * 5. Enable navigation, flagging, submission, and scoring.
     *
     * The timer and results remain inactive until the examination
     * workflow has been implemented and validated.
     */
    return {
        ready: false,
        message:
            "The question bank is available, but the exam workflow " +
            "must be implemented before the simulation can begin."
    };
}

/* 10. Simulation Navigation */
function handleStartSimulation() {
    showEntryView();
}

function handleConfirmedReadiness() {
    if (!applicationState.readinessConfirmed) {
        handleReadinessConfirmation();
        return;
    }

    const result = initializeExamWorkflow();

    elements.entryStatus.classList.remove("is-confirmed");
    elements.entryStatus.replaceChildren();

    const icon = document.createElement("span");
    icon.setAttribute("aria-hidden", "true");
    icon.textContent = "i";

    const message = document.createElement("p");
    message.textContent = result.message;

    elements.entryStatus.append(icon, message);
}

/* 11. Event Listeners */
function registerEventListeners() {
    elements.startButton.addEventListener(
        "click",
        handleStartSimulation
    );

    elements.backButton.addEventListener(
        "click",
        showIntroduction
    );

    elements.entryBackButton.addEventListener(
        "click",
        showIntroduction
    );

    elements.confirmReadyButton.addEventListener(
        "click",
        handleConfirmedReadiness
    );

    const readinessCheckboxes = [
        elements.readyTimeCheckbox,
        elements.readyInstructionsCheckbox
    ];

    readinessCheckboxes.forEach((checkbox) => {
        checkbox.addEventListener("change", () => {
            checkbox.removeAttribute("aria-invalid");

            if (applicationState.readinessConfirmed) {
                applicationState.readinessConfirmed = false;

                elements.entryStatus.classList.remove("is-confirmed");
                elements.entryStatus.replaceChildren();

                const icon = document.createElement("span");
                icon.setAttribute("aria-hidden", "true");
                icon.textContent = "i";

                const message = document.createElement("p");
                message.textContent =
                    "Your readiness selection has changed. " +
                    "Please confirm both statements again.";

                elements.entryStatus.append(icon, message);
            }
        });
    });
}

/* 12. Application Initialization */
function initializeApplication() {
    const requiredElements = [
        elements.introductionView,
        elements.entryView,
        elements.startButton,
        elements.backButton,
        elements.entryBackButton,
        elements.confirmReadyButton,
        elements.readyTimeCheckbox,
        elements.readyInstructionsCheckbox,
        elements.entryStatus
    ];

    if (requiredElements.some((element) => !element)) {
        console.error(
            "PL-300 Simulator initialization failed: " +
            "one or more required interface elements are missing."
        );

        return;
    }

    registerEventListeners();

    applicationState.currentView = "introduction";

    elements.introductionView.hidden = false;
    elements.entryView.hidden = true;

    console.info("PL-300 Exam Simulator initialized.", {
        practiceQuestionCount: APP_CONFIG.practiceQuestionCount,
        practiceDurationMinutes: APP_CONFIG.practiceDurationMinutes,
        skillDomainCount: APP_CONFIG.skillDomainCount,
        questionBankConnected: isQuestionBankAvailable()
    });
}

/* 13. Start the Application */
initializeApplication();