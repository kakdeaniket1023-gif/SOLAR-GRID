/**
 * DEPRECATED - Legacy In-Memory Database
 *
 * All SolarGrid application persistence is now backed exclusively by Supabase PostgreSQL
 * via SupabaseDatabaseService in `@/lib/supabase/db.ts`.
 *
 * Direct use of `DatabaseService` or `global.__SOLARGRID_DB__` is strictly forbidden.
 */

export const DEPRECATED_DATABASE = true;
