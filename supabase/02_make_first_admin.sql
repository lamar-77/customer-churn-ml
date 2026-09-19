-- Run this ONCE after you create your own ChurnSense account.
-- Replace YOUR_EMAIL_HERE with the email you used to register.

update public.profiles
set role = 'admin'
where lower(email) = lower('YOUR_EMAIL_HERE');

-- Check the result.
select id, name, email, role
from public.profiles
where lower(email) = lower('YOUR_EMAIL_HERE');
