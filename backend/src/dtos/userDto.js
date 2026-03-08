/**
 * Strip sensitive fields from user object
 */
function userDto(user) {
  if (!user) return null;

  const { passwordHash, ...safeUser } = user;
  return safeUser;
}

/**
 * Strip sensitive fields from array of users
 */
function userListDto(users) {
  return users.map(userDto);
}

module.exports = {
  userDto,
  userListDto,
};
