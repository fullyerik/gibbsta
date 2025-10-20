"use strict";

/* ===== Modus & Helpers ===== */
const qs = new URLSearchParams(location.search);
const POST_ID = qs.get("id"); // <-- UUID-String (nicht in Zahl umwandeln!)

function publicUrl(path){ return sb.storage.from('images').getPublicUrl(path).data.publicUrl; }
function escapeHtml(s){ return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }

/* Likes & Saves bleiben lokal */
const storage = {
  key(scope, id){ return `${scope}_${id}`; },
  read(scope, id){ try{ return JSON.parse(localStorage.getItem(this.key(scope,id))||'[]'); }catch{ return []; } },
  write(scope,id,arr){ localStorage.setItem(this.key(scope,id), JSON.stringify(arr)); }
};
function likeCountOf(postId){ return storage.read('like_counts', postId)[0]?.count || 0; }
function setLikeCount(postId, count){ storage.write('like_counts', postId, [{count}]); }
function getLikeStore(uid){ return storage.read('likes', uid); }
function setLikeStore(uid, arr){ storage.write('likes', uid, arr); }
function getSaveStore(uid){ return storage.read('saved', uid); }
function setSaveStore(uid, arr){ storage.write('saved', uid, arr); }
function isLiked(uid, postId){ return getLikeStore(uid).some(x=>x.postId===postId); }

/* ===== Init ===== */
document.addEventListener('DOMContentLoaded', async () => {
  const user = (await sb.auth.getUser()).data.user;
  if(!user){ location.href='index.html'; return; }

  if(POST_ID){
    document.getElementById('viewSection').classList.remove('hidden');
    await loadPostView(user.id, POST_ID); // UUID
  }else{
    document.getElementById('createSection').classList.remove('hidden');
    setupCreate(user.id);
  }
});

/* ===== VIEW ===== */
async function loadPostView(currentUserId, pid){
  // Post laden (id ist UUID → String verwenden)
  const { data: post, error } = await sb
    .from('posts')
    .select('id,user_id,caption,image_path,created_at')
    .eq('id', pid)
    .single();

  if(error || !post){ alert('Beitrag nicht gefunden.'); location.href='home.html'; return; }

  // Owner-Profil (Username/Avatar)
  let uname = post.user_id.slice(0,8), avatar = 'https://via.placeholder.com/80/dbdbdb/262626?text=+';
  const { data: prof } = await sb
    .from('profiles')
    .select('username, avatar_url, avatar_path')
    .eq('id', post.user_id)
    .limit(1);
  if(prof && prof[0]){
    uname = prof[0].username || uname;
    avatar = prof[0].avatar_url || (prof[0].avatar_path ? publicUrl(prof[0].avatar_path) : avatar);
  }

  // UI füllen
  const imgUrl = publicUrl(post.image_path);
  const liked = isLiked(currentUserId, post.id);
  const saved = getSaveStore(currentUserId).some(x=>x.postId===post.id);
  const likeCount = likeCountOf(post.id);

  document.getElementById('viewUname').textContent = '@'+uname;
  document.getElementById('viewAvatar').src = avatar;
  const viewImage = document.getElementById('viewImage');
  viewImage.src = imgUrl; viewImage.style.display = 'block';
  document.getElementById('viewCaption').textContent = post.caption || '';

  const likeIcon = document.getElementById('likeBtn').querySelector('i');
  likeIcon.classList.toggle('fa-solid', liked);
  likeIcon.classList.toggle('fa-regular', !liked);
  const saveIcon = document.getElementById('saveBtn').querySelector('i');
  saveIcon.classList.toggle('fa-solid', saved);
  saveIcon.classList.toggle('fa-regular', !saved);
  document.getElementById('likesCount').textContent = likeCount;

  // Kommentare laden (DB) & Realtime
  await renderCommentsFromDB(post.id);
  try{
    sb.channel('comments_post_'+post.id)
      .on('postgres_changes', { event:'*', schema:'public', table:'comments', filter:`post_id=eq.${post.id}` },
        () => renderCommentsFromDB(post.id))
      .subscribe();
  }catch(e){ console.warn('Realtime nicht aktiv?', e); }

  // Like (lokal)
  document.getElementById('likeBtn').onclick = async ()=>{
    let cnt = likeCountOf(post.id);
    if(isLiked(currentUserId, post.id)){
      const arr = getLikeStore(currentUserId);
      if(arr.some(x=>x.postId===post.id)){
        setLikeStore(currentUserId, arr.filter(x=>x.postId!==post.id));
        cnt = Math.max(0, cnt-1);
        setLikeCount(post.id, cnt);
        likeIcon.classList.remove('fa-solid'); likeIcon.classList.add('fa-regular');
      }
    }else{
      const arr = getLikeStore(currentUserId);
      if(!arr.some(x=>x.postId===post.id)){
        arr.push({ postId: post.id, at: Date.now() });
        setLikeStore(currentUserId, arr);
        cnt = cnt+1;
        setLikeCount(post.id, cnt);
        likeIcon.classList.remove('fa-regular'); likeIcon.classList.add('fa-solid');

        // Mitteilung an Post-Besitzer in DB (falls Liker != Owner)
        try{
          if (currentUserId && currentUserId !== post.user_id) {
            await sb.from('notifications').insert({
              owner_id: post.user_id,
              from_user_id: currentUserId,
              type: 'like',
              post_id: post.id
            });
          }
        }catch(e){
          console.warn('Notif insert failed', e);
        }
      }
    }
    document.getElementById('likesCount').textContent = String(cnt);
  };

  // Save (lokal)
  document.getElementById('saveBtn').onclick = ()=>{
    const already = getSaveStore(currentUserId).some(x=>x.postId===post.id);
    let arr = getSaveStore(currentUserId).filter(x=>x.postId!==post.id);
    if(!already) arr = [...getSaveStore(currentUserId), { postId: post.id, at: Date.now() }];
    setSaveStore(currentUserId, arr);
    saveIcon.classList.toggle('fa-solid', !already);
    saveIcon.classList.toggle('fa-regular', already);
  };

  // Kommentar senden → DB (+ Notification)
  document.getElementById('commentSend').onclick = async ()=>{
    const inp = document.getElementById('commentInput');
    const text = (inp.value||'').trim();
    if(!text) return;

    try{
      // Kommentar speichern (post.id ist UUID)
      const { error: insErr } = await sb.from('comments').insert({
        post_id: post.id,
        user_id: currentUserId,
        text
      });
      if(insErr) throw insErr;

      // Notification für Post-Besitzer (nicht bei eigenem Post)
      try{
        if (currentUserId && currentUserId !== post.user_id) {
          await sb.from('notifications').insert({
            owner_id: post.user_id,
            from_user_id: currentUserId,
            type: 'comment',
            post_id: post.id,
            comment: text
          });
        }
      }catch(e){ console.warn('Notif insert failed', e); }

      inp.value='';
      // Realtime rendert nach; bei Bedarf: await renderCommentsFromDB(post.id);
    }catch(e){
      console.error(e);
      alert('Kommentar konnte nicht gespeichert werden: ' + (e.message || e));
    }
  };
}

/* ===== Kommentare (DB) ===== */
async function renderCommentsFromDB(postId){
  const wrap = document.getElementById('commentsList');
  wrap.innerHTML = '';

  // 1) Kommentare holen
  const { data: comments, error } = await sb
    .from('comments')
    .select('id, user_id, text, created_at')
    .eq('post_id', postId)
    .order('created_at', { ascending: true });

  if(error){
    console.error(error);
    wrap.textContent = 'Fehler beim Laden der Kommentare.';
    return;
  }
  if(!comments || comments.length === 0) return;

  // 2) Usernames dazu in einem Rutsch
  const uniqueIds = [...new Set(comments.map(c => c.user_id))];
  let nameMap = {};
  if(uniqueIds.length){
    const { data: profs } = await sb
      .from('profiles')
      .select('id, username, email')
      .in('id', uniqueIds);
    (profs || []).forEach(p=>{
      const uname = (p.username && p.username.trim())
        ? p.username.trim()
        : (p.email ? p.email.split('@')[0] : (p.id ? p.id.slice(0,8) : 'user'));
      nameMap[p.id] = uname;
    });
  }

  // 3) Render
  comments.forEach(c=>{
    const uname = nameMap[c.user_id] || 'user';
    const el = document.createElement('div');
    el.innerHTML = `<b>@${escapeHtml(uname)}</b> ${escapeHtml(c.text)}`;
    wrap.appendChild(el);
  });
}

/* ===== CREATE ===== */
function setupCreate(currentUserId){
  const dropZone = document.getElementById('dropZone');
  const fileInput = document.getElementById('fileInput');
  const preview = document.getElementById('previewImg');
  const publishBtn = document.getElementById('publishBtn');
  const captionEl = document.getElementById('newCaption');
  const charCount = document.getElementById('charCount');
  const msgEl = document.getElementById('uploadMsg');

  fileInput.addEventListener('change', onFile);

  dropZone.addEventListener('dragover', (e)=>{ e.preventDefault(); dropZone.style.background='#fafafa'; });
  dropZone.addEventListener('dragleave', ()=>{ dropZone.style.background='#fff'; });
  dropZone.addEventListener('drop', (e)=>{
    e.preventDefault();
    dropZone.style.background='#fff';
    if(e.dataTransfer.files && e.dataTransfer.files[0]){
      fileInput.files = e.dataTransfer.files; onFile();
    }
  });

  captionEl.addEventListener('input', ()=>{ charCount.textContent = `${captionEl.value.length}/2200`; });

  let chosenFile = null;
  function onFile(){
    const f = fileInput.files?.[0]; if(!f) return;
    chosenFile = f;
    const reader = new FileReader();
    reader.onload = e => { preview.src = e.target.result; preview.style.display='block'; };
    reader.readAsDataURL(f);
    publishBtn.disabled = false;
  }

  publishBtn.addEventListener('click', async ()=>{
    if(!chosenFile){ return; }
    try{
      publishBtn.disabled = true;
      msgEl.textContent = 'Lade hoch…';

      const key = `posts/${currentUserId}_${Date.now()}_${(chosenFile.name||'image').replace(/\s+/g,'_')}`;
      const { error: upErr } = await sb.storage.from('images').upload(key, chosenFile, { upsert:true, contentType: chosenFile.type || 'image/jpeg' });
      if(upErr) throw upErr;

      const payload = { user_id: currentUserId, image_path: key, caption: captionEl.value || '', created_at: new Date().toISOString() };
      const { data, error: insErr } = await sb.from('posts').insert(payload).select('id').range(0,0);
      if(insErr) throw insErr;

      const newId = data && data[0] && data[0].id;
      msgEl.textContent = 'Fertig! Öffne Beitrag…';
      location.href = `post.html?id=${encodeURIComponent(newId)}`;
    }catch(e){
      console.error(e);
      msgEl.textContent = 'Fehler: ' + (e.message || e);
      publishBtn.disabled = false;
    }
  });
}
