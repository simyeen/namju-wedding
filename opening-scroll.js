// This GIF has a 4.3-second opening; GIF images do not emit an ended event.
(() => {
 const image = document.querySelector('.wedding-cover img');
 const root = document.documentElement;
 const motion = matchMedia('(prefers-reduced-motion: reduce)');
 if (!image || motion.matches) return;
 const lockIntro=window.scrollY===0&&!location.hash;
 if(lockIntro)root.classList.add('intro-playing');
 let playbackTimer;
 let releaseTimer;
 let done = false;
 const release = () => {
  done = true;
  clearTimeout(releaseTimer);
  clearTimeout(safetyTimer);
  root.classList.remove('intro-playing');
 };
 // Never leave the page locked if the image fails or its load event is lost.
 const safetyTimer = setTimeout(release, 12000);
 const startConfetti = () => {
  if (motion.matches || document.querySelector('.cover-confetti')) return;
  const layer = document.createElement('div');
  layer.className = 'cover-confetti';
  layer.setAttribute('aria-hidden', 'true');
  document.body.append(layer);
  const resize = () => layer.style.setProperty('--fall-height', `${window.innerHeight + 50}px`);
  resize();
  window.addEventListener('resize', resize);
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
  if (done) return;
  if (!image.naturalWidth) { release(); return; }
  playbackTimer = setTimeout(startConfetti, 3000);
  releaseTimer=setTimeout(release, 4300);
 };
 image.addEventListener('load', start, {once:true});
 image.addEventListener('error', release, {once:true});
 if (image.complete) start();
 motion.addEventListener('change', event => { if (event.matches) {clearTimeout(playbackTimer);release();}else startConfetti(); });
 window.addEventListener('pagehide',()=>{clearTimeout(playbackTimer);release();});
 window.addEventListener('pageshow',event=>{if(event.persisted)startConfetti();});
})();
