const { body } = require('express-validator');

const depositValidator = [
  body('amount')
    .isFloat({ min: 0.01 })
    .withMessage('Amount must be greater than 0')
    .custom((value) => {
      if (!/^\d+(\.\d{1,2})?$/.test(value.toString())) {
        throw new Error('Amount must have max 2 decimal places');
      }
      return true;
    }),
  body('reference')
    .trim()
    .notEmpty()
    .withMessage('Reference is required')
    .isLength({ max: 100 })
    .withMessage('Reference too long'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Description too long'),
];

const withdrawValidator = [
  body('amount')
    .isFloat({ min: 0.01 })
    .withMessage('Amount must be greater than 0')
    .custom((value) => {
      if (!/^\d+(\.\d{1,2})?$/.test(value.toString())) {
        throw new Error('Amount must have max 2 decimal places');
      }
      return true;
    }),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Description too long'),
];

module.exports = {
  depositValidator,
  withdrawValidator,
};
