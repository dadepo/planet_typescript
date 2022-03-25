import { config } from "https://deno.land/x/dotenv@v2.0.0/mod.ts";
import { DB } from "https://deno.land/x/sqlite@v2.3.2/mod.ts"

export const db = new DB(config()["DB_FILE"]);
