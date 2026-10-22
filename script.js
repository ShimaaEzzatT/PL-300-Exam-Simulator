
/* =========================================================
   PL-300 Exam Simulator
   Application Logic and Interface State Management
   ========================================================= */

"use strict";

/* 1. Application Configuration */

const APP_CONFIG = Object.freeze({
    practiceQuestionCount: 60,
    practiceDurationMinutes: 100,
    skillDomainCount: 4,

    // Change this to your preferred access code.
    examAccessCode: "EXAM_ACCESS_CODE"
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
    isVerifyingAccessCode: false
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
    showEntryView();
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


/* 8. Readiness Page */

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

    applicationState.currentView = "introduction";
    applicationState.readinessConfirmed = false;

    elements.introductionView.hidden = false;
    elements.entryView.hidden = true;

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


/* 14. Start the Application */

initializeApplication();
