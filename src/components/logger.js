import { getLogFileLocation } from './config';
// Simulated logger for frontend (browser cannot write to disk directly)
// In a real app, send logs to backend or use a logging service
// OpenTelemetry hooks are included for observability
export function logInfo(message, data) {
    // OpenTelemetry: Add trace/span here if needed
    // Example: window.otlp?.trace('info', message, data);
    // Simulate log output
    const logFile = getLogFileLocation();
    console.info(`[INFO] [${logFile}]`, message, data);
}
export function logError(message, error) {
    // OpenTelemetry: Add trace/span here if needed
    // Example: window.otlp?.trace('error', message, error);
    // Simulate log output
    const logFile = getLogFileLocation();
    console.error(`[ERROR] [${logFile}]`, message, error);
}
