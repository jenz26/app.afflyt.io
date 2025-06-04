import { Collection, Db } from 'mongodb';
import { UserSetting } from '../types';

export class UserSettingModel {
  private collection: Collection<UserSetting>;

  constructor(db: Db) {
    this.collection = db.collection<UserSetting>('user_settings');
    this.createIndexes();
  }

  private async createIndexes(): Promise<void> {
    try {
      await this.collection.createIndex({ userId: 1 }, { unique: true });
      await this.collection.createIndex({ createdAt: 1 });
      console.log('✅ UserSetting indexes created');
    } catch (error) {
      console.error('❌ Error creating user setting indexes:', error);
    }
  }

  async findByUserId(userId: string): Promise<UserSetting | null> {
    return await this.collection.findOne({ userId });
  }

  async upsertDashboardLayout(userId: string, dashboardLayout: any[]): Promise<UserSetting> {
    const now = new Date();
    
    const result = await this.collection.findOneAndUpdate(
      { userId },
      {
        $set: {
          dashboardLayout,
          updatedAt: now
        },
        $setOnInsert: {
          createdAt: now
        }
      },
      {
        upsert: true,
        returnDocument: 'after'
      }
    );

    return result!;
  }

  async create(settingData: Omit<UserSetting, '_id' | 'createdAt' | 'updatedAt'>): Promise<UserSetting> {
    const now = new Date();
    
    const setting: UserSetting = {
      ...settingData,
      createdAt: now,
      updatedAt: now
    };

    const result = await this.collection.insertOne(setting);
    return { ...setting, _id: result.insertedId };
  }
}