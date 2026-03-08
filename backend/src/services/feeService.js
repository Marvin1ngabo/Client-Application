const { PrismaClient } = require('@prisma/client');
const AppError = require('../utils/AppError');

const prisma = new PrismaClient();

class FeeService {
  // Calculate balance from transaction ledger (NEVER from stored column)
  async calculateBalance(feeAccountId) {
    const result = await prisma.feeTransaction.aggregate({
      where: {
        feeAccountId,
        status: 'APPROVED',
      },
      _sum: {
        amount: true,
      },
    });

    const deposits = await prisma.feeTransaction.aggregate({
      where: {
        feeAccountId,
        type: 'DEPOSIT',
        status: 'APPROVED',
      },
      _sum: {
        amount: true,
      },
    });

    const withdrawals = await prisma.feeTransaction.aggregate({
      where: {
        feeAccountId,
        type: 'WITHDRAWAL',
        status: 'APPROVED',
      },
      _sum: {
        amount: true,
      },
    });

    const balance = (deposits._sum.amount || 0) - (withdrawals._sum.amount || 0);
    return balance;
  }

  async getBalance(userId, requestingUserRole, requestingUserId) {
    const student = await prisma.student.findUnique({
      where: { userId },
      include: { feeAccount: true, user: true },
    });

    if (!student || !student.feeAccount) {
      throw new AppError('Fee account not found', 404);
    }

    // PARENT ACCESS CHECK: parent can only see their own children's data
    if (requestingUserRole === 'PARENT') {
      const parent = await prisma.user.findUnique({
        where: { id: requestingUserId },
        include: { parentStudents: true },
      });

      const isMyChild = parent.parentStudents.some(s => s.id === student.id);
      if (!isMyChild) {
        throw new AppError('Access denied. You are not authorized to view this student\'s data.', 403);
      }
    }

    // STUDENT ACCESS CHECK: student can only see their own data
    if (requestingUserRole === 'STUDENT' && student.userId !== requestingUserId) {
      throw new AppError('Access denied.', 403);
    }

    // Calculate real-time balance from transactions
    const balance = await this.calculateBalance(student.feeAccount.id);

    // Get pending withdrawals
    const pendingWithdrawals = await prisma.feeTransaction.aggregate({
      where: {
        feeAccountId: student.feeAccount.id,
        type: 'WITHDRAWAL',
        status: 'PENDING',
      },
      _sum: {
        amount: true,
      },
    });

    return {
      ...student.feeAccount,
      balance,
      availableBalance: balance - (pendingWithdrawals._sum.amount || 0),
      pendingWithdrawals: pendingWithdrawals._sum.amount || 0,
    };
  }

  async getTransactionHistory(userId, requestingUserRole, requestingUserId, limit = 50) {
    const student = await prisma.student.findUnique({
      where: { userId },
      include: { feeAccount: true },
    });

    if (!student || !student.feeAccount) {
      throw new AppError('Fee account not found', 404);
    }

    // PARENT ACCESS CHECK
    if (requestingUserRole === 'PARENT') {
      const parent = await prisma.user.findUnique({
        where: { id: requestingUserId },
        include: { parentStudents: true },
      });

      const isMyChild = parent.parentStudents.some(s => s.id === student.id);
      if (!isMyChild) {
        throw new AppError('Access denied. You are not authorized to view this student\'s data.', 403);
      }
    }

    // STUDENT ACCESS CHECK
    if (requestingUserRole === 'STUDENT' && student.userId !== requestingUserId) {
      throw new AppError('Access denied.', 403);
    }

    return await prisma.feeTransaction.findMany({
      where: { feeAccountId: student.feeAccount.id },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }

  async deposit(userId, amount, reference, description, requestingUserRole, requestingUserId) {
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

    // PARENT ACCESS CHECK
    if (requestingUserRole === 'PARENT') {
      const parent = await prisma.user.findUnique({
        where: { id: requestingUserId },
        include: { parentStudents: true },
      });

      const isMyChild = parent.parentStudents.some(s => s.id === student.id);
      if (!isMyChild) {
        throw new AppError('Access denied. You are not authorized to perform this action.', 403);
      }
    }

    // Check unique reference
    const existingRef = await prisma.feeTransaction.findUnique({
      where: { reference },
    });

    if (existingRef) {
      throw new AppError('Transaction reference already exists', 400);
    }

    // Create transaction - balance is calculated from transactions, not stored
    const transaction = await prisma.feeTransaction.create({
      data: {
        feeAccountId: student.feeAccount.id,
        type: 'DEPOSIT',
        amount,
        status: 'APPROVED', // Auto-approve deposits
        reference,
        description,
        createdBy: requestingUserId,
      },
    });

    // Create notification for parent
    await prisma.notification.create({
      data: {
        userId: requestingUserId,
        type: 'FEE',
        title: 'Payment Confirmed',
        message: `✅ Payment of ${amount} RWF confirmed for ${student.user.firstName} ${student.user.lastName}.`,
        metadata: { transactionId: transaction.id, amount, reference },
      },
    });

    return transaction;
  }

  async withdraw(userId, amount, description, requestingUserRole, requestingUserId) {
    if (amount <= 0) {
      throw new AppError('Withdrawal amount must be greater than 0', 400);
    }

    if (!/^\d+(\.\d{1,2})?$/.test(amount.toString())) {
      throw new AppError('Invalid amount format (max 2 decimal places)', 400);
    }

    if (!description || description.trim().length < 10) {
      throw new AppError('Please provide a reason for the refund request (minimum 10 characters)', 400);
    }

    const student = await prisma.student.findUnique({
      where: { userId },
      include: { feeAccount: true },
    });

    if (!student || !student.feeAccount) {
      throw new AppError('Fee account not found', 404);
    }

    // PARENT ACCESS CHECK
    if (requestingUserRole === 'PARENT') {
      const parent = await prisma.user.findUnique({
        where: { id: requestingUserId },
        include: { parentStudents: true },
      });

      const isMyChild = parent.parentStudents.some(s => s.id === student.id);
      if (!isMyChild) {
        throw new AppError('Access denied. You are not authorized to perform this action.', 403);
      }
    }

    // Calculate current balance
    const currentBalance = await this.calculateBalance(student.feeAccount.id);

    // Check pending withdrawals
    const pendingWithdrawals = await prisma.feeTransaction.aggregate({
      where: {
        feeAccountId: student.feeAccount.id,
        type: 'WITHDRAWAL',
        status: 'PENDING',
      },
      _sum: {
        amount: true,
      },
    });

    const availableBalance = currentBalance - (pendingWithdrawals._sum.amount || 0);

    if (amount > availableBalance) {
      throw new AppError(
        `Insufficient balance. Available: ${availableBalance} RWF. Requested: ${amount} RWF`,
        400
      );
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
        createdBy: requestingUserId,
      },
    });
  }

  async approveTransaction(transactionId, adminId, adminNote = '') {
    const transaction = await prisma.feeTransaction.findUnique({
      where: { id: transactionId },
      include: {
        feeAccount: {
          include: {
            student: {
              include: {
                user: true,
              },
            },
          },
        },
      },
    });

    if (!transaction) {
      throw new AppError('Transaction not found', 404);
    }

    if (transaction.status !== 'PENDING') {
      throw new AppError('Transaction already processed', 400);
    }

    // Update transaction status - balance is calculated from transactions
    const updated = await prisma.feeTransaction.update({
      where: { id: transactionId },
      data: {
        status: 'APPROVED',
        processedBy: adminId,
        processedAt: new Date(),
        adminNote,
      },
    });

    // Create notification for parent/student
    const notificationMessage =
      transaction.type === 'DEPOSIT'
        ? `✅ Payment of ${transaction.amount} RWF confirmed.`
        : `✅ Refund of ${transaction.amount} RWF approved and processed.`;

    await prisma.notification.create({
      data: {
        userId: transaction.createdBy,
        type: 'FEE',
        title: transaction.type === 'DEPOSIT' ? 'Payment Confirmed' : 'Refund Approved',
        message: notificationMessage,
        metadata: { transactionId: transaction.id, amount: transaction.amount },
      },
    });

    return updated;
  }

  async rejectTransaction(transactionId, adminId, rejectionReason) {
    if (!rejectionReason || rejectionReason.trim().length < 10) {
      throw new AppError('Please provide a reason for rejection (minimum 10 characters)', 400);
    }

    const transaction = await prisma.feeTransaction.findUnique({
      where: { id: transactionId },
      include: {
        feeAccount: {
          include: {
            student: {
              include: {
                user: true,
              },
            },
          },
        },
      },
    });

    if (!transaction) {
      throw new AppError('Transaction not found', 404);
    }

    if (transaction.status !== 'PENDING') {
      throw new AppError('Transaction already processed', 400);
    }

    const updated = await prisma.feeTransaction.update({
      where: { id: transactionId },
      data: {
        status: 'REJECTED',
        processedBy: adminId,
        processedAt: new Date(),
        adminNote: rejectionReason,
      },
    });

    // Create notification for parent/student
    const notificationMessage =
      transaction.type === 'DEPOSIT'
        ? `❌ Payment could not be processed. Reason: ${rejectionReason}`
        : `❌ Refund request rejected. Reason: ${rejectionReason}`;

    await prisma.notification.create({
      data: {
        userId: transaction.createdBy,
        type: 'FEE',
        title: transaction.type === 'DEPOSIT' ? 'Payment Failed' : 'Refund Rejected',
        message: notificationMessage,
        metadata: { transactionId: transaction.id, amount: transaction.amount, reason: rejectionReason },
      },
    });

    return updated;
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
