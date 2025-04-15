import type { Options } from 'ky';
import ky from 'ky';

export class Http {
  /**
   * @description Ky instance
   */
  instance: typeof ky;

  /**
   * @description Create a new instance of Http service
   * @param {Options} config Ky config options
   */
  constructor(config: Options) {
    this.instance = ky.create(config);
  }

  /**
   * @description Update the default configuration of the Http instance
   * @param {Options} newConfig New configuration options
   */
  updateConfig(newConfig: Options): void {
    this.instance = ky.extend(newConfig);
  }

  /**
   * @description Reset or create new configuration of the Http instance
   * @param {Options} newConfig New configuration options
   */
  resetConfig(newConfig: Options): void {
    this.instance = ky.create(newConfig);
  }
}
