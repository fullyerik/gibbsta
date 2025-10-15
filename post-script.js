/* Upload + Viewer in einem Script */

const qs = new URLSearchParams(location.search);
const POST_ID = qs.get('id');

let CU = null;
const storage = {
  key(s,id){ return `${s}_${id}`; },
  read(s,id){ try{return JSON.parse(localStorage.getItem(this.key(s,id))||'[]');}catch{return[];} },
  write(s,id,v){ localStorage.setItem(this.key(s,id), JSON.stringify(v)); }
};
const notif = {
  push({ownerId,type,fromUser,postId,postImage,comment}) {
    const list = storage.read('notifications', ownerId);
    list.unshift({
      id:`${Date.now()}_${Math.random().toString(36).slice(2,8)}`,
      type, fromUser, postId, postImage, comment: comment||'',
      timestamp:new Date().toISOString(), read:false
    });
    storage.write('notifications', ownerId, list);
  }
};

function getLikeStore(){ return storage.read('likes', CU.id); }
function setLikeStore(v){ storage.write('likes', CU.id, v); }
function getSaveStore(){ return storage.read('saved', CU.id); }
function setSaveStore(v){ storage.write('saved', CU.id, v); }
function comments(postId){ return storage.read('comments', postId); }
function setComments(postId,v){ storage.write('comments', postId, v); }
function likeCount(postId){ return storage.read('like_counts', postId)[0]?.count||0; }
function setLikeCount(postId,c){ storage.write('like_counts', postId, [{count:c}]); }

async function usernameOf(uid){
  const {data} = await sb.from('profiles').select('username').eq('id', uid).maybeSingle();
  return data?.username || uid.slice(0,8);
}

function show(id, yes){ document.getElementById(id).classList[yes?'remove':'add']('hidden'); }

async function init(){
  CU = (await sb.auth.getUser()).data.user;
  if(!CU){ location.href='index.html'; return; }

  if(POST_ID){            // ---- VIEWER-MODUS ----
    show('viewerUI', true); show('uploadUI', false);
    const { data: p, error } = await sb.from('posts').select('id,user_id,caption,image_path,created_at').eq('id', POST_ID).maybeSingle();
    if(error || !p){ document.getElementById('postBox').innerHTML = '<p>Post nicht gefunden.</p>'; return; }

    const uname = await usernameOf(p.user_id);
    document.getElementById('postUser').textContent = '@'+uname;
    document.getElementById('caption').value = p.caption || '';
    const img = publicUrl(p.image_path);
    const imgEl = document.getElementById('postImg'); imgEl.src = img; imgEl.style.display='block';

    // Likes/Saves Status
    const liked = getLikeStore().some(x=>x.postId===POST_ID);
    const saved = getSaveStore().some(x=>x.postId===POST_ID);
    if(liked) document.getElementById('likeBtn').firstElementChild.classList.replace('fa-regular','fa-solid');
    if(saved) document.getElementById('saveBtn').firstElementChild.classList.replace('fa-regular','fa-solid');
    document.getElementById('likesCount').textContent = likeCount(POST_ID);

    // Kommentare rendern
    renderComments();

    // Handlers
    document.getElementById('saveCaptionBtn').onclick = async ()=>{
      await sb.from('posts').update({ caption: document.getElementById('caption').value }).eq('id', POST_ID);
    };
    document.getElementById('likeBtn').onclick = async ()=>{
      const isLiked = getLikeStore().some(x=>x.postId===POST_ID);
      let list = getLikeStore(); let cnt = likeCount(POST_ID);
      const fromUser = CU.user_metadata?.username || 'user';
      if(!isLiked){
        list.unshift({postId:POST_ID, imageUrl: img});
        setLikeStore(list); setLikeCount(POST_ID,cnt+1);
        document.getElementById('likeBtn').firstElementChild.classList.replace('fa-regular','fa-solid');
        document.getElementById('likesCount').textContent = cnt+1;
        if(CU.id !== p.user_id){
          notif.push({ownerId:p.user_id, type:'like', fromUser, postId:POST_ID, postImage: img});
        }
      }else{
        list = list.filter(x=>x.postId!==POST_ID); setLikeStore(list);
        setLikeCount(POST_ID, Math.max(0,cnt-1));
        document.getElementById('likeBtn').firstElementChild.classList.replace('fa-solid','fa-regular');
        document.getElementById('likesCount').textContent = Math.max(0,cnt-1);
      }
    };
    document.getElementById('saveBtn').onclick = ()=>{
      const saved = getSaveStore().some(x=>x.postId===POST_ID);
      let list = getSaveStore();
      if(!saved){
        list.unshift({postId:POST_ID, imageUrl: img});
        setSaveStore(list);
        document.getElementById('saveBtn').firstElementChild.classList.replace('fa-regular','fa-solid');
      }else{
        list = list.filter(x=>x.postId!==POST_ID); setSaveStore(list);
        document.getElementById('saveBtn').firstElementChild.classList.replace('fa-solid','fa-regular');
      }
    };
    document.getElementById('commentSend').onclick = ()=>{
      const text = document.getElementById('commentInput').value.trim(); if(!text) return;
      const fromUser = CU.user_metadata?.username || 'user';
      const arr = comments(POST_ID); arr.push({ fromUser, text, timestamp:new Date().toISOString() });
      setComments(POST_ID, arr); renderComments(); document.getElementById('commentInput').value = '';
      if(CU.id !== p.user_id){ notif.push({ownerId:p.user_id, type:'comment', fromUser, postId:POST_ID, postImage: img, comment:text}); }
    };
    function renderComments(){
      const items = comments(POST_ID);
      const box = document.getElementById('commentsList');
      box.innerHTML = items.map(c=>`<div><b>@${c.fromUser}</b> ${c.text}</div>`).join('') || '<i>Keine Kommentare</i>';
    }
  }else{                  // ---- UPLOAD-MODUS ----
    show('uploadUI', true); show('viewerUI', false);
    const fileInput = document.getElementById('fileInput');
    const dropZone  = document.getElementById('dropZone');
    const preview   = document.getElementById('previewImg');
    const publish   = document.getElementById('publishBtn');
    const captionEl = document.getElementById('newCaption');
    const msg       = document.getElementById('uploadMsg');

    function setPreview(file){
      if(!file) return;
      const reader = new FileReader();
      reader.onload = e=>{ preview.src = e.target.result; preview.style.display='block'; publish.disabled=false; };
      reader.readAsDataURL(file);
    }
    dropZone.addEventListener('click', ()=>fileInput.click());
    fileInput.addEventListener('change', e=>setPreview(e.target.files[0]));
    ['dragover','dragenter'].forEach(ev=>dropZone.addEventListener(ev,e=>{e.preventDefault();dropZone.style.background='#f7f7f7';}));
    ['dragleave','drop'].forEach(ev=>dropZone.addEventListener(ev,e=>{e.preventDefault();dropZone.style.background='#fff'; if(ev==='drop'){ const f=e.dataTransfer.files?.[0]; if(f){ fileInput.files=e.dataTransfer.files; setPreview(f);} } }));

    publish.addEventListener('click', async ()=>{
      const file = fileInput.files?.[0];
      if(!file){ msg.textContent='Bitte wähle ein Bild aus.'; return; }
      msg.textContent='Lade hoch…';

      // 1) Upload in Storage
      const path = `${CU.id}/${Date.now()}_${file.name.replace(/\s+/g,'_')}`;
      const { error: upErr } = await sb.storage.from('images').upload(path, file, { upsert:false, contentType:file.type });
      if(upErr){ msg.textContent='Upload fehlgeschlagen.'; console.error(upErr); return; }

      // 2) Datensatz in posts
      const { data: inserted, error: insErr } = await sb.from('posts').insert({
        user_id: CU.id,
        image_path: path,
        caption: captionEl.value || null
      }).select('id').single();

      if(insErr){ msg.textContent='Post speichern fehlgeschlagen.'; console.error(insErr); return; }

      msg.textContent='Fertig! Öffne den Beitrag…';
      // 3) Weiterleiten zum Viewer
      location.href = `post.html?id=${encodeURIComponent(inserted.id)}`;
    });

    // Live Zeichenanzahl
    const charCount = document.getElementById('charCount');
    captionEl.addEventListener('input', ()=>{ charCount.textContent = `${captionEl.value.length}/2200`; });
  }
}

init();
