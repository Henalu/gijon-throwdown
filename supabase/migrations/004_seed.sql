-- ============================================================
-- 004_seed.sql
-- Demo data for Gijon Throwdown
-- ============================================================

-- Event config
INSERT INTO event_config (name, slug, description, date, end_date, location, venue_name, venue_address, primary_color, secondary_color, status, faq)
VALUES (
  'Gijon Throwdown',
  'gijon-throwdown',
  'La competicion funcional mas potente del norte de Espana. Equipos de 2 personas compiten en WODs brutales frente al Cantabrico.',
  '2026-06-20',
  '2026-06-21',
  'Gijon, Asturias',
  'Palacio de Deportes de Gijon',
  'Av. del Llano, 33209 Gijon, Asturias',
  '#3BD4A0',
  '#0A0A0A',
  'published',
  '[
    {"question": "Cuando es el evento?", "answer": "20 y 21 de junio de 2026. Sabado y domingo."},
    {"question": "Donde se celebra?", "answer": "Palacio de Deportes de Gijon, Av. del Llano."},
    {"question": "Cuantas categorias hay?", "answer": "Tres categorias: RX, Scaled y Masters (+35). Todas por equipos de 2."},
    {"question": "Hay que pagar entrada para ver?", "answer": "No, la entrada para el publico es gratuita."},
    {"question": "Puedo ir con ninos?", "answer": "Si, hay zona habilitada para familias."}
  ]'::jsonb
);

-- Categories
INSERT INTO categories (id, name, slug, description, is_team, team_size, sort_order) VALUES
  ('c1000000-0000-0000-0000-000000000001', 'RX', 'rx', 'Categoria principal. Equipos de 2. Sin scaling.', true, 2, 1),
  ('c1000000-0000-0000-0000-000000000002', 'Scaled', 'scaled', 'Categoria adaptada. Equipos de 2. Pesos y movimientos modificados.', true, 2, 2),
  ('c1000000-0000-0000-0000-000000000003', 'Masters +35', 'masters', 'Categoria veteranos (+35 anos). Equipos de 2.', true, 2, 3);

-- Teams (RX category)
INSERT INTO teams (id, category_id, name, slug, box_name, city, seed_rank) VALUES
  ('t1000000-0000-0000-0000-000000000001', 'c1000000-0000-0000-0000-000000000001', 'Los Barbaros', 'los-barbaros', 'CrossFit Gijon', 'Gijon', 1),
  ('t1000000-0000-0000-0000-000000000002', 'c1000000-0000-0000-0000-000000000001', 'Acero Cantabrico', 'acero-cantabrico', 'CrossFit Oviedo', 'Oviedo', 2),
  ('t1000000-0000-0000-0000-000000000003', 'c1000000-0000-0000-0000-000000000001', 'Furia Norte', 'furia-norte', 'CrossFit Santander', 'Santander', 3),
  ('t1000000-0000-0000-0000-000000000004', 'c1000000-0000-0000-0000-000000000001', 'Titan Box', 'titan-box', 'Titan CrossFit', 'Bilbao', 4);

-- Teams (Scaled category)
INSERT INTO teams (id, category_id, name, slug, box_name, city, seed_rank) VALUES
  ('t2000000-0000-0000-0000-000000000001', 'c1000000-0000-0000-0000-000000000002', 'Nuevos Guerreros', 'nuevos-guerreros', 'CrossFit Gijon', 'Gijon', 1),
  ('t2000000-0000-0000-0000-000000000002', 'c1000000-0000-0000-0000-000000000002', 'Equipo Rayo', 'equipo-rayo', 'Box Leon', 'Leon', 2);

-- Teams (Masters category)
INSERT INTO teams (id, category_id, name, slug, box_name, city, seed_rank) VALUES
  ('t3000000-0000-0000-0000-000000000001', 'c1000000-0000-0000-0000-000000000003', 'Viejas Glorias', 'viejas-glorias', 'CrossFit Aviles', 'Aviles', 1),
  ('t3000000-0000-0000-0000-000000000002', 'c1000000-0000-0000-0000-000000000003', 'Experiencia', 'experiencia', 'CrossFit Gijon', 'Gijon', 2);

-- Athletes (2 per team, RX)
INSERT INTO athletes (team_id, first_name, last_name, sort_order) VALUES
  ('t1000000-0000-0000-0000-000000000001', 'Carlos', 'Fernandez', 1),
  ('t1000000-0000-0000-0000-000000000001', 'Laura', 'Martinez', 2),
  ('t1000000-0000-0000-0000-000000000002', 'Pablo', 'Garcia', 1),
  ('t1000000-0000-0000-0000-000000000002', 'Ana', 'Rodriguez', 2),
  ('t1000000-0000-0000-0000-000000000003', 'David', 'Lopez', 1),
  ('t1000000-0000-0000-0000-000000000003', 'Maria', 'Sanchez', 2),
  ('t1000000-0000-0000-0000-000000000004', 'Javier', 'Ruiz', 1),
  ('t1000000-0000-0000-0000-000000000004', 'Elena', 'Diaz', 2);

-- Workouts
INSERT INTO workouts (id, name, slug, wod_type, score_type, time_cap_seconds, description, standards, sort_order, is_visible, higher_is_better) VALUES
  ('w1000000-0000-0000-0000-000000000001', 'WOD 1: Tormenta Cantabrica', 'wod-1-tormenta-cantabrica', 'for_time', 'time', 720,
   E'En parejas, por tiempo:\n\n50 Cal Row (alternando cada 10)\n40 Wall Balls (20/14 lb)\n30 Toes to Bar (alternando)\n20 Clean & Jerk (60/40 kg)\n10 Rope Climbs (alternando)',
   E'Row: cada atleta completa 10 cals antes de cambiar.\nWall Balls: rep compartida, un atleta trabaja a la vez.\nToes to Bar: pies deben tocar la barra simultaneamente.\nClean & Jerk: full squat clean + jerk overhead.\nRope Climbs: subida completa, tocar la marca.',
   1, true, false),
  ('w1000000-0000-0000-0000-000000000002', 'WOD 2: Asalto Final', 'wod-2-asalto-final', 'amrap', 'reps', 900,
   E'AMRAP 15 min en parejas:\n\n5 Deadlift (100/70 kg)\n10 Box Jump Over (24/20")\n15 Push-ups\n200m Run (juntos)',
   E'Deadlift: lockout completo arriba, platos tocan suelo abajo.\nBox Jump Over: no hace falta abrir cadera arriba, pero los dos pies deben despegar del suelo.\nPush-ups: pecho al suelo, lockout completo arriba.\nRun: los dos atletas deben cruzar la linea juntos.',
   2, true, true);

-- Workout Stages (WOD 1)
INSERT INTO workout_stages (workout_id, name, target_value, unit, sort_order) VALUES
  ('w1000000-0000-0000-0000-000000000001', '50 Cal Row', 50, 'calories', 1),
  ('w1000000-0000-0000-0000-000000000001', '40 Wall Balls', 40, 'reps', 2),
  ('w1000000-0000-0000-0000-000000000001', '30 Toes to Bar', 30, 'reps', 3),
  ('w1000000-0000-0000-0000-000000000001', '20 Clean & Jerk', 20, 'reps', 4),
  ('w1000000-0000-0000-0000-000000000001', '10 Rope Climbs', 10, 'reps', 5);

-- Workout Stages (WOD 2)
INSERT INTO workout_stages (workout_id, name, target_value, unit, sort_order) VALUES
  ('w1000000-0000-0000-0000-000000000002', '5 Deadlift', 5, 'reps', 1),
  ('w1000000-0000-0000-0000-000000000002', '10 Box Jump Over', 10, 'reps', 2),
  ('w1000000-0000-0000-0000-000000000002', '15 Push-ups', 15, 'reps', 3),
  ('w1000000-0000-0000-0000-000000000002', '200m Run', 200, 'meters', 4);

-- Heats (WOD 1, RX category - 2 heats of 2 teams each)
INSERT INTO heats (id, category_id, workout_id, heat_number, scheduled_at, status) VALUES
  ('h1000000-0000-0000-0000-000000000001', 'c1000000-0000-0000-0000-000000000001', 'w1000000-0000-0000-0000-000000000001', 1, '2026-06-20 10:00:00+02', 'pending'),
  ('h1000000-0000-0000-0000-000000000002', 'c1000000-0000-0000-0000-000000000001', 'w1000000-0000-0000-0000-000000000001', 2, '2026-06-20 10:30:00+02', 'pending'),
  ('h1000000-0000-0000-0000-000000000003', 'c1000000-0000-0000-0000-000000000001', 'w1000000-0000-0000-0000-000000000002', 1, '2026-06-20 14:00:00+02', 'pending');

-- Lanes
INSERT INTO lanes (heat_id, team_id, lane_number) VALUES
  ('h1000000-0000-0000-0000-000000000001', 't1000000-0000-0000-0000-000000000001', 1),
  ('h1000000-0000-0000-0000-000000000001', 't1000000-0000-0000-0000-000000000002', 2),
  ('h1000000-0000-0000-0000-000000000002', 't1000000-0000-0000-0000-000000000003', 1),
  ('h1000000-0000-0000-0000-000000000002', 't1000000-0000-0000-0000-000000000004', 2),
  ('h1000000-0000-0000-0000-000000000003', 't1000000-0000-0000-0000-000000000001', 1),
  ('h1000000-0000-0000-0000-000000000003', 't1000000-0000-0000-0000-000000000002', 2),
  ('h1000000-0000-0000-0000-000000000003', 't1000000-0000-0000-0000-000000000003', 3),
  ('h1000000-0000-0000-0000-000000000003', 't1000000-0000-0000-0000-000000000004', 4);

-- Sponsors
INSERT INTO sponsors (id, name, logo_url, website_url, tier, sort_order) VALUES
  ('s1000000-0000-0000-0000-000000000001', 'Rogue Fitness', '/images/sponsors/rogue.svg', 'https://www.roguefitness.com', 'title', 1),
  ('s1000000-0000-0000-0000-000000000002', 'Nocco', '/images/sponsors/nocco.svg', 'https://nocco.com', 'gold', 2),
  ('s1000000-0000-0000-0000-000000000003', 'MyProtein', '/images/sponsors/myprotein.svg', 'https://www.myprotein.es', 'silver', 3);

-- Sponsor Slots
INSERT INTO sponsor_slots (sponsor_id, position, label) VALUES
  ('s1000000-0000-0000-0000-000000000001', 'hero_section', 'Presentado por'),
  ('s1000000-0000-0000-0000-000000000001', 'leaderboard_header', 'Clasificacion oficial por'),
  ('s1000000-0000-0000-0000-000000000002', 'heat_highlight', 'Heat destacado por'),
  ('s1000000-0000-0000-0000-000000000003', 'footer_banner', NULL);
