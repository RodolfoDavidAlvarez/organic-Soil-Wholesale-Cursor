import { useEffect } from 'react';
import { formatPhoneNumber, getPhoneNumberForTel } from '@/utils/phone';

interface PhoneLockOptions {
  enabled?: boolean;
  selector?: string;
  root?: HTMLElement | null;
}

export const usePhoneNumberLock = (options?: PhoneLockOptions) => {
  const { enabled = true, selector = '[data-phone-number]', root } = options || {};

  useEffect(() => {
    if (!enabled || typeof document === 'undefined') {
      return;
    }

    const target = root ?? document.body;
    if (!target) return;

    const enforcePhoneNumbers = () => {
      target.querySelectorAll<HTMLElement>(selector).forEach((element) => {
        const rawPhone = element.getAttribute('data-phone-number');
        if (!rawPhone) return;

        const formatted = formatPhoneNumber(rawPhone);
        if (element.textContent !== formatted) {
          element.textContent = formatted;
        }

        if (element instanceof HTMLAnchorElement) {
          const telValue = `tel:${getPhoneNumberForTel(rawPhone)}`;
          if (element.getAttribute('href') !== telValue) {
            element.setAttribute('href', telValue);
          }
        }
      });
    };

    enforcePhoneNumbers();
    const observer = new MutationObserver(enforcePhoneNumbers);
    observer.observe(target, {
      attributes: true,
      characterData: true,
      childList: true,
      subtree: true,
    });

    return () => observer.disconnect();
  }, [enabled, root, selector]);
};
