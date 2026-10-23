// This GIF has a 4.3-second opening; GIF images do not emit an ended event.
(() => {
 const image = document.querySelector('.wedding-cover img');
 const root = document.documentElement;
 const motion = matchMedia('(prefers-reduced-motion: reduce)');
 if (!image) return;
 const cue=document.createElement('button');
 cue.type='button';
 cue.className='cover-scroll-cue';
 cue.setAttribute('aria-label','아래로 스크롤');
 cue.innerHTML='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m5 9 7 7 7-7"/></svg>';
 image.parentElement.append(cue);
 cue.addEventListener('click',()=>document.querySelector('.invitation-panel')?.scrollIntoView({behavior:'smooth'}));
 let done = false;
 let started = false;
 let invitationTitleShown=false;
 const updateCue=()=>cue.classList.toggle('is-visible',done&&!invitationTitleShown&&window.scrollY<40);
 window.addEventListener('scroll',updateCue,{passive:true});
 const watchInvitationTitle=()=>{
  const invitation=document.querySelector('.invitation-panel');
  if(!invitation)return;
  const title=invitation.querySelectorAll('.invitation-line')[1];
  if(!title)return;
  const observer=new MutationObserver(()=>{
   if(title.classList.contains('is-revealed')){
    invitationTitleShown=true;updateCue();observer.disconnect();
   }
  });
  observer.observe(title,{attributes:true,attributeFilter:['class']});
  if(title.classList.contains('is-revealed')){invitationTitleShown=true;updateCue();observer.disconnect();}
 };
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',watchInvitationTitle,{once:true});
 else watchInvitationTitle();
 if(motion.matches){
  return;
 }
 const lockIntro=window.scrollY===0&&!location.hash;
 if(lockIntro)root.classList.add('intro-playing');
 let playbackTimer;
 let releaseTimer;
 const release = () => {
  done = true;
  clearTimeout(releaseTimer);
  clearTimeout(safetyTimer);
  root.classList.remove('intro-playing');
  updateCue();
 };
 // Never leave the page locked if the image fails or its load event is lost.
 const safetyTimer = setTimeout(release, 12000);
 const startConfetti = () => {
  if (motion.matches || document.querySelector('.cover-confetti')) return;
  const layer = document.createElement('div');
  layer.className = 'cover-confetti';
  layer.setAttribute('aria-hidden', 'true');
  document.body.append(layer);
  const updateBoundary = () => {
   const photoTop=document.querySelector('#studio')?.getBoundingClientRect().top ?? window.innerHeight;
   const visibleHeight=Math.max(0,Math.min(window.innerHeight,photoTop));
   layer.style.clipPath=`inset(0 0 ${window.innerHeight-visibleHeight}px 0)`;
   layer.style.visibility=visibleHeight>0?'visible':'hidden';
  };
  const resize = () => {
   layer.style.setProperty('--fall-height', `${window.innerHeight + 50}px`);
   updateBoundary();
  };
  resize();
  window.addEventListener('resize', resize);
  window.addEventListener('scroll',updateBoundary,{passive:true});
  for (let i = 0; i < 32; i++) {
   const paper = document.createElement('i');
   paper.style.setProperty('--x', `${(i * 37 + 7) % 98}%`);
   paper.style.setProperty('--delay', `${i * .18}s`);
   paper.style.setProperty('--duration', `${5 + i % 4}s`);
   paper.style.setProperty('--drift', `${(i % 5 - 2) * 12}px`);
   layer.append(paper);
  }
 };
 const start = () => {
  if (done || started) return;
  started = true;
  if (!image.naturalWidth) { release(); return; }
  playbackTimer = setTimeout(startConfetti, 3000);
  releaseTimer=setTimeout(release, 4300);
 };
 image.addEventListener('load', start, {once:true});
 image.addEventListener('error', release, {once:true});
 // A unique URL gives every page load a fresh GIF decoder, including mobile reloads.
 const coverUrl = new URL(image.dataset.src, document.baseURI);
 coverUrl.searchParams.set('play', Date.now().toString(36));
 image.src = coverUrl.href;
 if (image.complete && image.naturalWidth) start();
 motion.addEventListener('change', event => { if (event.matches) {clearTimeout(playbackTimer);release();}else startConfetti(); });
 window.addEventListener('pagehide',()=>{clearTimeout(playbackTimer);release();});
 window.addEventListener('pageshow',event=>{if(event.persisted)startConfetti();});
})();
