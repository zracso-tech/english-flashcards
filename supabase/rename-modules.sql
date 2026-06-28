-- Renombra módulos existentes: W1 · → SEMANA 1 ·  y  W2 · → SEMANA 2 ·
-- Idempotente: si ya está renombrado, no cambia nada.

update public.cards
set module = 'SEMANA 1 · ' || substring(module from 6)
where module like 'W1 · %';

update public.cards
set module = 'SEMANA 2 · ' || substring(module from 6)
where module like 'W2 · %';

-- Comprobación
select module, count(*) as tarjetas
from public.cards
group by module
order by module;
