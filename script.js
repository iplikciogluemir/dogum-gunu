(() => {
  'use strict';
  const config = window.SITE_CONFIG || {};
  const $ = (selector) => document.querySelector(selector);
  const text = (selector, value) => { const el = $(selector); if (el && value != null) el.textContent = value; };
  const make = (tag, className, content) => { const el = document.createElement(tag); if(className) el.className=className; if(content != null)el.textContent=content;return el;};
  const photoPath = (file) => 'photos/' + file;
  const fallbackPath = (file, index) => 'photos/' + String(index + 1).padStart(2,'0') + '.svg';
  function withFallback(img, file, index){img.src=photoPath(file);img.onerror=()=>{img.onerror=null;img.src=fallbackPath(file,index);};}
  document.querySelectorAll('[data-fallback]').forEach(img => {img.onerror=()=>{img.onerror=null;img.src=img.dataset.fallback;};});
  text('#heroName',config.name);text('#finalText',config.finalMessage);text('#scratchText',config.scratchMessage);text('#letterGreeting',config.letterGreeting);text('#letterSignature',config.signature);
  const body = $('#letterBody');(config.letterParagraphs||[]).forEach(p => body.appendChild(make('p','',p)));
  const track = $('#galleryTrack');const photos=config.photos||[];
  photos.forEach((photo,index)=>{
    const card=make('div','gallery-card');card.tabIndex=0;card.setAttribute('role','button');card.setAttribute('aria-label',`Fotoğraf ${index+1}: ${photo.caption}`);
    const frame=make('div','gallery-polaroid');const img=make('img');img.alt=photo.caption;img.loading=index>1?'lazy':'eager';withFallback(img,photo.file,index);frame.appendChild(img);card.append(frame,make('div','gallery-tag',photo.tag),make('div','gallery-caption',photo.caption));
    card.addEventListener('click',()=>openLightbox(img.src,photo.caption));card.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();openLightbox(img.src,photo.caption);}});track.appendChild(card);
  });
  const viewport=$('#galleryViewport');const cards=()=>[...document.querySelectorAll('.gallery-card')];const pad=()=>parseFloat(getComputedStyle(viewport).paddingLeft)||0;
  const activeIndex=()=>{const left=viewport.scrollLeft;return cards().reduce((best,card,i)=>Math.abs(card.offsetLeft-cards()[0].offsetLeft-left)<Math.abs(cards()[best].offsetLeft-cards()[0].offsetLeft-left)?i:best,0);};
  const go=(idx)=>{const arr=cards();if(!arr.length)return;const j=(idx+arr.length)%arr.length;viewport.scrollTo({left:arr[j].offsetLeft-arr[0].offsetLeft,behavior:'smooth'});};
  $('#nextPhoto').addEventListener('click',()=>go(activeIndex()+1));$('#prevPhoto').addEventListener('click',()=>go(activeIndex()-1));
  text('#galleryTotal',String(photos.length).padStart(2,'0'));
  let scrollRaf=false;viewport.addEventListener('scroll',()=>{if(scrollRaf)return;scrollRaf=true;requestAnimationFrame(()=>{text('#galleryIndex',String(activeIndex()+1).padStart(2,'0'));scrollRaf=false;});},{passive:true});
  const lightbox=$('#lightbox');function openLightbox(src,caption){$('#lightboxImage').src=src;text('#lightboxCaption',caption);lightbox.classList.add('active');lightbox.setAttribute('aria-hidden','false');document.body.style.overflow='hidden';$('#closeLightbox').focus();}
  function closeLightbox(){lightbox.classList.remove('active');lightbox.setAttribute('aria-hidden','true');document.body.style.overflow='';}
  $('#closeLightbox').addEventListener('click',closeLightbox);lightbox.addEventListener('click',e=>{if(e.target===lightbox)closeLightbox();});document.addEventListener('keydown',e=>{if(e.key==='Escape')closeLightbox();});
  const reasonGrid=$('#reasonGrid');(config.reasons||[]).forEach(reason=>{const c=make('article','reason-card reveal');const h=make('div','reason-card-header');h.append(make('span','',reason.number),make('span','','✧'));const title=make('div');title.append(make('h3','',reason.title),make('p','',reason.text));c.append(h,make('div','reason-symbol',reason.symbol),title);reasonGrid.appendChild(c);});
  const timeline=$('#timelineList');(config.timeline||[]).forEach(item=>{const c=make('article','timeline-item reveal');c.append(make('span','timeline-emoji',item.emoji),make('div','timeline-when',item.when),make('h3','',item.title),make('p','',item.text));timeline.appendChild(c);});
  const observer=new IntersectionObserver(entries=>{entries.forEach(entry=>{if(entry.isIntersecting){entry.target.classList.add('visible');observer.unobserve(entry.target);}});},{threshold:.11,rootMargin:'0px 0px -25px 0px'});document.querySelectorAll('.reveal').forEach(el=>observer.observe(el));
  const canvas=$('#scratchCanvas'),board=$('#scratchBoard'),ctx=canvas.getContext('2d',{willReadFrequently:true});let scratching=false,unlocked=false,strokes=0;
  function paint(){if(unlocked)return;const rect=board.getBoundingClientRect();if(!rect.width||!rect.height)return;const scale=Math.min(devicePixelRatio||1,2);canvas.width=Math.round(rect.width*scale);canvas.height=Math.round(rect.height*scale);ctx.setTransform(scale,0,0,scale,0,0);ctx.globalCompositeOperation='source-over';const grad=ctx.createLinearGradient(0,0,rect.width,rect.height);grad.addColorStop(0,'#dbafa9');grad.addColorStop(.48,'#c38b91');grad.addColorStop(1,'#e1c1b5');ctx.fillStyle=grad;ctx.fillRect(0,0,rect.width,rect.height);ctx.fillStyle='#fff9f0';ctx.textAlign='center';ctx.font=`italic ${Math.min(36,rect.width/10)}px Georgia`;ctx.fillText('Burada bir sır saklı...',rect.width/2,rect.height/2-10);ctx.font='12px monospace';ctx.fillText('✳  KAZI VE KEŞFET  ✳',rect.width/2,rect.height/2+25);ctx.globalCompositeOperation='destination-out';}
  function at(e){const r=canvas.getBoundingClientRect();return{x:e.clientX-r.left,y:e.clientY-r.top};}
  function brush(e){if(!scratching||unlocked)return;const p=at(e);ctx.beginPath();ctx.arc(p.x,p.y,Math.max(23,canvas.clientWidth/18),0,Math.PI*2);ctx.fill();strokes++;if(strokes%12===0)checkScratch();}
  function checkScratch(){if(unlocked)return;const {data}=ctx.getImageData(0,0,canvas.width,canvas.height);let clear=0,total=0;for(let i=3;i<data.length;i+=4*24){total++;if(data[i]<70)clear++;}if(total>0&&clear/total>.42)unlock();}
  function unlock(){if(unlocked)return;unlocked=true;canvas.style.transition='opacity .65s';canvas.style.opacity='0';canvas.style.pointerEvents='none';text('#scratchStatus','SIR ORTAYA ÇIKTI! ♡');celebrate(70);}
  canvas.addEventListener('pointerdown',e=>{if(unlocked)return;scratching=true;canvas.setPointerCapture(e.pointerId);brush(e);});canvas.addEventListener('pointermove',brush);canvas.addEventListener('pointerup',()=>{scratching=false;checkScratch();});canvas.addEventListener('pointercancel',()=>{scratching=false;});$('#revealScratch').addEventListener('click',unlock);
  let resizeTimer;window.addEventListener('resize',()=>{clearTimeout(resizeTimer);resizeTimer=setTimeout(paint,250);});paint();
  const openLetter=$('#openLetter');openLetter.addEventListener('click',()=>{const opened=$('#letterPaper').classList.toggle('open');openLetter.classList.toggle('opened',opened);openLetter.setAttribute('aria-expanded',String(opened));$('#letterPaper').setAttribute('aria-hidden',String(!opened));text('#envelopeInstruction',opened?'MEKTUBU KAPAT ♡':'AÇMAK İÇİN DOKUN ✳');if(opened)setTimeout(()=>$('#letterPaper').scrollIntoView({behavior:'smooth',block:'nearest'}),300);});
  let confettiTimer;function celebrate(count=150){const layer=$('#confettiLayer');const colors=['#fff7e9','#d6a8a5','#ffc95f','#c34e64','#eabfc0'];for(let i=0;i<count;i++){const bit=make('span','confetti-piece');bit.style.setProperty('--left',(Math.random()*100)+'vw');bit.style.setProperty('--fall',(2.8+Math.random()*3.5)+'s');bit.style.setProperty('--drift',((Math.random()-.5)*220)+'px');bit.style.setProperty('--rot',(Math.random()*360)+'deg');bit.style.setProperty('--color',colors[Math.floor(Math.random()*colors.length)]);bit.style.animationDelay=Math.random()*.8+'s';bit.style.borderRadius=Math.random()>.6?'50%':'1px';layer.appendChild(bit);bit.addEventListener('animationend',()=>bit.remove(),{once:true});}clearTimeout(confettiTimer);confettiTimer=setTimeout(()=>{layer.querySelectorAll('.confetti-piece').forEach(el=>el.remove());},7600);}
  $('#celebrateBtn').addEventListener('click',()=>celebrate(180));
  window.addEventListener('load',()=>setTimeout(()=>$('#loading').classList.add('hidden'),450));setTimeout(()=>$('#loading').classList.add('hidden'),2400);
})();
