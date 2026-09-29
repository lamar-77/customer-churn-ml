
update public.profiles
set role = 'admin'
where lower(email) = lower('lamarsuliman.77@gmail.com');

-- Check the result.
select id, name, email, role
from public.profiles
where lower(email) = lower('lamarsuliman.77@gmail.com');
