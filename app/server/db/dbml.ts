import { pgGenerate } from "drizzle-dbml-generator"; // Using Postgres for this example
import * as schema from "./schema";

const out = "./schema.dbml";
const relational = true;

pgGenerate({ schema, out, relational });
