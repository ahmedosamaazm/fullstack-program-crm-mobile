/**
 * Format constants shared across features. These are *format* checks, not
 * business rules — `core/` is the right home, and neither creates a
 * `core/` → `features/` dependency.
 *
 * `EMAIL_PATTERN` was promoted from `features/auth/screens/LoginScreen.tsx`
 * (plan `11-story-create-a-customer-SCRUM-22.md` task 5) once the create-customer
 * form became a second consumer (hard rule 2).
 */
export const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Accepts an optional leading `+` then 7-20 characters of digits and the
 * separators an agent types while reading a number aloud. Deliberately NOT a
 * strict E.164 check — see the story's open question 2. `normalisePhone`
 * (`features/customers/api.ts`) is what collapses the accepted forms to the
 * single stored form the unique constraint compares.
 */
export const PHONE_PATTERN = /^\+?[\d\s\-()]{7,20}$/;
