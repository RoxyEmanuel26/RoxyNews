const res = await fetch('http://localhost:3000/');
const html = await res.text();

console.log('SIZE:', html.length);
console.log('HAS_DARK_CLASS:', html.includes('class="dark"'));
console.log('HAS_HERO_ARTICLE:', html.includes('hero-article'));
console.log('HAS_SKELETON:', html.includes('skeleton-pulse'));
console.log('HAS_NEWS_CARD:', html.includes('news-card'));

const heroIdx = html.indexOf('hero-section');
if (heroIdx > 0) {
  console.log('HERO_HTML:', html.substring(heroIdx, heroIdx + 200));
}

const gridIdx = html.indexOf('news-grid');
if (gridIdx > 0) {
  console.log('GRID_HTML:', html.substring(gridIdx, gridIdx + 300));
}
