// Configuration utility for frontend
// Reads config from a global variable (window.CONFIG) for maximum compatibility
// Add more config values as needed
// Example: window.CONFIG = { LOG_FILE_LOCATION: '...' } in index.html or injected at runtime
export function getLogFileLocation() {
    if (typeof window !== 'undefined' && window.CONFIG && window.CONFIG.LOG_FILE_LOCATION) {
        return window.CONFIG.LOG_FILE_LOCATION;
    }
    // Fallback default
    return 'C:/Vijay/Vibecoding/trynow-moodmall-platform/log/app.log';
}
