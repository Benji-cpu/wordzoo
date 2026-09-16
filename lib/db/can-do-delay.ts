/**
 * How long after finishing a scene before its can-dos can be certified.
 *
 * This lives in its own module, with no DB import, on purpose: seed-can-dos.ts
 * needs the value, and importing it from can-do-queries.ts pulls in ./client,
 * which reads DATABASE_URL at module load — i.e. before the seeder's
 * dotenv.config() has had a chance to run, so the seeder died on startup.
 */
export const CAN_DO_DELAY_HOURS = 48;
