import {config, DB} from "../deps.ts"

export const db = new DB(config()["DB_FILE"]);
