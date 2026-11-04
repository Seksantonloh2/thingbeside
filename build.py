"""Build the THINGBESIDE site.

All pages are generated from the shared pieces below, so header, footer, pricing,
FAQ and the rest stay identical everywhere. Edit content here, then run:

    python build.py

Output goes to ./site (styles and scripts live in ./site/assets).
"""
from pathlib import Path

OUT = Path(__file__).parent / 'site'

# ---------------------------------------------------------------- icons
ARROW = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M13 6l6 6-6 6"/></svg>'
DIAG = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M7 17 17 7M8 7h9v9"/></svg>'
CHECK = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="m5 12.5 4.5 4.5L19 7.5"/></svg>'
HOME = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 10.5 12 4l8 6.5V20h-5v-6H9v6H4z"/></svg>'
def icon(paths, fill='none'):
    return f'<svg viewBox="0 0 24 24" fill="{fill}" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">{paths}</svg>'

def btn(label, href='contact.html', cls='btn', extra=''):
    return (f'<a class="{cls}" href="{href}"{extra}><span class="btn__label"><span>{label}</span><span aria-hidden="true">{label}</span></span>'
            f'<span class="btn__icon">{ARROW}{ARROW}</span></a>')

U = lambda id_, w=1400: f'https://images.unsplash.com/photo-{id_}?auto=format&fit=crop&w={w}&q=80'
EMAIL = 'thingbeside@gmail.com'

# ---------------------------------------------------------------- shared chrome
PAGES = [('index.html', 'Home'), ('work.html', 'Work'), ('services.html', 'Services'), ('contact.html', 'Contact')]

def head(title, desc, extra=''):
    assert len(title) <= 60 and len(desc) <= 155, (title, len(title), len(desc))
    return f'''<!doctype html>
<html lang="en-AU">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="theme-color" content="#0a0a0a">
  <title>{title}</title>
  <meta name="description" content="{desc}">
  <meta property="og:title" content="{title}">
  <meta property="og:description" content="{desc}">
  <meta property="og:image" content="assets/work-voltsonelectrical.jpg">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Instrument+Sans:wght@400..700&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="assets/styles.css?v=7">
  <script>document.documentElement.classList.add('js');try{{if(sessionStorage.getItem('tb-loaded'))document.documentElement.classList.add('no-preload')}}catch(e){{}}</script>
{extra}</head>
'''

def nav(current):
    links = ''.join(
        f'<li><a href="{f}"{" aria-current=\"page\"" if f == current else ""}>{HOME if f == "index.html" else ""}{name}</a></li>'
        for f, name in PAGES)
    mobile = ''.join(f'  <a class="big" href="{f}"{" aria-current=\"page\"" if f == current else ""}>{name}</a>\n' for f, name in PAGES)
    return f'''<a class="skip" href="#main">Skip to content</a>
<canvas id="fluid" aria-hidden="true"></canvas>

<header class="nav">
  <a class="wordmark" href="index.html" aria-label="THINGBESIDE home">THINGBESIDE</a>
  <nav aria-label="Main"><ul class="nav__pill">{links}</ul></nav>
  <div class="nav__end">
    {btn('Get in touch', cls='btn btn--sm')}
    <button class="menu-btn" aria-label="Open menu" aria-expanded="false" aria-controls="mobile-menu"><span></span><span></span></button>
  </div>
</header>
<div class="mobile-menu" id="mobile-menu">
{mobile}  {btn('Get in touch', cls='btn')}
</div>

'''

FOOTER = f'''<footer class="footer">
  <div class="wrap">
    <div class="footer__top">
      <div>
        <a class="wordmark" href="index.html">THINGBESIDE</a>
        <p>AI-powered efficiency, hand-crafted design. Your new site live in weeks, ready to win customers.</p>
      </div>
      <div>
        <h4>Pages</h4>
        <ul>{''.join(f'<li><a href="{f}">{n}</a></li>' for f, n in PAGES)}</ul>
      </div>
      <div>
        <h4>Contact</h4>
        <ul><li><a href="mailto:{EMAIL}">{EMAIL}</a></li><li><a href="contact.html">Book a free call</a></li><li>Brisbane, QLD</li></ul>
      </div>
    </div>
    <div class="footer__mark" aria-hidden="true"><span>THINGBESIDE</span></div>
    <div class="footer__legal">
      <span>© <span data-year>2026</span> THINGBESIDE · ABN 00 000 000 000</span>
      <a href="privacy.html">Privacy policy</a>
    </div>
  </div>
</footer>
</div>

<script src="assets/main.js?v=7"></script>
</body>
</html>
'''

def page(file, title, desc, body, current=None, extra_head='', preloader=False):
    pre = '<div class="preloader" aria-hidden="true">\n  <canvas></canvas>\n  <div class="preloader__count">000</div>\n</div>\n' if preloader else ''
    html = (head(title, desc, extra_head) + '<body>\n' + pre + nav(current) +
            '<div class="page entering">\n<main id="main">\n' + body + '</main>\n\n' + FOOTER)
    (OUT / file).write_text(html, encoding='utf8', newline='\n')
    print('wrote', file)

def page_hero(eyebrow, h1, sub):
    return f'''  <section class="page-hero">
    <div class="wrap head">
      <span class="eyebrow reveal">{eyebrow}</span>
      <h1 data-split data-load data-kinetic>{h1}</h1>
      <p class="sub" data-split data-load>{sub}</p>
    </div>
  </section>

'''

def side_intro(eyebrow, h2, h2_id, sub, cta='Get in touch', extra=''):
    btn_line = '' if cta is None else ('        <div class="reveal">' + btn(cta, cls='btn btn--sm') + '</div>' + chr(10))
    return f'''      <div class="side-intro">
        <span class="eyebrow">{eyebrow}</span>
        <h2 id="{h2_id}" data-split data-kinetic>{h2}</h2>
        <p class="sub reveal">{sub}</p>
{btn_line}{extra}      </div>
'''

# ---------------------------------------------------------------- work (case studies)
# (slug, name, description, tags, on_home)
CASES = [
    ('voltsonelectrical', 'Voltson Electrical',
     'Turns “electrician near me” searches into quote requests, with fixed upfront pricing and a one-tap call button.',
     ['Electrical', 'Web design', 'Lead generation'], True),
    ('fernmoorphysiotherapy', 'Fernmoor Physiotherapy',
     'Fills the appointment book by making same-week bookings and no-referral visits clear up front.',
     ['Healthcare', 'Bookings'], True),
    ('saltmereweddings', 'Saltmere Weddings',
     'Helps couples picture the day, compare packages and check their date in a couple of taps.',
     ['Weddings', 'Packages'], True),
    ('northbridgeconsulting', 'Northbridge Consulting',
     'Wins enquiries from leadership teams with clear results, proof in numbers and one booking path.',
     ['Consulting', 'Strategy'], False),
]

def case_card(slug, name, desc, tags, i):
    return f'''        <a class="case reveal" href="https://{slug}.framer.website/" target="_blank" rel="noopener">
          <div class="case__media">
            <img src="assets/work-{slug}.jpg" alt="{name} website homepage" width="1600" height="940" loading="lazy">
            <span class="case__visit" aria-hidden="true">{DIAG}</span>
          </div>
          <div class="case__info">
            <span class="case__tag">Concept project</span>
            <h3 class="case__title">{name}</h3>
            <p class="case__sub">{desc}</p>
          </div>
          <span class="sr-only">(opens the live {name} site in a new tab)</span>
        </a>
'''

def cases(home):
    picked = [c for c in CASES if c[4] or not home]
    return ''.join(case_card(*c[:4], i) for i, c in enumerate(picked))

def work_card(slug, name, desc, tags, i):
    chips = ''.join(f'<span>{t}</span>' for t in tags)
    return f'''        <article class="wcard reveal" style="--d:{(i % 2) * 90}ms">
          <a class="wcard__media" href="https://{slug}.framer.website/" target="_blank" rel="noopener">
            <img src="assets/work-{slug}.jpg" alt="{name} website homepage" width="1600" height="940" loading="lazy">
            <div class="wcard__over">
              <h3>{name}</h3>
              <div class="wcard__tags">{chips}</div>
            </div>
          </a>
          <p class="wcard__desc">{desc}</p>
        </article>
'''

def work_cards():
    return ''.join(work_card(*c[:4], i) for i, c in enumerate(CASES))

WORK_HOME = f'''  <!-- WORK -->
  <section class="section" id="work" aria-labelledby="work-title">
    <div class="wrap">
      <div class="head">
        <span class="eyebrow">Work</span>
        <h2 id="work-title" data-split data-kinetic>Selected work</h2>
        <p class="sub reveal">Concept and client projects for Australian businesses, each designed to look sharp and bring in enquiries.</p>
        <div class="reveal"><a class="link-arrow" href="work.html">View all work {ARROW}</a></div>
      </div>
      <div class="stack">
{cases(home=True)}      </div>
    </div>
  </section>

'''

# ---------------------------------------------------------------- services (accordion)
SERVICES = [
    ('Design', 'Website design', '1586717791821-3f44a563fa4c', 'Designer sketching website wireframes on a tablet',
     'A custom design built around your business and your customers. You see the homepage first, then we roll the look across every page.',
     ['Homepage-first, so you see the direction early', 'Copy written or polished for you', '2 rounds of revisions included']),
    ('Development', 'Framer development', '1559028012-481c04fa702d', 'Website layout being designed on a large monitor',
     'Fast, secure and smooth to use, with animations that make you look established on every screen size.',
     ['Mobile-first, responsive layouts', 'Forms that land in your inbox', 'A private preview link before launch']),
    ('Launch &amp; SEO', 'Launch and SEO basics', '1460925895917-afdab827c52f', 'Laptop showing website analytics charts',
     'Your site goes live properly set up, so Google can find it and customers searching in your area can find you.',
     ['Domain connected and site published', 'Titles and descriptions on every page', 'Speed, alt text and accessibility checks']),
    ('Care &amp; updates', 'Ongoing care and updates', '1512941937669-90a1b58e7e9c', 'Smartphone on a desk showing app icons',
     'A site you can update yourself. Change text and photos in minutes, or hand the bigger jobs to me.',
     ['A walkthrough on editing at handover', '14 days of free support after launch', 'Bigger changes at $90/hour']),
]

def accordion(static=False):
    items = ''
    n = len(SERVICES)
    for i, (label, title, img, alt, desc, incl) in enumerate(SERVICES, 1):
        open_ = static or i == 1
        if static:
            head = f'<div class="acc__head acc__head--static"><span class="acc__label">{label}</span></div>'
        else:
            head = (f'<button class="acc__head" aria-expanded="{"true" if open_ else "false"}" aria-controls="acc-{i}">'
                    f'<span class="acc__label">{label}</span><span class="acc__toggle" aria-hidden="true"></span></button>')
        items += f'''          <div class="acc__item{' open' if open_ else ''}">
            {head}
            <div class="acc__panel" id="acc-{i}" role="region"><div>
              <div class="acc__body">
                <div class="acc__text">
                  <h3>{title}</h3>
                  <p>{desc}</p>
                  <ul class="incl">{''.join(f'<li>{x}</li>' for x in incl)}</ul>
                  {btn('Get in touch', cls='btn btn--sm')}
                </div>
                <div class="acc__img"><img src="{U(img, 1000)}" alt="{alt}" loading="lazy"><span class="acc__count">{i:02d} / {n:02d}</span></div>
              </div>
            </div></div>
          </div>
'''
    return f'        <div class="acc reveal{" acc--static" if static else ""}">\n{items}        </div>\n'

def service_card(i, s):
    label, title, img, alt, desc, incl = s
    return f'''        <article class="svc-card reveal">
          <div class="svc-card__media"><img src="{U(img, 1000)}" alt="{alt}" loading="lazy"><span class="acc__count">{i:02d} / {len(SERVICES):02d}</span></div>
          <div class="svc-card__body">
            <span class="svc-card__label">{label}</span>
            <h3>{title}</h3>
            <p>{desc}</p>
            <ul class="incl">{''.join(f'<li>{x}</li>' for x in incl)}</ul>
            {btn('Get in touch', cls='btn btn--sm')}
          </div>
        </article>
'''

def services_section(soft, eyebrow, h2, sub, static=False):
    if static:
        cards = ''.join(service_card(i, s) for i, s in enumerate(SERVICES, 1))
        return f'''  <!-- SERVICES -->
  <section class="section" id="services" aria-labelledby="svc-title">
    <div class="wrap">
      <div class="svc-grid" data-stagger>
{cards}      </div>
    </div>
  </section>

'''
    return f'''  <!-- SERVICES -->
  <section class="section{' section--soft' if soft else ''}" id="services" aria-labelledby="svc-title">
    <div class="wrap split">
{side_intro(eyebrow, h2, 'svc-title', sub, cta=None)}{accordion(static)}    </div>
  </section>

'''

# ---------------------------------------------------------------- process (timeline)
STEPS = [
    ('Day 1 · 15 min', 'Discovery call', 'A free, no-pressure chat about your business, your customers and what you need your website to do. If we’re a good fit, I’ll send you a fixed quote and timeline.'),
    ('Days 2–4', 'Brief', 'You fill in a simple website brief covering your services, style, pages and examples you like. Don’t stress if you don’t have everything. I’ll help fill the gaps and write or polish your content.'),
    ('Week 1–2', 'Design', 'I design your homepage first so you can see the look and feel early. Once you’re happy with the direction, I design the remaining pages. This stage includes 2 rounds of revisions.'),
    ('Week 2–3', 'Build', 'I build your website in Framer with smooth animations, mobile-friendly layouts and SEO basics. You get a private preview link to check everything on your own phone and computer before it goes live.'),
    ('Week 3', 'Launch and support', 'I connect your domain, run final checks and put your site live. You’ll get a quick walkthrough on editing it yourself, plus 14 days of free support for any small fixes.'),
]

def process_section(soft):
    tl = ''.join(f'''          <li class="tl-step"><span class="tl-dot" aria-hidden="true">{i}</span><div class="tl-body"><span class="tl-when">Step {i} · {when}</span><h3>{title}</h3><p>{text}</p></div></li>
''' for i, (when, title, text) in enumerate(STEPS, 1))
    img = f'        <div class="process__img reveal"><img src="{U("1531403009284-440f080d1e12", 1200)}" alt="Hand arranging website wireframe sketches on a whiteboard" loading="lazy"></div>\n'
    return f'''  <!-- PROCESS -->
  <section class="section{' section--soft' if soft else ''}" id="process" aria-labelledby="process-title">
    <div class="wrap split">
{side_intro('Process', 'Simple, clear, and fast.', 'process-title', 'A proven five-step process that takes you from first chat to live website in weeks, with no surprises along the way.')}      <div class="timeline" data-timeline>
        <div class="tl-line" aria-hidden="true"><span class="tl-fill"></span></div>
        <ol class="tl-steps">
{tl}        </ol>
      </div>
    </div>
  </section>

'''

# ---------------------------------------------------------------- pricing (glow cards)
def plan(for_, name, desc, price, suffix, note, fine, items, pop=False, wide=False):
    cls = 'plan' + (' plan--pop' if pop else '') + (' plan--wide' if wide else '')
    badge = '<span class="plan__badge">Most popular</span>' if pop else ''
    lis = ''.join(f'<li><i>{CHECK}</i>{x}</li>' for x in items)
    return f'''        <article class="{cls}">
          <div class="plan__top">
            <div class="plan__row"><span class="plan__for">{for_}</span>{badge}</div>
            <h3>{name}</h3>
            <p class="plan__desc">{desc}</p>
            <div class="plan__price">$<span data-count="{price}">0</span><small>{suffix}</small></div>
            <span class="plan__note">{note}</span>
            <a class="plan__btn" href="contact.html"><span class="plan__btn-label"><span>Get in touch</span><span aria-hidden="true">Get in touch</span></span><i>{DIAG}</i></a>
            <span class="plan__fine">{fine}</span>
          </div>
          <div class="plan__list">
            <span>What’s included</span>
            <ul>{lis}</ul>
          </div>
        </article>
'''

PLANS_MAIN = (
    plan('For new businesses', 'One-Page Website', 'A single, focused page built to turn visitors into enquiries. Ideal for new businesses, promotions or capturing leads fast.',
         590, 'AUD', 'Starting price · one-off fee', 'Live within a week',
         ['One focused, scrolling page', 'Mobile-first custom design', 'Enquiry form to your inbox', 'SEO basics and domain setup', '14 days of free support'])
    + plan('For growing businesses', 'Business Website', 'A 5–10 page website designed around your business, not a template. Mobile-first, fast-loading and ready for Google.',
           1990, 'AUD', 'Starting price · one-off fee', 'Most sites go live in about 3 weeks',
           ['5–10 custom-designed pages', 'Mobile-first and fast-loading', 'SEO essentials on every page', '2 rounds of design revisions', 'Edit it yourself in Framer', '14 days of free support'], pop=True)
    + plan('For businesses with plenty to say', 'Large Website', 'A bigger, well-structured site with more pages, sections and content, organised so visitors find what they need easily.',
           3490, 'AUD', 'Starting price · one-off fee', 'Fixed quote after a free call',
           ['10+ pages and sections', 'Clear structure and navigation', 'Blog or CMS collections', 'SEO essentials on every page', '14 days of free support'])
)
PLANS_EXTRA = (
    plan('For slow or clunky sites', 'Website Rebuild', 'Stuck with a slow, clunky or hard-to-manage website? I’ll rebuild it in Framer and move your content across.',
         1490, 'AUD', 'Starting price · one-off fee', 'Keep your Google rankings',
         ['Rebuilt in Framer from scratch', 'Content moved across for you', 'Redirects set up for old pages', 'Faster, easier to manage'], wide=True)
    + plan('For live websites', 'Updates &amp; Changes', 'Simple text and image edits are yours to make in Framer’s easy editor. For bigger changes, I’m here to help.',
           90, '/hour', 'Pay only for the time used', 'Most updates take under two hours',
           ['New pages and sections', 'Seasonal and promo updates', 'Layout and design tweaks', 'Group changes to save money'], wide=True)
)

def pricing_section(soft):
    return f'''  <!-- PRICING -->
  <section class="section{' section--soft' if soft else ''}" id="pricing" aria-labelledby="pricing-title">
    <div class="wrap">
      <div class="head">
        <span class="eyebrow">Pricing</span>
        <h2 id="pricing-title" data-split data-kinetic>Straightforward pricing.</h2>
        <p class="sub reveal">Clear packages in AUD with no hidden fees. Pick a starting point, or ask for a custom quote.</p>
      </div>
      <div class="pricing" data-stagger>
{PLANS_MAIN}      </div>
      <div class="pricing pricing--extra" data-stagger>
{PLANS_EXTRA}      </div>
      <p class="note reveal">Every website is built in Framer, designed by me and sped up with AI, so you get quality work faster and at a fairer price.</p>
    </div>
  </section>

'''

# ---------------------------------------------------------------- about
FACTS = [
    (icon('<path d="M12 21s-7-6.1-7-11a7 7 0 0 1 14 0c0 4.9-7 11-7 11z"/><circle cx="12" cy="10" r="2.5"/>'), 'Brisbane, working worldwide', 'Remote-friendly, Australian hours'),
    (icon('<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>'), 'About 3 weeks', 'Typical project timeline'),
    (icon('<path d="m12 3 9 5-9 5-9-5 9-5z"/><path d="m3 13 9 5 9-5"/>'), 'Design, build &amp; launch', 'All handled in Framer'),
    (icon('<path d="M21 12a8 8 0 0 1-11.6 7.1L4 20l1-4.6A8 8 0 1 1 21 12z"/>'), 'One-on-one service', 'From first call to handover'),
]
ABOUT = f'''  <!-- ABOUT -->
  <section class="section" id="about" aria-labelledby="about-title">
    <div class="wrap about">
      <div class="about__body">
        <span class="about__kicker reveal">{icon('<path d="M5 3l14 7-6 2-2 6z"/>', fill='currentColor')}The person behind THINGBESIDE</span>
        <h2 id="about-title" data-split>Hi, I’m Seksan,<br>the human behind<br><span class="dim">THINGBESIDE.</span></h2>
        <p class="about__lead reveal">I create modern, high-performing websites that help businesses stand out and turn visitors into customers. I work one-on-one with tradies, local businesses and individuals, from Brisbane to anywhere.</p>
        <p class="about__em reveal">Personally designed. Thoughtfully built. Powered by smart technology.</p>
        <div class="facts" data-stagger>
{''.join(f'          <div class="fact">{ic}<div><b>{t}</b><span>{s}</span></div></div>' + chr(10) for ic, t, s in FACTS)}        </div>
      </div>
      <div class="about__photo reveal"><img src="assets/about-person.webp" width="1142" height="1377" loading="lazy" alt="Portrait of Seksan, the person behind THINGBESIDE, in silhouette against a red backdrop"></div>
    </div>
  </section>

'''

# ---------------------------------------------------------------- FAQ
QA = [
    ('What platform do you build websites on?', 'I build every website in Framer, a modern website builder trusted by startups and design studios worldwide. It gives you a fast, secure and great-looking site with smooth animations, and it’s easy for you to edit after launch.'),
    ('Do you use AI to make my website? Will it look generic?', 'AI helps me with the repetitive parts, like layout drafts and first-pass copy, so I work faster. Every site is then designed and built by me in Framer, with each detail refined by hand. Your site is built around your business, not a template.'),
    ('Do I need my own domain and hosting?', 'If you already have a domain, we’ll connect it to your Framer site. If not, I’ll help you set one up. Hosting is through Framer, so your site loads fast, stays secure and needs no technical setup from you.'),
    ('Can I update the website myself?', 'Yes. Framer has a simple visual editor, so you can change text, images and blog posts without touching any code. I’ll show you how at handover, or you can leave updates to me with a care plan.'),
]

def faq_section(soft):
    items = ''.join(f'''          <div class="faq__item">
            <button class="faq__q" aria-expanded="false" aria-controls="fa{i}">{q}<span class="faq__icon" aria-hidden="true"></span></button>
            <div class="faq__a" id="fa{i}" role="region"><div><p>{a}</p></div></div>
          </div>
''' for i, (q, a) in enumerate(QA, 1))
    return f'''  <!-- FAQ -->
  <section class="section{' section--soft' if soft else ''}" id="faq" aria-labelledby="faq-title">
    <div class="wrap">
      <div class="head">
        <span class="eyebrow">FAQ</span>
        <h2 id="faq-title" data-split data-kinetic>Questions? Answered.</h2>
        <p class="sub reveal">Everything you might want to know before we start. Can’t find your answer? Just ask.</p>
      </div>
      <div class="faq reveal">
{items}      </div>
    </div>
  </section>

'''

CTA = f'''  <!-- FINAL CTA -->
  <section class="cta" aria-labelledby="cta-title">
    <div class="cta__card">
      <div class="cta__glow" aria-hidden="true"></div>
      <h2 id="cta-title" data-split data-kinetic>Ready for a website that works?</h2>
      <p class="sub reveal">Book a free 15-minute call. Tell me about your business, and I’ll tell you how I’d build your site.</p>
      <div class="reveal">{btn('Get in touch')}</div>
    </div>
  </section>
'''

# ---------------------------------------------------------------- HOME
HERO = f'''  <!-- HERO -->
  <section class="hero" aria-labelledby="hero-title">
    <div class="hero__card">
      <div class="hero__glow" aria-hidden="true"></div>
      <div class="hero__media">
        <img src="assets/hero-vr.webp" alt="Person wearing a white VR headset, looking up" width="1354" height="835" fetchpriority="high">
      </div>
      <div class="hero__content">
        <p class="eyebrow reveal">Web design studio · Brisbane &amp; worldwide</p>
        <h1 id="hero-title" data-split data-load data-kinetic>Modern websites, built in days, <span class="grad-text">not months.</span></h1>
        <p class="sub" data-split data-load>AI-powered efficiency, hand-crafted design. Your new site live in weeks, ready to win customers.</p>
        <p class="hero__tag reveal" style="--d:500ms">Custom design · Mobile-first · Built in Framer</p>
        <div class="hero__cta reveal" style="--d:650ms">
          {btn('Get in touch')}
          <a class="btn btn--ghost" href="work.html"><span class="btn__label"><span>See my work</span><span aria-hidden="true">See my work</span></span></a>
        </div>
      </div>
      <div class="hero__scroll" aria-hidden="true"><i></i>Scroll</div>
    </div>
  </section>

'''

SCHEMA = f'''  <script type="application/ld+json">
  {{"@context":"https://schema.org","@type":"ProfessionalService","name":"THINGBESIDE","description":"Website design and Framer development for Australian small businesses.","founder":{{"@type":"Person","name":"Seksan Tonloh"}},"areaServed":["Brisbane","Australia","Worldwide"],"address":{{"@type":"PostalAddress","addressLocality":"Brisbane","addressRegion":"QLD","addressCountry":"AU"}},"email":"{EMAIL}","priceRange":"From AUD 590"}}
  </script>
'''

page('index.html', 'THINGBESIDE | Website Designer in Brisbane',
     'Modern, mobile-first websites for Australian tradies and local businesses. Designed by hand, built in Framer, live in weeks. Book a free 15-minute call.',
     HERO + WORK_HOME
     + services_section(True, 'Services', 'Everything you need to get online properly.', 'From design to launch, I handle your whole website so you can get back to running your business.')
     + process_section(False) + pricing_section(True) + ABOUT + faq_section(True) + CTA,
     current='index.html', extra_head=SCHEMA, preloader=True)

# ---------------------------------------------------------------- WORK
page('work.html', 'Work | THINGBESIDE Website Designer',
     'Concept and client website projects for Australian tradies, clinics, planners and consultancies, each designed to look sharp and bring in enquiries.',
     page_hero('Work', 'Selected work', 'Concept and client projects for Australian businesses, each designed to look sharp and bring in enquiries.')
     + f'''  <section class="section" style="padding-top:0" aria-label="Projects">
    <div class="wrap">
      <div class="cgrid">
{work_cards()}      </div>
      <p class="note reveal">Every project here is labelled honestly. Concept projects show how I approach a real business problem, built to the same standard as paid client work. Click any project to open the live site.</p>
    </div>
  </section>

''' + CTA, current='work.html')

# ---------------------------------------------------------------- SERVICES
page('services.html', 'Services | Website Design &amp; Framer Development',
     'Website design, Framer development, launch and SEO basics, and ongoing care. Clear AUD pricing from $590 with no hidden fees.',
     page_hero('Services', 'Everything you need to get online properly.', 'From design to launch, I handle your whole website so you can get back to running your business.')
     .replace('class="page-hero"', 'class="page-hero" style="padding-bottom:0"')
     + services_section(False, 'What I do', 'One person, start to finish.', 'Design, build, launch and care, all handled by me, so nothing gets lost between agencies.', static=True)
     + process_section(True) + pricing_section(False) + faq_section(True) + CTA, current='services.html')

# ---------------------------------------------------------------- CONTACT
CONTACT = f'''  <section class="section" style="padding-top:0" aria-label="Get in touch">
    <div class="wrap contact">
      <form class="form reveal" id="quote-form" action="https://formspree.io/f/mvkkdgyn" method="POST" novalidate>
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
        <div style="display:flex;flex-wrap:wrap;gap:16px;align-items:center;justify-content:space-between">
          <button class="btn" type="submit"><span class="btn__label"><span>Get in touch</span><span aria-hidden="true">Get in touch</span></span><span class="btn__icon">{ARROW}{ARROW}</span></button>
          <p class="form__ok" role="status">Thanks! Your message is in. I’ll be in touch within 24 hours.</p>
          <p class="form__err" role="alert">Something went wrong. Please try again, or email thingbeside@gmail.com.</p>
        </div>
      </form>
      <aside class="side">
        <div class="side-card side-card--glow reveal">
          <span class="status">Taking new projects</span>
          <h3>Book a free 15-minute call</h3>
          <p>A no-pressure chat about your business and your website. If we’re a good fit, you’ll get a fixed quote and timeline.</p>
          {btn('Book a free call', f'mailto:{EMAIL}?subject=Free%2015-minute%20call', 'btn btn--sm')}
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
     page_hero('Contact', 'Let’s build your website.', 'Tell me a little about your business and what you need. I’ll reply within 24 hours with next steps.')
     + CONTACT + faq_section(True), current='contact.html')

# ---------------------------------------------------------------- PRIVACY
page('privacy.html', 'Privacy Policy | THINGBESIDE',
     'How THINGBESIDE collects, uses and protects the personal information you share through this website.',
     page_hero('Legal', 'Privacy policy', 'How THINGBESIDE collects, uses and looks after your personal information.') + f'''  <section class="section" style="padding-top:0">
    <div class="prose reveal">
      <p><em>Template for review. Have this checked against the Australian Privacy Principles before launch.</em></p>
      <h2>What I collect</h2>
      <p>When you use the contact form or book a call, I collect your name, email address and anything you choose to tell me about your business.</p>
      <h2>How I use it</h2>
      <p>Only to reply to your enquiry, prepare a quote and deliver your project. I don’t sell or share your details with anyone for marketing.</p>
      <h2>Storage</h2>
      <p>Form submissions are handled by Framer and stored securely. Project files are kept only as long as needed to support your website.</p>
      <h2>Your choices</h2>
      <p>You can ask to see, correct or delete the information I hold about you at any time by emailing <a href="mailto:{EMAIL}">{EMAIL}</a>.</p>
    </div>
  </section>

''' + CTA)
