import {RouterContext}  from "../deps.ts";
import {renderFileToString} from "../deps.ts"
import { log } from "../deps.ts"
import { Result } from "../lib.ts"
import { PendingSubmissionDao } from "../dao/pending_submission_dao.ts"

import { db } from "../dao/db_connection.ts"



const pendingDao = new PendingSubmissionDao(db)

// custom configuration with 2 loggers (the default and `tasks` loggers).
await log.setup({
    handlers: {  
      file: new log.handlers.FileHandler("INFO", {
        filename: "./log.txt",
        // you can change format of output message using any keys in `LogRecord`.
        formatter: "{datetime} {msg}",
      }),
    },
  
    loggers: {
      // configure default logger available via short-hand methods above.
      default: {
        level: "INFO",
        handlers: ["file"],
      },
    },
  });

