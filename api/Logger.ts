const logger = {
    info: (msg:any,...more:any[]) => console.log(`%c[INFO]`,msg, 'color: DodgerBlue;',...more),
    warn: (msg:any,...more:any[]) => console.warn(`%c[WARN]`,msg, 'color: orange;',...more),
    error: (msg:any,...more:any[]) => console.error(`%c[ERROR]`,msg, 'color: red;',...more),
    success: (msg:any,...more:any[]) => console.log(`%c[SUCCESS]`,msg, 'color: green;',...more),
    debug: (msg:any,...more:any[]) => console.debug(`%c[DEBUG]`,msg, 'color: gray;',...more),
  };
  export default logger;