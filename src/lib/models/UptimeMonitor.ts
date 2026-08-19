import mongoose, { Schema, Document } from 'mongoose';

export interface IUptimeCheck {
  timestamp: Date;
  status: 'online' | 'offline';
  responseTime: number;
  statusCode?: number;
  error?: string;
}

export interface IUptimeMonitor extends Document {
  userId: mongoose.Types.ObjectId;
  url: string;
  name: string;
  isActive: boolean;
  checkInterval: number; // em minutos
  currentStatus: 'online' | 'offline';
  lastCheck: Date;
  lastOnline: Date;
  lastOffline: Date;
  checks: IUptimeCheck[];
  totalChecks: number;
  successfulChecks: number;
  failedChecks: number;
  uptimePercentage: number;
  alertsEnabled: boolean;
  lastAlertSent?: Date;
  alertCooldown: number; // em minutos
  createdAt: Date;
  updatedAt: Date;
}

const UptimeCheckSchema = new Schema<IUptimeCheck>({
  timestamp: { type: Date, default: Date.now },
  status: { type: String, enum: ['online', 'offline'], required: true },
  responseTime: { type: Number, required: true },
  statusCode: { type: Number },
  error: { type: String }
});

const UptimeMonitorSchema = new Schema<IUptimeMonitor>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    url: { type: String, required: true, trim: true },
    name: { type: String, required: true, trim: true },
    isActive: { type: Boolean, default: true },
    checkInterval: { type: Number, default: 5 }, // 5 minutos por padrão
    currentStatus: { type: String, enum: ['online', 'offline'], default: 'offline' },
    lastCheck: { type: Date },
    lastOnline: { type: Date },
    lastOffline: { type: Date },
    checks: [UptimeCheckSchema],
    totalChecks: { type: Number, default: 0 },
    successfulChecks: { type: Number, default: 0 },
    failedChecks: { type: Number, default: 0 },
    uptimePercentage: { type: Number, default: 0 },
    alertsEnabled: { type: Boolean, default: true },
    lastAlertSent: { type: Date },
    alertCooldown: { type: Number, default: 30 }, // 30 minutos entre alertas
  },
  {
    timestamps: true
  }
);

// Índice para busca rápida por usuário
UptimeMonitorSchema.index({ userId: 1 });

// Índice para busca por status ativo
UptimeMonitorSchema.index({ isActive: 1 });

// Índice para última verificação
UptimeMonitorSchema.index({ lastCheck: 1 });

export default mongoose.models.UptimeMonitor || mongoose.model<IUptimeMonitor>('UptimeMonitor', UptimeMonitorSchema);
