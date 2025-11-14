/**
 * TimeTracker - Accurate work time tracking with daily reset and inactivity detection
 * 
 * Features:
 * - Screen time as primary metric
 * - Automatic daily reset at midnight
 * - 20-minute inactivity threshold triggers break
 * - Window activity detection (focus/blur/visibility)
 * - User activity detection (mouse, keyboard, touch, scroll)
 * - Automatic break management
 */

class TimeTracker {
    constructor() {
        this.isTracking = false;
        this.userId = null;
        this.todayKey = this.getTodayKey();

        // Time accumulation (in milliseconds)
        this.workSessionStart = null;
        this.breakSessionStart = null;
        this.totalWorkMs = 0;
        this.totalBreakMs = 0;
        this.lastBreakTimestamp = null;

        // Activity tracking
        this.lastActivityTime = Date.now();
        this.isWindowFocused = document.hasFocus();
        this.isWindowVisible = !document.hidden;

        // Timers
        this.inactivityTimer = null;
        this.updateTimer = null;
        this.dailyResetTimer = null;

        // Configuration
        this.INACTIVITY_THRESHOLD = 20 * 60 * 1000; // 20 minutes
        this.UPDATE_INTERVAL = 1000; // 1 second for UI updates

        // Callbacks for UI updates
        this.onTimeUpdate = null;
        this.onStatusChange = null;

        this.initializeEventListeners();
        this.loadTodayData();
        this.setupDailyReset();
    }

    /**
     * Get today's date key for localStorage
     */
    getTodayKey() {
        const today = new Date();
        const yyyy = today.getFullYear();
        const mm = String(today.getMonth() + 1).padStart(2, '0');
        const dd = String(today.getDate()).padStart(2, '0');
        return `${yyyy}-${mm}-${dd}`;
    }

    /**
     * Setup daily reset at midnight
     */
    setupDailyReset() {
        const scheduleNextReset = () => {
            const now = new Date();
            const tomorrow = new Date(now);
            tomorrow.setDate(tomorrow.getDate() + 1);
            tomorrow.setHours(0, 0, 0, 0);

            const timeUntilMidnight = tomorrow - now;

            if (this.dailyResetTimer) {
                clearTimeout(this.dailyResetTimer);
            }

            this.dailyResetTimer = setTimeout(() => {
                this.resetDailyData();
                scheduleNextReset();
            }, timeUntilMidnight);
        };

        scheduleNextReset();
    }

    /**
     * Reset work time data at midnight
     */
    resetDailyData() {
        // Reset counters
        this.totalWorkMs = 0;
        this.totalBreakMs = 0;
        this.workSessionStart = null;
        this.breakSessionStart = null;
        this.todayKey = this.getTodayKey();

        // Clear localStorage for today
        localStorage.removeItem(`timetracker_${this.todayKey}`);

        // Resume tracking if it was active
        if (this.isTracking) {
            this.resumeWork();
        }

        console.log('[TimeTracker] Daily reset completed at', new Date().toLocaleTimeString());
    }

    /**
     * Initialize all event listeners for activity and window state detection
     */
    initializeEventListeners() {
        // Window visibility and focus
        document.addEventListener('visibilitychange', () => this.handleVisibilityChange());
        window.addEventListener('focus', () => this.handleWindowFocus());
        window.addEventListener('blur', () => this.handleWindowBlur());

        // User activity events
        document.addEventListener('mousemove', (e) => this.handleActivity(e));
        document.addEventListener('mousedown', () => this.handleActivity());
        document.addEventListener('keydown', () => this.handleActivity());
        document.addEventListener('scroll', () => this.handleActivity());
        document.addEventListener('touchstart', () => this.handleActivity());
        document.addEventListener('touchmove', () => this.handleActivity());
        document.addEventListener('click', () => this.handleActivity());
    }

    /**
     * Handle window visibility change
     */
    handleVisibilityChange() {
        this.isWindowVisible = !document.hidden;

        if (document.hidden) {
            // Window hidden - pause work
            if (this.workSessionStart) {
                this.pauseWork();
            }
        } else {
            // Window visible again - resume work if not on break
            if (this.isTracking && !this.workSessionStart && !this.breakSessionStart) {
                this.resumeWork();
            }
        }
    }

    /**
     * Handle window focus
     */
    handleWindowFocus() {
        this.isWindowFocused = true;

        if (this.isTracking && !this.workSessionStart && this.breakSessionStart) {
            // Resume work if we were on break
            this.resumeWork();
        }

        // Reset inactivity timer
        this.resetInactivityTimer();
    }

    /**
     * Handle window blur - don't pause immediately, let inactivity timer handle it
     */
    handleWindowBlur() {
        this.isWindowFocused = false;
        // Don't pause work immediately - let inactivity timer handle it
    }

    /**
     * Handle user activity
     */
    handleActivity(event) {
        // Filter out hover-only mousemove (check if position changed significantly)
        if (event && event.type === 'mousemove') {
            const now = Date.now();
            if (now - this.lastActivityTime < 100) return; // Debounce
        }

        this.lastActivityTime = Date.now();

        // If on break and user becomes active, resume work
        if (this.isTracking && this.breakSessionStart && !this.workSessionStart) {
            this.resumeWork();
        }

        // Reset inactivity timer
        this.resetInactivityTimer();
    }

    /**
     * Reset the inactivity timer
     */
    resetInactivityTimer() {
        if (this.inactivityTimer) {
            clearTimeout(this.inactivityTimer);
        }

        if (this.isTracking && this.workSessionStart) {
            this.inactivityTimer = setTimeout(() => {
                this.handleInactivity();
            }, this.INACTIVITY_THRESHOLD);
        }
    }

    /**
     * Handle inactivity (20+ minutes without activity)
     */
    handleInactivity() {
        if (this.workSessionStart) {
            this.pauseWork();
        }
    }

    /**
     * Start tracking for a user
     */
    startTracking(userId) {
        if (this.isTracking) return;

        this.userId = userId;
        this.isTracking = true;

        // Check if we should continue from previous state
        const previousState = this.getPreviousState();
        if (previousState === 'working') {
            this.resumeWork();
        } else {
            this.startBreak();
        }

        // Start update interval for UI
        this.startUpdates();

        // Start inactivity timer
        this.resetInactivityTimer();

        console.log('[TimeTracker] Started tracking for user', userId);
    }

    /**
     * Stop tracking
     */
    stopTracking() {
        if (!this.isTracking) return;

        // Finalize current session
        if (this.workSessionStart) {
            this.pauseWork();
        }

        // Clear timers
        if (this.inactivityTimer) clearTimeout(this.inactivityTimer);
        if (this.updateTimer) clearInterval(this.updateTimer);
        if (this.dailyResetTimer) clearTimeout(this.dailyResetTimer);

        this.isTracking = false;
        this.saveTodayData();

        console.log('[TimeTracker] Stopped tracking');
    }

    /**
     * Resume work from break
     */
    resumeWork() {
        if (this.workSessionStart || !this.isTracking) return;

        // End break session if any
        if (this.breakSessionStart) {
            const breakDuration = Date.now() - this.breakSessionStart;
            this.totalBreakMs += breakDuration;
            this.breakSessionStart = null;
        }

        this.workSessionStart = Date.now();
        this.savePreviousState('working');
        this.resetInactivityTimer();

        if (this.onStatusChange) {
            this.onStatusChange('active');
        }

        console.log('[TimeTracker] Resumed work');
    }

    /**
     * Pause work into break
     */
    pauseWork() {
        if (!this.workSessionStart) return;

        const workDuration = Date.now() - this.workSessionStart;
        this.totalWorkMs += workDuration;
        this.workSessionStart = null;

        // Start break session
        this.breakSessionStart = Date.now();
        this.lastBreakTimestamp = this.breakSessionStart;
        this.savePreviousState('break');

        if (this.inactivityTimer) {
            clearTimeout(this.inactivityTimer);
            this.inactivityTimer = null;
        }

        if (this.onStatusChange) {
            this.onStatusChange('break');
        }

        console.log('[TimeTracker] Paused work, accumulated', Math.round(workDuration / 1000), 'seconds');
    }

    /**
     * Start break
     */
    startBreak() {
        if (this.breakSessionStart || !this.isTracking) return;

        if (this.workSessionStart) {
            this.pauseWork();
        } else {
            this.breakSessionStart = Date.now();
            this.savePreviousState('break');
        }
    }

    /**
     * Load today's accumulated time data
     */
    loadTodayData() {
        try {
            const stored = localStorage.getItem(`timetracker_${this.todayKey}`);
            if (stored) {
                const data = JSON.parse(stored);
                this.totalWorkMs = (data.workMs || 0);
                this.totalBreakMs = (data.breakMs || 0);
                this.lastBreakTimestamp = data.lastBreakTime || null;
            }
        } catch (error) {
            console.error('[TimeTracker] Error loading data:', error);
        }
    }

    /**
     * Save today's data to localStorage
     */
    saveTodayData() {
        try {
            const data = {
                workMs: this.totalWorkMs,
                breakMs: this.totalBreakMs,
                lastBreakTime: this.lastBreakTimestamp,
                savedAt: Date.now()
            };
            localStorage.setItem(`timetracker_${this.todayKey}`, JSON.stringify(data));
        } catch (error) {
            console.error('[TimeTracker] Error saving data:', error);
        }
    }

    /**
     * Save previous tracking state
     */
    savePreviousState(state) {
        try {
            localStorage.setItem('timetracker_state', JSON.stringify({
                state,
                timestamp: Date.now()
            }));
        } catch (error) {
            console.error('[TimeTracker] Error saving state:', error);
        }
    }

    /**
     * Get previous tracking state
     */
    getPreviousState() {
        try {
            const stored = localStorage.getItem('timetracker_state');
            if (stored) {
                const data = JSON.parse(stored);
                // Only use if recent (within 24 hours)
                if (Date.now() - data.timestamp < 24 * 60 * 60 * 1000) {
                    return data.state;
                }
            }
        } catch (error) {
            console.error('[TimeTracker] Error getting state:', error);
        }
        return 'break'; // Default to break
    }

    /**
     * Start UI update interval
     */
    startUpdates() {
        this.updateTimer = setInterval(() => {
            if (this.onTimeUpdate) {
                this.onTimeUpdate({
                    workMinutes: this.getTotalWorkMinutes(),
                    breakMinutes: this.getTotalBreakMinutes(),
                    status: this.getCurrentStatus(),
                    lastBreakTime: this.lastBreakTimestamp
                });
            }
        }, this.UPDATE_INTERVAL);
    }

    /**
     * Get total work milliseconds (including current session)
     */
    getTotalWorkMs() {
        let total = this.totalWorkMs;
        if (this.workSessionStart) {
            total += Date.now() - this.workSessionStart;
        }
        return total;
    }

    /**
     * Get total break milliseconds (including current session)
     */
    getTotalBreakMs() {
        let total = this.totalBreakMs;
        if (this.breakSessionStart) {
            total += Date.now() - this.breakSessionStart;
        }
        return total;
    }

    /**
     * Get total work time in minutes
     */
    getTotalWorkMinutes() {
        return Math.round(this.getTotalWorkMs() / (1000 * 60));
    }

    /**
     * Get total break time in minutes
     */
    getTotalBreakMinutes() {
        return Math.round(this.getTotalBreakMs() / (1000 * 60));
    }

    /**
     * Get current tracking status
     */
    getCurrentStatus() {
        if (!this.isTracking) return 'stopped';
        if (this.workSessionStart) return 'active';
        return 'break';
    }

    /**
     * Get last break timestamp
     */
    getLastBreakTime() {
        return this.lastBreakTimestamp;
    }

    /**
     * Get singleton instance
     */
    static getInstance() {
        if (!TimeTracker.instance) {
            TimeTracker.instance = new TimeTracker();
        }
        return TimeTracker.instance;
    }

    /**
     * Cleanup
     */
    destroy() {
        this.stopTracking();
        TimeTracker.instance = null;
    }
}

export default TimeTracker;
