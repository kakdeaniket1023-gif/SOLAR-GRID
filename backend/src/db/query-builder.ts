import { sql } from '@/backend/db/client';

export class NeonTableQueryBuilder<T = any> implements PromiseLike<{ data: any; error: any }> {
  private tableName: string;
  private action: 'select' | 'insert' | 'update' | 'upsert' | 'delete' = 'select';
  private selectedColumns: string = '*';
  private payload: any = null;
  private upsertOptions: { onConflict?: string } = {};
  private filters: { column: string; operator: string; value: any }[] = [];
  private orderClauses: { column: string; ascending: boolean }[] = [];
  private limitCount: number | null = null;
  private singleResult: boolean = false;

  constructor(tableName: string) {
    this.tableName = tableName;
  }

  select(columns: string = '*') {
    this.selectedColumns = columns;
    return this;
  }

  insert(data: any) {
    this.action = 'insert';
    this.payload = data;
    return this;
  }

  update(data: any) {
    this.action = 'update';
    this.payload = data;
    return this;
  }

  upsert(data: any, options: { onConflict?: string } = {}) {
    this.action = 'upsert';
    this.payload = data;
    this.upsertOptions = options;
    return this;
  }

  delete() {
    this.action = 'delete';
    return this;
  }

  eq(column: string, value: any) {
    this.filters.push({ column, operator: '=', value });
    return this;
  }

  neq(column: string, value: any) {
    this.filters.push({ column, operator: '!=', value });
    return this;
  }

  ilike(column: string, pattern: string) {
    this.filters.push({ column, operator: 'ILIKE', value: pattern });
    return this;
  }

  like(column: string, pattern: string) {
    this.filters.push({ column, operator: 'LIKE', value: pattern });
    return this;
  }

  in(column: string, values: any[]) {
    this.filters.push({ column, operator: 'IN', value: values });
    return this;
  }

  is(column: string, value: any) {
    this.filters.push({ column, operator: value === null ? 'IS NULL' : '=', value });
    return this;
  }

  order(column: string, options: { ascending?: boolean } = { ascending: true }) {
    this.orderClauses.push({ column, ascending: options.ascending !== false });
    return this;
  }

  limit(count: number) {
    this.limitCount = count;
    return this;
  }

  single() {
    this.singleResult = true;
    this.limitCount = 1;
    return this;
  }

  async execute(): Promise<{ data: any; error: any }> {
    try {
      const params: any[] = [];
      let paramIdx = 1;

      const buildWhere = (): string => {
        if (this.filters.length === 0) return '';
        const clauses = this.filters.map((f) => {
          if (f.operator === 'IS NULL') {
            return `${f.column} IS NULL`;
          }
          if (f.operator === 'IN') {
            if (!Array.isArray(f.value) || f.value.length === 0) {
              return 'FALSE';
            }
            const inPlaceholders = f.value.map((v: any) => {
              params.push(v);
              return `$${paramIdx++}`;
            });
            return `${f.column} IN (${inPlaceholders.join(', ')})`;
          }
          params.push(f.value);
          return `${f.column} ${f.operator} $${paramIdx++}`;
        });
        return ` WHERE ${clauses.join(' AND ')}`;
      };

      if (this.action === 'select') {
        let cols = this.selectedColumns;
        if (cols.includes('(') || cols.includes(':')) {
          cols = '*';
        }
        let query = `SELECT ${cols === '*' ? '*' : cols} FROM ${this.tableName}`;
        query += buildWhere();
        if (this.orderClauses.length > 0) {
          const orders = this.orderClauses.map((o) => `${o.column} ${o.ascending ? 'ASC' : 'DESC'}`);
          query += ` ORDER BY ${orders.join(', ')}`;
        }
        if (this.limitCount !== null) {
          query += ` LIMIT ${this.limitCount}`;
        }
        const rows = await (sql as any).query(query, params);
        if (this.singleResult) {
          return {
            data: rows && rows.length > 0 ? rows[0] : null,
            error: rows && rows.length > 0 ? null : { message: 'Row not found' },
          };
        }
        return { data: rows || [], error: null };
      }

      if (this.action === 'insert') {
        const dataObj = Array.isArray(this.payload) ? this.payload[0] : this.payload;
        if (!dataObj) return { data: null, error: null };
        if (!dataObj.id && this.tableName !== 'platform_settings') {
          dataObj.id = crypto.randomUUID();
        }
        const keys = Object.keys(dataObj);
        const colNames = keys.join(', ');
        const placeholders = keys.map((k) => {
          params.push(dataObj[k]);
          return `$${paramIdx++}`;
        });
        const query = `INSERT INTO ${this.tableName} (${colNames}) VALUES (${placeholders.join(', ')}) RETURNING *`;
        const rows = await (sql as any).query(query, params);
        return { data: Array.isArray(this.payload) ? rows : (rows[0] || null), error: null };
      }

      if (this.action === 'update') {
        const keys = Object.keys(this.payload);
        if (keys.length === 0) return { data: null, error: null };
        const setClauses = keys.map((k) => {
          params.push(this.payload[k]);
          return `${k} = $${paramIdx++}`;
        });
        let query = `UPDATE ${this.tableName} SET ${setClauses.join(', ')}`;
        query += buildWhere();
        query += ' RETURNING *';
        const rows = await (sql as any).query(query, params);
        return { data: this.singleResult ? (rows[0] || null) : rows, error: null };
      }

      if (this.action === 'upsert') {
        const dataObj = Array.isArray(this.payload) ? this.payload[0] : this.payload;
        if (!dataObj) return { data: null, error: null };
        const conflictTarget = this.upsertOptions.onConflict || 'id';
        const keys = Object.keys(dataObj);
        const colNames = keys.join(', ');
        const placeholders = keys.map((k) => {
          params.push(dataObj[k]);
          return `$${paramIdx++}`;
        });
        const updateKeys = keys.filter((k) => k !== conflictTarget);
        const updateClauses = updateKeys.map((k) => `${k} = EXCLUDED.${k}`).join(', ');
        const query = `INSERT INTO ${this.tableName} (${colNames}) VALUES (${placeholders.join(', ')}) ON CONFLICT (${conflictTarget}) DO UPDATE SET ${updateClauses} RETURNING *`;
        const rows = await (sql as any).query(query, params);
        return { data: rows[0] || null, error: null };
      }

      if (this.action === 'delete') {
        let query = `DELETE FROM ${this.tableName}`;
        query += buildWhere();
        query += ' RETURNING *';
        const rows = await (sql as any).query(query, params);
        return { data: rows, error: null };
      }

      return { data: null, error: null };
    } catch (err: any) {
      console.warn(`[Neon PostgreSQL Error on ${this.tableName}]:`, err?.message || err);
      return { data: null, error: err };
    }
  }

  then<TResult1 = { data: any; error: any }, TResult2 = never>(
    onfulfilled?: ((value: { data: any; error: any }) => TResult1 | PromiseLike<TResult1>) | null,
    onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | null
  ): PromiseLike<TResult1 | TResult2> {
    return this.execute().then(onfulfilled, onrejected);
  }
}

export function getDbClient(): any {
  return {
    from: (tableName: string) => new NeonTableQueryBuilder(tableName),
    rpc: async (functionName: string, params: Record<string, any> = {}) => {
      try {
        const paramKeys = Object.keys(params);
        const placeholders = paramKeys.map((_, i) => `$${i + 1}`).join(', ');
        const values = paramKeys.map((k) => params[k]);
        const query = `SELECT * FROM ${functionName}(${placeholders})`;
        const rows = await (sql as any).query(query, values);
        return { data: rows || [], error: null };
      } catch (err: any) {
        return { data: null, error: err };
      }
    },
  };
}

export const db = getDbClient();
