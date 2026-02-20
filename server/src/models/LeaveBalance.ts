import mongoose from 'mongoose';

const leaveBalanceSchema = new mongoose.Schema({
  employeeId: {
    type: String,
    required: true
    // Note: unique constraint is on compound index (employeeId + year), not on employeeId alone
  },
  year: {
    type: Number,
    required: true,
    default: () => new Date().getFullYear()
  },
  earnedLeave: {
    total: {
      type: Number,
      required: true,
      default: 20
    },
    used: {
      type: Number,
      default: 0,
      min: 0
    },
    remaining: {
      type: Number,
      required: true,
      default: 20,
      min: 0
    }
  },
  sabbaticalLeave: {
    total: {
      type: Number,
      required: true,
      default: 182 // 6 months
    },
    used: {
      type: Number,
      default: 0,
      min: 0
    },
    remaining: {
      type: Number,
      required: true,
      default: 182,
      min: 0
    }
  },
  compOff: {
    total: {
      type: Number,
      required: true,
      default: 0 // Accrued based on overtime work
    },
    used: {
      type: Number,
      default: 0,
      min: 0
    },
    remaining: {
      type: Number,
      required: true,
      default: 0
    }
  },
  paternityLeave: {
    total: {
      type: Number,
      required: true,
      default: 3
    },
    used: {
      type: Number,
      default: 0,
      min: 0
    },
    remaining: {
      type: Number,
      required: true,
      default: 3,
      min: 0
    }
  },
  maternityLeave: {
    total: {
      type: Number,
      required: true,
      default: 180 // 6 months (26 weeks)
    },
    used: {
      type: Number,
      default: 0,
      min: 0
    },
    remaining: {
      type: Number,
      required: true,
      default: 180,
      min: 0
    }
  },
  sickLeave: {
    total: {
      type: Number,
      required: true,
      default: 12
    },
    used: {
      type: Number,
      default: 0,
      min: 0
    },
    remaining: {
      type: Number,
      required: true,
      default: 12,
      min: 0
    }
  },
  lastUpdated: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Compound index for employee and year
leaveBalanceSchema.index({ employeeId: 1, year: 1 }, { unique: true });

// Method to update leave balance after approval/cancellation
leaveBalanceSchema.methods.updateBalance = function(leaveType: string, days: number, operation: 'add' | 'subtract') {
  // Normalize leave type to match schema keys
  // Note: Sick Leave and Maternity Leave have been deprecated
  const typeMap: Record<string, string> = {
    'Earned Leave': 'earnedLeave',
    'earned': 'earnedLeave',
    'earnedLeave': 'earnedLeave',
    'Sabbatical Leave': 'sabbaticalLeave',
    'sabbatical': 'sabbaticalLeave',
    'sabbaticalLeave': 'sabbaticalLeave',
    'Comp Off': 'compOff',
    'compOff': 'compOff',
    'Paternity Leave': 'paternityLeave',
    'paternity': 'paternityLeave',
    'paternityLeave': 'paternityLeave'
  };

  const normalizedType = typeMap[leaveType] as keyof typeof this;

  if (!normalizedType || !this[normalizedType]) {
    throw new Error(`Invalid leave type: ${leaveType}`);
  }

  const leaveCategory = this[normalizedType] as { used: number; remaining: number; total: number };

  if (operation === 'add') {
    // Adding days means using leave (approved)
    leaveCategory.used = Math.min(leaveCategory.used + days, leaveCategory.total);
    leaveCategory.remaining = leaveCategory.total - leaveCategory.used;
  } else {
    // Subtracting days means returning leave (cancelled)
    leaveCategory.used = Math.max(leaveCategory.used - days, 0);
    leaveCategory.remaining = leaveCategory.total - leaveCategory.used;
  }

  this.lastUpdated = new Date();
};

export default mongoose.model('LeaveBalance', leaveBalanceSchema);
