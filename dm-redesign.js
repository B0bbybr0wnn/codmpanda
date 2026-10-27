/* CODMPanda DM refresh: start chats by username, search a thread, and reply to messages.
   Uses the site's existing Firebase app and DM thread function; no duplicate messaging backend. */
import { getApps } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js';
import { getAuth } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js';
import { getFirestore, collection, getDocs, limit, query, where, doc, updateDoc, arrayUnion, arrayRemove, getDoc, onSnapshot } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js';

(() => {
  'use strict';
  if (window.__cpDMRefreshV1) return;
  window.__cpDMRefreshV1 = true;

  const css = `
    .cp-dm-unread{display:inline-flex;align-items:center;justify-content:center;min-width:20px;height:20px;padding:0 6px;border-radius:999px;background:#ff6b00;color:#fff;font-size:10px;font-weight:900;white-space:nowrap}
    .cp-dm-action{border:1px solid #303030;background:#141414;color:#f4f4f5;border-radius:11px;padding:9px 12px;font-size:12px;font-weight:800;cursor:pointer;display:inline-flex;align-items:center;justify-content:center;gap:7px}
    .cp-dm-action.primary{background:#ff6b00;border-color:#ff6b00;color:#fff}
    .cp-dm-action:disabled{opacity:.5;cursor:not-allowed}
    .cp-dm-search{width:100%;background:#101010!important;border:1px solid #2b2b2b!important;color:#fff!important;border-radius:12px!important;padding:12px 14px!important;outline:none}
    .cp-dm-search:focus{border-color:#ff6b00!important}
    .cp-dm-modal{position:fixed;inset:0;z-index:100010;background:rgba(0,0,0,.78);backdrop-filter:blur(8px);display:flex;align-items:center;justify-content:center;padding:18px}
    .cp-dm-modal-card{width:min(100%,480px);max-height:min(78dvh,680px);display:flex;flex-direction:column;background:#0b0b0b;border:1px solid #292929;border-radius:20px;overflow:hidden;box-shadow:0 24px 90px #000}
    .cp-dm-user-result{display:flex;align-items:center;gap:12px;padding:12px;border-bottom:1px solid #202020;cursor:pointer;text-align:left;width:100%;background:transparent;color:#fff;border-top:0;border-left:0;border-right:0}
    .cp-dm-user-result:hover{background:#171717}
    .cp-dm-user-avatar{width:42px;height:42px;flex:0 0 42px;border-radius:50%;display:flex;align-items:center;justify-content:center;background:#20140c;border:1px solid #553019;color:#ff8a3d;font-weight:900;overflow:hidden}
    .cp-dm-reply-preview{display:flex;align-items:center;gap:8px;background:#171717;border:1px solid #292929;border-left:3px solid #ff6b00;border-radius:10px;padding:8px 10px;margin:0 0 8px;color:#aaa;font-size:12px}
    .cp-dm-reply-preview span{overflow:hidden;text-overflow:ellipsis;white-space:nowrap;flex:1}
    .cp-dm-reply-cancel{border:0;background:transparent;color:#aaa;font-size:18px;cursor:pointer}
    .cp-dm-message-tools{display:flex;justify-content:flex-end;margin-top:4px}
    .cp-dm-reply-btn{border:0;background:transparent;color:#ff8a3d;font-size:11px;font-weight:800;padding:3px 6px;cursor:pointer;opacity:.8}
    @media(min-width:700px){.cp-dm-modal{padding:28px}.cp-dm-modal-card{max-height:75vh}}
  `;
  function addStyles(){if(document.getElementById('cp-dm-refresh-css'))return;const s=document.createElement('style');s.id='cp-dm-refresh-css';s.textContent=css;document.head.appendChild(s)}
  function esc(v){return String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
  function appDb(){const app=getApps()[0];return app?{auth:getAuth(app),db:getFirestore(app)}:null}
  function profileName(d,id){return String(d.ign||d.username||d.codmUsername||d.gameName||d.displayName||d.name||d.userName||d.handle||'').trim()||('Player '+id.slice(0,6))}
  function profileAvatar(d){return d.photoURL||d.photoUrl||d.avatarURL||d.avatarUrl||d.profilePicture||d.photo||''}

  function closeModal(){document.getElementById('cp-dm-new-chat')?.remove()}
  function openNewChat(){
    closeModal();
    const modal=document.createElement('div');modal.className='cp-dm-modal';modal.id='cp-dm-new-chat';
    modal.innerHTML='<section class="cp-dm-modal-card" role="dialog" aria-modal="true" aria-labelledby="cp-dm-new-title"><header style="display:flex;align-items:center;gap:12px;padding:18px;border-bottom:1px solid #242424"><div style="width:42px;height:42px;border-radius:13px;background:#251408;display:grid;place-items:center;color:#ff7a2e;font-size:21px">✉</div><div style="flex:1"><div id="cp-dm-new-title" style="font-weight:900;font-size:17px;color:#fff">New message</div><div style="font-size:12px;color:#888;margin-top:3px">Find any CODMPanda player by username</div></div><button type="button" class="cp-dm-action" data-close aria-label="Close">✕</button></header><div style="padding:14px 16px 8px"><input class="cp-dm-search" id="cp-dm-user-query" placeholder="Type a username or IGN…" autocomplete="off" maxlength="50" /></div><div id="cp-dm-user-results" style="overflow:auto;min-height:130px;padding:4px 10px 12px"><div style="padding:20px 10px;color:#777;font-size:13px;text-align:center">Type at least 2 characters to find players.</div></div><footer style="padding:12px 16px;border-top:1px solid #242424;color:#666;font-size:11px">Messages are available to signed-in players.</footer></section>';
    document.body.appendChild(modal);
    modal.addEventListener('click',e=>{if(e.target===modal||e.target.closest('[data-close]'))closeModal()});
    const input=modal.querySelector('#cp-dm-user-query');
    let timer;
    input.addEventListener('input',()=>{clearTimeout(timer);timer=setTimeout(()=>searchUsers(input.value.trim()),220)});
    input.focus();
    async function searchUsers(term){
      const results=modal.querySelector('#cp-dm-user-results');
      if(term.length<2){results.innerHTML='<div style="padding:20px 10px;color:#777;font-size:13px;text-align:center">Type at least 2 characters to find players.</div>';return}
      const fb=appDb();
      if(!fb?.auth.currentUser){results.innerHTML='<div style="padding:20px 10px;color:#ff9b64;text-align:center;font-size:13px">Sign in to start a conversation.</div>';return}
      results.innerHTML='<div style="padding:20px 10px;color:#888;text-align:center;font-size:13px">Searching players…</div>';
      try{
        // The users collection is readable to authenticated players under the current Firestore rules.
        const snap=await getDocs(query(collection(fb.db,'users'),limit(500)));
        const needle=term.toLocaleLowerCase();
        const matches=snap.docs.map(doc=>({id:doc.id,data:doc.data()}))
          .filter(u=>u.id!==fb.auth.currentUser.uid)
          .map(u=>({...u,name:profileName(u.data,u.id)}))
          .filter(u=>[u.name,u.data.username,u.data.ign,u.data.codmUsername,u.data.gameName,u.data.displayName,u.data.name,u.id].some(v=>String(v||'').toLocaleLowerCase().includes(needle)))
          .sort((a,b)=>a.name.localeCompare(b.name)).slice(0,30);
        if(!matches.length){results.innerHTML='<div style="padding:22px 10px;color:#777;text-align:center;font-size:13px">No players found. Check the spelling and try again.</div>';return}
        results.innerHTML=matches.map(u=>{const avatar=profileAvatar(u.data);return '<button type="button" class="cp-dm-user-result" data-uid="'+esc(u.id)+'" data-ign="'+esc(u.name)+'"><span class="cp-dm-user-avatar">'+(avatar?'<img src="'+esc(avatar)+'" alt="" style="width:100%;height:100%;object-fit:cover">':esc(u.name.slice(0,1).toUpperCase()))+'</span><span style="flex:1;min-width:0"><span style="display:block;font-size:14px;font-weight:850;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">'+esc(u.name)+'</span><span style="display:block;font-size:11px;color:#777;margin-top:4px">CODMPanda player</span></span><span style="color:#ff7a2e;font-size:12px;font-weight:900">MESSAGE ›</span></button>'}).join('');
      }catch(err){console.error('[CODMPanda DM] User search failed',err);results.innerHTML='<div style="padding:20px 10px;color:#ff9b64;text-align:center;font-size:13px">Could not search players right now. Please try again.</div>'}
    }
    modal.querySelector('#cp-dm-user-results').addEventListener('click',e=>{
      const row=e.target.closest('[data-uid]');if(!row)return;
      const uid=row.dataset.uid,ign=row.dataset.ign||'Player';
      closeModal();
      if(typeof window.closeInboxOverlay==='function')window.closeInboxOverlay();
      setTimeout(()=>{if(typeof window.openDMThread==='function')window.openDMThread(uid,ign);else console.warn('[CODMPanda DM] Existing DM opener is unavailable')},180);
    });
  }


  let cpUnreadUnsub=null;
  function installUnreadBadge(top){
    const fb=appDb();
    if(!fb?.auth.currentUser)return;
    if(!top.querySelector('#cp-dm-unread-badge')){
      const badge=document.createElement('span');
      badge.id='cp-dm-unread-badge';
      badge.className='cp-dm-unread';
      badge.textContent='0 unread';
      badge.title='Unread messages';
      top.appendChild(badge);
    }
    if(window.__cpUnreadUnsub){try{window.__cpUnreadUnsub()}catch(_){}}
    window.__cpUnreadUnsub=onSnapshot(
      query(collection(fb.db,'messages'),where('toUid','==',fb.auth.currentUser.uid),limit(100)),
      snap=>{
        const count=snap.docs.reduce((n,d)=>n+(d.data().readAt?0:1),0);
        const badge=document.getElementById('cp-dm-unread-badge');
        if(badge){badge.textContent=count?count+' unread':'All caught up';badge.style.background=count?'#ff6b00':'#242424';badge.style.color=count?'#fff':'#aaa'}
      },
      err=>console.warn('[CODMPanda DM] Unread counter unavailable',err)
    );
  }

  function enhanceInbox(){
    const body=document.getElementById('inbox-full-body');
    if(!body)return;

    // DM-only controls belong on the Messages tab, not the Notifications tab.
    const messagesTab=document.querySelector('.inbox-tab-btn[data-tab="messages"]');
    const messagesActive=!!messagesTab&&/#ff6b00/i.test(messagesTab.getAttribute('style')||'');
    if(!messagesActive){
      body.querySelector('#cp-dm-inbox-toolbar')?.remove();
      return;
    }
    // The legacy inbox renderer replaces body.innerHTML during loading and after
    // results arrive. Re-create the toolbar whenever that happens.
    if(body.querySelector('#cp-dm-inbox-toolbar'))return;

    // Keep only the compact New Chat text link above the conversation list.
    body.querySelector('#cp-dm-unread-badge')?.remove();
    body.querySelector('#cp-dm-inbox-search')?.remove();
    const top=document.createElement('div');
    top.id='cp-dm-inbox-toolbar';
    top.style.cssText='display:flex;justify-content:flex-end;align-items:center;padding:8px 12px 10px;background:#050505';
    top.innerHTML='<button type="button" id="cp-dm-new-chat-btn" style="border:0;background:transparent;color:#ff8a3d;font-size:12px;font-weight:800;padding:6px 0;cursor:pointer">＋ New Chat</button>';
    body.prepend(top);
    top.querySelector('#cp-dm-new-chat-btn').addEventListener('click',openNewChat);
  }

  async function toggleBlockCurrentUser(button){
    const target=window.__cpCurrentDMTarget;
    const fb=appDb();
    if(!target?.uid||!fb?.auth.currentUser){alert('Sign in to manage blocked players.');return}
    if(target.uid===fb.auth.currentUser.uid)return;
    button.disabled=true;
    try{
      const selfRef=doc(fb.db,'users',fb.auth.currentUser.uid);
      const selfSnap=await getDoc(selfRef);
      const blocked=Array.isArray(selfSnap.data()?.blockedUsers)?selfSnap.data().blockedUsers:[];
      const isBlocked=blocked.includes(target.uid);
      const verb=isBlocked?'unblock':'block';
      if(!confirm((isBlocked?'Unblock ':'Block ')+target.ign+'?'+(isBlocked?'':' They will not be able to message you.')))return;
      await updateDoc(selfRef,{blockedUsers:isBlocked?arrayRemove(target.uid):arrayUnion(target.uid)});
      window.__cpBlockedUsers=window.__cpBlockedUsers||new Set();
      if(isBlocked)window.__cpBlockedUsers.delete(target.uid);else window.__cpBlockedUsers.add(target.uid);
      button.textContent=isBlocked?'Block':'Unblock';
      const input=document.getElementById('dm-input');
      if(input)input.disabled=!isBlocked;
      if(!isBlocked&&input)input.placeholder='You blocked this player';
      else if(input)input.placeholder=input.dataset.cpOriginalPlaceholder||'Message…';
      alert(isBlocked?'Player unblocked.':'Player blocked.');
    }catch(err){console.error('[CODMPanda DM] Block update failed',err);alert('Could not update block settings. Please try again.')}
    finally{button.disabled=false}
  }

  async function syncBlockState(button,input){
    const target=window.__cpCurrentDMTarget,fb=appDb();
    if(!target?.uid||!fb?.auth.currentUser||target.uid===fb.auth.currentUser.uid)return;
    try{
      const snap=await getDoc(doc(fb.db,'users',fb.auth.currentUser.uid));
      const blocked=Array.isArray(snap.data()?.blockedUsers)?snap.data().blockedUsers:[];
      const isBlocked=blocked.includes(target.uid);
      button.textContent=isBlocked?'Unblock':'Block';
      if(input){input.disabled=isBlocked;input.placeholder=isBlocked?'You blocked this player':(input.dataset.cpOriginalPlaceholder||'Message…')}
    }catch(_){}
  }


  let cpTypingTimer=null;
  function installTypingPresence(input,header){
    const fb=appDb(),target=window.__cpCurrentDMTarget;
    if(!fb?.auth.currentUser||!target?.uid||!input)return;
    const selfUid=fb.auth.currentUser.uid;
    const statusWrap=header.querySelector('#cp-dm-title-column')||header.children[1]||header;
    if(statusWrap&&!statusWrap.querySelector('#cp-dm-presence')){
      const status=document.createElement('div');
      status.id='cp-dm-presence';
      status.style.cssText='font-size:10px;color:#ff9a56;margin-top:4px;min-height:12px';
      status.textContent=' ';
      statusWrap.appendChild(status);
    }
    const status=header.querySelector('#cp-dm-presence');
    if(input.dataset.cpTypingTarget===target.uid)return;
    input.dataset.cpTypingTarget=target.uid;
    if(window.__cpTypingUnsub){try{window.__cpTypingUnsub()}catch(_){}window.__cpTypingUnsub=null}
    if(status){
      window.__cpTypingUnsub=onSnapshot(doc(fb.db,'users',target.uid),snap=>{
        const d=snap.data()||{};
        const fresh=Number(d.typingAt||0)>Date.now()-4500;
        status.textContent=d.typingTo===selfUid&&fresh?'Typing…':' ';
      },()=>{if(status)status.textContent=' '});
    }
    if(input.dataset.cpTypingBound==='1')return;
    input.dataset.cpTypingBound='1';
    const updateTyping=async active=>{
      try{await updateDoc(doc(fb.db,'users',selfUid),{typingTo:active?target.uid:'',typingAt:active?Date.now():0})}catch(_){}
    };
    input.addEventListener('input',()=>{
      clearTimeout(cpTypingTimer);
      if(!String(input.value||'').trim()){updateTyping(false);return}
      cpTypingTimer=setTimeout(()=>updateTyping(true),500);
    });
    input.addEventListener('blur',()=>{clearTimeout(cpTypingTimer);updateTyping(false)});
    const form=input.closest('form');
    if(form)form.addEventListener('submit',()=>{clearTimeout(cpTypingTimer);updateTyping(false)},true);
  }

  function enhanceThread(){
    const sheet=document.getElementById('sheet-container');
    if(!sheet)return;
    const messages=sheet.querySelector('#dm-messages');
    const input=sheet.querySelector('#dm-input');
    // The composer and message list uniquely identify the actual DM thread.
    if(!messages||!input)return;
    const header=sheet.querySelector('.sheet')?.firstElementChild;
    if(!header)return;

    // Keep the DM title, presence, and actions aligned in one compact header row.
    let titleRow=header.querySelector('#cp-dm-header-row');
    if(!titleRow){
      const title=header.querySelector('h3');
      if(title){
        titleRow=document.createElement('div');
        titleRow.id='cp-dm-header-row';
        titleRow.style.cssText='display:flex;align-items:center;justify-content:space-between;gap:10px;width:100%;min-width:0';
        const titleColumn=document.createElement('div');
        titleColumn.id='cp-dm-title-column';
        titleColumn.style.cssText='flex:1;min-width:0';
        titleColumn.appendChild(title);
        titleRow.appendChild(titleColumn);
        header.appendChild(titleRow);
      }
    }
    installTypingPresence(input,header);
    const fb=appDb(),target=window.__cpCurrentDMTarget;
    if(fb?.auth.currentUser&&target?.uid){
      const receiptChatId=[fb.auth.currentUser.uid,target.uid].sort().join('_');
      if(sheet.dataset.cpReceiptChat!==receiptChatId){
        sheet.dataset.cpReceiptChat=receiptChatId;
        if(window.__cpDMReceiptUnsub){try{window.__cpDMReceiptUnsub()}catch(_){}}
        window.__cpDMReceiptUnsub=onSnapshot(
          query(collection(fb.db,'messages'),where('chatId','==',receiptChatId),where('fromUid','==',fb.auth.currentUser.uid),limit(100)),
          snap=>snap.forEach(d=>{
            const row=Array.from(messages.querySelectorAll('[data-dm-message-id]')).find(el=>el.dataset.dmMessageId===d.id);
            const status=row?.querySelector('[data-dm-status]');
            if(status)status.textContent=d.data().readAt?' · Read':' · Sent';
          }),
          err=>console.warn('[CODMPanda DM] Read receipt listener unavailable',err)
        );
      }
    }
    if(!header.querySelector('#cp-dm-thread-search-toggle')){
      const actions=document.createElement('div');actions.style.cssText='display:flex;gap:6px;align-items:center;flex:0 0 auto';
      actions.innerHTML='<button type="button" id="cp-dm-thread-search-toggle" class="cp-dm-action" aria-label="Search messages" title="Search messages">⌕</button><button type="button" id="cp-dm-block-user" class="cp-dm-action" title="Block or unblock this player">Block</button>';
      (header.querySelector('#cp-dm-header-row')||header).appendChild(actions);
      actions.querySelector('#cp-dm-block-user').addEventListener('click',e=>toggleBlockCurrentUser(e.currentTarget));
      syncBlockState(actions.querySelector('#cp-dm-block-user'),input);
      actions.querySelector('#cp-dm-thread-search-toggle').addEventListener('click',()=>{
        let search=sheet.querySelector('#cp-dm-thread-search');
        if(search){search.remove();messages.querySelectorAll('[data-cp-search-hidden]').forEach(n=>{n.style.display='';delete n.dataset.cpSearchHidden});return}
        search=document.createElement('div');search.style.cssText='padding:10px 16px;background:#080808;border-bottom:1px solid #222';
        search.innerHTML='<input id="cp-dm-thread-search" class="cp-dm-search" placeholder="Search messages in this chat…" aria-label="Search messages"/>';
        messages.parentElement.insertBefore(search,messages);
        const field=search.querySelector('input');field.focus();
        field.addEventListener('input',()=>{const q=field.value.trim().toLocaleLowerCase();Array.from(messages.children).forEach(node=>{const match=!q||node.innerText.toLocaleLowerCase().includes(q);node.style.display=match?'':'none';if(!match)node.dataset.cpSearchHidden='1';else delete node.dataset.cpSearchHidden})});
      });
    }
    if(!input.dataset.cpReplyReady){
      input.dataset.cpReplyReady='1';
      input.dataset.cpOriginalPlaceholder=input.placeholder||'Message…';
    }
    Array.from(messages.children).forEach(node=>{
      if(node.dataset.cpReplyTool==='1'||!node.innerText.trim())return;
      if(node.querySelector('button,input,textarea,a'))return;
      const text=(node.querySelector('.rounded-2xl > .text-xs')?.innerText||node.innerText).trim();if(!text||text.length>5000)return;
      node.dataset.cpReplyTool='1';
      const tools=document.createElement('div');tools.className='cp-dm-message-tools';
      const reply=document.createElement('button');reply.type='button';reply.className='cp-dm-reply-btn';reply.textContent='↩ Reply';reply.setAttribute('aria-label','Reply to message');
      reply.addEventListener('click',()=>{
        const clean=text.replace(/^↩ Reply\s*/,'').slice(0,180);
        let preview=sheet.querySelector('#cp-dm-reply-preview');
        if(!preview){preview=document.createElement('div');preview.id='cp-dm-reply-preview';preview.className='cp-dm-reply-preview';input.parentElement?.insertBefore(preview,input); }
        preview.innerHTML='<span><strong style="color:#ff8a3d">Replying</strong> · '+esc(clean)+'</span><button type="button" class="cp-dm-reply-cancel" aria-label="Cancel reply">×</button>';
        preview.querySelector('button').onclick=()=>preview.remove();
        input.dataset.cpReplyText=clean;
        input.placeholder='Write your reply…';
        input.focus();
      });
      tools.appendChild(reply);node.appendChild(tools);
    });
    // Inject the quoted message before the existing app's send handler runs.
    if(!input.dataset.cpReplySendBound){
      input.dataset.cpReplySendBound='1';
      const applyReply=()=>{
        const quote=input.dataset.cpReplyText;
        if(!quote||!String(input.value||'').trim())return;
        input.value=('↪ '+quote+'\n'+input.value).slice(0,500);
        delete input.dataset.cpReplyText;
        input.placeholder=input.dataset.cpOriginalPlaceholder||'Message…';
        sheet.querySelector('#cp-dm-reply-preview')?.remove();
      };
      sheet.querySelector('#dm-send')?.addEventListener('click',applyReply,true);
      input.addEventListener('keypress',e=>{if(e.key==='Enter')applyReply()},true);
    }
    // Keep reply UI in sync when the original app re-renders messages.
    const form=input.closest('form')||input.parentElement?.parentElement;
    if(form&&!form.dataset.cpReplySubmitBound){
      form.dataset.cpReplySubmitBound='1';
      form.addEventListener('submit',()=>{
        const quote=input.dataset.cpReplyText;
        if(!quote)return;
        const value=String(input.value||'');
        if(value.trim())input.value='↪ '+quote+'\n'+value;
        delete input.dataset.cpReplyText;
        input.placeholder=input.dataset.cpOriginalPlaceholder||'Message…';
        sheet.querySelector('#cp-dm-reply-preview')?.remove();
      },true);
    }
  }


  if(typeof window.openDMThread==='function'&&!window.__cpDMRefreshWrapped){
    const originalOpen=window.openDMThread;
    window.openDMThread=function(uid,ign){window.__cpCurrentDMTarget={uid:String(uid||''),ign:String(ign||'Player')};return originalOpen.apply(this,arguments)};
    window.__cpDMRefreshWrapped=true;
  }

  function install(){
    addStyles();
    const observer=new MutationObserver(()=>{
      enhanceInbox();
      enhanceThread();
      if(!document.getElementById('inbox-full-body')&&window.__cpUnreadUnsub){
        try{window.__cpUnreadUnsub()}catch(_){}
        window.__cpUnreadUnsub=null;
      }
      const activeDM=document.getElementById('sheet-container')?.querySelector('#dm-messages');
      if(!activeDM){
        if(window.__cpTypingUnsub){try{window.__cpTypingUnsub()}catch(_){}window.__cpTypingUnsub=null}
        if(window.__cpDMReceiptUnsub){try{window.__cpDMReceiptUnsub()}catch(_){}window.__cpDMReceiptUnsub=null}
        if(cpTypingTimer){clearTimeout(cpTypingTimer);cpTypingTimer=null}
      }
    });
    observer.observe(document.body,{childList:true,subtree:true});
    enhanceInbox();enhanceThread();
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install,{once:true});else install();
})();
