import { useCallback } from 'react';
import logger from '@/lib/logger';

/**
 * A React hook that provides component-specific logging functionality
 * This wrapper makes it easier to use the logger in React components
 * while maintaining context about which component the log came from
 */
export const useLogger = () => {
  const debug = useCallback((component: string, ...args: any[]) => {
    logger.debug(component, ...args);
  }, []);

  const info = useCallback((component: string, ...args: any[]) => {
    logger.info(component, ...args);
  }, []);

  const warn = useCallback((component: string, ...args: any[]) => {
    logger.warn(component, ...args);
  }, []);

  const error = useCallback((component: string, ...args: any[]) => {
    logger.error(component, ...args);
  }, []);

  return {
    debug,
    info,
    warn,
    error
  };
};
