import axios from 'axios';
import crypto from 'crypto';
import { getCurrentDate, formatDate } from '../utils/date';

const BASE_URL = process.env.API_URL || 'http://localhost:3001';
const SUBSCRIPTION_UUID = process.env.SUBSCRIPTION_UUID;
const SIGNING_SECRET = process.env.SIGNING_SECRET;

if (!SUBSCRIPTION_UUID) {
  console.error('Usage: SUBSCRIPTION_UUID=xxx-xxx SIGNING_SECRET=abc ts-node simulate.ts');
  process.exit(1);
}

const samplePayloads = [
  { event: 'payment.created', amount: 150.00, currency: 'USD', orderId: 'ORD-001', userId: 'USR-123' },
  { event: 'payment.completed', amount: 150.00, currency: 'USD', transactionId: 'TXN-456', orderId: 'ORD-001' },
  { event: 'order.shipped', orderId: 'ORD-001', trackingNumber: 'TRK-789', carrier: 'FedEx' },
  { event: 'payment.failed', amount: 200.00, reason: 'Insufficient funds', orderId: 'ORD-002' },
  { event: 'user.registered', userId: 'USR-999', email: 'newuser@example.com', plan: 'free' },
];

const computeSignature = (payload: Record<string, unknown>, secret: string): string => {
  return crypto.createHmac('sha256', secret).update(JSON.stringify(payload)).digest('hex');
};

const simulate = async () => {
  console.log(`\n🚀 Starting webhook simulation for subscription ${SUBSCRIPTION_UUID}\n`);

  for (let i = 0; i < samplePayloads.length; i++) {
    const payload = { ...samplePayloads[i], timestamp: formatDate(getCurrentDate()), sequence: i + 1 };
    const correlationId = `sim-${Date.now()}-${i}`;
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'X-Correlation-Id': correlationId,
    };

    if (SIGNING_SECRET) {
      headers['X-Webhook-Signature'] = computeSignature(payload, SIGNING_SECRET);
    }

    try {
      const res = await axios.post(
        `${BASE_URL}/api/webhooks/ingest/${SUBSCRIPTION_UUID}`,
        payload,
        { headers }
      );
      console.log(`✅ [${i + 1}/${samplePayloads.length}] ${payload.event} → ${res.status} (logUuid: ${res.data.data.logUuid})`);
    } catch (err: unknown) {
      const message = err instanceof Error ? (err as any).response?.data?.message || err.message : 'Unknown error';
      console.error(`❌ [${i + 1}/${samplePayloads.length}] ${payload.event} → ${message}`);
    }

    // Wait 1s between sends
    await new Promise((r) => setTimeout(r, 1000));
  }

  console.log('\n✅ Simulation complete\n');
};

simulate().catch(console.error);