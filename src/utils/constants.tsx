function isMobile() {
    return /Mobi|Android/i.test(navigator.userAgent);
}

export const CONSTANTS = {
    CLICK_TOUCH: isMobile() ? "touchend" : "click",
};
