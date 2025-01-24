console.log("IT'S ALIVE!");

function $$(selector, context = document) {
    return Array.from(context.querySelectorAll(selector));
  }

let navLinks = $$("nav a");
let currentLink = navLinks.find(
    (a) => a.host === location.host && a.pathname === location.pathname
);

currentLink?.classList.add('current');

const ARE_WE_HOME = document.documentElement.classList.contains('home');

let pages = [
    { url: '', title: 'Home' },
    { url: 'projects/', title: 'Projects' },
    { url: 'contact/', title: 'Contact' },
    { url: 'resume/', title: 'Resume' },
    { url: 'https://github.com/y3pat', title: 'GitHub', external: true },
  ];

let nav = document.createElement('nav');
document.body.prepend(nav);

for (let p of pages) {
    let url = p.url;
    let title = p.title;
    url = !ARE_WE_HOME && !url.startsWith('http') ? '../' + url : url;
    let a = document.createElement('a');
    a.href = url;
    a.textContent = title;
    a.classList.toggle(
        'current',
        a.host === location.host && a.pathname === location.pathname
    );
    
    
    a.target = a.host !== location.host ? '_blank' : '_self';
    
    nav.append(a);
    
}