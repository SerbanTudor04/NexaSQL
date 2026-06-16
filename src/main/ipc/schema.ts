import { IpcMain } from 'electron'
import { pools } from './connection'

export function registerSchemaHandlers(ipcMain: IpcMain): void {
  ipcMain.handle('schema:getTree', async (_event, connectionId: string) => {
    const pool = pools.get(connectionId)
    if (!pool) return { success: false, error: 'Not connected.' }

    try {
      const schemasResult = await pool.query(`
        SELECT schema_name
        FROM information_schema.schemata
        WHERE schema_name NOT IN ('pg_catalog', 'information_schema', 'pg_toast')
        ORDER BY schema_name
      `)

      const tree = await Promise.all(
        schemasResult.rows.map(async (row: { schema_name: string }) => {
          const schema = row.schema_name
          const objects = await getSchemaObjects(pool, schema)
          return { name: schema, type: 'schema', children: objects }
        })
      )

      return { success: true, tree }
    } catch (err: unknown) {
      const error = err as Error
      return { success: false, error: error.message }
    }
  })

  ipcMain.handle('schema:getTableDetails', async (_event, connectionId: string, schema: string, table: string) => {
    const pool = pools.get(connectionId)
    if (!pool) return { success: false, error: 'Not connected.' }

    try {
      const [columns, indexes, constraints, rowCount] = await Promise.all([
        pool.query(`
          SELECT
            c.column_name,
            c.data_type,
            c.character_maximum_length,
            c.numeric_precision,
            c.numeric_scale,
            c.is_nullable,
            c.column_default,
            c.ordinal_position,
            pgd.description AS comment
          FROM information_schema.columns c
          LEFT JOIN pg_catalog.pg_statio_all_tables st ON st.schemaname = c.table_schema AND st.relname = c.table_name
          LEFT JOIN pg_catalog.pg_description pgd ON pgd.objoid = st.relid AND pgd.objsubid = c.ordinal_position
          WHERE c.table_schema = $1 AND c.table_name = $2
          ORDER BY c.ordinal_position
        `, [schema, table]),
        pool.query(`
          SELECT
            i.relname AS index_name,
            ix.indisunique AS is_unique,
            ix.indisprimary AS is_primary,
            array_agg(a.attname ORDER BY k.ord) AS columns
          FROM pg_class t
          JOIN pg_index ix ON t.oid = ix.indrelid
          JOIN pg_class i ON i.oid = ix.indexrelid
          JOIN pg_namespace n ON t.relnamespace = n.oid
          JOIN LATERAL unnest(ix.indkey) WITH ORDINALITY AS k(attnum, ord) ON true
          JOIN pg_attribute a ON a.attrelid = t.oid AND a.attnum = k.attnum
          WHERE n.nspname = $1 AND t.relname = $2
          GROUP BY i.relname, ix.indisunique, ix.indisprimary
        `, [schema, table]),
        pool.query(`
          SELECT
            tc.constraint_name,
            tc.constraint_type,
            kcu.column_name,
            ccu.table_schema AS foreign_schema,
            ccu.table_name AS foreign_table,
            ccu.column_name AS foreign_column,
            rc.update_rule,
            rc.delete_rule
          FROM information_schema.table_constraints tc
          JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name AND tc.table_schema = kcu.table_schema
          LEFT JOIN information_schema.referential_constraints rc ON tc.constraint_name = rc.constraint_name
          LEFT JOIN information_schema.constraint_column_usage ccu ON ccu.constraint_name = tc.constraint_name
          WHERE tc.table_schema = $1 AND tc.table_name = $2
        `, [schema, table]),
        pool.query(`SELECT reltuples::bigint AS estimate FROM pg_class JOIN pg_namespace ON relnamespace = pg_namespace.oid WHERE nspname = $1 AND relname = $2`, [schema, table])
      ])

      return {
        success: true,
        columns: columns.rows,
        indexes: indexes.rows,
        constraints: constraints.rows,
        rowCountEstimate: rowCount.rows[0]?.estimate ?? 0
      }
    } catch (err: unknown) {
      const error = err as Error
      return { success: false, error: error.message }
    }
  })

  ipcMain.handle('schema:getSessions', async (_event, connectionId: string) => {
    const pool = pools.get(connectionId)
    if (!pool) return { success: false, error: 'Not connected.' }

    try {
      const result = await pool.query(`
        SELECT
          pid,
          usename AS username,
          application_name,
          client_addr,
          state,
          wait_event_type,
          wait_event,
          query_start,
          state_change,
          left(query, 200) AS query,
          backend_start,
          xact_start
        FROM pg_stat_activity
        WHERE pid != pg_backend_pid()
        ORDER BY query_start DESC NULLS LAST
      `)
      return { success: true, sessions: result.rows }
    } catch (err: unknown) {
      const error = err as Error
      return { success: false, error: error.message }
    }
  })

  ipcMain.handle('schema:killSession', async (_event, connectionId: string, pid: number) => {
    const pool = pools.get(connectionId)
    if (!pool) return { success: false, error: 'Not connected.' }

    try {
      const result = await pool.query('SELECT pg_terminate_backend($1)', [pid])
      return { success: true, terminated: result.rows[0]?.pg_terminate_backend }
    } catch (err: unknown) {
      const error = err as Error
      return { success: false, error: error.message }
    }
  })

  ipcMain.handle('schema:getTablespaces', async (_event, connectionId: string) => {
    const pool = pools.get(connectionId)
    if (!pool) return { success: false, error: 'Not connected.' }

    try {
      const result = await pool.query(`
        SELECT
          spcname AS name,
          pg_tablespace_location(oid) AS location,
          pg_size_pretty(pg_tablespace_size(oid)) AS size_pretty,
          pg_tablespace_size(oid) AS size_bytes
        FROM pg_tablespace
        ORDER BY spcname
      `)
      return { success: true, tablespaces: result.rows }
    } catch (err: unknown) {
      const error = err as Error
      return { success: false, error: error.message }
    }
  })

  ipcMain.handle('schema:getStorageStats', async (_event, connectionId: string) => {
    const pool = pools.get(connectionId)
    if (!pool) return { success: false, error: 'Not connected.' }

    try {
      const result = await pool.query(`
        SELECT
          schemaname,
          tablename,
          pg_total_relation_size(schemaname || '.' || tablename) AS total_bytes,
          pg_relation_size(schemaname || '.' || tablename) AS table_bytes,
          pg_indexes_size(schemaname || '.' || tablename) AS index_bytes,
          pg_size_pretty(pg_total_relation_size(schemaname || '.' || tablename)) AS total_pretty
        FROM information_schema.tables
        WHERE table_type = 'BASE TABLE'
          AND schemaname NOT IN ('pg_catalog', 'information_schema')
        ORDER BY total_bytes DESC
        LIMIT 50
      `)
      return { success: true, stats: result.rows }
    } catch (err: unknown) {
      const error = err as Error
      return { success: false, error: error.message }
    }
  })

  ipcMain.handle('schema:autocomplete', async (_event, connectionId: string, prefix: string) => {
    const pool = pools.get(connectionId)
    if (!pool) return { success: true, items: [] }

    try {
      const result = await pool.query(`
        SELECT DISTINCT
          table_schema || '.' || table_name || '.' || column_name AS fqn,
          column_name AS name,
          table_name,
          table_schema,
          data_type,
          'column' AS kind
        FROM information_schema.columns
        WHERE column_name ILIKE $1 OR table_name ILIKE $1
        UNION ALL
        SELECT
          table_schema || '.' || table_name AS fqn,
          table_name AS name,
          table_name,
          table_schema,
          table_type AS data_type,
          CASE table_type WHEN 'VIEW' THEN 'view' ELSE 'table' END AS kind
        FROM information_schema.tables
        WHERE table_name ILIKE $1
          AND table_schema NOT IN ('pg_catalog', 'information_schema')
        ORDER BY name
        LIMIT 50
      `, [`${prefix}%`])

      return { success: true, items: result.rows }
    } catch {
      return { success: true, items: [] }
    }
  })
}

async function getSchemaObjects(pool: import('pg').Pool, schema: string) {
  const [tables, views, procedures, sequences] = await Promise.all([
    pool.query(
      `SELECT table_name AS name, 'table' AS type FROM information_schema.tables
       WHERE table_schema = $1 AND table_type = 'BASE TABLE' ORDER BY table_name`,
      [schema]
    ),
    pool.query(
      `SELECT table_name AS name, 'view' AS type FROM information_schema.views
       WHERE table_schema = $1 ORDER BY table_name`,
      [schema]
    ),
    pool.query(
      `SELECT routine_name AS name, routine_type AS type FROM information_schema.routines
       WHERE routine_schema = $1 ORDER BY routine_name`,
      [schema]
    ),
    pool.query(
      `SELECT sequence_name AS name, 'sequence' AS type FROM information_schema.sequences
       WHERE sequence_schema = $1 ORDER BY sequence_name`,
      [schema]
    )
  ])

  return [
    { name: 'Tables', type: 'group', icon: 'table', children: tables.rows },
    { name: 'Views', type: 'group', icon: 'view', children: views.rows },
    { name: 'Procedures', type: 'group', icon: 'procedure', children: procedures.rows },
    { name: 'Sequences', type: 'group', icon: 'sequence', children: sequences.rows }
  ]
}
