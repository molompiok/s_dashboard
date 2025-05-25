//api/Logger.ts
export const LOG_LEVELS = {
  DEBUG: 1,
  INFO: 2,
  WARN: 3,
  ERROR: 4,
  SILENT: 5, // Pour désactiver tous les logs
} as const;

export type LogLevelName = keyof typeof LOG_LEVELS;
export type LogLevelNumber = typeof LOG_LEVELS[LogLevelName];

// Détermine le niveau de log actuel via une variable d'environnement (plus flexible)
// Par défaut à INFO en production, DEBUG en développement.
const getLogLevelFromEnv = (): LogLevelNumber => {
  // const envLevel = process.env.NEXT_PUBLIC_LOG_LEVEL || process.env.REACT_APP_LOG_LEVEL || process.env.VITE_LOG_LEVEL || process.env.LOG_LEVEL;
  // if (envLevel) {
  //   const upperLevel = envLevel.toUpperCase() as LogLevelName;
  //   if (LOG_LEVELS[upperLevel]) {
  //     return LOG_LEVELS[upperLevel];
  //   }
  // }
  return LOG_LEVELS.INFO;
};

const currentLogLevel: LogLevelNumber = getLogLevelFromEnv();

interface LoggerOptions {
  level?: LogLevelNumber;
  context?: string; // Permet d'ajouter un contexte (ex: nom du module)
  // D'autres options pourraient être ajoutées (ex: formatteur de message)
}

// Définition de l'interface Logger que LoadMonitorService attendra
export interface Logger {
  debug(message: any, metadata?: any): void;
  info(message: any, metadata?: any): void;
  warn(message: any, metadata?: any): void;
  error(message: any, metadata?: any): void;
  child(bindings: { context?: string;[key: string]: any }): Logger; // Pour créer des loggers enfants avec contexte
}

// Fonction pour créer une instance de logger
export function createLogger(options?: LoggerOptions): Logger {
  const activeLogLevel = options?.level ?? currentLogLevel;
  const baseContext = options?.context ? `[${options.context}]` : '';

  const log = (level: LogLevelNumber, levelName: string, message: string |Record<string, any>, metadata?: Record<string, any>) => {
    if (activeLogLevel <= level) {
      const timestamp = new Date().toISOString();
      const contextPrefix = baseContext ? `${baseContext} ` : '';
      let logMessage = `${timestamp} [${levelName}] ${contextPrefix}`;

      if (message instanceof Error) {
        logMessage += `${message.message}`;
        // Afficher la stack trace pour les erreurs, surtout en dev
        // if (process.env.NODE_ENV !== 'production' && message.stack) {
        console.error(logMessage, metadata || '', '\nStack:', message.stack);
        // return;
        // }
      } else {
        logMessage += message;
      }

      if (metadata && Object.keys(metadata).length > 0) {
        // Pour le console.log du navigateur, afficher les métadonnées comme un objet séparé
        // améliore la lisibilité et l'inspection.
        if (typeof window !== 'undefined') { // Si on est dans le navigateur
          switch (level) {
            case LOG_LEVELS.DEBUG: console.debug(logMessage, metadata); break;
            case LOG_LEVELS.INFO: console.info(logMessage, metadata); break;
            case LOG_LEVELS.WARN: console.warn(logMessage, metadata); break;
            case LOG_LEVELS.ERROR: console.error(logMessage, metadata); break;
          }
        } else { // Environnement Node.js
          console.log(logMessage, JSON.stringify(metadata));
        }
      } else {
        switch (level) {
          case LOG_LEVELS.DEBUG: console.debug(logMessage); break;
          case LOG_LEVELS.INFO: console.info(logMessage); break;
          case LOG_LEVELS.WARN: console.warn(logMessage); break;
          case LOG_LEVELS.ERROR: console.error(logMessage); break;
        }
      }

      // En production, vous pourriez envoyer les logs d'erreur/warn à un service de monitoring
      // if (process.env.NODE_ENV === 'production' && (level === LOG_LEVELS.ERROR || level === LOG_LEVELS.WARN)) {
      //   sendToMonitoringService(levelName, message, metadata);
      // }
    }
  };

  const loggerInstance: Logger = {
    debug: (message: any, metadata?:any) => log(LOG_LEVELS.DEBUG, 'DEBUG', message, metadata),
    info: (message: any, metadata?:any) => log(LOG_LEVELS.INFO, 'INFO', message, metadata),
    warn: (message: any, metadata?:any) => log(LOG_LEVELS.WARN, 'WARN', message, metadata),
    error: (message: any, metadata?:any) => log(LOG_LEVELS.ERROR, 'ERROR', message, metadata),
    child: (bindings: { context?: string;[key: string]: any }) => {
      // La création de logger enfant est simplifiée ici. Pour un vrai logger enfant
      // qui hérite des métadonnées parentes, il faudrait une implémentation plus complexe.
      // Pour l'instant, on crée juste un nouveau logger avec le nouveau contexte.
      const newContext = bindings.context ? (baseContext ? `${baseContext.replace(/\[|\]/g, '')}:${bindings.context}` : bindings.context) : baseContext.replace(/\[|\]/g, '');
      return createLogger({ ...options, context: newContext });
    },
  };

  return loggerInstance;
}

// Instance par défaut (peut être utilisée directement ou comme base)
const defaultLogger = createLogger();
export default defaultLogger;