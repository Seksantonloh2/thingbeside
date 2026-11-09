"""Build the THINGBESIDE site.

All pages are generated from the shared pieces below, so header, footer, pricing,
FAQ and the rest stay identical everywhere. Edit content here, then run:

    python build.py

Output goes to ./site (styles and scripts live in ./site/assets).
Design: light editorial layout modelled on riseatseven.com. See site/FRAMER-HANDOFF.md.
"""
from pathlib import Path

OUT = Path(__file__).parent / 'site'
V = 49  # bump to make browsers fetch fresh styles.css and main.js

# ---------------------------------------------------------------- icons
def svg(paths, sw=1.8, fill='none'):
    return (f'<svg viewBox="0 0 24 24" fill="{fill}" stroke="currentColor" stroke-width="{sw}" '
            f'stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">{paths}</svg>')

ARROW = svg('<path d="M7 17 17 7M8 7h9v9"/>', 2)
CHECK = svg('<path d="m5 12.5 4.5 4.5L19 7.5"/>', 2.6)
SEARCH = svg('<circle cx="11" cy="11" r="6.5"/><path d="m20 20-4.2-4.2"/>', 2)
TREND = svg('<path d="m3 17 6-6 4 4 8-8"/><path d="M15 7h6v6"/>', 2)

def btn(label, href='contact.html', cls='btn', extra=''):
    return (f'<a class="{cls}" href="{href}"{extra}><span class="btn__label"><span>{label}</span>'
            f'<span aria-hidden="true">{label}</span></span>'
            f'<span class="btn__icon" aria-hidden="true">{ARROW}{ARROW}</span></a>')

def pic(src, cls=''):
    """A small rounded photo that sits inside a big heading, between two words."""
    extra = f' {cls}' if cls else ''
    return f'<span class="pic{extra}" aria-hidden="true"><img src="{src}" alt="" loading="lazy"></span>'

U = lambda id_, w=1400: f'https://images.unsplash.com/photo-{id_}?auto=format&fit=crop&w={w}&q=80'
EMAIL = 'thingbeside@gmail.com'

# ---------------------------------------------------------------- content
# (slug, name, sector, search query shown on the card, hover colour, hover text colour, description, tags, live URL)
CASES = [
    ('fernmoorphysiotherapy', 'Fernmoor Physiotherapy', 'Healthcare', 'physio no referral', '#2B3D54', '#F4F4F2',
     'Fills the appointment book by making same-week bookings and no-referral visits clear up front.',
     ['Healthcare', 'Bookings'], 'https://fernmoor-physiotherapy.vercel.app/'),
    ('umbra', 'Umbra Architecture', 'Architecture', 'residential architect', '#EB9843', '#111212',
     'Puts a small architecture studio’s work up front, with a rough timeline before the first call.',
     ['Architecture', 'Residential', 'Brief form'], 'https://umbra-architecture.vercel.app/'),
    ('voltsonelectrical', 'Voltson Electrical', 'Electrical', 'electrician near me', '#FFD23F', '#111212',
     'Turns “electrician near me” searches into quote requests, with fixed upfront pricing and a one-tap call button.',
     ['Electrical', 'Web design', 'Lead generation'], 'https://voltson-electrical.vercel.app/'),
    ('saltmereweddings', 'Saltmere Weddings', 'Weddings', 'wedding planner brisbane', '#683526', '#F4F4F2',
     'Helps couples picture the day, compare packages and check their date in a couple of taps.',
     ['Weddings', 'Packages'], 'https://saltmere-weddings.vercel.app/'),
]

# (label, title, image, alt, description, what's included)
SERVICES = [
    ('Design', 'Website design', U('1586717791821-3f44a563fa4c', 1000), 'Designer sketching website wireframes on a tablet',
     'A custom design built around your business and your customers. You see the homepage first, then I roll the look across every page.',
     ['Homepage-first, so you see the direction early', 'Copy written or polished for you', '2 rounds of revisions included']),
    ('Development', 'Framer development', U('1559028012-481c04fa702d', 1000), 'Website layout being designed on a large monitor',
     'Fast, secure and smooth to use, with animations that make you look established on every screen size.',
     ['Mobile-first, responsive layouts', 'Forms that land in your inbox', 'A private preview link before launch']),
    ('Launch &amp; SEO', 'Launch &amp; SEO', U('1460925895917-afdab827c52f', 1000), 'Laptop showing website analytics charts',
     'Your site goes live properly set up, so Google can find it and customers searching in your area can find you.',
     ['Domain connected and site published', 'Titles and descriptions on every page', 'Speed, alt text and accessibility checks']),
    ('Care', 'Care &amp; updates', U('1512941937669-90a1b58e7e9c', 1000), 'Smartphone on a desk showing app icons',
     'A site you can update yourself. Change text and photos in minutes, or hand the bigger jobs to me.',
     ['A walkthrough on editing at handover', '14 days of free support after launch', 'Bigger changes at $90/hour']),
    ('One page', 'One-page websites', 'assets/work-fernmoorphysiotherapy.jpg', 'Fernmoor Physiotherapy website homepage',
     'A single, focused page built to turn visitors into enquiries. Ideal for new businesses, promotions or capturing leads fast.',
     ['One scrolling page, built to convert', 'Enquiry form to your inbox', 'Live within a week']),
    ('Rebuilds', 'Website rebuilds', 'assets/work-northbridgeconsulting.jpg', 'Northbridge Consulting website homepage',
     'Stuck with a slow, clunky or hard-to-manage website? I’ll rebuild it in Framer and move your content across.',
     ['Content moved across for you', 'Redirects set up for old pages', 'Keep your Google rankings']),
]

STEPS = [
    ('Day 1 · 15 min', 'Discovery call', 'A free, no-pressure chat about your business, your customers and what your website needs to do. If we’re a good fit, you get a fixed quote and timeline.'),
    ('Days 2–4', 'Brief', 'You fill in a simple brief covering your services, style and examples you like. Don’t have everything? I’ll help fill the gaps and write or polish your content.'),
    ('Weeks 1–2', 'Design', 'I design your homepage first so you see the look and feel early. Once you’re happy, I design the remaining pages. Two rounds of revisions included.'),
    ('Weeks 2–3', 'Build', 'I build your site in Framer with smooth animations, mobile-friendly layouts and SEO basics. You get a private preview link to check it on your own phone.'),
    ('Week 3', 'Launch &amp; support', 'I connect your domain, run final checks and put your site live. You get a walkthrough on editing it yourself, plus 14 days of free support.'),
]

QA = [
    ('What platform do you build websites on?', 'I build every website in Framer, a modern website builder trusted by startups and design studios worldwide. It gives you a fast, secure and great-looking site with smooth animations, and it’s easy for you to edit after launch.'),
    ('Do you use AI to make my website? Will it look generic?', 'AI helps me with the repetitive parts, like layout drafts and first-pass copy, so I work faster. Every site is then designed and built by me in Framer, with each detail refined by hand. Your site is built around your business, not a template.'),
    ('Do I need my own domain and hosting?', 'If you already have a domain, we’ll connect it to your Framer site. If not, I’ll help you set one up. Hosting is through Framer, so your site loads fast, stays secure and needs no technical setup from you.'),
    ('Can I update the website myself?', 'Yes. Framer has a simple visual editor, so you can change text, images and blog posts without touching any code. I’ll show you how at handover, or you can leave updates to me.'),
    ('How long does a website take?', 'A one-page site is usually live within a week. A 5–10 page business website takes about three weeks from the first call to launch, depending on how quickly we get your content together.'),
]

TRADES = ['Electricians', 'Plumbers', 'Builders', 'Physios', 'Cafés', 'Wedding planners', 'Consultants', 'Landscapers', 'Cleaners', 'Clinics']

# ---------------------------------------------------------------- shared chrome
NAV = [('work.html', 'Work'), ('services.html', 'Services'), ('services.html#pricing', 'Pricing'),
       ('index.html#about', 'About'), ('contact.html', 'Contact')]
PAGES = [('index.html', 'Home'), ('work.html', 'Work'), ('services.html', 'Services'), ('contact.html', 'Contact')]

def head(title, desc, extra=''):
    assert len(title) <= 60 and len(desc) <= 155, (title, len(title), len(desc))
    return f'''<!doctype html>
<html lang="en-AU">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="theme-color" content="#efeeec">
  <title>{title}</title>
  <meta name="description" content="{desc}">
  <meta property="og:title" content="{title}">
  <meta property="og:description" content="{desc}">
  <meta property="og:image" content="assets/work-voltsonelectrical.jpg">
  <link rel="preconnect" href="https://api.fontshare.com" crossorigin>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://api.fontshare.com/v2/css?f[]=switzer@400,500,600&amp;display=swap" rel="stylesheet">
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&amp;display=swap" rel="stylesheet">
  <link rel="stylesheet" href="assets/styles.css?v={V}">
  <script>document.documentElement.classList.add('js');try{{if(sessionStorage.getItem('tb-loaded'))document.documentElement.classList.add('no-preload')}}catch(e){{}}setTimeout(function(){{var p=document.querySelector('.page');p&&p.classList.remove('entering')}},5000)</script>
{extra}</head>
'''

def nav(current, dark_top):
    def cur(f):
        return ' aria-current="page"' if f == current else ''
    links = ''.join(
        f'<li><a href="{f}"{cur(f)}>{n}{f"<sup class=nav__count>{len(CASES)}</sup>" if n == "Work" else ""}</a></li>'
        for f, n in NAV)
    mobile = ''.join(f'    <a class="mm__link" href="{f}"{cur(f)}>{n}</a>\n' for f, n in [('index.html', 'Home')] + NAV)
    return f'''<a class="skip" href="#main">Skip to content</a>

<header class="nav{' nav--over-dark' if dark_top else ''}">
  <a class="wordmark" href="index.html" aria-label="THINGBESIDE home">THINGBESIDE</a>
  <nav aria-label="Main"><ul class="nav__links">{links}</ul></nav>
  <div class="nav__end">
    {btn('Get in touch', cls='btn btn--sm nav__cta')}
    <button class="menu-btn" aria-label="Open menu" aria-expanded="false" aria-controls="mobile-menu"><span></span><span></span></button>
  </div>
</header>
<div class="mobile-menu" id="mobile-menu">
  <nav class="mm__links" aria-label="Mobile">
{mobile}  </nav>
  <div class="mm__foot">
    {btn('Get in touch', cls='btn btn--light')}
    <a href="mailto:{EMAIL}">{EMAIL}</a>
  </div>
</div>

'''

TOPBAR = f'''<div class="topbar"><a href="contact.html"><i class="dot" aria-hidden="true"></i><span>Taking new projects</span><span class="topbar__sep" aria-hidden="true">·</span><span class="topbar__more">Book a free 15-minute call</span>{ARROW}</a></div>
'''

FOOTER = f'''<footer class="footer">
  <div class="footer__panel">
    <div class="footer__top">
      <div class="footer__lead">
        <h2 class="footer__title">Start with a free <span class="nowrap">15-minute</span> call</h2>
        <a class="footer__mail" href="mailto:{EMAIL}"><span>{EMAIL}</span><i>{ARROW}</i></a>
        <p class="footer__small">Replies within 24 hours. Based in Brisbane, working with Australia &amp; worldwide.</p>
      </div>
      <nav class="footer__cols" aria-label="Footer">
        <ul>{''.join(f'<li><a href="{f}">{n}</a></li>' for f, n in PAGES)}</ul>
        <ul><li><a href="index.html#work">Featured work</a></li><li><a href="index.html#process">Process</a></li><li><a href="services.html#pricing">Pricing</a></li><li><a href="index.html#about">About</a></li><li><a href="index.html#faq">FAQ</a></li></ul>
        <ul><li><a href="mailto:{EMAIL}">Email me</a></li><li><a href="contact.html">Book a free call</a></li><li><a href="privacy.html">Privacy policy</a></li></ul>
      </nav>
    </div>
    <div class="footer__mark" aria-hidden="true"><span>THINGBESIDE</span></div>
    <div class="footer__legal">
      <span>© <span data-year>2026</span> THINGBESIDE · ABN 00 000 000 000</span>
      <span>Designed by hand in Brisbane, QLD</span>
    </div>
  </div>
</footer>
</div>

<script src="assets/main.js?v={V}"></script>
</body>
</html>
'''

def page(file, title, desc, body, current=None, extra_head='', preloader=False, dark_top=False):
    letters = ''.join(f'<span class="pl"><span>{c}</span></span>' for c in 'THINGBESIDE')
    pre = (f'<div class="preloader" aria-hidden="true">\n  <div class="preloader__frame"></div>\n  <p class="preloader__word">{letters}</p>\n  <div class="preloader__count">000</div>\n</div>\n'
           if preloader else '')
    html = (head(title, desc, extra_head) + '<body>\n' + pre + nav(current, dark_top)
            + '<div class="page entering">\n' + TOPBAR + '<main id="main">\n' + body + '</main>\n\n' + FOOTER)
    (OUT / file).write_text(html, encoding='utf8', newline='\n')
    print('wrote', file)

def page_hero(label, h1, sub, aside=''):
    return f'''  <section class="phero">
    <div class="wrap">
      <p class="label reveal">{label}</p>
      <h1 class="display" data-split data-load>{h1}</h1>
      <div class="phero__foot">
        <p class="phero__sub reveal">{sub}</p>
{aside}      </div>
    </div>
  </section>

'''

# ---------------------------------------------------------------- HOME: hero
ROTATOR = ('<span class="pic pic--rotate" aria-hidden="true">'
           + ''.join(f'<img src="assets/pic-{c[0]}.jpg" alt="">' for c in CASES) + '</span>')

HERO = f'''  <!-- HERO -->
  <section class="hero" aria-labelledby="hero-title">
    <div class="hero__card">
      <video class="hero__video" autoplay muted loop playsinline preload="auto" poster="assets/hero-bg.jpg" aria-hidden="true">
        <source src="assets/hero-bg-mobile.mp4" type="video/mp4" media="(max-width: 760px)">
        <source src="assets/hero-bg.mp4" type="video/mp4">
      </video>
      <div class="hero__content">
        <p class="hero__eyebrow reveal">Web design studio · Brisbane &amp; worldwide</p>
        <h1 id="hero-title" class="display" data-split data-load>Modern websites, <br>built in {ROTATOR} days</h1>
        <p class="hero__pitch reveal">Custom websites <b>designed by hand</b> and sped up with AI, so you win customers sooner.</p>
        <div class="hero__cta reveal">
          {btn('Get in touch', cls='btn btn--light')}
          {btn('See my work', 'work.html', 'btn btn--ghost-light')}
        </div>
      </div>
    </div>
  </section>

'''

TRADES_STRIP = f'''  <!-- WHO IT'S FOR -->
  <section class="trades" aria-label="Who I build websites for">
    <p class="trades__label">Built for</p>
    <div class="trades__marquee">
      <ul class="trades__track">{''.join(f'<li>{t}</li>' for t in TRADES)}</ul>
      <ul class="trades__track" aria-hidden="true">{''.join(f'<li>{t}</li>' for t in TRADES)}</ul>
    </div>
  </section>

'''

STATS = [('3', ' weeks', 'Typical time from first call to launch'), ('590', '', 'Starting price in AUD, fixed quote', '$'),
         ('14', ' days', 'Free support after your site goes live'), ('24', ' hrs', 'Reply time on every enquiry')]

def stat(n, suf, label, pre=''):
    return f'<div class="stat"><b>{pre}<span data-count="{n}">0</span>{suf}</b><span>{label}</span></div>'

INTRO = f'''  <!-- INTRO -->
  <section class="section intro" aria-labelledby="intro-title">
    <div class="wrap intro__grid">
      <p class="intro__lead reveal">One designer, start to finish. I design and build modern, high-performing websites that help Australian businesses stand out and turn visitors into customers.</p>
      <div class="intro__main">
        <h2 id="intro-title" class="h-lg" data-split>Designed by hand, built to {pic('assets/pic-voltsonelectrical.jpg')} convert</h2>
        <div class="intro__cta reveal">
          {btn('My story', 'index.html#about', 'btn btn--white btn--sm')}
          {btn('My services', 'services.html', 'btn btn--text btn--sm')}
        </div>
      </div>
    </div>
    <div class="wrap stats" data-stagger>
      {''.join(stat(*s) for s in STATS)}
    </div>
  </section>

'''

# ---------------------------------------------------------------- work cards
def proj(c, show_desc=False, idx=0):
    slug, name, sector, query, col, ink, desc, tags, url = c
    chips = ''.join(f'<span>{t}</span>' for t in tags)
    below = (f'<span class="proj__meta"><span class="proj__name">{name}</span><span class="proj__tags">{chips}</span></span>'
             + (f'<span class="proj__desc">{desc}</span>' if show_desc else ''))
    return f'''        <a class="proj reveal" id="p-{slug}" href="{url}" target="_blank" rel="noopener" style="--c:{col};--c-ink:{ink};--d:{(idx % 2) * 90}ms">
          <span class="proj__media">
            <img src="assets/work-{slug}.jpg" alt="{name} website homepage" width="1600" height="940" loading="lazy">
            <span class="proj__hover" aria-hidden="true"><span class="proj__hl">{desc}</span><span class="proj__brand">{name}</span></span>
            <span class="proj__search" aria-hidden="true">{SEARCH}<span>{query}</span>{TREND}</span>
            <span class="proj__cursor" aria-hidden="true">{ARROW}</span>
          </span>
          {below}
          <span class="sr-only">(opens the live {name} site in a new tab)</span>
        </a>
'''

WORK_HOME = f'''  <!-- FEATURED WORK -->
  <section class="work-sec" id="work" aria-labelledby="work-title">
    <div class="panel work" data-work>
      <div class="work__side">
        <h2 id="work-title" class="label">Featured work</h2>
        <div class="work__wheel">
          <ol class="work__list">
{''.join(f'            <li><a href="#p-{c[0]}"><small>({c[2]})</small><span>{c[1]}</span></a></li>{chr(10)}' for c in CASES)}          </ol>
        </div>
        {btn('Explore all work', 'work.html', 'btn btn--light btn--sm')}
      </div>
      <div class="work__cards">
{''.join(proj(c) for c in CASES)}      </div>
    </div>
  </section>

'''

# ---------------------------------------------------------------- services list
SERVICES_LIST = f'''  <!-- SERVICES -->
  <section class="section svc" id="services" aria-labelledby="svc-title">
    <div class="wrap">
      <div class="sec-head">
        <h2 id="svc-title" class="h-xl" data-split>My {pic(U('1586717791821-3f44a563fa4c', 300))} services</h2>
        <div class="reveal">{btn('All services', 'services.html', 'btn btn--white btn--sm')}</div>
      </div>
      <ul class="svc-list" data-stagger>
{''.join(f'        <li><a class="svc-link" href="services.html#svc-{i}"><img src="{s[2]}" alt="" loading="lazy"><span class="svc-link__arrow" aria-hidden="true">{ARROW}</span><span class="svc-link__t">{s[1]}</span></a></li>{chr(10)}' for i, s in enumerate(SERVICES, 1))}      </ul>
    </div>
  </section>

'''

BIGLINE = f'''  <!-- BIG LINE -->
  <section class="bigline" aria-label="Hand-crafted design, AI-powered speed">
    <div class="bigline__track" data-drift aria-hidden="true">
      <span>Hand-crafted design</span>{pic('assets/pic-saltmereweddings.jpg')}<span>AI-powered speed</span>{pic('assets/pic-fernmoorphysiotherapy.jpg')}<span>Hand-crafted design</span>{pic('assets/pic-umbra.jpg')}<span>AI-powered speed</span>
    </div>
  </section>

'''

# ---------------------------------------------------------------- process deck
DECK_STYLE = [('dark', -3), ('light', 2.5), ('accent', -1.5), ('dark', 3.5), ('light', -2)]

def deck_section():
    cards = ''.join(f'''        <article class="dcard dcard--{DECK_STYLE[i][0]}" data-rot="{DECK_STYLE[i][1]}" style="--rot:{DECK_STYLE[i][1]}deg">
          <div class="dcard__top"><span class="dcard__step">Step {i + 1:02d}</span><span>{when}</span></div>
          <span class="dcard__num" aria-hidden="true">{i + 1:02d}</span>
          <h3>{title}</h3>
          <p>{text}</p>
        </article>
''' for i, (when, title, text) in enumerate(STEPS))
    return f'''  <!-- PROCESS -->
  <section class="deck" id="process" aria-labelledby="process-title">
    <div class="wrap deck__head">
      <p class="label reveal">How it works</p>
      <h2 id="process-title" class="h-xl" data-split>Five steps. No surprises.</h2>
      <p class="sub reveal">From first chat to live website in about three weeks, with a fixed quote before anything starts.</p>
    </div>
    <div class="deck__track" data-deck style="--n:{len(STEPS)}">
      <div class="deck__stage">
{cards}        <p class="deck__count" aria-hidden="true"><span data-deck-now>01</span> / {len(STEPS):02d}</p>
      </div>
    </div>
  </section>

'''

# ---------------------------------------------------------------- pricing
def plan(for_, name, desc, price, suffix, note, items, pop=False, wide=False):
    cls = 'plan' + (' plan--pop' if pop else '') + (' plan--wide' if wide else '')
    badge = '<span class="plan__badge">Most popular</span>' if pop else ''
    lis = ''.join(f'<li><i>{CHECK}</i>{x}</li>' for x in items)
    return f'''        <article class="{cls}">
          <div class="plan__main">
            <div class="plan__head"><span class="plan__for">{for_}</span>{badge}</div>
            <h3 class="plan__name">{name}</h3>
            <p class="plan__desc">{desc}</p>
            <div class="plan__price">$<span data-count="{price}">0</span><small>{suffix}</small></div>
            <p class="plan__note">{note}</p>
          </div>
          <ul class="plan__list">{lis}</ul>
          <div class="plan__cta">{btn('Get in touch', 'contact.html', 'btn btn--block' + (' btn--light' if pop else ''))}</div>
        </article>
'''

PLANS_MAIN = (
    plan('For new businesses', 'One-Page Website', 'A single, focused page built to turn visitors into enquiries. Ideal for new businesses, promotions or capturing leads fast.',
         590, 'AUD', 'One-off fee · live within a week',
         ['One focused, scrolling page', 'Mobile-first custom design', 'Enquiry form to your inbox', 'SEO basics and domain setup', '14 days of free support'])
    + plan('For growing businesses', 'Business Website', 'A 5–10 page website designed around your business, not a template. Mobile-first, fast-loading and ready for Google.',
           1990, 'AUD', 'One-off fee · most sites live in about 3 weeks',
           ['5–10 custom-designed pages', 'Mobile-first and fast-loading', 'SEO essentials on every page', '2 rounds of design revisions', 'Edit it yourself in Framer', '14 days of free support'], pop=True)
    + plan('For businesses with plenty to say', 'Large Website', 'A bigger, well-structured site with more pages and content, organised so visitors find what they need easily.',
           3490, 'AUD', 'One-off fee · fixed quote after a free call',
           ['10+ pages and sections', 'Clear structure and navigation', 'Blog or CMS collections', 'SEO essentials on every page', '14 days of free support'])
)
PLANS_EXTRA = (
    plan('For slow or clunky sites', 'Website Rebuild', 'Stuck with a slow, clunky or hard-to-manage website? I’ll rebuild it in Framer and move your content across.',
         1490, 'AUD', 'One-off fee · keep your Google rankings',
         ['Rebuilt in Framer from scratch', 'Content moved across for you', 'Redirects set up for old pages', 'Faster, easier to manage'], wide=True)
    + plan('For live websites', 'Updates &amp; Changes', 'Simple text and image edits are yours to make in Framer’s easy editor. For bigger changes, I’m here to help.',
           90, '/hour', 'Pay only for the time used · most updates take under two hours',
           ['New pages and sections', 'Seasonal and promo updates', 'Layout and design tweaks', 'Group changes to save money'], wide=True)
)

def pricing_section(extra):
    if extra:
        grid = f'      <div class="plans plans--row" data-stagger>\n{PLANS_MAIN}{PLANS_EXTRA.replace(" plan--wide", "")}      </div>\n'
    else:
        grid = f'      <div class="plans" data-stagger>\n{PLANS_MAIN}      </div>\n'
    return f'''  <!-- PRICING -->
  <section class="section pricing" id="pricing" aria-labelledby="pricing-title">
    <div class="wrap">
      <div class="sec-head">
        <h2 id="pricing-title" class="h-xl" data-split>Straightforward pricing</h2>
        <p class="sec-head__sub reveal">Clear packages in AUD with no hidden fees. Pick a starting point, or ask for a custom quote.</p>
      </div>
{grid}      <p class="note reveal">Every website is built in Framer, designed by me and sped up with AI, so you get quality work faster and at a fairer price.</p>
    </div>
  </section>

'''

# ---------------------------------------------------------------- about
FACTS = [('Brisbane, working worldwide', 'Remote-friendly, Australian hours'), ('About 3 weeks', 'Typical project timeline'),
         ('Design, build &amp; launch', 'All handled in Framer'), ('One-on-one service', 'From first call to handover')]

ABOUT = f'''  <!-- ABOUT -->
  <section class="section about" id="about" aria-labelledby="about-title">
    <div class="wrap about__grid">
      <div class="about__body">
        <p class="label reveal">The human behind THINGBESIDE</p>
        <h2 id="about-title" class="h-lg" data-split>Hi, I’m Seksan. <span class="muted">I build websites that bring in work.</span></h2>
        <figure class="about__photo reveal">
          <img src="assets/about-person.webp" width="1142" height="1377" loading="lazy" alt="Portrait of Seksan, the person behind THINGBESIDE, in silhouette against a red backdrop">
          <figcaption>Seksan · Founder &amp; designer</figcaption>
        </figure>
        <p class="about__lead reveal">I create modern, high-performing websites that help businesses stand out and turn visitors into customers. I work one-on-one with tradies, local businesses and individuals, from Brisbane to anywhere.</p>
        <p class="about__em reveal">Personally designed. Thoughtfully built. Powered by smart technology.</p>
        <ul class="facts" data-stagger>
{''.join(f'          <li><b>{t}</b><span>{s}</span></li>{chr(10)}' for t, s in FACTS)}        </ul>
      </div>
    </div>
  </section>

'''

# ---------------------------------------------------------------- FAQ
def faq_section():
    items = ''.join(f'''        <div class="faq__item">
          <h3><button class="faq__q" aria-expanded="false" aria-controls="fa{i}">{q}<span class="faq__icon" aria-hidden="true"></span></button></h3>
          <div class="faq__a" id="fa{i}" role="region"><div><p>{a}</p></div></div>
        </div>
''' for i, (q, a) in enumerate(QA, 1))
    return f'''  <!-- FAQ -->
  <section class="section faq-sec" id="faq" aria-labelledby="faq-title">
    <div class="wrap">
      <div class="sec-head">
        <h2 id="faq-title" class="h-xl" data-split>Questions? Answered.</h2>
        <div class="reveal">{btn('Ask me anything', 'contact.html', 'btn btn--white btn--sm')}</div>
      </div>
      <div class="faq">
{items}      </div>
    </div>
  </section>

'''

OUTRO = f'''  <!-- FINAL CTA -->
  <section class="outro" aria-labelledby="cta-title">
    <h2 id="cta-title" class="outro__line" data-wave>Ready for a website that works?</h2>
    <div class="wrap outro__foot">
      <p class="outro__sub reveal">Book a free 15-minute call. Tell me about your business, and I’ll tell you how I’d build your site.</p>
      <div class="reveal">{btn('Book a free call')}</div>
    </div>
  </section>
'''

SCHEMA = f'''  <script type="application/ld+json">
  {{"@context":"https://schema.org","@type":"ProfessionalService","name":"THINGBESIDE","description":"Website design and Framer development for Australian small businesses.","founder":{{"@type":"Person","name":"Seksan Tonloh"}},"areaServed":["Brisbane","Australia","Worldwide"],"address":{{"@type":"PostalAddress","addressLocality":"Brisbane","addressRegion":"QLD","addressCountry":"AU"}},"email":"{EMAIL}","priceRange":"From AUD 590"}}
  </script>
'''

# ---------------------------------------------------------------- HOME
page('index.html', 'THINGBESIDE | Website Designer in Brisbane',
     'Modern, mobile-first websites for Australian tradies and local businesses. Designed by hand, built in Framer, live in weeks. Book a free 15-minute call.',
     HERO + TRADES_STRIP + INTRO + WORK_HOME + SERVICES_LIST + BIGLINE + deck_section()
     + pricing_section(True) + ABOUT + faq_section() + OUTRO,
     current='index.html', extra_head=SCHEMA, preloader=True, dark_top=True)

# ---------------------------------------------------------------- WORK
page('work.html', 'Work | THINGBESIDE Website Designer',
     'Concept and client website projects for Australian tradies, clinics, planners and consultancies, each designed to look sharp and bring in enquiries.',
     page_hero('Work', f'Selected {pic("assets/pic-saltmereweddings.jpg")} work',
               'Concept and client projects for Australian businesses, each designed to look sharp and bring in enquiries.',
               f'        <p class="phero__meta reveal"><b>{len(CASES):02d}</b> projects · click any to open the live site</p>\n')
     + f'''  <section class="section pwork" aria-label="Projects">
    <div class="wrap">
      <div class="pgrid">
{''.join(proj(c, show_desc=True, idx=i) for i, c in enumerate(CASES))}      </div>
      <p class="note reveal">Every project here is labelled honestly. Concept projects show how I approach a real business problem, built to the same standard as paid client work.</p>
    </div>
  </section>

''' + OUTRO, current='work.html')

# ---------------------------------------------------------------- SERVICES
def srow(i, s):
    label, title, img, alt, desc, incl = s
    return f'''      <article class="srow" id="svc-{i}">
        <span class="srow__num reveal">{i:02d}</span>
        <div class="srow__main reveal">
          <p class="srow__label">{label}</p>
          <h2 class="srow__title">{title}</h2>
          <p class="srow__desc">{desc}</p>
          <ul class="incl">{''.join(f'<li><i>{CHECK}</i>{x}</li>' for x in incl)}</ul>
          {btn('Get in touch', cls='btn btn--sm')}
        </div>
        <div class="srow__img reveal"><img src="{img}" alt="{alt}" loading="lazy"></div>
      </article>
'''

page('services.html', 'Services | Website Design &amp; Framer Development',
     'Website design, Framer development, launch and SEO basics, and ongoing care. Clear AUD pricing from $590 with no hidden fees.',
     page_hero('Services', f'Everything {pic(U("1559028012-481c04fa702d", 300))} you need',
               'From design to launch, I handle your whole website so you can get back to running your business.',
               f'        <div class="reveal">{btn("See pricing", "#pricing", "btn btn--white btn--sm")}</div>\n')
     + f'''  <section class="section srows" aria-label="What I do">
    <div class="wrap">
{''.join(srow(i, s) for i, s in enumerate(SERVICES, 1))}    </div>
  </section>

''' + deck_section() + pricing_section(True) + faq_section() + OUTRO, current='services.html')

# ---------------------------------------------------------------- CONTACT
CONTACT = f'''  <section class="section contact-sec" aria-label="Get in touch">
    <div class="wrap contact">
      <form class="form reveal" id="quote-form" action="https://formspree.io/f/mvkkdgyn" method="POST" novalidate>
        <h2 class="form__title">Tell me about your project</h2>
        <div class="form__row">
          <div class="field"><label for="f-name">Name</label><input id="f-name" name="name" autocomplete="name" required><span class="err">Please enter your name.</span></div>
          <div class="field"><label for="f-email">Email</label><input id="f-email" name="email" type="email" autocomplete="email" required><span class="err">Please enter a valid email address.</span></div>
        </div>
        <div class="field"><label for="f-job">What do you need?</label>
          <select id="f-job" name="job" required>
            <option value="">Choose one</option>
            <option>One-page website</option>
            <option>Business website (5–10 pages)</option>
            <option>Large website</option>
            <option>Website rebuild</option>
            <option>Updates and changes</option>
            <option>Not sure yet</option>
          </select><span class="err">Please choose an option.</span></div>
        <div class="field"><label for="f-msg">Tell me about your business</label><textarea id="f-msg" name="message" required placeholder="What you do, where you work and what you want your website to do."></textarea><span class="err">A sentence or two helps me prepare (10+ characters).</span></div>
        <div class="form__foot">
          <button class="btn" type="submit"><span class="btn__label"><span>Send message</span><span aria-hidden="true">Send message</span></span><span class="btn__icon" aria-hidden="true">{ARROW}{ARROW}</span></button>
          <p class="form__ok" role="status">Thanks! Your message is in. I’ll be in touch within 24 hours.</p>
          <p class="form__err" role="alert">Something went wrong. Please try again, or email {EMAIL}.</p>
        </div>
      </form>
      <aside class="side">
        <div class="side-card side-card--dark reveal">
          <span class="status"><i class="dot" aria-hidden="true"></i>Taking new projects</span>
          <h3>Book a free 15-minute call</h3>
          <p>A no-pressure chat about your business and your website. If we’re a good fit, you’ll get a fixed quote and timeline.</p>
          {btn('Book a free call', f'mailto:{EMAIL}?subject=Free%2015-minute%20call', 'btn btn--light btn--sm')}
        </div>
        <div class="side-card reveal">
          <dl class="dl">
            <div><dt>Email</dt><dd><a href="mailto:{EMAIL}">{EMAIL}</a></dd></div>
            <div><dt>Based in</dt><dd>Brisbane, QLD</dd></div>
            <div><dt>Working with</dt><dd>Australia &amp; worldwide</dd></div>
            <div><dt>Reply time</dt><dd>Within 24 hours</dd></div>
          </dl>
        </div>
      </aside>
    </div>
  </section>

'''
page('contact.html', 'Contact | Book a Free Website Call | THINGBESIDE',
     'Get in touch about your new website. Send a quick message or book a free 15-minute call with Seksan, a Brisbane-based website designer.',
     page_hero('Contact', f'Let’s build {pic("assets/pic-voltsonelectrical.jpg")} your website',
               'Tell me a little about your business and what you need. I’ll reply within 24 hours with next steps.')
     + CONTACT + faq_section(), current='contact.html')

# ---------------------------------------------------------------- PRIVACY
page('privacy.html', 'Privacy Policy | THINGBESIDE',
     'How THINGBESIDE collects, uses and protects the personal information you share through this website.',
     page_hero('Legal', 'Privacy policy', 'How THINGBESIDE collects, uses and looks after your personal information.') + f'''  <section class="section" style="padding-top:0">
    <div class="wrap">
      <div class="prose reveal">
        <p><em>Template for review. Have this checked against the Australian Privacy Principles before launch.</em></p>
        <h2>What I collect</h2>
        <p>When you use the contact form or book a call, I collect your name, email address and anything you choose to tell me about your business.</p>
        <h2>How I use it</h2>
        <p>Only to reply to your enquiry, prepare a quote and deliver your project. I don’t sell or share your details with anyone for marketing.</p>
        <h2>Storage</h2>
        <p>Form submissions are handled by Formspree and stored securely. Project files are kept only as long as needed to support your website.</p>
        <h2>Your choices</h2>
        <p>You can ask to see, correct or delete the information I hold about you at any time by emailing <a href="mailto:{EMAIL}">{EMAIL}</a>.</p>
      </div>
    </div>
  </section>

''' + OUTRO)
