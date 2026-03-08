const crypto = require('crypto');

/**
 * Generate a random salt
 */
function generateSalt(rounds = 16) {
  return crypto.randomBytes(rounds).toString('hex');
}

/**
 * Hash password with SHA-512
 */
function hashPassword(password, salt, pepper = process.env.PASSWORD_PEPPER || '') {
  const hash = crypto
    .createHash('sha512')
    .update(password + salt + pepper)
    .digest('hex');
  return `${salt}:${hash}`;
}

/**
 * Verify password
 */
function verifyPassword(password, storedHash, pepper = process.env.PASSWORD_PEPPER || '') {
  const [salt, hash] = storedHash.split(':');
  const newHash = crypto
    .createHash('sha512')
    .update(password + salt + pepper)
    .digest('hex');
  return hash === newHash;
}

module.exports = {
  generateSalt,
  hashPassword,
  verifyPassword,
};
