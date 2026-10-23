'use strict';
const byId = id => document.getElementById(id);
const dialogHistory=new Map();
let dialogHistorySequence=0;
function showWeddingDialog(dialog){
 if(dialog.open)return;
 dialog.showModal();
 const token=Date.now()+'-'+(++dialogHistorySequence);
 history.pushState({...history.state,weddingDialog:token},'');
 dialogHistory.set(dialog,token);
 dialog.addEventListener('close',()=>{
  dialogHistory.delete(dialog);
  // X / Escape should also remove the extra history step.
  if(history.state?.weddingDialog===token)history.back();
 },{once:true});
}
window.addEventListener('popstate',()=>{
 for(const [dialog,token] of dialogHistory){
  if(dialog.open&&history.state?.weddingDialog!==token)dialog.close();
 }
});
// Create the browsing context before navigating to a map universal link.
document.addEventListener('click',event=>{
 const link=event.target.closest('a[href]');
 if(!link||event.defaultPrevented)return;
 const url=new URL(link.href,location.href);
 if(!['map.kakao.com','map.naver.com'].includes(url.hostname))return;
 event.preventDefault();
 if(/KAKAOTALK/i.test(navigator.userAgent)){
  // Request Kakao's external-browser handler; never fall back to replacing this page.
  window.location.href='kakaotalk://web/openExternal?url='+encodeURIComponent(url.href);
  return;
 }
 const mapWindow=window.open('about:blank','_blank');
 if(!mapWindow){
  showCopyToast('새 창이 차단되었어요. 팝업을 허용한 뒤 다시 눌러주세요.');
  return;
 }
 try{
  mapWindow.opener=null;
  mapWindow.location.replace(url.href);
 }catch(_){
  mapWindow.close();
  showCopyToast('지도를 열지 못했어요. 브라우저에서 다시 시도해 주세요.');
 }
});
document.querySelectorAll('[data-open]').forEach(button => button.addEventListener('click', async () => {
  const dialog = byId(button.dataset.open);
  if(dialog.id === 'calendar-dialog'){
    dialog.tabIndex=-1;
    dialog.focus({preventScroll:true});
  }
  if(dialog.id === 'letter-dialog'){
    cancelLetterAnimation();
    dialog.classList.remove('is-reading');
    byId('letter-form').reset();
    document.querySelectorAll('.code-digit').forEach(input=>input.removeAttribute('aria-invalid'));
    ['guest-name','guest-code'].forEach(id=>{byId(id).removeAttribute('aria-invalid');byId(id+'-error').textContent='';byId(id+'-error').hidden=true;});
    byId('letter-form').hidden=false;
    byId('letter-result').hidden=true;
    byId('letter-status').textContent='';
    byId('letter-recipient').textContent='';
    byId('letter-body').textContent='';
    byId('letter-theme').textContent='';
  }
  if(dialog.id === 'calendar-dialog' && !matchMedia('(prefers-reduced-motion: reduce)').matches){
    if(button.disabled)return;
    button.disabled=true;
    const panel=byId('calendar');
    panel.classList.add('has-heart','is-bursting');
    await new Promise(resolve=>setTimeout(resolve,720));
    panel.classList.remove('is-bursting');
    button.disabled=false;
  }
  showWeddingDialog(dialog);
  if(dialog.id === 'letter-dialog'){
    dialog.tabIndex=-1;
    dialog.focus({preventScroll:true});
  }
  dialog.scrollTop=0;
  document.body.classList.add('gallery-open');
  dialog.addEventListener('close', () => {document.body.classList.remove('gallery-open');button.focus();}, {once:true});
}));
document.querySelectorAll('.feature-dialog').forEach(dialog => {
  dialog.querySelector('.dialog-close').addEventListener('click', () => dialog.close());
  dialog.addEventListener('click', event => {if(event.target !== dialog)return;const r=dialog.getBoundingClientRect();if(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom)dialog.close();});
});
const calendarQuery = new URLSearchParams({action:'TEMPLATE',text:'남일과 주희의 결혼식',dates:'20270130T060000Z/20270130T080000Z',ctz:'Asia/Seoul',location:'그랜드힐 컨벤션 3층 그랜드볼룸 홀, 서울 강남구 역삼로 607',details:'남일과 주희의 결혼식에 초대합니다.'});
const googleURL = 'https://calendar.google.com/calendar/render?' + calendarQuery;
byId('google-calendar').href = googleURL;
// Android browsers cannot reliably open the system calendar's INSERT activity.
// Keep a direct HTTPS event editor and avoid silently falling back to a file download.
if (/Android/i.test(navigator.userAgent)) {
  byId('device-calendar').hidden = true;
  document.querySelector('.calendar-actions').style.gridTemplateColumns = '1fr';
  document.querySelector('.calendar-note').textContent =
    '구글 캘린더에서 저장해 주세요. 같은 Google 계정을 삼성 캘린더에 동기화한 경우 그곳에도 표시됩니다.';
} else if (/iPhone|iPad|iPod/i.test(navigator.userAgent)) {
  byId('device-calendar').textContent = '아이폰 달력 파일';
  document.querySelector('.calendar-note').textContent =
    '구글 캘린더에서 저장하거나, 일정 파일을 열어 아이폰 달력에 추가해 주세요.';
} else {
  byId('device-calendar').textContent = '일정 파일 다운로드';
  document.querySelector('.calendar-note').textContent =
    '구글 캘린더에서 저장하거나, 일정 파일을 사용 중인 달력 앱으로 가져와 주세요.';
}
async function copyText(text) {
  if (navigator.clipboard && window.isSecureContext) {
    try {await navigator.clipboard.writeText(text);return true;} catch (_) {}
  }
  const field=document.createElement('textarea');field.value=text;field.style.cssText='position:fixed;left:0;top:0;opacity:0';document.body.append(field);field.select();field.setSelectionRange(0,field.value.length);
  let ok=false;try{ok=document.execCommand('copy');}catch(_){}field.remove();return ok;
}
function manualCopy(text, host) {
  let field=host.querySelector('input');if(!field){field=document.createElement('input');field.className='manual-copy';field.readOnly=true;field.setAttribute('aria-label','복사할 내용');host.append(field);}field.value=text;field.focus();field.select();
}
let copyToastTimer;
let copyToastClearTimer;
function showCopyToast(message,duration=1000) {
 const toast = byId('copy-toast');
 (document.querySelector('dialog[open]')||document.body).append(toast);
 clearTimeout(copyToastTimer);
 clearTimeout(copyToastClearTimer);
 toast.textContent = message;
 toast.classList.add('is-visible');
 copyToastTimer = setTimeout(() => {
   toast.classList.remove('is-visible');
   copyToastClearTimer = setTimeout(() => { toast.textContent = ''; }, 300);
 }, duration);
}
document.querySelectorAll('[data-copy]').forEach(button => {
 const label = document.createElement('span');
 label.className = 'copy-label';
 label.textContent = button.textContent;
 button.replaceChildren(label);
 const check = document.createElement('span');
 check.className = 'copy-check';
 check.textContent = '✓';
 check.setAttribute('aria-hidden', 'true');
 button.append(check);
 const originalLabel = button.getAttribute('aria-label');
 const resetDelay = button.closest('.account-card')?.querySelector('h2')?.textContent.trim() === '신랑측 계좌번호' ? 1000 : 2000;
 let resetTimer;
 button.addEventListener('click', async () => {
  const ok = await copyText(button.dataset.copy);
  if (ok) {
   clearTimeout(resetTimer);
   button.classList.add('is-copied');
   button.setAttribute('aria-label', '계좌번호 복사 완료');
   resetTimer = setTimeout(() => {
    button.classList.remove('is-copied');
    if (originalLabel) button.setAttribute('aria-label', originalLabel);
    else button.removeAttribute('aria-label');
   }, resetDelay);
  }
  showCopyToast(ok ? '축하 해주셔서 감사합니다 🎉' : '복사하지 못했어요. 계좌번호를 길게 눌러 복사해 주세요.');
 });
});
byId('share').addEventListener('click', async () => {
 const shareUrl = 'https://namju-wedding.vercel.app/';
 if (window.Kakao) {
   try {
     if (!Kakao.isInitialized()) Kakao.init('dc60b45fa86c8e52871166a16861b501');
     Kakao.Share.sendDefault({
       objectType: 'feed',
       content: {
         title: '김남일 ♥ 이주희 결혼합니다.',
         description: '2027년 1월 30일 토요일 오후 3시',
         imageUrl: shareUrl + 'assets/studio-2.png',
         imageWidth: 282,
         imageHeight: 411,
         link: { mobileWebUrl: shareUrl, webUrl: shareUrl }
       },
       buttons: [{
         title: '일정 등록',
         link: { mobileWebUrl: googleURL, webUrl: googleURL }
       }]
     });
     return;
   } catch (error) {
     console.error('카카오톡 공유를 열지 못했습니다.', error);
   }
 }
 if (navigator.share && window.isSecureContext) {
   try {
     await navigator.share({title:document.title,text:'남일과 주희의 결혼식에 초대합니다.',url:shareUrl});
     return;
   } catch (error) {
     if (error.name === 'AbortError') return;
   }
 }
 const copied = await copyText(shareUrl);
 showCopyToast(copied ? 'URL을 복사했어요' : 'URL을 복사하지 못했어요. 주소창에서 복사해 주세요.');
});
function validateLetterField(id){
 const value=byId(id).value.trim();
 const valid=id==='guest-name'?value.length>=2&&value.length<=4:/^[0-9]{4}$/.test(value);
 const error=byId(id+'-error');
 error.textContent=valid?'':id==='guest-name'?'이름은 2~4글자로 입력해 주세요.':'전화번호 끝 네 자리를 숫자로 입력해 주세요.';
 error.hidden=valid;
 byId(id).setAttribute('aria-invalid',String(!valid));
 if(id==='guest-code')document.querySelectorAll('.code-digit').forEach(input=>input.setAttribute('aria-invalid',String(!valid)));
 return valid;
}
['guest-name','guest-code'].forEach(id=>{
 byId(id).addEventListener('blur',()=>validateLetterField(id));
 byId(id).addEventListener('input',event=>{
  if(id==='guest-code')event.target.value=event.target.value.replace(/\D/g,'').slice(0,4);
  if(byId(id).hasAttribute('aria-invalid'))validateLetterField(id);
 });
});
// 개인 편지가 없는 분들에게 보여 줄 기본 편지 5개입니다.
const defaultLetters = [
  [
    "함께 쌓아 온 추억",
    "함께 보낸 시간들을 돌아보면, 특별한 날보다 평범한 날의 장면들이 먼저 떠오릅니다. 마주 앉아 나누었던 이야기와 사소한 일에도 함께 웃었던 순간들이 오래도록 따뜻하게 남아 있습니다.\n\n그 시간들을 함께해 주셔서 감사합니다. 덕분에 저희의 지난날이 조금 더 다정하고 풍성해졌습니다.\n\n이제 두 사람이 함께 새로운 추억을 쌓아 가려 합니다. 저희의 시작도 훗날 기분 좋게 꺼내 볼 수 있는 기억이 되었으면 좋겠습니다."
  ],
  [
    "함께 나누는 기쁨",
    "기쁜 일이 생겼을 때 소식을 전하고 싶은 분이 있다는 것은 참 감사한 일입니다. 저희의 결혼 소식을 이렇게 전할 수 있어 더욱 설레고 행복합니다.\n\n결혼식 날에는 편안한 마음으로 오셔서 맛있는 식사도 하시고, 반가운 얼굴들과 웃음을 나누셨으면 좋겠습니다. 여러분께도 즐거운 하루로 기억되기를 바랍니다.\n\n저희의 기쁨을 함께 나누어 주셔서 감사합니다. 앞으로도 서로의 좋은 소식에 함께 웃을 수 있으면 좋겠습니다."
  ],
  [
    "보내 주신 응원에 감사하며",
    "새로운 시작을 앞두니 그동안 보내 주신 응원과 따뜻한 마음이 떠오릅니다. 건네주신 말 한마디와 작은 배려가 저희에게는 큰 힘이 되었습니다.\n\n그 고마움을 기억하며, 이제는 서로의 가장 가까운 편이 되어 살아가려 합니다. 좋은 날에는 함께 기뻐하고 어려운 날에는 먼저 손을 내미는 부부가 되겠습니다.\n\n저희의 시작을 응원해 주셔서 진심으로 감사합니다. 저희도 여러분의 소중한 순간에 따뜻한 마음을 보탤 수 있기를 바랍니다."
  ],
  [
    "오랜만에 전하는 안부",
    "각자의 일상을 보내다 보면 마음만큼 자주 안부를 전하지 못할 때가 있습니다. 오랜만에 전하는 소식이지만, 이 편지에 반가운 마음을 함께 담아 보냅니다.\n\n어떻게 지내고 계신지, 요즘은 어떤 일로 웃으시는지 궁금합니다. 결혼 소식을 계기로 서로의 안부를 나눌 수 있다면 저희에게는 또 하나의 기쁨이 될 것 같습니다.\n\n어디에 계시든 건강하고 평안한 날들을 보내시기를 바랍니다. 가까이서든 멀리서든 보내 주시는 축하의 마음, 감사히 간직하겠습니다."
  ],
  [
    "앞으로도 이어 갈 인연",
    "저희가 부부로서 새로운 일상을 시작하게 되었습니다. 앞으로 어떤 날들이 기다리고 있을지 설레는 마음으로 한 걸음씩 함께 걸어가려 합니다.\n\n결혼 후에도 소중한 분들과 안부를 나누고, 때로는 함께 식사하며 오래도록 인연을 이어 가고 싶습니다. 특별한 약속이 없어도 편안히 만날 수 있는 날들이 많았으면 좋겠습니다.\n\n저희의 새로운 시작에 함께해 주셔서 감사합니다. 앞으로 쌓아 갈 시간 속에서도 서로에게 반가운 사람으로 남기를 바랍니다."
  ]
];
// 기본 편지 순서: 0000–2000, 2001–4000, 4001–6000, 6001–8000, 8001–9999
const defaultLetterRangeEnds = [2000,4000,6000,8000,9999];
function findLetter(code){
  const index=defaultLetterRangeEnds.findIndex(end=>Number(code)<=end);
  return defaultLetters[index];
}

byId('letter-form').addEventListener('submit',async event=>{
 if(letterOpening){event.preventDefault();return;}
 event.preventDefault();
 const name=byId('guest-name').value.trim();
 const code=byId('guest-code').value;
 const nameValid=validateLetterField('guest-name');
 const codeValid=validateLetterField('guest-code');
 if(!nameValid||!codeValid){(!nameValid?byId('guest-name'):document.querySelector('.code-digit')).focus();return;}
 cancelLetterAnimation();
 const openingVersion=letterOpeningVersion;
 letterOpening=true;
 const submitButton=byId('letter-form').querySelector('[type="submit"]');
 submitButton.disabled=true;
 submitButton.classList.add('is-loading');
 submitButton.setAttribute('aria-label','편지를 찾고 있어요');
 byId('letter-status').textContent='';
 let letter=findLetter(code);
 let author='남일 & 주희';
 const lookupController=new AbortController();
 const lookupTimeout=setTimeout(()=>lookupController.abort(),3000);
 try {
  const response=await fetch('/api/letter',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({name,code}),signal:lookupController.signal});
  if(response.status!==404){
   if(!response.ok)throw new Error('lookup failed');
   const data=await response.json();
   letter=['',data.body];
   author=data.author;
  }
 } catch (_) {
  if(openingVersion===letterOpeningVersion&&byId('letter-dialog').open){
   showCopyToast('편지를 불러오지 못했어요. 다시 시도해 주세요.',3000);
   letterOpening=false;
  }
  submitButton.disabled=false;
  submitButton.classList.remove('is-loading');
  submitButton.removeAttribute('aria-label');
  return;
 } finally {
  clearTimeout(lookupTimeout);
 }
 submitButton.disabled=false;
 submitButton.classList.remove('is-loading');
 submitButton.removeAttribute('aria-label');
 if(openingVersion!==letterOpeningVersion||!byId('letter-dialog').open)return;
 byId('letter-status').textContent='';
 byId('letter-theme').textContent=letter[0];
 byId('letter-body').textContent=letter[1];
 byId('letter-content').lastElementChild.textContent='마음을 담아,\n'+author;
 const dialog=byId('letter-dialog');
 const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
 const fadeOut=reduced?null:dialog.animate([{opacity:1},{opacity:0,transform:'translateY(-6px)'}],{duration:240,easing:'ease-in',fill:'forwards'});
 if(fadeOut)await fadeOut.finished.catch(()=>{});
 if(openingVersion!==letterOpeningVersion||!dialog.open){fadeOut?.cancel();return;}
 byId('letter-form').hidden=true;
 byId('letter-result').hidden=false;
 byId('letter-dialog').classList.add('is-reading');
 byId('letter-dialog').scrollTop=0;
 byId('letter-content').scrollTop=0;
 fadeOut?.cancel();
 const fadeIn=reduced?null:dialog.animate([{opacity:0,transform:'translateY(12px) scale(.98)'},{opacity:1,transform:'translateY(0) scale(1)'}],{duration:650,easing:'cubic-bezier(.22,1,.36,1)'});
 if(fadeIn)await fadeIn.finished.catch(()=>{});
 if(openingVersion!==letterOpeningVersion||!dialog.open)return;
 letterOpening=false;
 animateLetterRecipient('To. '+name);
});


// Restore the original site's public Naver Maps browser client ID.
let mapFinished=false;
function mapUnavailable(reason){if(mapFinished)return;console.warn("[wedding-map]", typeof reason === "string" ? reason : "script-load-error");}
window.navermap_authFailure=()=>mapUnavailable('authentication-failed');
let mapReadyAttempts=0;
let mapInitializing=false;
window.initWeddingMap=function(){
 if(!window.naver?.maps?.Service){if(++mapReadyAttempts<80){setTimeout(window.initWeddingMap,100);return;}mapUnavailable('sdk-not-ready');return;}
 if(mapInitializing)return;mapInitializing=true;
 try{window.naver.maps.Service.geocode({query:'서울 강남구 역삼로 607'},function(status,response){
 const address=response?.v2?.addresses?.[0];
 if(status!==naver.maps.Service.Status.OK||!address){mapUnavailable('geocode-failed status='+status+' response='+JSON.stringify(response));return;}
 const position=new naver.maps.LatLng(Number(address.y),Number(address.x));
 byId('naver-map').hidden=false;
 const map=new naver.maps.Map('naver-map',{center:position,zoom:15,scrollWheel:false,zoomControl:true,zoomControlOptions:{style:naver.maps.ZoomControlStyle.SMALL,position:naver.maps.Position.TOP_LEFT}});
 new naver.maps.Marker({position,map,title:'그랜드힐 컨벤션'});naver.maps.Event.once(map,'tilesloaded',()=>{mapFinished=true;byId('naver-map').closest('.map-stack').classList.add('map-ready');byId('naver-map').removeAttribute('aria-hidden');});
 });}catch(error){mapUnavailable('initialization-failed '+error.message);}
};
const mapScript=document.createElement('script');mapScript.src='https://oapi.map.naver.com/openapi/v3/maps.js?ncpKeyId=sr88bskr5z&submodules=geocoder&callback=initWeddingMap';mapScript.async=true;mapScript.onload=window.initWeddingMap;mapScript.onerror=mapUnavailable;document.head.append(mapScript);setTimeout(()=>{if(!mapFinished)mapUnavailable("timeout");},12000);

// Swipe, keyboard arrows and pagination share the same active card.
(()=>{
 const carousel=document.querySelector('.faq-carousel');
 const track=carousel.querySelector('.faq-cards');
 const originals=[...track.querySelectorAll('.faq-card')];
 for(let group=1;group<=2;group++)originals.forEach(card=>{
  const copy=card.cloneNode(true);
  const answer=copy.querySelector('.faq-card-answer');
  answer.id+='-loop-'+group;
  copy.querySelector('.faq-card-button').setAttribute('aria-controls',answer.id);
  track.append(copy);
 });
 const cards=[...track.querySelectorAll('.faq-card')];
 const count=originals.length;
 const dots=[...document.querySelectorAll('.faq-dot')];
 let active=0,frame=0,slideFrame=0,autoVisible=false,drag=null,touching=false,suppressClick=false,clickTimer;
 let lastFrame=performance.now(),flowPosition=0,hoveringCard=false,pauseUntil=0;
 const motion=matchMedia('(prefers-reduced-motion: reduce)');
 const cycleWidth=()=>cards[count].offsetLeft-cards[0].offsetLeft;
 function normalize(){
  const width=cycleWidth();
  if(!width)return;
  if(carousel.scrollLeft<width)carousel.scrollLeft+=width;
  else if(carousel.scrollLeft>=width*2)carousel.scrollLeft-=width;
 }
 function flow(now){
  const elapsed=Math.min((now-lastFrame)/1000,.05);
  lastFrame=now;
  if(autoVisible&&!document.hidden&&!motion.matches&&!drag&&!touching&&!hoveringCard&&now>=pauseUntil&&
     !carousel.classList.contains('is-animating')&&!cards.some(card=>card.classList.contains('is-open'))){
   // Keep fractional progress outside scrollLeft: some browsers round it to pixels.
   const width=cycleWidth();
   if(width){
    if(Math.abs(carousel.scrollLeft-flowPosition)>1)flowPosition=carousel.scrollLeft;
    flowPosition=width+((flowPosition-width+22*elapsed)%width+width)%width;
    carousel.scrollLeft=flowPosition;
   }
  }else flowPosition=carousel.scrollLeft;
  requestAnimationFrame(flow);
 }
 requestAnimationFrame(flow);
 function update(){
  const left=carousel.getBoundingClientRect().left+carousel.clientWidth*.082;
  active=cards.reduce((best,card,i)=>Math.abs(card.getBoundingClientRect().left-left)<Math.abs(cards[best].getBoundingClientRect().left-left)?i:best,0)%count;
  dots.forEach((dot,i)=>{dot.classList.toggle('is-active',i===active);dot.setAttribute('aria-current',String(i===active));});
 }
 function go(index,direction=0){
  const logical=(index+count)%count;
  if(logical===active)return;
  const width=cycleWidth();
  const card=cards[count+logical];
  const base=carousel.scrollLeft+card.getBoundingClientRect().left-carousel.getBoundingClientRect().left-carousel.clientWidth*.082;
  const candidates=[base-width,base,base+width].filter(value=>value>=0&&value<=carousel.scrollWidth-carousel.clientWidth);
  let choices=candidates.filter(value=>direction===0||(direction>0?value<carousel.scrollLeft-1:value>carousel.scrollLeft+1));
  if(!choices.length)choices=candidates;
  let target=choices.reduce((best,value)=>Math.abs(value-carousel.scrollLeft)<Math.abs(best-carousel.scrollLeft)?value:best);
  cancelAnimationFrame(slideFrame);
  if(motion.matches){carousel.scrollLeft=Math.max(0,target);normalize();update();return;}
  const start=carousel.scrollLeft, distance=target-start, started=performance.now();
  carousel.classList.add('is-animating');
  const slide=now=>{
   const progress=Math.min((now-started)/600,1);
   carousel.scrollLeft=start+distance*(1-Math.pow(1-progress,3));
   if(progress<1)slideFrame=requestAnimationFrame(slide);
   else{carousel.scrollLeft=target;carousel.classList.remove('is-animating');normalize();update();}
  };
  slideFrame=requestAnimationFrame(slide);
 }
 dots.forEach((dot,i)=>dot.addEventListener('click',()=>go(i)));
 if('IntersectionObserver' in window)new IntersectionObserver(entries=>{
  autoVisible=entries[0].isIntersecting;
 },{threshold:.1}).observe(carousel);
 carousel.addEventListener('touchstart',()=>{touching=true;},{passive:true});
 const endTouch=()=>{touching=false;pauseUntil=performance.now()+500;normalize();};
 carousel.addEventListener('touchend',endTouch,{passive:true});
 carousel.addEventListener('touchcancel',endTouch,{passive:true});
 carousel.addEventListener('scroll',()=>{if(!frame)frame=requestAnimationFrame(()=>{frame=0;if(!drag&&!touching&&!carousel.classList.contains('is-animating'))normalize();update();});},{passive:true});
 carousel.addEventListener('keydown',event=>{if(event.key==='ArrowRight'||event.key==='ArrowLeft'){event.preventDefault();go(active+(event.key==='ArrowRight'?1:-1),event.key==='ArrowRight'?-1:1);}});
 cards.forEach((card,index)=>{
  card.addEventListener('pointerenter',event=>{if(event.pointerType==='mouse')hoveringCard=true;});
  card.addEventListener('pointerleave',event=>{if(event.pointerType==='mouse')hoveringCard=false;});
  const button=card.querySelector('.faq-card-button');
  const answer=card.querySelector('.faq-card-answer');
  const hint=card.querySelector('.faq-card-hint');
  answer.setAttribute('role','button');
  answer.setAttribute('aria-label',answer.textContent+' (눌러서 닫기)');
  answer.tabIndex=0;
  answer.hidden=false;answer.inert=true;
  function setOpen(open){
   button.setAttribute('aria-expanded',String(open));
   card.classList.toggle('is-open',open);
   answer.inert=!open;button.inert=open;
   hint.setAttribute('aria-hidden',String(open));
   (open?answer:button).focus({preventScroll:true});
  }
  // The first tap on a peeking card only brings that card into view.
  card.addEventListener('click',event=>{
   pauseUntil=performance.now()+500;
   update();
   if(index%count!==active){event.preventDefault();event.stopPropagation();go(index%count,card.getBoundingClientRect().left<carousel.getBoundingClientRect().left+carousel.clientWidth*.082?1:-1);return;}
   if(event.target.closest('a'))return;
   if(event.target.closest('.faq-card-answer'))setOpen(false);
   else if(event.target.closest('.faq-card-button'))setOpen(true);
  });
  answer.addEventListener('keydown',event=>{
   if(event.target!==answer)return;
   if(event.key==='Enter'||event.key===' '){event.preventDefault();answer.click();}
  });
 });
 // Mouse dragging complements native touch swiping and trackpad scrolling.
 carousel.addEventListener('pointerdown',event=>{
  cancelAnimationFrame(slideFrame);carousel.classList.remove('is-animating');
  if(event.pointerType!=='mouse'||event.button!==0)return;
  update();suppressClick=false;clearTimeout(clickTimer);
  drag={id:event.pointerId,x:event.clientX,y:event.clientY,left:carousel.scrollLeft,index:active,moved:false};
 });
 carousel.addEventListener('pointermove',event=>{
  if(!drag||event.pointerId!==drag.id)return;
  const dx=event.clientX-drag.x,dy=event.clientY-drag.y;
  if(!drag.moved){
   if(Math.abs(dx)<6||Math.abs(dx)<Math.abs(dy))return;
   drag.moved=true;carousel.setPointerCapture(event.pointerId);carousel.classList.add('is-dragging');
  }
  event.preventDefault();carousel.scrollLeft=drag.left-dx;
 });
 function endDrag(event){
  if(!drag||event.pointerId!==drag.id)return;
  const previous=drag;drag=null;
  carousel.classList.remove('is-dragging');
  if(carousel.hasPointerCapture(event.pointerId))carousel.releasePointerCapture(event.pointerId);
  if(!previous.moved)return;
  suppressClick=true;clickTimer=setTimeout(()=>{suppressClick=false;},350);
  normalize();update();
 }
 carousel.addEventListener('pointerup',endDrag);
 carousel.addEventListener('pointercancel',endDrag);
 carousel.addEventListener('pointerleave',event=>{if(drag&&!drag.moved)drag=null;});
 carousel.addEventListener('click',event=>{if(suppressClick){event.preventDefault();event.stopImmediatePropagation();suppressClick=false;}},true);
 window.addEventListener('resize',()=>{normalize();update();});
 carousel.scrollLeft=cycleWidth();flowPosition=carousel.scrollLeft;update();
})();

let letterTypingTimer;
let letterOpening=false;
let letterOpeningVersion=0;
function cancelLetterAnimation(){
 letterOpeningVersion++;
 letterOpening=false;
 byId('letter-dialog').getAnimations().forEach(animation=>animation.cancel());
 clearTimeout(letterTypingTimer);
 byId('letter-recipient').classList.remove('is-typing');
 byId('letter-content').classList.remove('is-visible');
 byId('letter-content').inert=true;
}
function animateLetterRecipient(text){
 const recipient=byId('letter-recipient');
 const content=byId('letter-content');
 recipient.textContent='';
 recipient.setAttribute('aria-label',text);
 recipient.focus();
 const reveal=()=>{
  recipient.classList.remove('is-typing');
  content.inert=false;
  content.classList.add('is-visible');
 };
 if(matchMedia('(prefers-reduced-motion: reduce)').matches){recipient.textContent=text;reveal();return;}
 recipient.classList.add('is-typing');
 const characters=Array.from(text);
 let index=0;
 const typeNext=()=>{
  recipient.textContent+=characters[index++];
  if(index<characters.length)letterTypingTimer=setTimeout(typeNext,110);
  else letterTypingTimer=setTimeout(reveal,450);
 };
 letterTypingTimer=setTimeout(typeNext,160);
}
byId('letter-dialog').addEventListener('close',cancelLetterAnimation);

// Reveal each content block once, leaving the opening cover immediately visible.
(()=>{
 const motion=matchMedia('(prefers-reduced-motion: reduce)');
 if(motion.matches||!('IntersectionObserver' in window))return;
 const targets=[...document.querySelectorAll('main > .panel:not(.inset):not(.invitation-panel), .invitation-line, .studio-stack img, .studio-more, main > .inset > *, #faq-title, .faq-heart-mascot, .faq-intro, .faq-carousel, .faq-dots')];
 const cover=document.querySelector('main > section');
 const invitation=document.querySelector('.invitation-panel');
 let hasScrolled=false;
 window.addEventListener('scroll',()=>{
  if(document.documentElement.classList.contains('intro-playing')||window.scrollY<=0)return;
  hasScrolled=true;
  invitation.querySelectorAll('.is-pending').forEach(line=>{const rect=line.getBoundingClientRect();if(rect.top<innerHeight-35&&rect.bottom>0)reveal(line);});
 },{passive:true});
 const observer=new IntersectionObserver(entries=>{
  entries.forEach(entry=>{
   if(!entry.isIntersecting||(entry.target.closest('.invitation-panel')&&!hasScrolled))return;
   if(entry.target.matches('.studio-stack img')&&!entry.target.complete){
    entry.target.addEventListener('load',()=>reveal(entry.target),{once:true});
    entry.target.addEventListener('error',()=>reveal(entry.target),{once:true});
    observer.unobserve(entry.target);
    return;
   }
   entry.target.classList.remove('is-pending');
   entry.target.classList.add('is-revealed');
   observer.unobserve(entry.target);
  });
 },{threshold:0,rootMargin:'0px 0px -35px 0px'});
 const reveal=element=>{
  element.classList.remove('is-pending');
  element.classList.add('is-revealed');
  observer.unobserve(element);
 };
 targets.forEach(element=>{
  if(element===cover)return;
  element.classList.add('scroll-reveal');
  const rect=element.getBoundingClientRect();
  if(!element.closest('.invitation-panel')&&rect.top<innerHeight&&rect.bottom>0){element.classList.add('is-revealed');return;}
  element.classList.add('is-pending');
  observer.observe(element);
 });
 // Keyboard navigation must never land on an invisible control.
 document.addEventListener('focusin',event=>{
  const element=event.target.closest('.scroll-reveal');
  if(element)reveal(element);
 });
 motion.addEventListener('change',event=>{
  if(event.matches){targets.forEach(reveal);observer.disconnect();}
 });
})();

const codeDigits=[...document.querySelectorAll('.code-digit')];
function syncCodeDigits(){
 byId('guest-code').value=codeDigits.map(input=>input.value).join('');
 if(byId('guest-code').hasAttribute('aria-invalid'))validateLetterField('guest-code');
}
codeDigits.forEach((input,index)=>{
 input.addEventListener('focus',()=>input.select());
 input.addEventListener('input',()=>{
  input.value=input.value.replace(/[^0-9]/g,'').slice(-1);
  syncCodeDigits();
  if(input.value&&index<3)codeDigits[index+1].focus();
 });
 input.addEventListener('keydown',event=>{
  if(event.key==='Backspace'&&!input.value&&index>0){event.preventDefault();codeDigits[index-1].value='';codeDigits[index-1].focus();syncCodeDigits();}
  if(event.key==='ArrowLeft'&&index>0){event.preventDefault();codeDigits[index-1].focus();}
  if(event.key==='ArrowRight'&&index<3){event.preventDefault();codeDigits[index+1].focus();}
 });
 input.addEventListener('paste',event=>{
  event.preventDefault();
  const digits=event.clipboardData.getData('text').replace(/[^0-9]/g,'').slice(0,4);
  if(!digits)return;
  const start=digits.length===4?0:index;
  Array.from(digits).forEach((digit,offset)=>{if(codeDigits[start+offset])codeDigits[start+offset].value=digit;});
  syncCodeDigits();codeDigits[Math.min(start+digits.length,3)].focus();
 });
});
document.querySelector('.code-digits').addEventListener('focusout',event=>{
 if(!event.currentTarget.contains(event.relatedTarget))validateLetterField('guest-code');
});

// Draw the outline, then color the heart with back-and-forth strokes on entry.
(()=>{
 const panel=byId('calendar');
 const heart=panel.querySelector('.calendar-heart-trigger');
 if(!('IntersectionObserver' in window)||matchMedia('(prefers-reduced-motion: reduce)').matches){panel.classList.add('has-heart');return;}
 const observer=new IntersectionObserver(entries=>{
  if(!entries.some(entry=>entry.isIntersecting&&entry.intersectionRatio>=.6))return;
  observer.disconnect();
  setTimeout(()=>{
   panel.classList.add('has-heart');
  },300);
 },{threshold:.6});
 observer.observe(heart);
})();
