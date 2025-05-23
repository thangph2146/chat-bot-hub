const LOG_LEVEL_ENV = process.env.NEXT_PUBLIC_LOG_LEVEL || 'INFO';

enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
  NONE = 4, // To disable all logs
}

const CURRENT_LOG_LEVEL: LogLevel = (LogLevel[LOG_LEVEL_ENV.toUpperCase() as keyof typeof LogLevel] as LogLevel) ?? LogLevel.INFO;

const getTimestamp = (): string => new Date().toISOString();

const formatMessage = (level: string, component: string | null, ...args: any[]): any[] => {
  const prefix = component ? `[${level.toUpperCase()}][${getTimestamp()}][${component}]` : `[${level.toUpperCase()}][${getTimestamp()}]`;
  return [prefix, ...args];
};

interface Logger {
  debug: (component: string | null, ...args: any[]) => void;
  info: (component: string | null, ...args: any[]) => void;
  warn: (component: string | null, ...args: any[]) => void;
  error: (component: string | null, ...args: any[]) => void;
}

const logger: Logger = {
  debug: (component, ...args) => {
    if (CURRENT_LOG_LEVEL <= LogLevel.DEBUG) {
      console.debug(...formatMessage('debug', component, ...args));
    }
  },
  info: (component, ...args) => {
    if (CURRENT_LOG_LEVEL <= LogLevel.INFO) {
      console.info(...formatMessage('info', component, ...args));
    }
  },
  warn: (component, ...args) => {
    if (CURRENT_LOG_LEVEL <= LogLevel.WARN) {
      console.warn(...formatMessage('warn', component, ...args));
    }
  },
  error: (component, ...args) => {
    if (CURRENT_LOG_LEVEL <= LogLevel.ERROR) {
      console.error(...formatMessage('error', component, ...args));
    }
  },
};

export default logger;
