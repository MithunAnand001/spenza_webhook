import crypto from 'crypto';
import { 
  IUserEventMappingRepository, 
  IUserConfigurationRepository, 
  ISubscriptionsService 
} from '../../types/interfaces';
import { CreateSubscriptionDto } from './subscriptions.dto';
import { logger } from '../../utils/logger';
import { CryptoUtil } from '../../utils/crypto';

export class SubscriptionsService implements ISubscriptionsService {
  constructor(
    private mappingRepo: IUserEventMappingRepository,
    private configRepo: IUserConfigurationRepository
  ) {}

  async createSubscription(userId: number, dto: CreateSubscriptionDto) {
    const existing = await this.mappingRepo.findActive(userId, dto.eventTypeId);
    if (existing) {
      logger.warn(`User ${userId} attempted duplicate subscription to event type ${dto.eventTypeId}`);
      throw new Error('Already subscribed to this event type');
    }

    const mapping = await this.mappingRepo.save({
      userId,
      eventTypeId: dto.eventTypeId,
      callbackUrl: dto.callbackUrl,
      createdBy: userId,
    });

    let config = await this.configRepo.findByUserId(userId);
    
    // Process credentials if they exist in the DTO (assuming DTO might have them now or in future)
    const authData: any = {
      authenticationType: dto.authenticationType ?? 'none',
    };

    if ((dto as any).callbackUsername) authData.callbackUsername = (dto as any).callbackUsername;
    if ((dto as any).callbackPassword) authData.callbackPassword = CryptoUtil.encrypt((dto as any).callbackPassword);
    if ((dto as any).callbackBearerToken) authData.callbackBearerToken = CryptoUtil.encrypt((dto as any).callbackBearerToken);

    if (!config) {
      const signingSecret = crypto.randomBytes(32).toString('hex');
      config = await this.configRepo.save({
        userId,
        ...authData,
        signingSecret,
        createdBy: userId,
      });
    } else {
      // Update auth type if it changed
      if (dto.authenticationType) {
        config.authenticationType = dto.authenticationType as any;
        await this.configRepo.save(config);
      }
    }

    logger.info(`Subscription created for user ${userId}, subscription ID ${mapping.id}`);
    return {
      subscription: mapping,
      signingSecret: config.signingSecret,
    };
  }

  async listSubscriptions(userId: number) {
    return this.mappingRepo.findByUserId(userId);
  }

  async getSubscription(userId: number, id: number) {
    const sub = await this.mappingRepo.findByIdAndUser(id, userId);
    if (!sub) {
      logger.warn(`Subscription ${id} not found for user ${userId}`);
      throw new Error('Subscription not found');
    }
    return sub;
  }

  async cancelSubscription(userId: number, id: number) {
    const sub = await this.mappingRepo.findByIdAndUser(id, userId);
    if (!sub) {
      logger.warn(`Attempted to cancel non-existent subscription ${id} for user ${userId}`);
      throw new Error('Subscription not found');
    }
    sub.isActive = false;
    sub.modifiedBy = userId;
    return this.mappingRepo.save(sub);
  }
}
