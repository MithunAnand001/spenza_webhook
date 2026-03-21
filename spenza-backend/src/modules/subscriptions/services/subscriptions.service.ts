import crypto from 'crypto';
import { 
  IUserEventMappingRepository, 
  IUserConfigurationRepository, 
  ISubscriptionsService,
  IEventTypeRepository 
} from '../../../types/interfaces';
import { CreateSubscriptionDto } from '../entities/subscriptions.dto';
import { logger } from '../../../utils/logger';
import { CryptoUtil } from '../../../utils/crypto';

export class SubscriptionsService implements ISubscriptionsService {
  constructor(
    private mappingRepo: IUserEventMappingRepository,
    private configRepo: IUserConfigurationRepository,
    private eventTypeRepo: IEventTypeRepository
  ) {}

  async createSubscription(userId: number, dto: CreateSubscriptionDto) {
    // Look up event type by UUID
    const eventType = await this.eventTypeRepo.findByUuid(dto.eventTypeUuid);
    if (!eventType) throw new Error('Event type not found');

    const existing = await this.mappingRepo.findActive(userId, eventType.id);
    if (existing) {
      logger.warn(`User ${userId} attempted duplicate subscription to event type ${eventType.name}`);
      throw new Error('Already subscribed to this event type');
    }

    const mapping = await this.mappingRepo.save({
      userId,
      eventTypeId: eventType.id,
      callbackUrl: dto.callbackUrl,
      createdBy: userId,
    });

    let config = await this.configRepo.findByUserId(userId);
    
    // Process credentials if they exist in the DTO
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
      subscription: {
        uuid: mapping.uuid,
        callbackUrl: mapping.callbackUrl,
        isActive: mapping.isActive,
        createdOn: mapping.createdOn,
      },
      signingSecret: config.signingSecret,
    };
  }

  async listSubscriptions(userId: number) {
    const mappings = await this.mappingRepo.findByUserId(userId);
    // Remove internal ID before returning
    return mappings.map((m: any) => {
      const { id, userId: uid, createdBy, modifiedBy, ...rest } = m;
      if (rest.eventType) {
        const { id: etid, createdBy: etcb, modifiedBy: etmb, ...etRest } = rest.eventType;
        rest.eventType = etRest;
      }
      return rest;
    });
  }

  async getSubscription(userId: number, uuid: string) {
    const sub = await this.mappingRepo.findByUuidAndUser(uuid, userId);
    if (!sub) {
      logger.warn(`Subscription ${uuid} not found for user ${userId}`);
      throw new Error('Subscription not found');
    }
    // Remove internal ID
    const { id, userId: uid, createdBy, modifiedBy, ...rest } = sub as any;
    if (rest.eventType) {
      const { id: etid, createdBy: etcb, modifiedBy: etmb, ...etRest } = rest.eventType;
      rest.eventType = etRest;
    }
    return rest;
  }

  async cancelSubscription(userId: number, uuid: string) {
    const sub = await this.mappingRepo.findByUuidAndUser(uuid, userId);
    if (!sub) {
      logger.warn(`Attempted to cancel non-existent subscription ${uuid} for user ${userId}`);
      throw new Error('Subscription not found');
    }
    sub.isActive = false;
    sub.modifiedBy = userId;
    const saved = await this.mappingRepo.save(sub);
    // Remove internal ID
    const { id, userId: uid, createdBy, modifiedBy, ...rest } = saved as any;
    if (rest.eventType) {
      const { id: etid, createdBy: etcb, modifiedBy: etmb, ...etRest } = rest.eventType;
      rest.eventType = etRest;
    }
    return rest;
  }
}
