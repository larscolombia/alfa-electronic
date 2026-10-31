-- =====================================================================
-- Backfill de códigos CO para ítems legacy sin equipmentCode
-- Fecha: 2026-10-31 · Idempotente (solo rellena vacíos) · Transaccional
--
-- Semántica idéntica a backend/internal/crm/equipment/service_codes.go:
--   código    = CO + YY + MM + secuencial(≥4 dígitos, crece si supera 9999)
--   contador  por (empresa, periodo YYYYMM) con reinicio mensual
-- La reserva de secuencia usa la misma sentencia atómica que Go
-- (INSERT ... ON CONFLICT DO UPDATE SET last_value = s + EXCLUDED), así un
-- backfill concurrente con recepciones nuevas nunca repite ni salta códigos.
--
-- El periodo se toma de la fecha de recepción del registro
-- (reception_year/reception_month) para que el código refleje cuándo entró
-- el equipo, no cuándo se corrió este backfill.
-- Incluye registros archivados: sus ítems pueden seguir expuestos en vistas
-- activas (proyectos vinculados), y el identificador universal debe existir.
--
-- Uso: psql -v ON_ERROR_STOP=1 -d <db> -f 2026-10-31_backfill_equipment_codes.sql
-- =====================================================================
BEGIN;

WITH targets AS (
    SELECT r.company_id                                  AS company_id,
           lpad(r.reception_year::text, 4, '0')
             || lpad(r.reception_month::text, 2, '0')    AS period,
           r.id                                          AS record_id,
           COALESCE(e.elem->>'id', '')                   AS item_id,
           e.ord                                         AS item_idx_1based,
           row_number() OVER w                           AS rank_in_period,
           -- frame explícito: sin él, el ORDER BY de la ventana nombrada aplica
           -- el frame por defecto (RANGE ... CURRENT ROW) y el conteo se vuelve acumulativo.
           count(*)     OVER (w ROWS BETWEEN UNBOUNDED PRECEDING AND UNBOUNDED FOLLOWING)
                                                             AS needed
    FROM crm_equipment_records r
    CROSS JOIN LATERAL jsonb_array_elements(r.items_json) WITH ORDINALITY e(elem, ord)
    WHERE COALESCE(e.elem->>'equipmentCode', '') = ''
      -- Se incluyen registros archivados: si un proyecto activo aún los
      -- referencia (EQ-* legacy), la vista debe resolver un código CO real.
      AND r.company_id IS NOT NULL AND r.company_id <> ''
      AND r.reception_year  IS NOT NULL
      AND r.reception_month IS NOT NULL
      AND r.created_at      IS NOT NULL
    WINDOW w AS (
        PARTITION BY r.company_id,
                     lpad(r.reception_year::text, 4, '0') || lpad(r.reception_month::text, 2, '0')
        ORDER BY r.created_at, r.id, e.ord
    )
),
period_needs AS (
    SELECT DISTINCT company_id, period, needed FROM targets
),
-- Reserva atómica del bloque de secuencia por (empresa, periodo).
reserved AS (
    INSERT INTO equipment_code_sequences AS s (company_id, period, last_value)
    SELECT pn.company_id, pn.period, pn.needed
      FROM period_needs pn
    ON CONFLICT (company_id, period) DO UPDATE
        SET last_value = s.last_value + EXCLUDED.last_value
    RETURNING company_id, period, last_value AS end_seq
),
-- Código por ítem: seq = último_valor_previo + rank_in_period.
assignment AS (
    SELECT t.item_id,
           t.record_id,
           t.item_idx_1based,
           'CO' || substr(t.period, 3, 2) || substr(t.period, 5, 2)
             || lpad((rs.end_seq - t.needed + t.rank_in_period)::text, 4, '0') AS code
      FROM targets t
      JOIN reserved rs ON rs.company_id = t.company_id AND rs.period = t.period
),
item_codes AS (
    SELECT item_id, code FROM assignment WHERE item_id <> ''
),
-- Reconstruye items_json del registro tocado respetando el orden original;
-- solo se inyecta equipmentCode en las posiciones asignadas.
rebuild AS (
    SELECT rec.id AS record_id,
           jsonb_agg(
               CASE WHEN a.item_idx_1based = e.ord
                    THEN e.elem || jsonb_build_object('equipmentCode', to_jsonb(a.code))
                    ELSE e.elem END
               ORDER BY e.ord
           ) AS new_items_json
      FROM crm_equipment_records rec
      CROSS JOIN LATERAL jsonb_array_elements(rec.items_json) WITH ORDINALITY e(elem, ord)
      LEFT JOIN assignment a ON a.record_id = rec.id AND a.item_idx_1based = e.ord
     WHERE rec.id IN (SELECT DISTINCT record_id FROM assignment)
     GROUP BY rec.id
),
-- Propagación a proyectos vinculados por equipmentItemId que aún no tienen código.
proj_update AS (
    UPDATE projects p
       SET properties_json = jsonb_set(p.properties_json, '{equipmentCode}', to_jsonb(ic.code))
      FROM item_codes ic
     WHERE COALESCE(p.properties_json->>'equipmentCode', '') = ''
       AND p.properties_json->>'equipmentItemId' = ic.item_id
    RETURNING p.id
),
-- Aplica los items_json reconstruidos.
rec_update AS (
    UPDATE crm_equipment_records r
       SET items_json = rb.new_items_json,
           updated_at = now()
      FROM rebuild rb
     WHERE r.id = rb.record_id
    RETURNING r.id
)
SELECT count(*) FILTER (WHERE src = 'asignados')   AS codigos_asignados,
       count(*) FILTER (WHERE src = 'proyectos')   AS proyectos_actualizados,
       count(*) FILTER (WHERE src = 'registros')   AS registros_actualizados
  FROM (
      SELECT 'asignados' AS src FROM assignment
      UNION ALL SELECT 'proyectos'   FROM proj_update
      UNION ALL SELECT 'registros'   FROM rec_update
  ) x;

-- ---------------------------------------------------------------------
-- Paso 2: proyectos que aún traen el código legacy EQ-* (fallback derivado
-- del ID antiguo) → sincronizar con el código CO real de su ítem vinculado.
-- Solo se toca cuando el valor actual coincide con el patrón legacy y el
-- ítem ya tiene un CO válido; nunca se sobreescribe un CO legítimo ni se
-- reemplaza por NULL si el ítem no tuviera código.
-- ---------------------------------------------------------------------
UPDATE projects p
   SET properties_json = jsonb_set(p.properties_json, '{equipmentCode}', to_jsonb(src.item_code))
  FROM (
      SELECT p2.id        AS project_id,
             l.item_code AS item_code
        FROM projects p2
        CROSS JOIN LATERAL (
            SELECT e.elem->>'equipmentCode' AS item_code
              FROM crm_equipment_records r
              CROSS JOIN LATERAL jsonb_array_elements(r.items_json) e(elem)
             WHERE COALESCE(e.elem->>'id', '') = p2.properties_json->>'equipmentItemId'
               AND e.elem->>'equipmentCode' ~ '^CO[0-9]{8,}$'
            LIMIT 1
        ) l(item_code)
       WHERE p2.properties_json ? 'equipmentItemId'
         AND p2.properties_json->>'equipmentCode' ~ '^EQ-'
  ) src
 WHERE p.id = src.project_id;

COMMIT;
