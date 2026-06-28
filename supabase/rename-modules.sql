-- Colapsa los módulos a solo SEMANA 1 / SEMANA 2 (sin sub-categoría).
-- Idempotente: cubre tanto el estado viejo (W1/W2 · ...) como el intermedio (SEMANA 1/2 · ...).

update public.cards
set module = 'SEMANA 1'
where module like 'W1 ·%' or module like 'W1 %' or module = 'W1'
   or module like 'SEMANA 1 ·%' or module like 'SEMANA 1 %';

update public.cards
set module = 'SEMANA 2'
where module like 'W2 ·%' or module like 'W2 %' or module = 'W2'
   or module like 'SEMANA 2 ·%' or module like 'SEMANA 2 %';

-- Comprobación
select module, count(*) as tarjetas
from public.cards
group by module
order by module;
