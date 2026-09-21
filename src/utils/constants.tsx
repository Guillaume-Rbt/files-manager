function isMobile() {
    return /Mobi|Android/i.test(navigator.userAgent);
}

type Events = {
    CLICK_TOUCH: keyof DocumentEventMap;
};

type Constants = {
    events: Events;
};

export const CONSTANTS = {
    events: {
        CLICK_TOUCH: isMobile() ? "touchend" : "click",
    },
} as Constants;
