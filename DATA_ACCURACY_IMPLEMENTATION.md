# Data Accuracy Implementation Guide

This document outlines all the changes needed to implement the data accuracy, cross-app communication, and role isolation requirements.

## ✅ COMPLETED CHANGES

### 1. Fee Service - Balance Calculation from Transactions
- ✅ Removed stored balance column updates
- ✅ Implemented `calculateBalance()` method that sums transactions
- ✅ Added parent-child access validation
- ✅ Added pending withdrawals calculation
- ✅ Added withdrawal validation (amount, reason, available balance)
- ✅ Added notifications for deposit/withdrawal approval/rejection
- ✅ Added admin note for rejections

**File**: `school-client-app/backend/src/services/feeService.js`

## 🔄 REQUIRED CHANGES

### 2. Grade Service - Enhanced Validation

**File**: `school-client-app/backend/src/services/gradeService.js`

```javascript
// Add parent-child validation to getStudentGrades
async getStudentGrades(studentId, requestingUserId, requestingUserRole, filters = {}) {
  // Verify access based on role
  if (requestingUserRole === 'PARENT') {
    const parent = await prisma.user.findUnique({
      where: { id: requestingUserId },
      include: { parentStudents: true },
    });
    
    const isMyChild = parent.parentStudents.some(s => s.id === studentId);
    if (!isMyChild) {
      throw new AppError('Access denied. You are not authorized to view this student\'s data.', 403);
    }
  }
  
  if (requestingUserRole === 'STUDENT') {
    const student = await prisma.student.findUnique({ where: { id: studentId } });
    if (student.userId !== requestingUserId) {
      throw new AppError('Access denied.', 403);
    }
  }
  
  if (requestingUserRole === 'TEACHER') {
    const isMyStudent = await this.isStudentInTeacherClass(requestingUserId, studentId);
    if (!isMyStudent) {
      throw new AppError('Access denied. This student is not in your class.', 403);
    }
  }
  
  // ... rest of method
}

// Add term lock check to addGrade
async addGrade(teacherId, data) {
  // ... existing validations
  
  // Check if term is locked
  const termLock = await prisma.academicTerm.findFirst({
    where: {
      name: data.term,
      academicYear: data.academicYear,
      isLocked: true,
    },
  });
  
  if (termLock) {
    throw new AppError('This term has been locked by the administrator. Grades cannot be edited.', 403);
  }
  
  // Check for duplicate - update instead of create
  const existing = await prisma.grade.findFirst({
    where: {
      studentId: data.studentId,
      classId: data.classId,
      subject: data.subject,
      term: data.term,
      academicYear: data.academicYear,
    },
  });
  
  if (existing) {
    return await this.updateGrade(existing.id, teacherId, data);
  }
  
  // Create notification for parent and student
  const student = await prisma.student.findUnique({
    where: { id: data.studentId },
    include: { user: true },
  });
  
  await prisma.notification.createMany({
    data: [
      {
        userId: student.userId,
        type: 'GRADE',
        title: 'New Grade Posted',
        message: `📝 New grade posted: ${data.subject} — ${data.score}/${data.maxScore}`,
      },
      ...(student.parentId ? [{
        userId: student.parentId,
        type: 'GRADE',
        title: 'New Grade Posted',
        message: `📝 New grade posted for ${student.user.firstName}: ${data.subject} — ${data.score}/${data.maxScore}`,
      }] : []),
    ],
  });
  
  // ... rest of method
}

// Add helper method
async isStudentInTeacherClass(teacherUserId, studentId) {
  const teacher = await prisma.teacher.findUnique({
    where: { userId: teacherUserId },
    include: { classes: true },
  });
  
  const student = await prisma.student.findUnique({
    where: { id: studentId },
  });
  
  return teacher.classes.some(c => c.id === student.classId);
}
```

### 3. Attendance Service - Enhanced Validation

**File**: `school-client-app/backend/src/services/attendanceService.js`

```javascript
// Add parent-child validation
async getStudentAttendance(studentId, requestingUserId, requestingUserRole, filters = {}) {
  // Add same parent-child validation as grades
  if (requestingUserRole === 'PARENT') {
    const parent = await prisma.user.findUnique({
      where: { id: requestingUserId },
      include: { parentStudents: true },
    });
    
    const isMyChild = parent.parentStudents.some(s => s.id === studentId);
    if (!isMyChild) {
      throw new AppError('Access denied. You are not authorized to view this student\'s data.', 403);
    }
  }
  
  // ... rest of method
}

// Update markAttendance to only allow today's date
async markAttendance(teacherId, data) {
  const { studentId, classId, date, status, notes } = data;
  
  // Date cannot be in future
  if (new Date(date) > new Date()) {
    throw new AppError('Cannot mark attendance for a future date', 400);
  }
  
  // Can only mark attendance for today (unless admin override)
  const today = new Date().toISOString().split('T')[0];
  const requestedDate = new Date(date).toISOString().split('T')[0];
  
  if (requestedDate !== today) {
    throw new AppError('Attendance can only be marked for today', 400);
  }
  
  // ... rest of validations
  
  // Check for duplicate - update instead of error
  const existing = await prisma.attendance.findUnique({
    where: {
      studentId_classId_date: {
        studentId,
        classId,
        date: new Date(date),
      },
    },
  });
  
  if (existing) {
    return await this.updateAttendance(existing.id, teacherId, { status, notes });
  }
  
  // ... create attendance
}
```

### 4. Auth Middleware - Device Re-verification

**File**: `school-client-app/backend/src/middlewares/auth.js`

```javascript
async function authenticate(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new AppError('No token provided', 401);
    }
    
    const token = authHeader.substring(7);
    const decoded = verifyAccessToken(token);
    
    if (!decoded) {
      throw new AppError('Invalid or expired token', 401);
    }
    
    // Fetch user from database (ALWAYS re-check, never trust token alone)
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        email: true,
        role: true,
        firstName: true,
        lastName: true,
        isActive: true,
        accountLockedUntil: true,
      },
    });
    
    if (!user) {
      throw new AppError('User not found', 401);
    }
    
    // Check if user is active
    if (!user.isActive) {
      throw new AppError('Your account has been deactivated. Please contact the administrator.', 401);
    }
    
    // Check if account is locked
    if (user.accountLockedUntil && new Date(user.accountLockedUntil) > new Date()) {
      const minutesLeft = Math.ceil((new Date(user.accountLockedUntil) - new Date()) / 60000);
      throw new AppError(`Your account is locked. Please try again in ${minutesLeft} minutes.', 401);
    }
    
    // Re-verify device from DB (not just from token)
    if (decoded.deviceId) {
      const device = await prisma.device.findUnique({
        where: { id: decoded.deviceId },
      });
      
      if (!device || device.status !== 'VERIFIED') {
        throw new AppError('Your device is no longer verified. Please contact the administrator.', 401);
      }
    }
    
    req.user = user;
    next();
  } catch (error) {
    if (error instanceof AppError) {
      return errorResponse(res, error.message, error.statusCode);
    }
    return errorResponse(res, 'Authentication failed', 401);
  }
}
```

### 5. Fee Controller - Update Method Signatures

**File**: `school-client-app/backend/src/controllers/feeController.js`

```javascript
async getBalance(req, res, next) {
  try {
    const { studentId } = req.params;
    const userId = studentId || req.user.id;
    
    const balance = await feeService.getBalance(
      userId,
      req.user.role,
      req.user.id
    );
    
    return successResponse(res, balance);
  } catch (error) {
    next(error);
  }
}

async getTransactionHistory(req, res, next) {
  try {
    const { studentId } = req.params;
    const userId = studentId || req.user.id;
    const limit = parseInt(req.query.limit) || 50;
    
    const transactions = await feeService.getTransactionHistory(
      userId,
      req.user.role,
      req.user.id,
      limit
    );
    
    return successResponse(res, transactions);
  } catch (error) {
    next(error);
  }
}

async deposit(req, res, next) {
  try {
    const { studentId, amount, reference, description } = req.body;
    
    const transaction = await feeService.deposit(
      studentId,
      amount,
      reference,
      description,
      req.user.role,
      req.user.id
    );
    
    return successResponse(res, transaction, 'Deposit submitted successfully', 201);
  } catch (error) {
    next(error);
  }
}

async withdraw(req, res, next) {
  try {
    const { studentId, amount, description } = req.body;
    
    const transaction = await feeService.withdraw(
      studentId,
      amount,
      description,
      req.user.role,
      req.user.id
    );
    
    return successResponse(res, transaction, 'Withdrawal request submitted', 201);
  } catch (error) {
    next(error);
  }
}

async approveTransaction(req, res, next) {
  try {
    const { id } = req.params;
    const { adminNote } = req.body;
    
    const transaction = await feeService.approveTransaction(
      id,
      req.user.id,
      adminNote
    );
    
    return successResponse(res, transaction, 'Transaction approved successfully');
  } catch (error) {
    next(error);
  }
}

async rejectTransaction(req, res, next) {
  try {
    const { id } = req.params;
    const { rejectionReason } = req.body;
    
    if (!rejectionReason) {
      throw new AppError('Rejection reason is required', 400);
    }
    
    const transaction = await feeService.rejectTransaction(
      id,
      req.user.id,
      rejectionReason
    );
    
    return successResponse(res, transaction, 'Transaction rejected');
  } catch (error) {
    next(error);
  }
}
```

### 6. Frontend - React Query Configuration

**File**: `school-client-app/frontend/src/main.jsx`

```javascript
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 0, // Always fetch fresh data for critical info
      refetchOnWindowFocus: true,
      refetchOnMount: true,
    },
  },
});
```

### 7. Frontend - Idle Timeout

**File**: `school-client-app/frontend/src/App.jsx`

```javascript
import { useEffect } from 'react';
import { useAuthStore } from './store/authStore';

function App() {
  const { logout } = useAuthStore();
  
  useEffect(() => {
    let idleTimer;
    
    function resetIdleTimer() {
      clearTimeout(idleTimer);
      idleTimer = setTimeout(() => {
        logout();
        toast.error('You have been logged out due to inactivity.');
      }, 30 * 60 * 1000); // 30 minutes
    }
    
    const events = ['mousemove', 'keydown', 'click', 'scroll', 'touchstart'];
    events.forEach(event => {
      window.addEventListener(event, resetIdleTimer);
    });
    
    resetIdleTimer();
    
    return () => {
      clearTimeout(idleTimer);
      events.forEach(event => {
        window.removeEventListener(event, resetIdleTimer);
      });
    };
  }, [logout]);
  
  // ... rest of component
}
```

### 8. Frontend - Error Messages Mapping

**File**: `school-client-app/frontend/src/utils/errorMessages.js`

```javascript
export const ERROR_MESSAGES = {
  'DEVICE_NOT_VERIFIED': 'Your device is awaiting approval from the school administrator.',
  'INSUFFICIENT_BALANCE': 'The requested amount exceeds the available fee balance.',
  'GRADE_TERM_LOCKED': 'Grades for this term have been finalized and cannot be edited.',
  'DUPLICATE_ATTENDANCE': 'Attendance for this student has already been recorded today.',
  'ACCESS_DENIED': 'You do not have permission to perform this action.',
  'ACCOUNT_LOCKED': 'Your account has been temporarily locked. Please try again in 30 minutes.',
  'INVALID_TOKEN': 'Your session has expired. Please log in again.',
  'USER_NOT_FOUND': 'User account not found.',
  'PARENT_CHILD_MISMATCH': 'You are not authorized to view this student\'s data.',
};

export function getFriendlyErrorMessage(error) {
  const errorCode = error.response?.data?.code;
  const errorMessage = error.response?.data?.message;
  
  return ERROR_MESSAGES[errorCode] || errorMessage || 'An unexpected error occurred. Please try again.';
}
```

### 9. Database Schema Updates

**File**: `school-client-app/backend/prisma/schema.prisma`

Add these fields if not present:

```prisma
model User {
  // ... existing fields
  accountLockedUntil DateTime?
  failedLoginAttempts Int @default(0)
  lastLoginAttempt DateTime?
  parentStudents Student[] @relation("ParentStudents")
}

model Student {
  // ... existing fields
  parentId String?
  parent User? @relation("ParentStudents", fields: [parentId], references: [id])
}

model FeeTransaction {
  // ... existing fields
  processedBy String?
  processedAt DateTime?
  adminNote String?
}

model AcademicTerm {
  id String @id @default(uuid())
  name String // TERM_1, TERM_2, TERM_3
  academicYear String
  startDate DateTime
  endDate DateTime
  isLocked Boolean @default(false)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  
  @@unique([name, academicYear])
}
```

### 10. Copy All Changes to Admin Backend

After implementing all changes in `school-client-app/backend`, copy the updated files to `school-admin-app/backend`:

```bash
# Services
cp school-client-app/backend/src/services/feeService.js school-admin-app/backend/src/services/
cp school-client-app/backend/src/services/gradeService.js school-admin-app/backend/src/services/
cp school-client-app/backend/src/services/attendanceService.js school-admin-app/backend/src/services/

# Middlewares
cp school-client-app/backend/src/middlewares/auth.js school-admin-app/backend/src/middlewares/

# Controllers
cp school-client-app/backend/src/controllers/feeController.js school-admin-app/backend/src/controllers/
cp school-client-app/backend/src/controllers/gradeController.js school-admin-app/backend/src/controllers/
cp school-client-app/backend/src/controllers/attendanceController.js school-admin-app/backend/src/controllers/

# Schema
cp school-client-app/backend/prisma/schema.prisma school-admin-app/backend/prisma/
```

## 📋 TESTING CHECKLIST

### Parent-Student Isolation
- [ ] Parent can ONLY see their own children's data
- [ ] Parent-child ownership checked at SERVICE layer on every request
- [ ] Child switcher only shows parent's own children
- [ ] Student can ONLY see their own data

### Fee Accuracy
- [ ] Balance calculated from transaction ledger (SUM), not stored column
- [ ] Pending withdrawals deducted from available balance
- [ ] Deposit and withdrawal statuses flow correctly
- [ ] Balance updates reflected immediately after admin approves

### Grade Accuracy
- [ ] Teacher can only enter/edit grades for their assigned classes
- [ ] Score ≤ maxScore enforced at backend
- [ ] Duplicate grade entry updates existing record
- [ ] Grade letter calculated consistently
- [ ] Grade lock prevents edits after term finalized

### Attendance Accuracy
- [ ] Date cannot be future
- [ ] Can only mark attendance for today
- [ ] Duplicate attendance handled correctly
- [ ] Teacher can only mark attendance for their classes

### Cross-App Sync
- [ ] Admin actions immediately visible in client app
- [ ] Client fee deposits immediately visible in admin dashboard
- [ ] Notifications created on all relevant events

### Session Security
- [ ] Device re-verified from DB on every request
- [ ] Deactivated user cannot access API even with valid JWT
- [ ] Idle timeout implemented on frontend (30 minutes)
- [ ] Account locks after 5 failed login attempts

## 🚀 DEPLOYMENT STEPS

1. Update database schema: `npx prisma migrate dev`
2. Update both backends with new service logic
3. Update both frontends with idle timeout and error handling
4. Test all parent-child access scenarios
5. Test fee balance calculation accuracy
6. Test grade and attendance validation
7. Test cross-app data sync
8. Test session security features

## 📝 NOTES

- All changes maintain backward compatibility
- No breaking changes to existing API contracts
- All new validations return user-friendly error messages
- Notifications are created for all critical events
- Balance is NEVER stored, always calculated from transactions
- All role-based access checks happen at the SERVICE layer
