-- Adds delivery + trucking columns to orders so a paid checkout can carry a
-- real delivered price (truck type, miles, hours, access modifier) alongside
-- the existing pickup workflow. Also creates a tiny cache table so we don't
-- re-geocode the same ZIP repeatedly.

ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS trucking_fee_cents integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS delivery_truck_type text,
  ADD COLUMN IF NOT EXISTS delivery_zip text,
  ADD COLUMN IF NOT EXISTS delivery_miles numeric(6, 1),
  ADD COLUMN IF NOT EXISTS delivery_hours numeric(5, 2),
  ADD COLUMN IF NOT EXISTS access_modifier numeric(3, 2) DEFAULT 1.0,
  ADD COLUMN IF NOT EXISTS delivery_origin_yard text;

CREATE TABLE IF NOT EXISTS sp_trucking_distance_cache (
  id              bigserial PRIMARY KEY,
  origin_key      text        NOT NULL,
  dest_zip        text        NOT NULL,
  miles_one_way   numeric(6, 1) NOT NULL,
  hours_one_way   numeric(5, 2) NOT NULL,
  source          text        NOT NULL DEFAULT 'haversine',
  created_at      timestamptz NOT NULL DEFAULT now(),
  refreshed_at    timestamptz NOT NULL DEFAULT now(),
  UNIQUE (origin_key, dest_zip)
);

CREATE INDEX IF NOT EXISTS sp_trucking_cache_lookup_idx
  ON sp_trucking_distance_cache (origin_key, dest_zip);

CREATE TABLE IF NOT EXISTS sp_settings (
  key         text PRIMARY KEY,
  value       jsonb NOT NULL,
  updated_at  timestamptz NOT NULL DEFAULT now()
);

-- Seed the default trucking rate table. Admin UI will overwrite via UPSERT.
INSERT INTO sp_settings (key, value)
VALUES (
  'trucking_rates',
  '{
    "walking_floor":   { "hourly_rate": 165, "min_fee": 400, "capacity_label": "~24 tons / 90-110 cu yd" },
    "flatbed_moffett": { "hourly_rate": 150, "min_fee": 400, "capacity_label": "22 pallets / 22 totes" },
    "hot_shot":        { "hourly_rate": 95,  "min_fee": 175, "capacity_label": "4-10 pallets" },
    "avg_speed_mph":   55,
    "road_factor":     1.30,
    "unload_hours":    0.5
  }'::jsonb
)
ON CONFLICT (key) DO NOTHING;
