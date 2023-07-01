import * as Redis from 'ioredis';

class SingletonRedis {
  private static instance: SingletonRedis;
  private client: Redis.Redis;
  private constructor() {
    this.client = new Redis.Redis(process.env.CACHE_URL || 'redis://localhost:6379/10');
  }
  public static getInstance = () => {
    if (!SingletonRedis.instance) {
      SingletonRedis.instance = new SingletonRedis();
    }
    return SingletonRedis.instance;
  };
  public getClient = () => this.client;
}

export default SingletonRedis;
