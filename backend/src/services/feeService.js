const { PrismaClient } = require('@prisma/client');
const AppError = require('../utils/AppError');

const prisma = new PrismaClient();

class FeeService {
  async getBalance(userId) {
    const student = await prisma.student.findUnique({
      where: { userId },
      include: { feeAccount: true },
    });

    if (!student || !student.feeAccount) {
      throw new AppError('Fee account not found', 404);
    }

    return student.feeAccount;
  }

  async getTransactionHistory(userId, limit = 50) {
    const student = await prisma.student.findUnique({
      where: { userId },
      include: { feeAccount: true },
    });

    if (!student || !student.feeAccount) {
      throw new AppError('Fee account not found', 404);
    }

    return await prisma.feeTransaction.findMany({
      where: { feeAccountId: student.feeAccount.id },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }

  async deposit(userId, amount, reference, description) {
    if (amount <= 0) {
      throw new AppError('Deposit amount must be greater than 0', 400);
    }

    if (!/^\d+(\.\d{1,2})?$/.test(amount.toString())) {
      throw new AppError('Invalid amount format (max 2 decimal places)', 400);
    }

    const student = await prisma.student.findUnique({
      where: { userId },
      include: { feeAccount: true },
    });

    if (!student || !student.feeAccount) {
      throw new AppError('Fee account not found', 404);
    }

    // Check unique reference
    const existingRef = await prisma.feeTransaction.findUnique({
      where: { reference },
    });

    if (existingRef) {
      throw new AppError('Transaction reference already exists', 400);
    }

    return await prisma.$transaction(async (tx) => {
      const transaction = await tx.feeTransaction.create({
        data: {
          feeAccountId: student.feeAccount.id,
          type: 'DEPOSIT',
          amount,
          status: 'APPROVED',
          reference,
          description,
          createdBy: userId,
        },
      });

      await tx.feeAccount.update({
        where: { id: student.feeAccount.id },
        data: { balance: { increment: amount } },
      });

      return transaction;
    });
  }

  async withdraw(userId, amount, description) {
    if (amount <= 0) {
      throw new AppError('Withdrawal amount must be greater than 0', 400);
    }

    const student = await prisma.student.findUnique({
      where: { userId },
      include: { feeAccount: true },
    });

    if (!student || !student.feeAccount) {
      throw new AppError('Fee account not found', 404);
    }

    if (parseFloat(student.feeAccount.balance) < amount) {
      throw new AppError('Insufficient balance', 400);
    }

    const reference = `WD-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    return await prisma.feeTransaction.create({
      data: {
        feeAccountId: student.feeAccount.id,
        type: 'WITHDRAWAL',
        amount,
        status: 'PENDING',
        reference,
        description,
        createdBy: userId,
      },
    });
  }

  async approveTransaction(transactionId, adminId) {
    const transaction = await prisma.feeTransaction.findUnique({
      where: { id: transactionId },
      include: { feeAccount: true },
    });

    if (!transaction) {
      throw new AppError('Transaction not found', 404);
    }

    if (transaction.status !== 'PENDING') {
      throw new AppError('Transaction already processed', 400);
    }

    return await prisma.$transaction(async (tx) => {
      const updated = await tx.feeTransaction.update({
        where: { id: transactionId },
        data: { status: 'APPROVED' },
      });

      if (transaction.type === 'WITHDRAWAL') {
        await tx.feeAccount.update({
          where: { id: transaction.feeAccountId },
          data: { balance: { decrement: transaction.amount } },
        });
      }

      return updated;
    });
  }

  async rejectTransaction(transactionId) {
    const transaction = await prisma.feeTransaction.findUnique({
      where: { id: transactionId },
    });

    if (!transaction) {
      throw new AppError('Transaction not found', 404);
    }

    if (transaction.status !== 'PENDING') {
      throw new AppError('Transaction already processed', 400);
    }

    return await prisma.feeTransaction.update({
      where: { id: transactionId },
      data: { status: 'REJECTED' },
    });
  }

  async getAllTransactions(filters = {}) {
    const where = {};
    
    if (filters.status) {
      where.status = filters.status;
    }

    return await prisma.feeTransaction.findMany({
      where,
      include: {
        feeAccount: {
          include: {
            student: {
              include: {
                user: {
                  select: {
                    firstName: true,
                    lastName: true,
                    email: true,
                  },
                },
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }
}

module.exports = new FeeService();
