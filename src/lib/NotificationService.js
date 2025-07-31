import { Notice } from 'obsidian'

/**
 * Service for handling user notifications
 * Centralizes UI concerns and provides consistent notification behavior
 */
export class NotificationService {
  constructor() {
    this.enabled = true
  }

  /**
   * Show informational notice
   * @param {string} message - Message to display
   * @param {number} timeout - Timeout in milliseconds (0 = persistent)
   */
  info(message, timeout = 4000) {
    if (this.enabled) {
      new Notice(message, timeout)
    }
  }

  /**
   * Show success notice
   * @param {string} message - Message to display
   * @param {number} timeout - Timeout in milliseconds
   */
  success(message, timeout = 4000) {
    if (this.enabled) {
      new Notice(`✓ ${message}`, timeout)
    }
  }

  /**
   * Show error notice
   * @param {string} message - Message to display
   * @param {number} timeout - Timeout in milliseconds
   */
  error(message, timeout = 6000) {
    if (this.enabled) {
      new Notice(`❌ ${message}`, timeout)
    }
  }

  /**
   * Show warning notice
   * @param {string} message - Message to display
   * @param {number} timeout - Timeout in milliseconds
   */
  warning(message, timeout = 5000) {
    if (this.enabled) {
      new Notice(`⚠️ ${message}`, timeout)
    }
  }

  /**
   * Enable or disable notifications
   * @param {boolean} enabled - Whether notifications should be shown
   */
  setEnabled(enabled) {
    this.enabled = enabled
  }
}