import { Db } from 'mongodb';
import { UserModel } from './User';
import { AffiliateLinkModel } from './AffiliateLink';
import { ClickModel } from './Click';

export class Models {
  public user: UserModel;
  public affiliateLink: AffiliateLinkModel;
  public click: ClickModel;

  constructor(db: Db) {
    this.user = new UserModel(db);
    this.affiliateLink = new AffiliateLinkModel(db);
    this.click = new ClickModel(db);
  }
}

export * from './User';
export * from './AffiliateLink';
export * from './Click';