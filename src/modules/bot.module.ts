import { Telegraf, Context } from 'telegraf';
import * as ngrok from 'ngrok';

import * as Config from '../config';
import { LoggerModule } from './logger.module';
import { StartController, TextController } from '../controllers';

class BotModule {
  private config: typeof Config;
  private bot: Telegraf<Context>;

  constructor(config: typeof Config) {
    this.config = config;
    this.bot = new Telegraf(config.TelegramConfig.token);

    this.bot.catch((err: Error) => {
      LoggerModule.error(`ERROR: ${err}\n`);
    });

    this.bot.start(StartController);
    this.bot.on('text', TextController);
  }

  async launch() {
    const { AppConfig, TelegramConfig } = this.config;

    if (TelegramConfig.webhook.isEnabled) {
      let host;
      if (AppConfig.env === 'development') {
        host = await ngrok.connect(TelegramConfig.webhook.port);
      } else {
      // eslint-disable-next-line prefer-destructuring
        host = TelegramConfig.webhook.host;
      }

      await this.bot.launch({
        webhook: {
          domain: host,
          hookPath: TelegramConfig.webhook.path,
          port: TelegramConfig.webhook.port,
        },
      });
    } else {
      await this.bot.telegram.deleteWebhook();
      this.bot.startPolling();
    }

    LoggerModule.info('bot - online');
  }
}

const botModule = new BotModule(Config);

export { botModule as BotModule };
