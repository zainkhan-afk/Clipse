// Password policy, mirrored from the backend (auth.password_problem).
export const MIN_PASSWORD_LENGTH = 8;
export const MAX_PASSWORD_LENGTH = 72; // bcrypt only hashes the first 72 bytes

export const PASSWORD_HINT = "At least 8 characters, including a letter and a number.";

// Returns a human-readable problem with the password, or "" if it's acceptable.
export function passwordProblem(password) {
  if (!password || password.length < MIN_PASSWORD_LENGTH) {
    return `Password must be at least ${MIN_PASSWORD_LENGTH} characters.`;
  }
  if (password.length > MAX_PASSWORD_LENGTH) {
    return `Password must be at most ${MAX_PASSWORD_LENGTH} characters.`;
  }
  if (!/[A-Za-z]/.test(password)) return "Password must contain at least one letter.";
  if (!/[0-9]/.test(password)) return "Password must contain at least one number.";
  return "";
}
