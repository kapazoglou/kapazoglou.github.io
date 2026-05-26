/**
 * Collected responses — extend or POST this object when you wire a backend.
 * @type {{ name: string, age: number | null }}
 */
const responses = {
  name: "",
  age: null,
  /** @type {"no" | "yes" | null} */
  voyageChoice: null,
  /** @type {"no" | "yes" | null} */
  goAlone: null,
  /** @type {"bike" | "train-bike" | null} */
  embarkDistance: null,
  /** @type {"no" | "yes" | null} */
  needGuide: null,
  /** @type {"no" | "yes" | null} */
  stayNight: null,
  /** @type {"no" | "yes" | null} */
  conjoined: null,
  /** @type {string[]} */
  embarkWhen: [],
};

const CORRECT_NAME = "DANI";
/** Four-letter names that enable Continue (only DANI advances). */
const NAME_CONTINUE_NAMES = new Set(["DANI", "MANO"]);

/** @param {string} name */
function isValidName(name) {
  return name === CORRECT_NAME;
}

/** @param {string} name */
function canActivateNameContinue(name) {
  return NAME_CONTINUE_NAMES.has(name);
}
const CORRECT_AGE = 23.5;
const AGE_MIN = 0;
const AGE_MAX = 88;
const AGE_STEP = 0.5;
/** Letters A–Z — each wheel gets its own shuffled order */
const ALPHABET = Array.from({ length: 26 }, (_, i) => String.fromCharCode(65 + i));
const DIAL_REPEAT = 12;

/**
 * Fisher–Yates shuffle (copy).
 * @param {string[]} arr
 */
function shuffleLetters(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const t = a[i];
    a[i] = a[j];
    a[j] = t;
  }
  return a;
}

/** Distinct permutation per wheel (reshuffles if collision). */
function uniqueDialOrders(count) {
  const seen = new Set();
  /** @type {string[][]} */
  const out = [];
  for (let w = 0; w < count; w++) {
    let order = /** @type {string[] | null} */ (null);
    for (let attempt = 0; attempt < 100; attempt++) {
      const candidate = shuffleLetters(ALPHABET);
      const key = candidate.join("");
      if (!seen.has(key)) {
        seen.add(key);
        order = candidate;
        break;
      }
    }
    out.push(order ?? shuffleLetters(ALPHABET));
  }
  return out;
}

/** Screens in the flow (name → age → birthday → gift → voyage). */
const TOTAL_STEPS = 13;
/** Progress bar fill and “Step X of N” count cap at 4. */
const PROGRESS_BAR_STEPS = 4;
/** Steps that show 𓊞 instead of the numeric total in the label */
const PROGRESS_MYSTERY_FROM_STEP = 4;
/** Shown instead of the step count on mystery progress labels */
const PROGRESS_FINAL_LABEL = "𓊞";
/** Progress label on the final screen */
const PROGRESS_DONE_LABEL = "Done!";

/** Google Emoji Kitchen CDN; Gboard batch dates (newest first, through 2025). */
const EMOJI_KITCHEN_BASE = "https://www.gstatic.com/android/keyboard/emojikitchen";
const EMOJI_KITCHEN_DATES = [
  "20250204",
  "20250130",
  "20241023",
  "20241021",
  "20240715",
  "20240610",
  "20240530",
  "20240214",
  "20240206",
  "20231128",
  "20231113",
  "20230821",
  "20230818",
  "20230803",
  "20230426",
  "20230421",
  "20230418",
  "20230405",
  "20230301",
  "20230221",
  "20230216",
  "20230127",
  "20230126",
  "20230118",
  "20221107",
  "20221101",
  "20220823",
  "20220815",
  "20220506",
  "20220406",
  "20220203",
  "20220110",
  "20211115",
  "20210831",
  "20210521",
  "20210218",
  "20201001",
];

/**
 * Extra hex keys to try when the literal emoji codepoint has no mashup
 * (e.g. ⏳ U+23F3 is stored as ⌛ U+231B in Kitchen).
 * @type {Record<string, string[]>}
 */
const KITCHEN_HEX_ALTERNATES = {
  "23f3": ["231a", "231b"],
  "23f3-fe0f": ["231a", "231b"],
};

/** @param {string} hexKey */
function kitchenHexKeyVariants(hexKey) {
  const out = [hexKey];
  for (const alt of KITCHEN_HEX_ALTERNATES[hexKey] ?? []) {
    if (!out.includes(alt)) out.push(alt);
  }
  return out;
}

const els = {
  appTop: document.getElementById("appTop"),
  stepLabel: document.getElementById("stepLabel"),
  progressBar: document.getElementById("progressBar"),
  screenName: document.getElementById("screenName"),
  screenAge: document.getElementById("screenAge"),
  screenBirthday: document.getElementById("screenBirthday"),
  screenGift: document.getElementById("screenGift"),
  screenVoyage: document.getElementById("screenVoyage"),
  screenAlone: document.getElementById("screenAlone"),
  screenEmbark: document.getElementById("screenEmbark"),
  screenGuide: document.getElementById("screenGuide"),
  screenNight: document.getElementById("screenNight"),
  screenConjoined: document.getElementById("screenConjoined"),
  screenEmbarkWhen: document.getElementById("screenEmbarkWhen"),
  screenFinal: document.getElementById("screenFinal"),
  screenHelp: document.getElementById("screenHelp"),
  emojiStageName: document.getElementById("emojiStageName"),
  emojiStageAge: document.getElementById("emojiStageAge"),
  emojiStageBirthday: document.getElementById("emojiStageBirthday"),
  emojiStageGift: document.getElementById("emojiStageGift"),
  emojiStageVoyage: document.getElementById("emojiStageVoyage"),
  emojiStageAlone: document.getElementById("emojiStageAlone"),
  emojiStageEmbark: document.getElementById("emojiStageEmbark"),
  emojiStageGuide: document.getElementById("emojiStageGuide"),
  emojiStageNight: document.getElementById("emojiStageNight"),
  emojiStageConjoined: document.getElementById("emojiStageConjoined"),
  emojiStageEmbarkWhen: document.getElementById("emojiStageEmbarkWhen"),
  emojiStageFinal: document.getElementById("emojiStageFinal"),
  emojiStageHelp: document.getElementById("emojiStageHelp"),
  emojiKitchenName: document.getElementById("emojiKitchenName"),
  emojiKitchenAge: document.getElementById("emojiKitchenAge"),
  emojiKitchenBirthday: document.getElementById("emojiKitchenBirthday"),
  emojiKitchenGift: document.getElementById("emojiKitchenGift"),
  emojiKitchenVoyage: document.getElementById("emojiKitchenVoyage"),
  emojiKitchenFinal: document.getElementById("emojiKitchenFinal"),
  nameEntry: document.getElementById("nameEntry"),
  nameLive: document.getElementById("nameLive"),
  readouts: [
    document.getElementById("readout0"),
    document.getElementById("readout1"),
    document.getElementById("readout2"),
    document.getElementById("readout3"),
  ],
  btnNameNext: document.getElementById("btnNameNext"),
  ageBlock: document.getElementById("ageBlock"),
  btnAgeMinus: document.getElementById("btnAgeMinus"),
  btnAgePlus: document.getElementById("btnAgePlus"),
  ageValue: document.getElementById("ageValue"),
  btnAgeNext: document.getElementById("btnAgeNext"),
  btnBack: document.getElementById("btnBack"),
  btnBirthdayBack: document.getElementById("btnBirthdayBack"),
  btnBirthdayDone: document.getElementById("btnBirthdayDone"),
  slideUnlock: document.getElementById("slideUnlock"),
  slideUnlockTrack: document.getElementById("slideUnlockTrack"),
  slideUnlockThumb: document.getElementById("slideUnlockThumb"),
  slideUnlockFill: document.getElementById("slideUnlockFill"),
  slideUnlockHint: document.getElementById("slideUnlockHint"),
  birthdayMusic: document.getElementById("birthdayMusic"),
  birthdayContinueTimer: document.getElementById("birthdayContinueTimer"),
  birthdayTimerProgress: document.getElementById("birthdayTimerProgress"),
  birthdayContinueSeconds: document.getElementById("birthdayContinueSeconds"),
  btnGiftBack: document.getElementById("btnGiftBack"),
  btnGiftContinue: document.getElementById("btnGiftContinue"),
  giftSlideUnlock: document.getElementById("giftSlideUnlock"),
  giftSlideTrack: document.getElementById("giftSlideTrack"),
  giftSlideThumb: document.getElementById("giftSlideThumb"),
  giftSlideFill: document.getElementById("giftSlideFill"),
  giftSlideHint: document.getElementById("giftSlideHint"),
  emojiGiftSolo: document.getElementById("emojiGiftSolo"),
  btnVoyageBack: document.getElementById("btnVoyageBack"),
  btnVoyageContinue: document.getElementById("btnVoyageContinue"),
  btnVoyageNo: document.getElementById("btnVoyageNo"),
  btnVoyageYes: document.getElementById("btnVoyageYes"),
  voyageChoiceBlock: document.getElementById("voyageChoiceBlock"),
  voyageVerb: document.getElementById("voyageVerb"),
  voyageRejectionFlash: document.getElementById("voyageRejectionFlash"),
  btnAloneBack: document.getElementById("btnAloneBack"),
  btnAloneContinue: document.getElementById("btnAloneContinue"),
  btnAloneNo: document.getElementById("btnAloneNo"),
  btnAloneYes: document.getElementById("btnAloneYes"),
  btnEmbarkBack: document.getElementById("btnEmbarkBack"),
  btnEmbarkContinue: document.getElementById("btnEmbarkContinue"),
  btnEmbarkBike: document.getElementById("btnEmbarkBike"),
  btnEmbarkTrainBike: document.getElementById("btnEmbarkTrainBike"),
  embarkChoiceBlock: document.getElementById("embarkChoiceBlock"),
  btnGuideBack: document.getElementById("btnGuideBack"),
  btnGuideContinue: document.getElementById("btnGuideContinue"),
  btnGuideNo: document.getElementById("btnGuideNo"),
  btnGuideYes: document.getElementById("btnGuideYes"),
  btnNightBack: document.getElementById("btnNightBack"),
  btnNightContinue: document.getElementById("btnNightContinue"),
  btnNightNo: document.getElementById("btnNightNo"),
  btnNightYes: document.getElementById("btnNightYes"),
  btnConjoinedBack: document.getElementById("btnConjoinedBack"),
  btnConjoinedContinue: document.getElementById("btnConjoinedContinue"),
  btnConjoinedNo: document.getElementById("btnConjoinedNo"),
  btnConjoinedYes: document.getElementById("btnConjoinedYes"),
  btnEmbarkWhenBack: document.getElementById("btnEmbarkWhenBack"),
  btnEmbarkWhenContinue: document.getElementById("btnEmbarkWhenContinue"),
  inputEmbarkWhen: document.getElementById("inputEmbarkWhen"),
  embarkDatesList: document.getElementById("embarkDatesList"),
  labelEmbarkWhenAdd: document.getElementById("labelEmbarkWhenAdd"),
  btnFinalBack: document.getElementById("btnFinalBack"),
  btnFinalHelp: document.getElementById("btnFinalHelp"),
  emojiKitchenHelp: document.getElementById("emojiKitchenHelp"),
  finalNameEcho: document.getElementById("finalNameEcho"),
};

/** @type {"no" | "yes" | null} */
let voyageChoice = null;
/** @type {"no" | "yes" | null} */
let aloneChoice = null;
let voyageRejectionFlashActive = false;
/** @type {"bike" | "train-bike" | null} */
let embarkDistance = null;
/** @type {"no" | "yes" | null} */
let guideChoice = null;
/** @type {"no" | "yes" | null} */
let nightChoice = null;
/** @type {"no" | "yes" | null} */
let conjoinedChoice = null;
/** @type {string[]} ISO date strings (YYYY-MM-DD) */
let embarkDates = [];

let birthdayMusicStarted = false;

/** @type {HTMLDivElement[]} */
const dialViewports = /** @type {HTMLDivElement[]} */ (
  Array.from(document.querySelectorAll(".dial-viewport"))
);

/** Current value on the picker (clamped to {@link AGE_MIN}–{@link AGE_MAX}, {@link AGE_STEP} steps). */
let ageValue = AGE_MIN;

/** @param {number} n */
function toAgeTicks(n) {
  return Math.round(n / AGE_STEP);
}

/** @param {number} ticks */
function fromAgeTicks(ticks) {
  return ticks * AGE_STEP;
}

/** @param {number} n */
function clampAge(n) {
  const ticks = Math.max(
    toAgeTicks(AGE_MIN),
    Math.min(toAgeTicks(AGE_MAX), toAgeTicks(n)),
  );
  return fromAgeTicks(ticks);
}

/** @param {number} n */
function formatAgeDisplay(n) {
  const v = fromAgeTicks(toAgeTicks(n));
  return v.toFixed(1);
}

/** @param {number} a @param {number} b */
function ageValuesEqual(a, b) {
  return toAgeTicks(a) === toAgeTicks(b);
}

let dialItemPx = 40;

function getDialItemHeight() {
  const raw = getComputedStyle(document.documentElement).getPropertyValue("--dial-item-h");
  const n = Number.parseFloat(raw);
  return Number.isFinite(n) && n > 0 ? n : 40;
}

function setProgress(step) {
  if (step >= TOTAL_STEPS) {
    els.progressBar.style.width = "100%";
    els.stepLabel.textContent = PROGRESS_DONE_LABEL;
    els.appTop?.classList.remove("is-step-mystery");
    return;
  }

  const barStep = Math.min(step, PROGRESS_BAR_STEPS);
  const pct = (barStep / PROGRESS_BAR_STEPS) * 100;
  els.progressBar.style.width = `${pct}%`;
  const totalLabel =
    step >= PROGRESS_MYSTERY_FROM_STEP ? PROGRESS_FINAL_LABEL : String(PROGRESS_BAR_STEPS);
  els.stepLabel.textContent = `Step ${step} of ${totalLabel}`;
  els.appTop?.classList.toggle("is-step-mystery", step >= PROGRESS_MYSTERY_FROM_STEP);
}

function hideAllScreens() {
  els.screenName?.classList.add("is-hidden");
  els.screenAge?.classList.add("is-hidden");
  els.screenBirthday?.classList.add("is-hidden");
  els.screenGift?.classList.add("is-hidden");
  els.screenVoyage?.classList.add("is-hidden");
  els.screenAlone?.classList.add("is-hidden");
  els.screenEmbark?.classList.add("is-hidden");
  els.screenGuide?.classList.add("is-hidden");
  els.screenNight?.classList.add("is-hidden");
  els.screenConjoined?.classList.add("is-hidden");
  els.screenEmbarkWhen?.classList.add("is-hidden");
  els.screenFinal?.classList.add("is-hidden");
}

function runEmojiTransition(fromStage, toStage, after) {
  if (!fromStage || !toStage) {
    after();
    return;
  }
  fromStage.classList.remove("transition-in");
  fromStage.classList.add("transition-out");

  const onOutEnd = () => {
    fromStage.removeEventListener("animationend", onOutEnd);
    fromStage.classList.remove("transition-out");
    after();
    toStage.classList.remove("transition-in");
    void toStage.offsetWidth;
    toStage.classList.add("transition-in");
    const onInEnd = () => {
      toStage.removeEventListener("animationend", onInEnd);
      toStage.classList.remove("transition-in");
    };
    toStage.addEventListener("animationend", onInEnd);
  };

  fromStage.addEventListener("animationend", onOutEnd);
}

function isNameScreenVisible() {
  return !!els.screenName && !els.screenName.classList.contains("is-hidden");
}

function isAgeScreenVisible() {
  return !!els.screenAge && !els.screenAge.classList.contains("is-hidden");
}

function isBirthdayScreenVisible() {
  return !!els.screenBirthday && !els.screenBirthday.classList.contains("is-hidden");
}

function isGiftScreenVisible() {
  return !!els.screenGift && !els.screenGift.classList.contains("is-hidden");
}

function isVoyageScreenVisible() {
  return !!els.screenVoyage && !els.screenVoyage.classList.contains("is-hidden");
}

function isAloneScreenVisible() {
  return !!els.screenAlone && !els.screenAlone.classList.contains("is-hidden");
}

function isEmbarkScreenVisible() {
  return !!els.screenEmbark && !els.screenEmbark.classList.contains("is-hidden");
}

function isGuideScreenVisible() {
  return !!els.screenGuide && !els.screenGuide.classList.contains("is-hidden");
}

function isNightScreenVisible() {
  return !!els.screenNight && !els.screenNight.classList.contains("is-hidden");
}

function isConjoinedScreenVisible() {
  return !!els.screenConjoined && !els.screenConjoined.classList.contains("is-hidden");
}

function isEmbarkWhenScreenVisible() {
  return !!els.screenEmbarkWhen && !els.screenEmbarkWhen.classList.contains("is-hidden");
}

function isFinalScreenVisible() {
  return !!els.screenFinal && !els.screenFinal.classList.contains("is-hidden");
}

function isHelpScreenVisible() {
  return !!els.screenHelp && !els.screenHelp.classList.contains("is-hidden");
}

function isEmojiStageAnimating() {
  const stages = [
    els.emojiStageName,
    els.emojiStageAge,
    els.emojiStageBirthday,
    els.emojiStageGift,
    els.emojiStageVoyage,
    els.emojiStageAlone,
    els.emojiStageEmbark,
    els.emojiStageGuide,
    els.emojiStageNight,
    els.emojiStageConjoined,
    els.emojiStageEmbarkWhen,
    els.emojiStageFinal,
    els.emojiStageHelp,
  ];
  return stages.some(
    (stage) =>
      stage?.classList.contains("transition-out") ||
      stage?.classList.contains("transition-in"),
  );
}

function goToAgeScreenBypass() {
  const name = settleNameFromDials();
  if (!isValidName(name)) {
    if (canActivateNameContinue(name)) void playNameRejectionFlash();
    return;
  }
  responses.name = name;
  runEmojiTransition(els.emojiStageName, els.emojiStageAge, () => {
    hideAllScreens();
    els.screenAge.classList.remove("is-hidden");
    setProgress(2);
    els.btnAgeMinus.focus();
  });
}

function goToBirthdayScreen() {
  responses.age = ageValue;
  resetSlideUnlock();
  runEmojiTransition(els.emojiStageAge, els.emojiStageBirthday, () => {
    hideAllScreens();
    els.screenBirthday.classList.remove("is-hidden");
    setProgress(3);
    els.slideUnlockThumb?.focus();
  });
}

function goToNameScreenBypass() {
  stopCelebration();
  runEmojiTransition(els.emojiStageAge, els.emojiStageName, () => {
    hideAllScreens();
    els.screenName.classList.remove("is-hidden");
    setProgress(1);
    dialViewports[0]?.focus();
  });
}

function goToAgeFromBirthdayBypass() {
  stopCelebration();
  resetSlideUnlock();
  runEmojiTransition(els.emojiStageBirthday, els.emojiStageAge, () => {
    hideAllScreens();
    els.screenAge.classList.remove("is-hidden");
    setProgress(2);
    els.btnAgeMinus.focus();
  });
}

function ensureBirthdayMusicPlaying() {
  if (!birthdayMusicStarted) return;
  const audio = els.birthdayMusic;
  if (!audio || !audio.paused) return;
  void playBirthdayMusic();
}

function goToGiftScreen() {
  resetGiftSlideUnlock();
  runEmojiTransition(els.emojiStageBirthday, els.emojiStageGift, () => {
    hideAllScreens();
    els.screenGift.classList.remove("is-hidden");
    setProgress(4);
    ensureBirthdayMusicPlaying();
    initGiftSlideAtRest();
    els.giftSlideThumb?.focus();
  });
}

function goToBirthdayFromGiftBypass() {
  resetGiftSlideUnlock();
  runEmojiTransition(els.emojiStageGift, els.emojiStageBirthday, () => {
    hideAllScreens();
    els.screenBirthday.classList.remove("is-hidden");
    setProgress(3);
    ensureBirthdayMusicPlaying();
    els.slideUnlockThumb?.focus();
  });
}

function restoreGiftSlideIfComplete() {
  if (!giftSlideComplete) {
    initGiftSlideAtRest();
    return;
  }
  setGiftSlideOffset(0);
  els.giftSlideUnlock?.classList.add("is-complete");
  if (els.giftSlideThumb) els.giftSlideThumb.disabled = true;
  if (els.giftSlideHint) els.giftSlideHint.textContent = "Party stopped.";
  showGiftSoloEmoji();
  if (els.btnGiftContinue) els.btnGiftContinue.disabled = false;
}

/** @type {ReturnType<typeof setTimeout> | null} */
let voyageVerbTimerId = null;

function stopVoyageVerbFlip() {
  if (voyageVerbTimerId !== null) {
    clearTimeout(voyageVerbTimerId);
    voyageVerbTimerId = null;
  }
  if (els.voyageVerb) els.voyageVerb.textContent = "embarque";
}

function scheduleVoyageVerbFlip() {
  const delayMs = 160 + Math.random() * 240;
  voyageVerbTimerId = window.setTimeout(() => {
    voyageVerbTimerId = null;
    if (!isVoyageScreenVisible() || !els.voyageVerb) return;
    const current = els.voyageVerb.textContent.trim();
    els.voyageVerb.textContent = current === "embark" ? "embarque" : "embark";
    scheduleVoyageVerbFlip();
  }, delayMs);
}

function startVoyageVerbFlip() {
  stopVoyageVerbFlip();
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  scheduleVoyageVerbFlip();
}

function resetVoyageChoice() {
  voyageChoice = null;
  responses.voyageChoice = null;
  els.btnVoyageNo?.setAttribute("aria-pressed", "false");
  els.btnVoyageYes?.setAttribute("aria-pressed", "false");
  if (els.btnVoyageContinue) els.btnVoyageContinue.disabled = true;
}

function syncVoyageChoiceState() {
  const isNo = voyageChoice === "no";
  const isYes = voyageChoice === "yes";
  els.btnVoyageNo?.setAttribute("aria-pressed", isNo ? "true" : "false");
  els.btnVoyageYes?.setAttribute("aria-pressed", isYes ? "true" : "false");
  if (els.btnVoyageContinue) els.btnVoyageContinue.disabled = voyageChoice === null;
}

function isVoyageContinueReady() {
  return (
    !voyageRejectionFlashActive &&
    voyageChoice !== null &&
    els.btnVoyageContinue &&
    !els.btnVoyageContinue.disabled
  );
}

/**
 * @param {{ continueBtn?: HTMLButtonElement | null, onFinish?: () => void }} [options]
 */
function playRejectionFlash(options = {}) {
  const overlay = els.voyageRejectionFlash;
  if (!overlay || voyageRejectionFlashActive) return Promise.resolve();

  const { continueBtn, onFinish } = options;
  voyageRejectionFlashActive = true;
  if (continueBtn) continueBtn.disabled = true;

  return new Promise((resolve) => {
    const finish = () => {
      overlay.classList.remove("is-active");
      overlay.hidden = true;
      voyageRejectionFlashActive = false;
      onFinish?.();
      resolve();
    };

    const onEnd = () => {
      overlay.removeEventListener("animationend", onEnd);
      finish();
    };

    overlay.hidden = false;
    void overlay.offsetWidth;
    overlay.classList.add("is-active");
    overlay.addEventListener("animationend", onEnd);

    window.setTimeout(() => {
      if (!voyageRejectionFlashActive) return;
      overlay.removeEventListener("animationend", onEnd);
      finish();
    }, 1200);
  });
}

function playVoyageRejectionFlash() {
  return playRejectionFlash({
    continueBtn: els.btnVoyageContinue,
    onFinish: () => {
      resetVoyageChoice();
      els.btnVoyageNo?.focus();
    },
  });
}

function playAloneRejectionFlash() {
  return playRejectionFlash({
    continueBtn: els.btnAloneContinue,
    onFinish: () => {
      resetAloneChoice();
      els.btnAloneNo?.focus();
    },
  });
}

function resetNameDials() {
  els.nameEntry?.classList.remove("is-correct");
  dialViewports.forEach((viewport) => {
    viewport.scrollTop = 0;
    snapDialViewport(viewport);
  });
  syncDialSelectedItems();
  updateNameState();
}

function playNameRejectionFlash() {
  return playRejectionFlash({
    continueBtn: els.btnNameNext,
    onFinish: () => {
      resetNameDials();
    },
  });
}

function handleVoyageContinue() {
  if (!isVoyageContinueReady()) return;
  if (voyageChoice === "no") {
    void playVoyageRejectionFlash();
    return;
  }
  goToAloneScreen();
}

function resetAloneChoice() {
  aloneChoice = null;
  responses.goAlone = null;
  resetYesNoButtons(els.btnAloneNo, els.btnAloneYes, els.btnAloneContinue);
}

function syncAloneChoiceState() {
  syncYesNoButtons(aloneChoice, els.btnAloneNo, els.btnAloneYes, els.btnAloneContinue);
}

function isAloneContinueReady() {
  return (
    !voyageRejectionFlashActive &&
    aloneChoice !== null &&
    els.btnAloneContinue &&
    !els.btnAloneContinue.disabled
  );
}

function setAloneChoice(choice) {
  aloneChoice = choice;
  responses.goAlone = choice;
  syncAloneChoiceState();
}

function handleAloneContinue() {
  if (!isAloneContinueReady()) return;
  if (aloneChoice === "yes") {
    void playAloneRejectionFlash();
    return;
  }
  goToEmbarkScreen();
}

function goToAloneScreen() {
  stopVoyageVerbFlip();
  resetAloneChoice();
  runEmojiTransition(els.emojiStageVoyage, els.emojiStageAlone, () => {
    hideAllScreens();
    els.screenAlone.classList.remove("is-hidden");
    setProgress(6);
    els.btnAloneNo?.focus();
  });
}

function goToVoyageFromAloneBypass() {
  resetAloneChoice();
  runEmojiTransition(els.emojiStageAlone, els.emojiStageVoyage, () => {
    hideAllScreens();
    els.screenVoyage.classList.remove("is-hidden");
    setProgress(5);
    startVoyageVerbFlip();
    syncVoyageChoiceState();
    els.btnVoyageYes?.focus();
  });
}

function resetEmbarkChoice() {
  embarkDistance = null;
  responses.embarkDistance = null;
  els.btnEmbarkBike?.setAttribute("aria-pressed", "false");
  els.btnEmbarkTrainBike?.setAttribute("aria-pressed", "false");
  if (els.btnEmbarkContinue) els.btnEmbarkContinue.disabled = true;
}

function syncEmbarkChoiceState() {
  const isBike = embarkDistance === "bike";
  const isTrainBike = embarkDistance === "train-bike";
  els.btnEmbarkBike?.setAttribute("aria-pressed", isBike ? "true" : "false");
  els.btnEmbarkTrainBike?.setAttribute("aria-pressed", isTrainBike ? "true" : "false");
  if (els.btnEmbarkContinue) els.btnEmbarkContinue.disabled = embarkDistance === null;
}

function isEmbarkContinueReady() {
  return embarkDistance !== null && els.btnEmbarkContinue && !els.btnEmbarkContinue.disabled;
}

function setEmbarkDistance(choice) {
  embarkDistance = choice;
  responses.embarkDistance = choice;
  syncEmbarkChoiceState();
}

function goToEmbarkScreen() {
  resetEmbarkChoice();
  runEmojiTransition(els.emojiStageAlone, els.emojiStageEmbark, () => {
    hideAllScreens();
    els.screenEmbark.classList.remove("is-hidden");
    setProgress(7);
    els.btnEmbarkBike?.focus();
  });
}

function goToAloneFromEmbarkBypass() {
  resetEmbarkChoice();
  runEmojiTransition(els.emojiStageEmbark, els.emojiStageAlone, () => {
    hideAllScreens();
    els.screenAlone.classList.remove("is-hidden");
    setProgress(6);
    syncAloneChoiceState();
    els.btnAloneNo?.focus();
  });
}

/**
 * @param {HTMLButtonElement | null} noBtn
 * @param {HTMLButtonElement | null} yesBtn
 * @param {HTMLButtonElement | null} continueBtn
 */
function resetYesNoButtons(noBtn, yesBtn, continueBtn) {
  noBtn?.setAttribute("aria-pressed", "false");
  yesBtn?.setAttribute("aria-pressed", "false");
  if (continueBtn) continueBtn.disabled = true;
}

/**
 * @param {"no" | "yes" | null} choice
 * @param {HTMLButtonElement | null} noBtn
 * @param {HTMLButtonElement | null} yesBtn
 * @param {HTMLButtonElement | null} continueBtn
 */
function syncYesNoButtons(choice, noBtn, yesBtn, continueBtn) {
  noBtn?.setAttribute("aria-pressed", choice === "no" ? "true" : "false");
  yesBtn?.setAttribute("aria-pressed", choice === "yes" ? "true" : "false");
  if (continueBtn) continueBtn.disabled = choice === null;
}

function resetGuideChoice() {
  guideChoice = null;
  responses.needGuide = null;
  resetYesNoButtons(els.btnGuideNo, els.btnGuideYes, els.btnGuideContinue);
}

function syncGuideChoiceState() {
  syncYesNoButtons(guideChoice, els.btnGuideNo, els.btnGuideYes, els.btnGuideContinue);
}

function isGuideContinueReady() {
  return guideChoice !== null && els.btnGuideContinue && !els.btnGuideContinue.disabled;
}

function setGuideChoice(choice) {
  guideChoice = choice;
  responses.needGuide = choice;
  syncGuideChoiceState();
}

function resetNightChoice() {
  nightChoice = null;
  responses.stayNight = null;
  resetYesNoButtons(els.btnNightNo, els.btnNightYes, els.btnNightContinue);
}

function syncNightChoiceState() {
  syncYesNoButtons(nightChoice, els.btnNightNo, els.btnNightYes, els.btnNightContinue);
}

function isNightContinueReady() {
  return nightChoice !== null && els.btnNightContinue && !els.btnNightContinue.disabled;
}

function setNightChoice(choice) {
  nightChoice = choice;
  responses.stayNight = choice;
  syncNightChoiceState();
}

function resetConjoinedChoice() {
  conjoinedChoice = null;
  responses.conjoined = null;
  resetYesNoButtons(els.btnConjoinedNo, els.btnConjoinedYes, els.btnConjoinedContinue);
}

function syncConjoinedChoiceState() {
  syncYesNoButtons(conjoinedChoice, els.btnConjoinedNo, els.btnConjoinedYes, els.btnConjoinedContinue);
}

function isConjoinedContinueReady() {
  return (
    conjoinedChoice !== null && els.btnConjoinedContinue && !els.btnConjoinedContinue.disabled
  );
}

function setConjoinedChoice(choice) {
  conjoinedChoice = choice;
  responses.conjoined = choice;
  syncConjoinedChoiceState();
}

/** Tomorrow in local time as YYYY-MM-DD (earliest selectable embark date). */
function getMinEmbarkDateIso() {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function updateEmbarkDateInputMin() {
  if (!els.inputEmbarkWhen) return;
  els.inputEmbarkWhen.min = getMinEmbarkDateIso();
}

/**
 * @param {string} iso YYYY-MM-DD
 */
function isEmbarkDateAllowed(iso) {
  return iso >= getMinEmbarkDateIso();
}

function openEmbarkDatePicker() {
  const input = els.inputEmbarkWhen;
  if (!input) return;
  updateEmbarkDateInputMin();
  if (typeof input.showPicker === "function") {
    try {
      input.showPicker();
      return;
    } catch {
      /* fall through */
    }
  }
  input.click();
}

/**
 * @param {string} iso YYYY-MM-DD
 */
function formatEmbarkDateLabel(iso) {
  const parts = iso.split("-").map(Number);
  if (parts.length !== 3 || parts.some((n) => !Number.isFinite(n))) return iso;
  const [y, m, d] = parts;
  const date = new Date(y, m - 1, d);
  if (Number.isNaN(date.getTime())) return iso;
  const dayName = new Intl.DateTimeFormat(undefined, { weekday: "short" }).format(date);
  const dd = String(d).padStart(2, "0");
  const mm = String(m).padStart(2, "0");
  return `${dayName}, ${dd}.${mm}`;
}

function renderEmbarkDateChips() {
  const list = els.embarkDatesList;
  if (!list) return;
  list.replaceChildren();

  for (const iso of embarkDates) {
    const chip = document.createElement("button");
    chip.type = "button";
    chip.className = "embark-date-chip";
    chip.setAttribute("role", "listitem");
    chip.setAttribute("aria-label", `Remove ${formatEmbarkDateLabel(iso)}`);

    const label = document.createElement("span");
    label.className = "embark-date-chip-label";
    label.textContent = formatEmbarkDateLabel(iso);

    const remove = document.createElement("span");
    remove.className = "embark-date-chip-remove";
    remove.setAttribute("aria-hidden", "true");
    remove.textContent = "×";

    chip.append(label, remove);
    chip.addEventListener("click", () => {
      removeEmbarkDate(iso);
    });
    list.append(chip);
  }
}

/**
 * @param {string} iso
 */
function addEmbarkDate(iso) {
  const value = iso.trim();
  if (!value || !isEmbarkDateAllowed(value)) return;
  if (!embarkDates.includes(value)) {
    embarkDates.push(value);
    embarkDates.sort();
    responses.embarkWhen = [...embarkDates];
    renderEmbarkDateChips();
  }
  if (els.inputEmbarkWhen) els.inputEmbarkWhen.value = "";
  syncEmbarkWhenState();
}

/**
 * @param {string} iso
 */
function removeEmbarkDate(iso) {
  embarkDates = embarkDates.filter((d) => d !== iso);
  responses.embarkWhen = [...embarkDates];
  renderEmbarkDateChips();
  syncEmbarkWhenState();
}

function resetEmbarkWhen() {
  embarkDates = [];
  responses.embarkWhen = [];
  if (els.inputEmbarkWhen) els.inputEmbarkWhen.value = "";
  updateEmbarkDateInputMin();
  renderEmbarkDateChips();
  if (els.btnEmbarkWhenContinue) els.btnEmbarkWhenContinue.disabled = true;
}

function syncEmbarkWhenState() {
  if (els.btnEmbarkWhenContinue) {
    els.btnEmbarkWhenContinue.disabled = embarkDates.length === 0;
  }
}

function isEmbarkWhenContinueReady() {
  return (
    embarkDates.length > 0 && els.btnEmbarkWhenContinue && !els.btnEmbarkWhenContinue.disabled
  );
}

function goToGuideScreen() {
  resetGuideChoice();
  runEmojiTransition(els.emojiStageEmbark, els.emojiStageGuide, () => {
    hideAllScreens();
    els.screenGuide.classList.remove("is-hidden");
    setProgress(8);
    els.btnGuideNo?.focus();
  });
}

function goToEmbarkFromGuideBypass() {
  resetGuideChoice();
  runEmojiTransition(els.emojiStageGuide, els.emojiStageEmbark, () => {
    hideAllScreens();
    els.screenEmbark.classList.remove("is-hidden");
    setProgress(7);
    syncEmbarkChoiceState();
    els.btnEmbarkBike?.focus();
  });
}

function goToNightScreen() {
  resetNightChoice();
  runEmojiTransition(els.emojiStageGuide, els.emojiStageNight, () => {
    hideAllScreens();
    els.screenNight.classList.remove("is-hidden");
    setProgress(9);
    els.btnNightNo?.focus();
  });
}

function goToGuideFromNightBypass() {
  resetNightChoice();
  runEmojiTransition(els.emojiStageNight, els.emojiStageGuide, () => {
    hideAllScreens();
    els.screenGuide.classList.remove("is-hidden");
    setProgress(8);
    syncGuideChoiceState();
    els.btnGuideNo?.focus();
  });
}

function goToConjoinedScreen() {
  resetConjoinedChoice();
  runEmojiTransition(els.emojiStageNight, els.emojiStageConjoined, () => {
    hideAllScreens();
    els.screenConjoined.classList.remove("is-hidden");
    setProgress(10);
    els.btnConjoinedNo?.focus();
  });
}

function goToNightFromConjoinedBypass() {
  resetConjoinedChoice();
  runEmojiTransition(els.emojiStageConjoined, els.emojiStageNight, () => {
    hideAllScreens();
    els.screenNight.classList.remove("is-hidden");
    setProgress(9);
    syncNightChoiceState();
    els.btnNightNo?.focus();
  });
}

function goToEmbarkWhenScreen() {
  resetEmbarkWhen();
  runEmojiTransition(els.emojiStageConjoined, els.emojiStageEmbarkWhen, () => {
    hideAllScreens();
    els.screenEmbarkWhen.classList.remove("is-hidden");
    setProgress(11);
    updateEmbarkDateInputMin();
    els.labelEmbarkWhenAdd?.focus();
  });
}

function goToConjoinedFromEmbarkWhenBypass() {
  resetEmbarkWhen();
  runEmojiTransition(els.emojiStageEmbarkWhen, els.emojiStageConjoined, () => {
    hideAllScreens();
    els.screenConjoined.classList.remove("is-hidden");
    setProgress(10);
    syncConjoinedChoiceState();
    els.btnConjoinedNo?.focus();
  });
}

function syncFinalNameEcho() {
  if (els.finalNameEcho) {
    els.finalNameEcho.textContent = responses.name.trim() || "friend";
  }
}

function goToFinalScreen() {
  syncFinalNameEcho();
  runEmojiTransition(els.emojiStageEmbarkWhen, els.emojiStageFinal, () => {
    hideAllScreens();
    els.screenFinal.classList.remove("is-hidden");
    setProgress(12);
    els.btnFinalHelp?.focus();
  });
}

function goToHelpScreen() {
  hideAllScreens();
  document.body.classList.add("is-help-page");
  els.screenHelp?.classList.remove("is-hidden");

  const theme = document.querySelector('meta[name="theme-color"]');
  if (theme) theme.setAttribute("content", "#ffffff");
}

function goToEmbarkWhenFromFinalBypass() {
  runEmojiTransition(els.emojiStageFinal, els.emojiStageEmbarkWhen, () => {
    hideAllScreens();
    els.screenEmbarkWhen.classList.remove("is-hidden");
    setProgress(11);
    syncEmbarkWhenState();
    els.labelEmbarkWhenAdd?.focus();
  });
}

function setVoyageChoice(choice) {
  voyageChoice = choice;
  responses.voyageChoice = choice;
  syncVoyageChoiceState();
}

function goToVoyageScreen() {
  resetVoyageChoice();
  runEmojiTransition(els.emojiStageGift, els.emojiStageVoyage, () => {
    hideAllScreens();
    els.screenVoyage.classList.remove("is-hidden");
    setProgress(5);
    startVoyageVerbFlip();
    els.btnVoyageNo?.focus();
  });
}

function goToGiftFromVoyageBypass() {
  stopVoyageVerbFlip();
  resetVoyageChoice();
  runEmojiTransition(els.emojiStageVoyage, els.emojiStageGift, () => {
    hideAllScreens();
    els.screenGift.classList.remove("is-hidden");
    setProgress(4);
    restoreGiftSlideIfComplete();
    els.giftSlideThumb?.focus();
  });
}

/**
 * @typedef {{
 *   actionUrl: string,
 *   entries: {
 *     embarkDistance: string,
 *     needGuide: string,
 *     stayNight: string,
 *     conjoined: string,
 *     embarkWhen: string,
 *   },
 * }} GoogleFormConfig
 */

/** @returns {GoogleFormConfig | null} */
function getGoogleFormConfig() {
  const cfg = /** @type {{ GOOGLE_FORM_CONFIG?: GoogleFormConfig }} */ (window).GOOGLE_FORM_CONFIG;
  if (!cfg?.actionUrl?.trim()) return null;

  const { entries } = cfg;
  if (
    !entries?.embarkDistance?.trim() ||
    !entries?.needGuide?.trim() ||
    !entries?.stayNight?.trim() ||
    !entries?.conjoined?.trim() ||
    !entries?.embarkWhen?.trim()
  ) {
    return null;
  }

  return cfg;
}

/** @param {GoogleFormConfig} cfg */
function buildGoogleFormBody(cfg) {
  const params = new URLSearchParams();
  params.append(cfg.entries.embarkDistance, responses.embarkDistance ?? "");
  params.append(cfg.entries.needGuide, responses.needGuide ?? "");
  params.append(cfg.entries.stayNight, responses.stayNight ?? "");
  params.append(cfg.entries.conjoined, responses.conjoined ?? "");
  params.append(
    cfg.entries.embarkWhen,
    responses.embarkWhen.length > 0 ? responses.embarkWhen.join(", ") : "",
  );
  return params;
}

/** @returns {Promise<{ ok: boolean, skipped: boolean }>} */
async function submitResponsesToGoogleForm() {
  const cfg = getGoogleFormConfig();
  if (!cfg) {
    console.info("Google Form not configured; skipping form submit.");
    return { ok: true, skipped: true };
  }

  try {
    await fetch(cfg.actionUrl.trim(), {
      method: "POST",
      mode: "no-cors",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8",
      },
      body: buildGoogleFormBody(cfg),
    });
    console.info("Google Form submit sent.", {
      embarkDistance: responses.embarkDistance,
      needGuide: responses.needGuide,
      stayNight: responses.stayNight,
      conjoined: responses.conjoined,
      embarkWhen: responses.embarkWhen,
    });
    return { ok: true, skipped: false };
  } catch (err) {
    console.error("Google Form submit failed:", err);
    return { ok: false, skipped: false };
  }
}

async function handleEmbarkWhenSubmit() {
  const btn = els.btnEmbarkWhenContinue;
  const prevLabel = btn?.textContent ?? "Submit";

  if (btn) {
    btn.disabled = true;
    btn.textContent = "Submitting…";
  }

  await submitResponsesToGoogleForm();

  if (btn) {
    btn.textContent = prevLabel;
    syncEmbarkWhenState();
  }

  goToFinalScreen();
}

function finishQuestionnaire() {
  stopVoyageVerbFlip();
  responses.age = ageValue;
  console.info("Collected questionnaire sample:", {
    name: responses.name,
    age: responses.age,
    voyageChoice: responses.voyageChoice,
    goAlone: responses.goAlone,
    embarkDistance: responses.embarkDistance,
    needGuide: responses.needGuide,
    stayNight: responses.stayNight,
    conjoined: responses.conjoined,
    embarkWhen: responses.embarkWhen,
  });
  const embarkLabel =
    responses.embarkWhen.length > 0
      ? responses.embarkWhen.map(formatEmbarkDateLabel).join(", ")
      : "—";
  alert(
    `Thanks, ${responses.name}!\n\n(Example) Date: ${formatAgeDisplay(responses.age ?? ageValue)}\nEmbark: ${embarkLabel}\n\nOpen DevTools console to see the payload object.`,
  );
}

/**
 * One grapheme cluster (for a single emoji glyph).
 * @param {string} str
 */
function firstGrapheme(str) {
  if (!str) return "";
  const seg = new Intl.Segmenter(undefined, { granularity: "grapheme" });
  const first = [...seg.segment(str)][0];
  return first?.segment ?? "";
}

/**
 * Hyphenated hex keys used in Emoji Kitchen URLs (e.g. "2764-fe0f").
 * @param {string} emoji one grapheme
 */
function emojiToKitchenHexKey(emoji) {
  const parts = [];
  for (let i = 0; i < emoji.length; ) {
    const cp = emoji.codePointAt(i);
    parts.push(cp.toString(16));
    i += cp > 0xffff ? 2 : 1;
  }
  return parts.length ? parts.join("-").toLowerCase() : "";
}

/** @param {string} hexKey */
function kitchenUrlPathPart(hexKey) {
  return hexKey
    .split("-")
    .map((p) => `u${p}`)
    .join("-");
}

/**
 * @param {string} date YYYYMMDD
 * @param {string} leftKey
 * @param {string} rightKey
 */
function emojiKitchenPngUrl(date, leftKey, rightKey) {
  const L = kitchenUrlPathPart(leftKey);
  const R = kitchenUrlPathPart(rightKey);
  return `${EMOJI_KITCHEN_BASE}/${date}/${L}/${L}_${R}.png`;
}

/**
 * @param {string} emojiA
 * @param {string} emojiB
 * @returns {string[]}
 */
function buildEmojiKitchenCandidates(emojiA, emojiB) {
  const ka0 = emojiToKitchenHexKey(firstGrapheme(emojiA));
  const kb0 = emojiToKitchenHexKey(firstGrapheme(emojiB));
  if (!ka0 || !kb0) return [];

  const kaList = kitchenHexKeyVariants(ka0);
  const kbList = kitchenHexKeyVariants(kb0);
  const urls = [];

  for (const date of EMOJI_KITCHEN_DATES) {
    for (const ka of kaList) {
      for (const kb of kbList) {
        urls.push(emojiKitchenPngUrl(date, ka, kb));
        if (ka !== kb) urls.push(emojiKitchenPngUrl(date, kb, ka));
      }
    }
  }
  return urls;
}

/**
 * Load Emoji Kitchen combo into `img` from `stage.dataset.kitchenLeft` / `kitchenRight`.
 * Combo image only — no text fallback if loading fails.
 * @param {HTMLImageElement | null} img
 * @param {HTMLElement | null} stage
 */
function initEmojiKitchenDuo(img, stage) {
  if (!img || !stage) return;

  const a = (stage.dataset.kitchenLeft ?? "").trim();
  const b = (stage.dataset.kitchenRight ?? "").trim();
  if (!a || !b) return;

  const urls = buildEmojiKitchenCandidates(a, b);
  if (urls.length === 0) return;

  const alt = (stage.dataset.kitchenAlt ?? "").trim() || `${a} + ${b}`;
  img.alt = alt;

  let idx = 0;
  const fail = () => {
    img.removeAttribute("src");
    img.hidden = true;
  };

  const tryNext = () => {
    if (idx >= urls.length) {
      fail();
      return;
    }
    const url = urls[idx];
    idx += 1;
    img.onload = () => {
      img.onload = null;
      img.onerror = null;
      img.hidden = false;
    };
    img.onerror = () => {
      img.onload = null;
      tryNext();
    };
    img.src = url;
  };

  img.hidden = true;
  tryNext();
}

/**
 * @param {HTMLElement} listEl
 * @param {string[]} letterOrder one full A–Z permutation per wheel
 */
function populateDialList(listEl, letterOrder) {
  listEl.replaceChildren();
  for (let r = 0; r < DIAL_REPEAT; r++) {
    for (const letter of letterOrder) {
      const item = document.createElement("div");
      item.className = "dial-item";
      item.dataset.letter = letter;
      item.textContent = letter;
      item.setAttribute("role", "option");
      listEl.appendChild(item);
    }
  }
}

/**
 * Snap scroll position so a row is centered (iOS-style).
 * @param {HTMLDivElement} viewport
 */
function snapDialViewport(viewport) {
  const maxScroll = Math.max(0, viewport.scrollHeight - viewport.clientHeight);
  let y = Math.round(viewport.scrollTop / dialItemPx) * dialItemPx;
  y = Math.max(0, Math.min(maxScroll, y));
  if (Math.abs(viewport.scrollTop - y) > 0.5) {
    viewport.scrollTop = y;
  }
}

/**
 * @param {HTMLDivElement} viewport
 */
function readDialLetter(viewport) {
  const selected = viewport.querySelector(".dial-item.is-selected");
  if (selected?.dataset.letter) return selected.dataset.letter;

  const items = viewport.querySelectorAll(".dial-item");
  if (!items.length) return "A";
  const idx = Math.round(viewport.scrollTop / dialItemPx);
  const clamped = Math.max(0, Math.min(items.length - 1, idx));
  return items[clamped].dataset.letter ?? "A";
}

/** Snap wheels, sync selection, return the four-letter name. */
function settleNameFromDials() {
  dialViewports.forEach((viewport) => {
    snapDialViewport(viewport);
  });
  syncDialSelectedItems();
  return dialViewports.map((viewport) => readDialLetter(viewport)).join("");
}

function syncDialSelectedItems() {
  dialViewports.forEach((viewport) => {
    const items = viewport.querySelectorAll(".dial-item");
    if (!items.length) return;
    const idx = Math.round(viewport.scrollTop / dialItemPx);
    const clamped = Math.max(0, Math.min(items.length - 1, idx));
    items.forEach((el, i) => {
      el.classList.toggle("is-selected", i === clamped);
    });
  });
}

function getNameFromDials() {
  return dialViewports.map((vp) => readDialLetter(vp)).join("");
}

function supportsScrollEnd() {
  return typeof HTMLElement !== "undefined" && "onscrollend" in HTMLElement.prototype;
}

function attachDialViewport(viewport) {
  const snapAndUpdate = () => {
    snapDialViewport(viewport);
    updateNameState();
  };

  let raf = 0;
  let settleTimer = 0;

  const onScroll = () => {
    if (raf) cancelAnimationFrame(raf);
    raf = requestAnimationFrame(() => {
      raf = 0;
      updateNameState();
    });

    if (!supportsScrollEnd()) {
      window.clearTimeout(settleTimer);
      settleTimer = window.setTimeout(snapAndUpdate, 140);
    }
  };

  viewport.addEventListener("scroll", onScroll, { passive: true });

  if (supportsScrollEnd()) {
    viewport.addEventListener("scrollend", snapAndUpdate);
  }
}

function updateNameState() {
  const name = getNameFromDials();
  const isCorrect = isValidName(name);
  const canContinue = canActivateNameContinue(name);

  els.readouts.forEach((el, i) => {
    if (!el) return;
    el.textContent = name[i] ?? "—";
  });

  els.nameEntry.classList.toggle("is-correct", isCorrect);
  els.btnNameNext.disabled = !canContinue;

  els.nameLive.textContent = isCorrect
    ? `${name}. Correct.`
    : canContinue
      ? `${name.split("").join(" ")}. Try again.`
      : `${name.split("").join(" ")}. Spell ${CORRECT_NAME} to continue.`;

  syncDialSelectedItems();
}

function initDials() {
  dialItemPx = getDialItemHeight();

  const orders = uniqueDialOrders(dialViewports.length);

  dialViewports.forEach((viewport, i) => {
    const list = viewport.querySelector(".dial-list");
    if (!list) return;
    const order = orders[i] ?? shuffleLetters(ALPHABET);
    populateDialList(list, order);
    attachDialViewport(viewport);
    viewport.scrollTop = 0;
    snapDialViewport(viewport);
  });

  updateNameState();
}

initDials();

els.btnNameNext.addEventListener("click", (e) => {
  e.preventDefault();
  const name = settleNameFromDials();
  if (!isValidName(name)) {
    if (canActivateNameContinue(name)) void playNameRejectionFlash();
    return;
  }
  responses.name = name;

  runEmojiTransition(els.emojiStageName, els.emojiStageAge, () => {
    hideAllScreens();
    els.screenAge.classList.remove("is-hidden");
    setProgress(2);
    els.btnAgeMinus.focus();
  });
});

function syncAgeState() {
  els.ageValue.textContent = formatAgeDisplay(ageValue);
  const ok = ageValuesEqual(ageValue, CORRECT_AGE);
  els.ageBlock.classList.toggle("is-correct", ok);
  els.btnAgeNext.disabled = !ok;

  els.btnAgeMinus.disabled = ageValuesEqual(clampAge(ageValue - AGE_STEP), ageValue);
  els.btnAgePlus.disabled = ageValuesEqual(clampAge(ageValue + AGE_STEP), ageValue);
}

els.btnAgeMinus.addEventListener("click", () => {
  ageValue = clampAge(ageValue - AGE_STEP);
  syncAgeState();
});

els.btnAgePlus.addEventListener("click", () => {
  ageValue = clampAge(ageValue + AGE_STEP);
  syncAgeState();
});

els.btnBack.addEventListener("click", () => {
  goToNameScreenBypass();
});

els.btnAgeNext.addEventListener("click", () => {
  if (!ageValuesEqual(ageValue, CORRECT_AGE)) return;
  responses.age = CORRECT_AGE;
  goToBirthdayScreen();
});

const SLIDE_COMPLETE_RATIO = 0.92;
const CONTINUE_DELAY_MS = 20000;
const CONTINUE_TIMER_RING_R = 13;
const CONTINUE_TIMER_CIRCUMFERENCE = 2 * Math.PI * CONTINUE_TIMER_RING_R;
const CONFETTI_COLORS = [
  "#b3d334",
  "#f4f6fb",
  "#ff7b72",
  "#6eb5ff",
  "#ffd166",
  "#c77dff",
  "#ff8fab",
];
const BIRTHDAY_MUSIC_SRC = "assets/sok.mp3";
/** Start playback at 00:01 on page 3. */
const BIRTHDAY_MUSIC_START_SEC = 1;

let slideUnlockComplete = false;
let giftSlideComplete = false;
let continueUnlocked = false;
/** @type {number | null} */
let continueTimerFrameId = null;
/** @type {number | null} */
let slidePointerId = null;
/** @type {number | null} */
let giftSlidePointerId = null;
let slideDragStartX = 0;
let slideStartOffset = 0;
let giftSlideDragStartX = 0;
let giftSlideStartOffset = 0;
let confettiRunning = false;
let confettiFrameId = 0;
/** @type {HTMLCanvasElement | null} */
let confettiCanvas = null;
/** @type {(() => void) | null} */
let confettiResizeHandler = null;
/** @type {Array<{ x: number, y: number, w: number, h: number, color: string, vx: number, vy: number, rot: number, vr: number }>} */
let confettiParticles = [];

function getSlideMaxOffset() {
  const track = els.slideUnlockTrack;
  const thumb = els.slideUnlockThumb;
  if (!track || !thumb) return 0;
  return Math.max(0, track.clientWidth - thumb.offsetWidth);
}

function getSlideOffsetFromThumb() {
  const left = els.slideUnlockThumb?.style.left;
  if (!left) return 0;
  return Number.parseFloat(left) || 0;
}

function setSlideOffset(px) {
  const max = getSlideMaxOffset();
  const x = Math.max(0, Math.min(max, px));
  const thumbW = els.slideUnlockThumb?.offsetWidth ?? 0;
  if (els.slideUnlockThumb) els.slideUnlockThumb.style.left = `${x}px`;
  if (els.slideUnlockFill) els.slideUnlockFill.style.width = `${x + thumbW}px`;
  return x;
}

function clearContinueTimer() {
  if (continueTimerFrameId !== null) {
    cancelAnimationFrame(continueTimerFrameId);
    continueTimerFrameId = null;
  }
  continueUnlocked = false;
  const btn = els.btnBirthdayDone;
  if (btn) {
    btn.disabled = true;
    btn.classList.remove("is-waiting");
    btn.removeAttribute("aria-label");
  }
  els.birthdayContinueTimer?.setAttribute("hidden", "");
  if (els.birthdayTimerProgress) {
    els.birthdayTimerProgress.style.strokeDashoffset = String(CONTINUE_TIMER_CIRCUMFERENCE);
  }
  if (els.birthdayContinueSeconds) {
    els.birthdayContinueSeconds.textContent = String(CONTINUE_DELAY_MS / 1000);
  }
}

function isBirthdayContinueReady() {
  return continueUnlocked && els.btnBirthdayDone && !els.btnBirthdayDone.disabled;
}

function startContinueCountdown() {
  clearContinueTimer();
  const btn = els.btnBirthdayDone;
  if (!btn) return;

  btn.disabled = true;
  btn.classList.add("is-waiting");
  els.birthdayContinueTimer?.removeAttribute("hidden");
  if (els.birthdayTimerProgress) {
    els.birthdayTimerProgress.style.strokeDasharray = String(CONTINUE_TIMER_CIRCUMFERENCE);
    els.birthdayTimerProgress.style.strokeDashoffset = String(CONTINUE_TIMER_CIRCUMFERENCE);
  }

  const start = performance.now();

  const frame = (now) => {
    const elapsed = now - start;
    const progress = Math.min(1, elapsed / CONTINUE_DELAY_MS);
    const remainingSec = Math.max(0, Math.ceil((CONTINUE_DELAY_MS - elapsed) / 1000));

    if (els.birthdayContinueSeconds) {
      els.birthdayContinueSeconds.textContent = String(remainingSec);
    }
    if (els.birthdayTimerProgress) {
      els.birthdayTimerProgress.style.strokeDashoffset = String(
        CONTINUE_TIMER_CIRCUMFERENCE * (1 - progress),
      );
    }
    btn.setAttribute(
      "aria-label",
      remainingSec > 0
        ? `Continue available in ${remainingSec} seconds`
        : "Continue",
    );

    if (progress < 1) {
      continueTimerFrameId = requestAnimationFrame(frame);
      return;
    }

    continueTimerFrameId = null;
    continueUnlocked = true;
    btn.disabled = false;
    btn.classList.remove("is-waiting");
    els.birthdayContinueTimer?.setAttribute("hidden", "");
    btn.setAttribute("aria-label", "Continue");
  };

  continueTimerFrameId = requestAnimationFrame(frame);
}

function resetSlideUnlock() {
  slideUnlockComplete = false;
  slidePointerId = null;
  clearContinueTimer();
  els.slideUnlock?.classList.remove("is-complete", "is-dragging");
  if (els.slideUnlockThumb) {
    els.slideUnlockThumb.style.left = "";
    els.slideUnlockThumb.disabled = false;
  }
  if (els.slideUnlockFill) {
    els.slideUnlockFill.style.width = "";
    els.slideUnlockFill.style.transition = "";
  }
  if (els.slideUnlockHint) els.slideUnlockHint.textContent = "Slide to celebrate";
}

function stopConfetti() {
  confettiRunning = false;
  if (confettiFrameId) {
    cancelAnimationFrame(confettiFrameId);
    confettiFrameId = 0;
  }
  if (confettiResizeHandler) {
    window.removeEventListener("resize", confettiResizeHandler);
    confettiResizeHandler = null;
  }
  if (confettiCanvas) {
    confettiCanvas.remove();
    confettiCanvas = null;
  }
  confettiParticles = [];
}

function stopBirthdayMusic() {
  birthdayMusicStarted = false;
  if (els.birthdayMusic) {
    els.birthdayMusic.pause();
    els.birthdayMusic.currentTime = BIRTHDAY_MUSIC_START_SEC;
  }
}

function stopCelebration() {
  clearContinueTimer();
  stopConfetti();
  stopBirthdayMusic();
}

/** @param {number} w @param {number} h */
function spawnConfettiParticle(w, h) {
  return {
    x: Math.random() * w,
    y: -10 - Math.random() * h * 0.4,
    w: 5 + Math.random() * 7,
    h: 3 + Math.random() * 6,
    color: CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
    vx: (Math.random() - 0.5) * 5,
    vy: 2 + Math.random() * 6,
    rot: Math.random() * Math.PI * 2,
    vr: (Math.random() - 0.5) * 0.25,
  };
}

function startConfetti() {
  if (confettiRunning && confettiCanvas) return;
  confettiRunning = true;
  confettiCanvas = document.createElement("canvas");
  confettiCanvas.className = "confetti-canvas";
  confettiCanvas.setAttribute("aria-hidden", "true");
  document.body.appendChild(confettiCanvas);
  const ctx = confettiCanvas.getContext("2d");
  if (!ctx) return;

  const resize = () => {
    if (!confettiCanvas) return;
    confettiCanvas.width = window.innerWidth;
    confettiCanvas.height = window.innerHeight;
  };
  resize();
  confettiResizeHandler = resize;
  window.addEventListener("resize", resize);

  const target = 200;
  confettiParticles = [];
  for (let i = 0; i < target; i++) {
    confettiParticles.push(
      spawnConfettiParticle(confettiCanvas.width, confettiCanvas.height),
    );
  }

  const tick = () => {
    if (!confettiRunning || !confettiCanvas) return;
    const { width, height } = confettiCanvas;
    ctx.clearRect(0, 0, width, height);

    if (confettiParticles.length < target + 50) {
      confettiParticles.push(spawnConfettiParticle(width, height));
    }

    for (let i = 0; i < confettiParticles.length; i++) {
      const p = confettiParticles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.06;
      p.vx *= 0.995;
      p.rot += p.vr;
      if (p.y > height + 30) {
        confettiParticles[i] = spawnConfettiParticle(width, height);
        continue;
      }
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rot);
      ctx.fillStyle = p.color;
      ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
      ctx.restore();
    }
    confettiFrameId = requestAnimationFrame(tick);
  };
  tick();
}

function configureBirthdayAudioElement() {
  const audio = els.birthdayMusic;
  if (!audio) return;
  if (!audio.getAttribute("src")) {
    audio.src = BIRTHDAY_MUSIC_SRC;
  }
  audio.preload = "auto";
  audio.loop = true;
  audio.volume = 1;
  audio.muted = false;
  audio.setAttribute("playsinline", "");
  audio.setAttribute("webkit-playsinline", "");
}

function seekBirthdayMusicToStart() {
  const audio = els.birthdayMusic;
  if (!audio) return;

  const apply = () => {
    try {
      const duration = audio.duration;
      if (Number.isFinite(duration) && duration > BIRTHDAY_MUSIC_START_SEC) {
        audio.currentTime = BIRTHDAY_MUSIC_START_SEC;
      } else if (!Number.isFinite(duration)) {
        audio.currentTime = BIRTHDAY_MUSIC_START_SEC;
      }
    } catch {
      /* not seekable yet */
    }
  };

  if (audio.readyState >= 1) apply();
  else audio.addEventListener("loadedmetadata", apply, { once: true });
}

/**
 * @param {boolean} muted
 * @returns {Promise<boolean>}
 */
async function attemptBirthdayMusicPlay(muted) {
  const audio = els.birthdayMusic;
  if (!audio) return false;

  const prevMuted = audio.muted;
  audio.muted = muted;
  try {
    if (!birthdayMusicStarted || audio.currentTime < BIRTHDAY_MUSIC_START_SEC - 0.05) {
      seekBirthdayMusicToStart();
    }
    await audio.play();
    if (!muted) {
      audio.muted = prevMuted;
    }
    birthdayMusicStarted = true;
    return true;
  } catch {
    audio.muted = prevMuted;
    return false;
  }
}

/** @returns {Promise<boolean>} */
async function playBirthdayMusic() {
  const audio = els.birthdayMusic;
  if (!audio) return false;

  configureBirthdayAudioElement();
  if (audio.readyState === 0) {
    audio.load();
  }

  if (!audio.paused && birthdayMusicStarted) return true;

  if (await attemptBirthdayMusicPlay(false)) return true;
  if (await attemptBirthdayMusicPlay(true)) {
    audio.muted = false;
    return true;
  }

  return false;
}

function startCelebration() {
  if (slideUnlockComplete) return;
  slideUnlockComplete = true;
  const max = getSlideMaxOffset();
  setSlideOffset(max);
  els.slideUnlock?.classList.add("is-complete");
  els.slideUnlock?.classList.remove("is-dragging");
  if (els.slideUnlockThumb) els.slideUnlockThumb.disabled = true;
  if (els.slideUnlockHint) els.slideUnlockHint.textContent = "Enjoy the celebration!";
  startConfetti();
  void playBirthdayMusic();
  startContinueCountdown();
}

/** @param {PointerEvent} e */
function onSlidePointerDown(e) {
  if (slideUnlockComplete || !els.slideUnlockThumb) return;
  slidePointerId = e.pointerId;
  slideDragStartX = e.clientX;
  slideStartOffset = getSlideOffsetFromThumb();
  els.slideUnlock?.classList.add("is-dragging");
  if (els.slideUnlockFill) els.slideUnlockFill.style.transition = "none";
  els.slideUnlockThumb.setPointerCapture(e.pointerId);
  e.preventDefault();
}

/** @param {PointerEvent} e */
function onSlidePointerMove(e) {
  if (slidePointerId !== e.pointerId || slideUnlockComplete) return;
  setSlideOffset(slideStartOffset + (e.clientX - slideDragStartX));
}

/** @param {PointerEvent} e */
function onSlidePointerUp(e) {
  if (slidePointerId !== e.pointerId) return;
  slidePointerId = null;
  els.slideUnlock?.classList.remove("is-dragging");
  if (els.slideUnlockFill) els.slideUnlockFill.style.transition = "";
  const max = getSlideMaxOffset();
  const x = setSlideOffset(getSlideOffsetFromThumb());
  if (max > 0 && x / max >= SLIDE_COMPLETE_RATIO) {
    startCelebration();
  } else if (!slideUnlockComplete) {
    setSlideOffset(0);
  }
  try {
    els.slideUnlockThumb?.releasePointerCapture(e.pointerId);
  } catch {
    /* already released */
  }
}

if (els.slideUnlockThumb) {
  els.slideUnlockThumb.addEventListener("pointerdown", onSlidePointerDown);
  els.slideUnlockThumb.addEventListener("pointermove", onSlidePointerMove);
  els.slideUnlockThumb.addEventListener("pointerup", onSlidePointerUp);
  els.slideUnlockThumb.addEventListener("pointercancel", onSlidePointerUp);
}

function getGiftSlideMaxOffset() {
  const track = els.giftSlideTrack;
  const thumb = els.giftSlideThumb;
  if (!track || !thumb) return 0;
  return Math.max(0, track.clientWidth - thumb.offsetWidth);
}

function getGiftSlideOffsetFromThumb() {
  const left = els.giftSlideThumb?.style.left;
  if (!left) return getGiftSlideMaxOffset();
  return Number.parseFloat(left) || 0;
}

function setGiftSlideOffset(px) {
  const max = getGiftSlideMaxOffset();
  const x = Math.max(0, Math.min(max, px));
  const thumbW = els.giftSlideThumb?.offsetWidth ?? 0;
  if (els.giftSlideThumb) els.giftSlideThumb.style.left = `${x}px`;
  if (els.giftSlideFill) els.giftSlideFill.style.width = `${x + thumbW}px`;
  return x;
}

function initGiftSlideAtRest() {
  requestAnimationFrame(() => {
    if (giftSlideComplete) return;
    setGiftSlideOffset(getGiftSlideMaxOffset());
  });
}

function showGiftSoloEmoji() {
  els.emojiStageGift?.classList.add("is-gift-solo");
  if (els.emojiGiftSolo) {
    els.emojiGiftSolo.hidden = false;
    els.emojiGiftSolo.setAttribute("aria-hidden", "false");
  }
  if (els.emojiStageGift) {
    els.emojiStageGift.setAttribute("aria-hidden", "false");
    els.emojiStageGift.setAttribute("aria-label", "Gift");
  }
}

function resetGiftEmoji() {
  els.emojiStageGift?.classList.remove("is-gift-solo");
  if (els.emojiGiftSolo) {
    els.emojiGiftSolo.hidden = true;
    els.emojiGiftSolo.setAttribute("aria-hidden", "true");
  }
  if (els.emojiStageGift) {
    els.emojiStageGift.setAttribute("aria-hidden", "true");
    els.emojiStageGift.setAttribute("aria-label", "Turtle and gift");
  }
}

function resetGiftSlideUnlock() {
  giftSlideComplete = false;
  giftSlidePointerId = null;
  resetGiftEmoji();
  els.giftSlideUnlock?.classList.remove("is-complete", "is-dragging");
  if (els.giftSlideThumb) {
    els.giftSlideThumb.style.left = "";
    els.giftSlideThumb.disabled = false;
  }
  if (els.giftSlideFill) {
    els.giftSlideFill.style.width = "";
    els.giftSlideFill.style.transition = "";
  }
  if (els.giftSlideHint) {
    els.giftSlideHint.textContent = "Slide left to stop the party";
  }
  if (els.btnGiftContinue) els.btnGiftContinue.disabled = true;
}

function isGiftContinueReady() {
  return giftSlideComplete && els.btnGiftContinue && !els.btnGiftContinue.disabled;
}

function completeGiftSlide() {
  if (giftSlideComplete) return;
  giftSlideComplete = true;
  setGiftSlideOffset(0);
  els.giftSlideUnlock?.classList.add("is-complete");
  els.giftSlideUnlock?.classList.remove("is-dragging");
  if (els.giftSlideThumb) els.giftSlideThumb.disabled = true;
  if (els.giftSlideHint) els.giftSlideHint.textContent = "Party stopped.";
  showGiftSoloEmoji();
  stopCelebration();
  if (els.btnGiftContinue) els.btnGiftContinue.disabled = false;
}

/** @param {PointerEvent} e */
function onGiftSlidePointerDown(e) {
  if (giftSlideComplete || !els.giftSlideThumb) return;
  giftSlidePointerId = e.pointerId;
  giftSlideDragStartX = e.clientX;
  giftSlideStartOffset = getGiftSlideOffsetFromThumb();
  els.giftSlideUnlock?.classList.add("is-dragging");
  if (els.giftSlideFill) els.giftSlideFill.style.transition = "none";
  els.giftSlideThumb.setPointerCapture(e.pointerId);
  e.preventDefault();
}

/** @param {PointerEvent} e */
function onGiftSlidePointerMove(e) {
  if (giftSlidePointerId !== e.pointerId || giftSlideComplete) return;
  setGiftSlideOffset(giftSlideStartOffset + (e.clientX - giftSlideDragStartX));
}

/** @param {PointerEvent} e */
function onGiftSlidePointerUp(e) {
  if (giftSlidePointerId !== e.pointerId) return;
  giftSlidePointerId = null;
  els.giftSlideUnlock?.classList.remove("is-dragging");
  if (els.giftSlideFill) els.giftSlideFill.style.transition = "";
  const max = getGiftSlideMaxOffset();
  const x = setGiftSlideOffset(getGiftSlideOffsetFromThumb());
  if (max > 0 && x / max <= 1 - SLIDE_COMPLETE_RATIO) {
    completeGiftSlide();
  } else if (!giftSlideComplete) {
    setGiftSlideOffset(max);
  }
  try {
    els.giftSlideThumb?.releasePointerCapture(e.pointerId);
  } catch {
    /* already released */
  }
}

if (els.giftSlideThumb) {
  els.giftSlideThumb.addEventListener("pointerdown", onGiftSlidePointerDown);
  els.giftSlideThumb.addEventListener("pointermove", onGiftSlidePointerMove);
  els.giftSlideThumb.addEventListener("pointerup", onGiftSlidePointerUp);
  els.giftSlideThumb.addEventListener("pointercancel", onGiftSlidePointerUp);
}

els.btnBirthdayBack.addEventListener("click", () => {
  goToAgeFromBirthdayBypass();
});

els.btnBirthdayDone.addEventListener("click", () => {
  if (!isBirthdayContinueReady()) return;
  goToGiftScreen();
});

els.btnGiftBack.addEventListener("click", () => {
  goToBirthdayFromGiftBypass();
});

els.btnGiftContinue.addEventListener("click", () => {
  if (!isGiftContinueReady()) return;
  goToVoyageScreen();
});

els.btnVoyageBack.addEventListener("click", () => {
  goToGiftFromVoyageBypass();
});

els.btnVoyageNo.addEventListener("click", () => {
  setVoyageChoice("no");
});

els.btnVoyageYes.addEventListener("click", () => {
  setVoyageChoice("yes");
});

els.btnVoyageContinue.addEventListener("click", () => {
  handleVoyageContinue();
});

els.btnAloneBack.addEventListener("click", () => {
  goToVoyageFromAloneBypass();
});

els.btnAloneNo.addEventListener("click", () => {
  setAloneChoice("no");
});

els.btnAloneYes.addEventListener("click", () => {
  setAloneChoice("yes");
});

els.btnAloneContinue.addEventListener("click", () => {
  handleAloneContinue();
});

els.btnEmbarkBack.addEventListener("click", () => {
  goToAloneFromEmbarkBypass();
});

els.btnEmbarkBike.addEventListener("click", () => {
  setEmbarkDistance("bike");
});

els.btnEmbarkTrainBike.addEventListener("click", () => {
  setEmbarkDistance("train-bike");
});

els.btnEmbarkContinue.addEventListener("click", () => {
  if (!isEmbarkContinueReady()) return;
  goToGuideScreen();
});

els.btnGuideBack.addEventListener("click", () => {
  goToEmbarkFromGuideBypass();
});

els.btnGuideNo.addEventListener("click", () => {
  setGuideChoice("no");
});

els.btnGuideYes.addEventListener("click", () => {
  setGuideChoice("yes");
});

els.btnGuideContinue.addEventListener("click", () => {
  if (!isGuideContinueReady()) return;
  goToNightScreen();
});

els.btnNightBack.addEventListener("click", () => {
  goToGuideFromNightBypass();
});

els.btnNightNo.addEventListener("click", () => {
  setNightChoice("no");
});

els.btnNightYes.addEventListener("click", () => {
  setNightChoice("yes");
});

els.btnNightContinue.addEventListener("click", () => {
  if (!isNightContinueReady()) return;
  goToConjoinedScreen();
});

els.btnConjoinedBack.addEventListener("click", () => {
  goToNightFromConjoinedBypass();
});

els.btnConjoinedNo.addEventListener("click", () => {
  setConjoinedChoice("no");
});

els.btnConjoinedYes.addEventListener("click", () => {
  setConjoinedChoice("yes");
});

els.btnConjoinedContinue.addEventListener("click", () => {
  if (!isConjoinedContinueReady()) return;
  goToEmbarkWhenScreen();
});

els.btnEmbarkWhenBack.addEventListener("click", () => {
  goToConjoinedFromEmbarkWhenBypass();
});

els.labelEmbarkWhenAdd?.addEventListener("click", () => {
  openEmbarkDatePicker();
});

els.inputEmbarkWhen?.addEventListener("change", () => {
  const value = (els.inputEmbarkWhen?.value ?? "").trim();
  if (value) addEmbarkDate(value);
});

els.btnEmbarkWhenContinue.addEventListener("click", () => {
  if (!isEmbarkWhenContinueReady()) return;
  void handleEmbarkWhenSubmit();
});

els.btnFinalBack.addEventListener("click", () => {
  goToEmbarkWhenFromFinalBypass();
});

els.btnFinalHelp.addEventListener("click", () => {
  goToHelpScreen();
});

document.addEventListener("keydown", (e) => {
  if (isHelpScreenVisible()) return;
  if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
  if (e.altKey || e.ctrlKey || e.metaKey) return;
  if (e.repeat) return;
  if (isEmojiStageAnimating()) return;

  if (e.key === "ArrowRight") {
    if (isNameScreenVisible()) {
      e.preventDefault();
      goToAgeScreenBypass();
      return;
    }
    if (isAgeScreenVisible()) {
      e.preventDefault();
      goToBirthdayScreen();
      return;
    }
    if (isBirthdayScreenVisible()) {
      if (!slideUnlockComplete) return;
      e.preventDefault();
      goToGiftScreen();
      return;
    }
    if (isGiftScreenVisible()) {
      if (!isGiftContinueReady()) return;
      e.preventDefault();
      goToVoyageScreen();
      return;
    }
    if (isVoyageScreenVisible()) {
      if (!isVoyageContinueReady()) return;
      e.preventDefault();
      handleVoyageContinue();
      return;
    }
    if (isAloneScreenVisible()) {
      if (!isAloneContinueReady()) return;
      e.preventDefault();
      handleAloneContinue();
      return;
    }
    if (isEmbarkScreenVisible()) {
      if (!isEmbarkContinueReady()) return;
      e.preventDefault();
      goToGuideScreen();
      return;
    }
    if (isGuideScreenVisible()) {
      if (!isGuideContinueReady()) return;
      e.preventDefault();
      goToNightScreen();
      return;
    }
    if (isNightScreenVisible()) {
      if (!isNightContinueReady()) return;
      e.preventDefault();
      goToConjoinedScreen();
      return;
    }
    if (isConjoinedScreenVisible()) {
      if (!isConjoinedContinueReady()) return;
      e.preventDefault();
      goToEmbarkWhenScreen();
      return;
    }
    if (isEmbarkWhenScreenVisible()) {
      if (!isEmbarkWhenContinueReady()) return;
      e.preventDefault();
      void handleEmbarkWhenSubmit();
      return;
    }
    if (isFinalScreenVisible()) {
      e.preventDefault();
      goToHelpScreen();
      return;
    }
    return;
  }

  if (e.key === "ArrowLeft") {
    if (isFinalScreenVisible()) {
      e.preventDefault();
      goToEmbarkWhenFromFinalBypass();
      return;
    }
    if (isEmbarkWhenScreenVisible()) {
      e.preventDefault();
      goToConjoinedFromEmbarkWhenBypass();
      return;
    }
    if (isConjoinedScreenVisible()) {
      e.preventDefault();
      goToNightFromConjoinedBypass();
      return;
    }
    if (isNightScreenVisible()) {
      e.preventDefault();
      goToGuideFromNightBypass();
      return;
    }
    if (isGuideScreenVisible()) {
      e.preventDefault();
      goToEmbarkFromGuideBypass();
      return;
    }
    if (isEmbarkScreenVisible()) {
      e.preventDefault();
      goToAloneFromEmbarkBypass();
      return;
    }
    if (isAloneScreenVisible()) {
      e.preventDefault();
      goToVoyageFromAloneBypass();
      return;
    }
    if (isVoyageScreenVisible()) {
      e.preventDefault();
      goToGiftFromVoyageBypass();
      return;
    }
    if (isGiftScreenVisible()) {
      e.preventDefault();
      goToBirthdayFromGiftBypass();
      return;
    }
    if (isBirthdayScreenVisible()) {
      e.preventDefault();
      goToAgeFromBirthdayBypass();
      return;
    }
    if (isAgeScreenVisible()) {
      e.preventDefault();
      goToNameScreenBypass();
    }
  }
});

setProgress(1);
syncAgeState();
clearContinueTimer();
resetGiftSlideUnlock();
resetVoyageChoice();
resetAloneChoice();
resetEmbarkChoice();

initEmojiKitchenDuo(els.emojiKitchenName, els.emojiStageName);
initEmojiKitchenDuo(els.emojiKitchenAge, els.emojiStageAge);
initEmojiKitchenDuo(els.emojiKitchenBirthday, els.emojiStageBirthday);
initEmojiKitchenDuo(els.emojiKitchenGift, els.emojiStageGift);
initEmojiKitchenDuo(els.emojiKitchenVoyage, els.emojiStageVoyage);
initEmojiKitchenDuo(els.emojiKitchenFinal, els.emojiStageFinal);
initEmojiKitchenDuo(els.emojiKitchenHelp, els.emojiStageHelp);
updateEmbarkDateInputMin();
configureBirthdayAudioElement();
els.birthdayMusic?.load();
