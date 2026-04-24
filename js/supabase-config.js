const _sb = supabase.createClient(
  'https://msbhkldcxwhmeeyslmzn.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1zYmhrbGRjeHdobWVleXNsbXpuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI5MTY1MjMsImV4cCI6MjA4ODQ5MjUyM30.CzN7BjGx-ympqOvZ-9P2-UkktI37NeTrFFYhcWTPDQ8'
);

window.supabase          = _sb;
window.SUPABASE_URL      = 'https://msbhkldcxwhmeeyslmzn.supabase.co';
window.SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1zYmhrbGRjeHdobWVleXNsbXpuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI5MTY1MjMsImV4cCI6MjA4ODQ5MjUyM30.CzN7BjGx-ympqOvZ-9P2-UkktI37NeTrFFYhcWTPDQ8';
const db                 = _sb;