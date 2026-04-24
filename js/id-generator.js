async function generateId(type) {
  const year = new Date().getFullYear();
  const pattern = `${type}${year}`;
  const { data } = await db.from('persons').select('id').like('id', `${pattern}%`);
  const count = data ? data.length : 0;
  return `${pattern}${String(count + 1).padStart(5, '0')}`;
}

async function updateIdPreview(type) {
  const box = document.getElementById('idPreviewBox');
  const strong = document.getElementById('previewId');
  if (!box || !strong) return;
  box.style.display = 'flex';
  strong.textContent = 'GENERATING...';
  const id = await generateId(type);
  strong.textContent = id;
}