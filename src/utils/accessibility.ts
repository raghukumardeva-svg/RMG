/**
 * Accessibility utilities for RMG Portal
 * Provides helpers for ARIA labels, keyboard navigation, and screen reader support
 */

/**
 * Generate ARIA labels for common UI elements
 */
export const ariaLabels = {
  // Navigation
  closeDialog: 'Close dialog',
  closeModal: 'Close modal',
  openMenu: 'Open menu',
  closeMenu: 'Close menu',
  expandSection: 'Expand section',
  collapseSection: 'Collapse section',
  previousPage: 'Go to previous page',
  nextPage: 'Go to next page',
  firstPage: 'Go to first page',
  lastPage: 'Go to last page',

  // Actions
  edit: (item: string) => `Edit ${item}`,
  delete: (item: string) => `Delete ${item}`,
  view: (item: string) => `View ${item}`,
  download: (item: string) => `Download ${item}`,
  upload: (item: string) => `Upload ${item}`,
  approve: (item: string) => `Approve ${item}`,
  reject: (item: string) => `Reject ${item}`,
  submit: (item: string) => `Submit ${item}`,
  cancel: (item: string) => `Cancel ${item}`,
  save: (item: string) => `Save ${item}`,

  // Filters
  filterBy: (filterType: string) => `Filter by ${filterType}`,
  sortBy: (sortType: string) => `Sort by ${sortType}`,
  searchFor: (searchType: string) => `Search for ${searchType}`,

  // Status
  loading: 'Loading content',
  error: 'Error occurred',
  success: 'Action completed successfully',
  warning: 'Warning message',

  // Forms
  required: 'Required field',
  optional: 'Optional field',
  invalidInput: 'Invalid input',
  validInput: 'Valid input',

  // Tickets
  ticketStatus: (status: string) => `Ticket status: ${status}`,
  ticketPriority: (priority: string) => `Priority: ${priority}`,
  assignTicket: 'Assign ticket to specialist',
  completeTicket: 'Mark ticket as complete',

  // Employees
  employeeProfile: (name: string) => `${name}'s profile`,
  employeeStatus: (status: string) => `Employee status: ${status}`,

  // Leaves
  leaveRequest: 'Submit leave request',
  leaveBalance: (type: string, balance: number) => `${type} balance: ${balance} days`,

  // Notifications
  notifications: 'Notifications',
  newNotifications: (count: number) => `${count} new notification${count !== 1 ? 's' : ''}`,
  markAsRead: 'Mark notification as read',
  clearNotifications: 'Clear all notifications',
} as const;

/**
 * Generate ARIA descriptions for complex elements
 */
export const ariaDescriptions = {
  pagination: (current: number, total: number) => 
    `Page ${current} of ${total}`,
  
  fileUpload: (maxSize: number, formats: string) => 
    `Upload files up to ${maxSize}MB. Accepted formats: ${formats}`,
  
  searchResults: (count: number) => 
    `${count} result${count !== 1 ? 's' : ''} found`,
  
  selectedItems: (count: number, total: number) => 
    `${count} of ${total} item${total !== 1 ? 's' : ''} selected`,
  
  progress: (current: number, total: number) => 
    `${current} of ${total} completed`,
  
  timeRemaining: (hours: number, minutes: number) => 
    `${hours} hour${hours !== 1 ? 's' : ''} and ${minutes} minute${minutes !== 1 ? 's' : ''} remaining`,
} as const;

/**
 * Keyboard navigation helpers
 */
export const keyboardNavigation = {
  /**
   * Handle arrow key navigation in lists
   */
  handleArrowKeys: (
    event: KeyboardEvent,
    currentIndex: number,
    itemCount: number,
    onIndexChange: (index: number) => void
  ) => {
    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        onIndexChange(Math.min(currentIndex + 1, itemCount - 1));
        break;
      case 'ArrowUp':
        event.preventDefault();
        onIndexChange(Math.max(currentIndex - 1, 0));
        break;
      case 'Home':
        event.preventDefault();
        onIndexChange(0);
        break;
      case 'End':
        event.preventDefault();
        onIndexChange(itemCount - 1);
        break;
    }
  },

  /**
   * Handle Enter and Space key for activation
   */
  handleActivation: (
    event: KeyboardEvent,
    callback: () => void
  ) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      callback();
    }
  },

  /**
   * Handle Escape key for closing
   */
  handleEscape: (
    event: KeyboardEvent,
    callback: () => void
  ) => {
    if (event.key === 'Escape') {
      event.preventDefault();
      callback();
    }
  },

  /**
   * Tab trap for modal dialogs
   */
  trapFocus: (
    event: KeyboardEvent,
    containerRef: React.RefObject<HTMLElement>
  ) => {
    if (event.key !== 'Tab') return;

    const container = containerRef.current;
    if (!container) return;

    const focusableElements = container.querySelectorAll<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );

    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    if (event.shiftKey && document.activeElement === firstElement) {
      event.preventDefault();
      lastElement.focus();
    } else if (!event.shiftKey && document.activeElement === lastElement) {
      event.preventDefault();
      firstElement.focus();
    }
  },
} as const;

/**
 * Screen reader announcements
 */
export class ScreenReaderAnnouncer {
  private static liveRegion: HTMLDivElement | null = null;

  /**
   * Initialize the live region for announcements
   */
  static init(): void {
    if (this.liveRegion) return;

    this.liveRegion = document.createElement('div');
    this.liveRegion.setAttribute('aria-live', 'polite');
    this.liveRegion.setAttribute('aria-atomic', 'true');
    this.liveRegion.setAttribute('class', 'sr-only');
    this.liveRegion.style.cssText = `
      position: absolute;
      left: -10000px;
      width: 1px;
      height: 1px;
      overflow: hidden;
    `;
    document.body.appendChild(this.liveRegion);
  }

  /**
   * Announce a message to screen readers
   */
  static announce(message: string, priority: 'polite' | 'assertive' = 'polite'): void {
    this.init();
    if (!this.liveRegion) return;

    this.liveRegion.setAttribute('aria-live', priority);
    this.liveRegion.textContent = '';

    // Small delay to ensure the change is picked up
    setTimeout(() => {
      if (this.liveRegion) {
        this.liveRegion.textContent = message;
      }
    }, 100);
  }

  /**
   * Clear announcements
   */
  static clear(): void {
    if (this.liveRegion) {
      this.liveRegion.textContent = '';
    }
  }
}

/**
 * Focus management utilities
 */
export const focusManagement = {
  /**
   * Focus the first focusable element in a container
   */
  focusFirst: (containerRef: React.RefObject<HTMLElement>): void => {
    const container = containerRef.current;
    if (!container) return;

    const focusable = container.querySelector<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    focusable?.focus();
  },

  /**
   * Save focus before opening modal/dialog
   */
  saveFocus: (): HTMLElement | null => {
    return document.activeElement as HTMLElement;
  },

  /**
   * Restore focus after closing modal/dialog
   */
  restoreFocus: (element: HTMLElement | null): void => {
    element?.focus();
  },

  /**
   * Focus an element with optional delay
   */
  focusElement: (element: HTMLElement | null, delay = 0): void => {
    if (!element) return;
    if (delay > 0) {
      setTimeout(() => element.focus(), delay);
    } else {
      element.focus();
    }
  },
} as const;

/**
 * Color contrast utilities
 */
export const colorContrast = {
  /**
   * Check if color contrast meets WCAG AA standards
   * Returns contrast ratio
   */
  getContrastRatio: (foreground: string, background: string): number => {
    const l1 = colorContrast.getLuminance(foreground);
    const l2 = colorContrast.getLuminance(background);
    const lighter = Math.max(l1, l2);
    const darker = Math.min(l1, l2);
    return (lighter + 0.05) / (darker + 0.05);
  },

  /**
   * Calculate relative luminance
   */
  getLuminance: (color: string): number => {
    const rgb = colorContrast.hexToRgb(color);
    if (!rgb) return 0;

    const [r, g, b] = [rgb.r, rgb.g, rgb.b].map((val) => {
      val = val / 255;
      return val <= 0.03928 ? val / 12.92 : Math.pow((val + 0.055) / 1.055, 2.4);
    });

    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  },

  /**
   * Convert hex color to RGB
   */
  hexToRgb: (hex: string): { r: number; g: number; b: number } | null => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result
      ? {
          r: parseInt(result[1], 16),
          g: parseInt(result[2], 16),
          b: parseInt(result[3], 16),
        }
      : null;
  },

  /**
   * Check if contrast meets WCAG AA (4.5:1 for normal text)
   */
  meetsWCAG_AA: (foreground: string, background: string): boolean => {
    return colorContrast.getContrastRatio(foreground, background) >= 4.5;
  },

  /**
   * Check if contrast meets WCAG AAA (7:1 for normal text)
   */
  meetsWCAG_AAA: (foreground: string, background: string): boolean => {
    return colorContrast.getContrastRatio(foreground, background) >= 7;
  },
} as const;

/**
 * Skip navigation links helper
 */
export const skipLinks = {
  /**
   * Generate skip link data
   */
  createSkipLink: (id: string, label: string) => ({
    href: `#${id}`,
    label: `Skip to ${label}`,
    id: `skip-to-${id}`,
  }),

  /**
   * Common skip links for the application
   */
  common: [
    { href: '#main-content', label: 'Skip to main content', id: 'skip-to-main' },
    { href: '#navigation', label: 'Skip to navigation', id: 'skip-to-nav' },
    { href: '#search', label: 'Skip to search', id: 'skip-to-search' },
    { href: '#footer', label: 'Skip to footer', id: 'skip-to-footer' },
  ],
} as const;

/**
 * Type guard for KeyboardEvent
 */
type KeyboardEvent = {
  key: string;
  shiftKey?: boolean;
  preventDefault: () => void;
};
