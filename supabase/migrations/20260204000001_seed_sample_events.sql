-- Seed sample events for Berlin (weekend of Feb 7-8, 2026)
INSERT INTO public.events (city, meetup_type, date_time, neighborhood, max_participants, min_participants, status)
VALUES
  ('Berlin', 'brunch', '2026-02-07 12:00:00+01', 'mitte', 4, 3, 'open'),
  ('Berlin', 'brunch', '2026-02-07 12:00:00+01', 'prenzlauer_berg_friedrichshain', 4, 3, 'open'),
  ('Berlin', 'coffee', '2026-02-07 15:00:00+01', 'kreuzberg_neukoelln', 4, 3, 'open'),
  ('Berlin', 'walk', '2026-02-08 11:00:00+01', 'charlottenburg_schoeneberg', 4, 3, 'open'),
  ('Berlin', 'sports', '2026-02-08 14:00:00+01', 'mitte', 4, 3, 'open'),
  ('Berlin', 'brunch', '2026-02-14 12:00:00+01', 'mitte', 4, 3, 'open'),
  ('Berlin', 'coffee', '2026-02-14 15:00:00+01', 'prenzlauer_berg_friedrichshain', 4, 3, 'open')
;
