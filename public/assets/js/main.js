
const artists = [
  ['01','Harenowa','DTP','assets/images/harenowa-square.jpg','harenowa.html','image','thumb-blue'],
  ['02','Mike Studio','イラスト','','#','placeholder','thumb-beige'],
  ['03','Kento Works','動画','','#','placeholder','thumb-green'],
  ['04','Aoi Creative','WEB','','#','placeholder','thumb-lilac'],
  ['05','Nami Visual','Other（3D）','','#','placeholder','thumb-gray'],
  ['06','Rin Lab','イラスト','','#','placeholder','thumb-peach'],
  ['07','Yui Motion','動画','','#','placeholder','thumb-gray'],
  ['08','Haru Web','WEB','','#','placeholder','thumb-green'],
  ['09','Koto Works','動画','','#','placeholder','thumb-beige'],
  ['10','Leaf Design','DTP','','#','placeholder','thumb-blue'],
  ['11','Tomo Art','イラスト','','#','placeholder','thumb-beige'],
  ['12','Bright Web','WEB','','#','placeholder','thumb-green'],
  ['13','Ame Studio','Other（音源）','','#','placeholder','thumb-lilac'],
  ['14','Wave Motion','動画','','#','placeholder','thumb-blue'],
  ['15','Noe illustration','イラスト','','#','placeholder','thumb-peach'],
  ['16','Link Web','WEB','','#','placeholder','thumb-gray'],
  ['17','Mori Film','動画','','#','placeholder','thumb-green'],
  ['18','North DTP','DTP','','#','placeholder','thumb-beige'],
  ['19','Hana Illust','イラスト','','#','placeholder','thumb-blue'],
  ['20','Blue Web','WEB','','#','placeholder','thumb-beige'],
  ['21','Cube Lab','Other（ゲーム）','','#','placeholder','thumb-green'],
  ['22','Mono Works','DTP','','#','placeholder','thumb-lilac'],
  ['23','Mugi Motion','動画','','#','placeholder','thumb-blue'],
  ['24','Sui Design','WEB','','#','placeholder','thumb-peach'],
  ['25','Mellow Art','イラスト','','#','placeholder','thumb-gray'],
  ['26','Orbit Sound','Other（音源）','','#','placeholder','thumb-green'],
  ['27','Game Craft','Other（ゲーム）','','#','placeholder','thumb-beige'],
  ['28','Three Studio','Other（3D）','','#','placeholder','thumb-blue']
];
const grid = document.getElementById('artistGrid');
function placeholderMarkup(color){
  return `<div class="artist-thumb ${color}">
      <div class="artist-placeholder">
        <div class="placeholder-lines"><i></i><i></i><i></i></div>
        <div class="placeholder-wave"></div>
      </div>
    </div>`;
}
function imageMarkup(src, alt){
  return `<div class="artist-thumb"><img src="${src}" alt="${alt}"></div>`;
}
function renderArtists(filter='all'){
  if(!grid) return;
  grid.innerHTML = artists.filter(a => filter==='all' || a[2].includes(filter)).map(a => `
    <a class="artist-card" href="${a[4]}" data-cat="${a[2]}">
      ${a[5] === 'image' ? imageMarkup(a[3], a[1]) : placeholderMarkup(a[6])}
      <div class="artist-meta"><small>${a[0]}</small><h2>${a[1]}</h2><p>${a[2]}</p></div>
    </a>`).join('');
}
renderArtists();
document.querySelectorAll('.filter-tabs button').forEach(btn=>{
  btn.addEventListener('click',()=>{
    document.querySelectorAll('.filter-tabs button').forEach(b=>b.classList.remove('is-active'));
    btn.classList.add('is-active');
    renderArtists(btn.dataset.filter);
  });
});
const modal = document.getElementById('workModal');
document.querySelectorAll('.modal-open').forEach(btn=>{
  btn.addEventListener('click',()=>{
    if(!modal) return;
    document.getElementById('modalTitle').textContent = btn.dataset.title;
    document.getElementById('modalNo').textContent = btn.dataset.title.split(' ')[0];
    document.getElementById('modalImg').src = btn.dataset.img;
    document.getElementById('modalImg').alt = btn.dataset.title;
    document.getElementById('modalText').textContent = btn.dataset.text;
    modal.classList.add('is-open');
    modal.setAttribute('aria-hidden','false');
  });
});
document.querySelectorAll('[data-close]').forEach(el=>{
  el.addEventListener('click',()=>{
    if(!modal) return;
    modal.classList.remove('is-open');
    modal.setAttribute('aria-hidden','true');
  });
});
document.addEventListener('keydown',e=>{ if(e.key==='Escape' && modal) modal.classList.remove('is-open'); });
