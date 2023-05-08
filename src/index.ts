const getCurrentTime = (): number => {
  return Date.now();
};

class ValidOperatingTime {
  static instance: ValidOperatingTime;

  static getInstance = (): ValidOperatingTime => {
    if (!ValidOperatingTime.instance) {
      ValidOperatingTime.instance = new ValidOperatingTime();
    }
    return ValidOperatingTime.instance;
  };

  /**
   * 记录每一次活跃的开始时间
   */
  sessionStartTime: number;

  timerHandler: null | NodeJS.Timer;

  /**
   * session更新间隔时间，默认1000毫秒
   */
  intervalTime: number;

  /**
   * 存储到session中时间的key
   */
  storageKey: string;

  /**
   * 保证init方法只执行一次
   */
  isInitialized: boolean;

  constructor() {
    this.sessionStartTime = getCurrentTime();
    this.timerHandler = null;

    this.intervalTime = 1000;
    this.storageKey = '_valid_operating_time';
    this.isInitialized = false;
  }

  init = (initParams?: {
    intervalTime?: number;
    storageKey?: string;
  }): void => {
    if (this.isInitialized) {
      return;
    }
    this.isInitialized = true;

    const { intervalTime, storageKey } = initParams ?? {};
    intervalTime && (this.intervalTime = intervalTime);
    storageKey && (this.storageKey = storageKey);

    // 启动
    this.enableValidOperatingTime();
  };

  /**
   * @description 获取存储中的累计有效时间
   */
  getStoragedValidTime = (): number => {
    try {
      return Number(window.localStorage.getItem(this.storageKey) || 0);
    } catch (err) {
      // eslint-disable-next-line no-console
      console.log('err');
      return 0;
    }
  };

  /** -------------------- start：处理跨Tab页面方法 --------------------  */
  /**
   *
   * @param uniqeBusinessKey 多页面切换场景, 业务流程key，唯一标识, 最好拼接携带业务场景下的数据id
   */
  startBusinessProcess = (params: { uniqeBusinessKey: string }) => {
    const { uniqeBusinessKey } = params ?? {};
    if (!uniqeBusinessKey) {
      return;
    }

    try {
      window.localStorage.setItem(
        uniqeBusinessKey,
        this.getStoragedValidTime().toString(),
      );
    } catch (e) {
      console.error(e);
    }
  };

  /**
   *
   * @param uniqeBusinessKey
   * @returns 当前业务流程的有效时间
   */
  endBusinessProcess = (params: {
    uniqeBusinessKey: string;
    autoClearStorage?: boolean;
  }): number => {
    const { uniqeBusinessKey, autoClearStorage = true } = params ?? {};
    if (!uniqeBusinessKey) {
      return 0;
    }

    try {
      const validDurationTime =
        this.getStoragedValidTime() -
        Number(window.localStorage.getItem(uniqeBusinessKey) || 0);

      autoClearStorage && window.localStorage.removeItem(uniqeBusinessKey);
      return validDurationTime;
    } catch (err) {
      // eslint-disable-next-line no-console
      console.log('err');
      return 0;
    }
  };
  /** -------------------- end：处理跨Tab页面方法 --------------------  */

  /**
   * @description 更新session中的「总有效时间」
   */
  private updateTotalTime = (): void => {
    const duration = getCurrentTime() - this.sessionStartTime;

    if (duration < 0) {
      return;
    }

    try {
      const totalTime = this.getStoragedValidTime() + duration;
      window.localStorage.setItem(this.storageKey, totalTime.toString());

      // 重置活跃开始的切片时间
      this.sessionStartTime = getCurrentTime();
    } catch (e) {
      console.error(e);
    }
  };

  private setUpTimer = (): NodeJS.Timer => {
    if (this.timerHandler) {
      clearInterval(this.timerHandler);
    }
    return setInterval(() => {
      if (getCurrentTime() - this.sessionStartTime >= this.intervalTime) {
        this.updateTotalTime();
      }
    }, this.intervalTime);
  };

  private visibilitychange = (): void => {
    if (document.visibilityState === 'hidden') {
      if (this.timerHandler) {
        clearInterval(this.timerHandler);

        this.updateTotalTime();
      }
    } else if (document.visibilityState === 'visible') {
      // 重置时间
      this.sessionStartTime = getCurrentTime();
      this.timerHandler = this.setUpTimer();
    }
  };

  private enableValidOperatingTime = (): void => {
    this.timerHandler = this.setUpTimer();
    document.addEventListener('visibilitychange', this.visibilitychange);
  };
}

export default ValidOperatingTime.getInstance();
