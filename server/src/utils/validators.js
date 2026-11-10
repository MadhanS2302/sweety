const { isValidDate, todayString } = require('./dates');

const SLOTS = {
  morning: 'Morning (fasting)',
  after_breakfast: 'After breakfast',
  after_lunch: 'After lunch',
  after_dinner: 'After dinner',
};
const SLOT_KEYS = Object.keys(SLOTS);

// Returns an error message string, or null when the reading is valid.
// (The "one per slot" and "max 4 per day" rules need the database, so they live in the route.)
function validateReading({ value, date, slot }, today = todayString()) {
  if (value === undefined || value === null || String(value).trim() === '') {
    return 'Please enter a glucose value.';
  }
  const n = Number(value);
  if (!Number.isInteger(n) || n < 40 || n > 600) {
    return 'Value must be between 40 and 600 mg/dl.';
  }
  if (!isValidDate(date)) return 'Please choose a valid date.';
  if (date > today) return 'Date cannot be in the future.';
  if (!SLOTS[slot]) return 'Please choose a time slot.';
  return null;
}

function validateRegistration({ name, email, password }) {
  if (!name || !String(name).trim()) return 'Please enter your name.';
  if (!email || !/^\S+@\S+\.\S+$/.test(email)) return 'Please enter a valid email address.';
  if (!password || String(password).length < 8) return 'Password must be at least 8 characters.';
  return null;
}

module.exports = { SLOTS, SLOT_KEYS, validateReading, validateRegistration };
