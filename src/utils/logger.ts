/**
 * Global Logger Utility
 * Provides a centralized way to handle console logs, preventing memory leaks in production
 * and providing better formatting in development.
 */

const isDev = __DEV__;

export const logger = {
    log: (...args: any[]) => {
        if (isDev) {
            console.log(...args);
        }
    },
    warn: (...args: any[]) => {
        if (isDev) {
            console.warn(...args);
        }
    },
    error: (...args: any[]) => {
        // Errors might still be useful to log in production depending on the monitoring setup
        console.error(...args);
    },
    info: (...args: any[]) => {
        if (isDev) {
            console.info(...args);
        }
    },
    debug: (...args: any[]) => {
        if (isDev) {
            console.debug(...args);
        }
    }
};
