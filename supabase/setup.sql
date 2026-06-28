-- Setup completo de la app (idempotente). Pegar y ejecutar en el SQL Editor de Supabase.
-- Estado final: cards (con 75 seed) + card_progress + daily_sessions, RLS abierta a anon.

create extension if not exists "uuid-ossp";

-- Limpieza: si existían las tablas anteriores con user_id las dropeamos.
drop table if exists public.sessions cascade;
drop table if exists public.user_progress cascade;
drop table if exists public.card_progress cascade;
drop table if exists public.daily_sessions cascade;

create table if not exists public.cards (
  id uuid primary key default uuid_generate_v4(),
  word text not null,
  meaning text not null,
  example text,
  module text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists cards_module_idx on public.cards(module);

create table public.card_progress (
  card_id uuid primary key references public.cards(id) on delete cascade,
  streak int not null default 0,
  last_seen_at timestamptz,
  mastered_at timestamptz
);

create index card_progress_streak_idx on public.card_progress(streak);

create table public.daily_sessions (
  date date primary key,
  correct int not null default 0,
  wrong int not null default 0
);

-- updated_at trigger
create or replace function public.touch_updated_at() returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists cards_touch_updated_at on public.cards;
create trigger cards_touch_updated_at
  before update on public.cards
  for each row execute function public.touch_updated_at();

-- RLS abierta a anon. La URL pública es el "secreto" — no la compartas.
alter table public.cards enable row level security;
alter table public.card_progress enable row level security;
alter table public.daily_sessions enable row level security;

drop policy if exists "cards_read"   on public.cards;
drop policy if exists "cards_write"  on public.cards;
drop policy if exists "cards_update" on public.cards;
drop policy if exists "cards_delete" on public.cards;
drop policy if exists "cards_all_auth" on public.cards;
drop policy if exists "cards_anon"  on public.cards;

create policy "cards_anon" on public.cards for all to anon
  using (true) with check (true);

create policy "card_progress_anon" on public.card_progress for all to anon
  using (true) with check (true);

create policy "daily_sessions_anon" on public.daily_sessions for all to anon
  using (true) with check (true);

-- Seed: solo si cards está vacía
insert into public.cards (word, meaning, example, module)
select * from (values
  ('Stuff', 'Cosas / material / sustancia', 'Where''s my stuff? I thought I left it here.', 'W1 · Sounding Native'),
  ('You guys', 'Vosotros / ustedes (coloquial)', 'How are you guys? Are you guys coming?', 'W1 · Sounding Native'),
  ('Guy', 'Tipo / tío / hombre (coloquial)', 'He''s a nice guy, isn''t he?', 'W1 · Sounding Native'),
  ('To deal with', 'Lidiar con / ocuparse de algo', 'We have to deal with it. I don''t want to deal with him.', 'W2 · Sounding Native'),
  ('What''s the deal?', '¿Qué pasa? / ¿Qué ocurre?', 'What''s the deal? Here''s the deal…', 'W2 · Sounding Native'),
  ('No big deal', 'No es para tanto / no hay problema', 'No big deal! Don''t worry about it.', 'W2 · Sounding Native'),
  ('The real deal', 'Lo auténtico / el crack / lo mejor de verdad', 'This guy''s the real deal!', 'W2 · Sounding Native'),
  ('A great deal of', 'Una gran cantidad de', 'He''s causing a great deal of problems.', 'W2 · Sounding Native'),
  ('To blow your mind', 'Dejarte alucinado / sorprenderte muchísimo', 'This new technology is going to blow your mind.', 'W2 · Sounding Native'),
  ('To blow you away', 'Dejarte muy impresionado / sorprenderte', 'I was blown away by the new technology.', 'W2 · Sounding Native'),
  ('Hang in there', 'Aguanta / sé fuerte / no te rindas', 'Hang in there, it''s gonna be okay.', 'W2 · Sounding Native'),
  ('You rock / This rocks', 'Eres increíble / esto mola / eres la leche', 'You rock man! You did a great job!', 'W2 · Sounding Native'),
  ('Flap T', 'La T/D que suena como "r" española suave (entre vocales)', 'Party, city, water, better, meeting — la T entre vocales.', 'W1 · Connecting Words'),
  ('Wanna', 'Want to — querer hacer algo (coloquial oral)', 'Do you wanna come? I wanna go there.', 'W2 · Connecting Words'),
  ('Gonna', 'Going to — ir a hacer algo (coloquial oral)', 'It''s gonna be fine. Everything''s gonna work out.', 'W2 · Connecting Words'),
  ('However', 'Sin embargo (conecta ideas opuestas, formal)', 'It was a tough game. However, we managed to win.', 'W1 · Beautifying'),
  ('Nevertheless', 'Sin embargo / aun así (más formal que however)', 'He works a lot. Nevertheless, he doesn''t have money.', 'W1 · Beautifying'),
  ('Even though / Although', 'Aunque / a pesar de que', 'Even though I''m tired, I still want to go out.', 'W1 · Beautifying'),
  ('On the one hand… on the other hand', 'Por un lado… por otro lado', 'On the one hand it''s useful. On the other hand it''s expensive.', 'W1 · Beautifying'),
  ('Whereas', 'Mientras que (contraste directo entre dos cosas)', 'This movie is great, whereas that one is boring.', 'W1 · Beautifying'),
  ('Instead of / Rather than', 'En lugar de / en vez de', 'Instead of texting her, why don''t you call her?', 'W1 · Beautifying'),
  ('Despite / In spite of', 'A pesar de / pese a', 'In spite of being insulted, he kept his temper.', 'W1 · Beautifying'),
  ('Unless', 'A menos que / a no ser que', 'You don''t need to go unless you want to.', 'W1 · Beautifying'),
  ('Yet', 'Aún así (contraste, más literario que however)', 'It''s a small car, yet it''s surprisingly wide.', 'W1 · Beautifying'),
  ('Otherwise', 'O si no / de lo contrario', 'We could go now. Otherwise, we could go in the evening.', 'W1 · Beautifying'),
  ('On the contrary', 'Todo lo contrario / por el contrario', 'Did you say she was nice? On the contrary, she''s really mean.', 'W1 · Beautifying'),
  ('Nonetheless', 'Sin embargo / no obstante (formal, escrito)', 'The results were mixed. Nonetheless, the project moved forward.', 'W1 · Beautifying'),
  ('Undoubtedly', 'Sin duda / indudablemente', 'Undoubtedly, this restaurant is the best in town.', 'W2 · Beautifying'),
  ('Indeed', 'De hecho / ciertamente / sí que (énfasis)', 'Did you enjoy the film? Yes, indeed.', 'W2 · Beautifying'),
  ('Especially', 'Especialmente / sobre todo', 'This is hard, especially if you''re tired.', 'W2 · Beautifying'),
  ('Clearly / Obviously', 'Claramente / obviamente', 'Clearly, this car is bigger than that one.', 'W2 · Beautifying'),
  ('In particular', 'En particular / concretamente', 'I like these cars, in particular this one.', 'W2 · Beautifying'),
  ('Pity', 'Pena / lástima', 'What a pity you can''t come to the meeting.', 'W1 · Mastering Sounds'),
  ('Notice', 'Darse cuenta / notar', 'Did you notice the change in strategy?', 'W1 · Mastering Sounds'),
  ('Matter', 'Asunto / tema / importar', 'We talked about thirty different matters at the meeting.', 'W1 · Mastering Sounds'),
  ('Settle', 'Asentarse / establecerse / resolver', 'Her daughter got settled in Seattle.', 'W1 · Mastering Sounds'),
  ('Attitude', 'Actitud', 'His attitude toward innovation changed everything.', 'W1 · Mastering Sounds'),
  ('Gratitude', 'Gratitud / agradecimiento', 'I''d like to express my gratitude for your support.', 'W1 · Mastering Sounds'),
  ('Hesitate', 'Dudar / vacilar', 'Don''t hesitate to contact me if you need anything.', 'W1 · Mastering Sounds'),
  ('Pretty', 'Bastante / muy (adverbio) / guapo,a (adjetivo)', 'That''s a pretty good deal for the company.', 'W1 · Mastering Sounds'),
  ('Better', 'Mejor', 'We need a better approach to this problem.', 'W1 · Mastering Sounds'),
  ('Bitter', 'Amargo / resentido', 'He was bitter about losing the contract.', 'W1 · Mastering Sounds'),
  ('Waiter', 'Camarero', 'The waiter recommended the local fish.', 'W1 · Mastering Sounds'),
  ('Politician', 'Político (persona)', 'The politician avoided the question completely.', 'W1 · Mastering Sounds'),
  ('Narrow', 'Estrecho / limitado', 'That narrow arrow went into the apple.', 'W2 · Mastering Sounds (a)'),
  ('Laugh', 'Reír / risa', 'He laughed at the idea at first, then approved it.', 'W2 · Mastering Sounds (a)'),
  ('Fast', 'Rápido / rápidamente', 'We need to move fast on this project.', 'W2 · Mastering Sounds (a)'),
  ('Ask', 'Preguntar / pedir', 'Don''t hesitate to ask if you need clarification.', 'W2 · Mastering Sounds (a)'),
  ('Angry', 'Enfadado / enojado', 'The client was angry about the delay.', 'W2 · Mastering Sounds (a)'),
  ('Language', 'Idioma / lenguaje', 'Body language matters as much as words in a pitch.', 'W2 · Mastering Sounds (a)'),
  ('Bank', 'Banco / banca', 'The bank approved the funding for the project.', 'W2 · Mastering Sounds (a)'),
  ('Thanks', 'Gracias (informal)', 'Thanks for joining the call on short notice.', 'W2 · Mastering Sounds (a)'),
  ('Funny', 'Gracioso / curioso / extraño', 'It''s funny how the market shifted overnight.', 'W2 · Mastering Sounds (N)'),
  ('Know', 'Saber / conocer', 'I know this market better than anyone.', 'W2 · Mastering Sounds (N)'),
  ('Near', 'Cerca / próximo', 'We''re near a breakthrough with this technology.', 'W2 · Mastering Sounds (N)'),
  ('Noon', 'Mediodía', 'Let''s schedule the call for noon.', 'W2 · Mastering Sounds (N)'),
  ('Pneumonia', 'Neumonía', 'He missed the conference due to pneumonia.', 'W2 · Mastering Sounds (N)'),
  ('Treasure', 'Tesoro / valorar mucho', 'This data is a real treasure for our analysis.', 'W2 · Mastering Sounds (zh)'),
  ('Leisure', 'Tiempo libre / ocio', 'I went to Germany for leisure, not for business.', 'W2 · Mastering Sounds (zh)'),
  ('Casual', 'Informal / relajado', 'It''s a casual dinner so I''m gonna wear casual clothes.', 'W2 · Mastering Sounds (zh)'),
  ('Collision', 'Colisión / choque', 'The two strategies led to a direct collision.', 'W2 · Mastering Sounds (zh)'),
  ('Version', 'Versión', 'Please send me the latest version of the report.', 'W2 · Mastering Sounds (zh)'),
  ('Conclusion', 'Conclusión / cierre', 'In conclusion, I wouldn''t do it.', 'W2 · Mastering Sounds (zh)'),
  ('Unusual', 'Inusual / poco común', 'That was an unusual approach to the problem.', 'W2 · Mastering Sounds (zh)'),
  ('Usually', 'Normalmente / habitualmente', 'I usually prepare the agenda the night before.', 'W2 · Mastering Sounds (zh)'),
  ('Exposure', 'Exposición / visibilidad', 'This role gives me great exposure to the board.', 'W2 · Mastering Sounds (zh)'),
  ('Envision', 'Imaginar / vislumbrar / contemplar el futuro', 'Let''s envision a bright future for our business.', 'W2 · Mastering Sounds (zh)'),
  ('Conversion', 'Conversión (negocio / dato)', 'The conversion rate of this website is 2%.', 'W2 · Mastering Sounds (zh)'),
  ('Seizure', 'Convulsión / incautación', 'Exposure to flashing lights can trigger seizures.', 'W2 · Mastering Sounds (zh)'),
  ('To mumble', 'Balbucear / hablar entre dientes / mascullar', 'Stop mumbling and speak clearly!', 'W2 · Mastering Sounds (B)'),
  ('To babble', 'Balbucear / hablar sin parar sin decir nada', 'The baby was babbling in his crib.', 'W2 · Mastering Sounds (B)'),
  ('Bubble', 'Burbuja', 'The dot-com bubble burst in 2000.', 'W2 · Mastering Sounds (B)'),
  ('Rubber', 'Goma / caucho', 'The rubber seal on the device failed.', 'W2 · Mastering Sounds (B)'),
  ('Bug', 'Bicho / error de software / espiar', 'There''s a bug in the system we need to fix.', 'W2 · Mastering Sounds (B)'),
  ('Bumblebee', 'Abejorro', 'Bob saw a bumblebee on the doorknob.', 'W2 · Mastering Sounds (B)')
) as v(word, meaning, example, module)
where not exists (select 1 from public.cards);
