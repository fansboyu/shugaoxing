const button=document.querySelector('.nav-toggle');
const nav=document.querySelector('.main-nav');
if(button&&nav){button.addEventListener('click',()=>{const open=nav.classList.toggle('is-open');button.setAttribute('aria-expanded',String(open));});nav.querySelectorAll('a').forEach(link=>link.addEventListener('click',()=>{nav.classList.remove('is-open');button.setAttribute('aria-expanded','false');}));}

const year=document.getElementById('year');if(year)year.textContent=new Date().getFullYear();

window.addEventListener('load',()=>document.body.classList.add('page-ready'));

const revealTargets=document.querySelectorAll('.feature-grid article,.about-art,.about-copy,.section-heading,.service-grid article,.method-copy,.method-steps article,.article-grid article,.cta-section .container,.footer-layout>div,.footer-layout>.copyright');
revealTargets.forEach((element,index)=>{element.classList.add('reveal');element.style.transitionDelay=`${Math.min((index%4)*80,240)}ms`;});
if('IntersectionObserver' in window){const revealObserver=new IntersectionObserver((entries,observer)=>{entries.forEach(entry=>{if(entry.isIntersecting){entry.target.classList.add('is-visible');observer.unobserve(entry.target);}});},{threshold:.12});revealTargets.forEach(element=>revealObserver.observe(element));}else{revealTargets.forEach(element=>element.classList.add('is-visible'));}

const navLinks=[...document.querySelectorAll('.main-nav a[href^="#"]')];
const sections=navLinks.map(link=>document.querySelector(link.getAttribute('href'))).filter(Boolean);
if(sections.length&&'IntersectionObserver' in window){const navObserver=new IntersectionObserver(entries=>{const active=entries.filter(entry=>entry.isIntersecting).sort((a,b)=>b.intersectionRatio-a.intersectionRatio)[0];if(!active)return;navLinks.forEach(link=>link.classList.toggle('active',link.getAttribute('href')===`#${active.target.id}`));},{rootMargin:'-38% 0px -52% 0px',threshold:[.05,.2,.5]});sections.forEach(section=>navObserver.observe(section));}
