const fs = require('fs');
const path = 'D:/projects/opencode/Hinglish/index.html';
let content = fs.readFileSync(path, 'utf8');
const oldNav = '<nav class="main-nav" data-main-nav aria-label="Primary">';
const start = content.indexOf(oldNav);
if (start >= 0) {
    const end = content.indexOf('</nav>', start);
    if (end >= 0) {
        const newNav = '<nav class="main-nav" data-main-nav aria-label="Primary">\n        <a class="nav-link" href="/">Home</a>\n        <a class="nav-link" href="/hinglish-to-hindi/">Hinglish → Hindi</a>\n        \n        <a class="nav-link" href="/what-is-hinglish/">What is Hinglish</a>\n        <a class="nav-link" href="/faq/">FAQ</a>\n      </nav>\n      <div class="nav-actions">\n        <div class="lang-switch" role="group" aria-label="Language">\n          <a href="/" lang="en" aria-current="true">EN</a>\n          <a href="/hi/" lang="hi">???</a>\n        </div>\n        <button class="theme-toggle" data-theme-toggle aria-label="Switch theme" type="button">\n          <svg class="icon-sun" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"/>\n          <svg class="icon-moon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>\n        </button>\n        <button class="nav-toggle" data-nav-toggle aria-expanded="false" aria-label="Menu" type="button">\n          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M3 6h18M3 12h18M3 18h18"/></svg>\n        </button>\n      </div>';
        const newContent = content.substring(0, start) + newNav + content.substring(end + 6);
        fs.writeFileSync(path, newContent, 'utf8');
        console.log('Updated index.html');
    }
}