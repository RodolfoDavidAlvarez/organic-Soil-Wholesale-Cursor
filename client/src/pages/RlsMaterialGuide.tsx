import { Helmet } from 'react-helmet-async';
import { Link, useLocation } from 'wouter';
import RlsBrandMark from '@/components/RlsBrandMark';
import guides from '@/features/landscaper-supply/material-guides.json';
import { ArrowLeft, ArrowUpRight, MapPin } from 'lucide-react';

export default function RlsMaterialGuide() {
  const [location] = useLocation();
  const slug = location.match(/^\/materials\/([^/]+)\/?$/)?.[1];
  const guide = slug ? guides.find((item) => item.slug === slug) : undefined;

  if (!guide) {
    return <main className="rls rls-guide rls-guide-missing"><h1>Material guide not found</h1><Link href="/">Browse current landscape materials</Link></main>;
  }

  const canonical = `https://regenerativelandscapersupply.com/materials/${guide.slug}`;

  return <div className="rls rls-guide">
    <Helmet>
      <title>{guide.title}</title>
      <meta name="description" content={guide.description}/>
      <meta name="robots" content="index,follow,max-image-preview:large"/>
      <link rel="canonical" href={canonical}/>
      <meta property="og:type" content="product"/>
      <meta property="og:title" content={guide.title}/>
      <meta property="og:description" content={guide.description}/>
      <meta property="og:url" content={canonical}/>
      <meta property="og:image" content={`https://regenerativelandscapersupply.com${guide.image}`}/>
    </Helmet>
    <header className="rls-header">
      <Link href="/" className="rls-brand"><RlsBrandMark size={36}/><span>REGENERATIVE<small>LANDSCAPER SUPPLY</small></span></Link>
      <nav><Link href="/#materials">Materials</Link><Link href="/#planning">Plan your job</Link><Link href="/cart" className="rls-bag">Material list</Link></nav>
    </header>
    <main>
      <section className="rls-guide-hero">
        <nav aria-label="Breadcrumb" className="rls-guide-breadcrumb"><Link href="/">Home</Link><span aria-hidden="true">/</span><Link href="/#materials">Landscape materials</Link><span aria-hidden="true">/</span><span aria-current="page">{guide.name}</span></nav>
        <div className="rls-guide-layout">
          <div><div className="rls-eyebrow">{guide.category} · PHOENIX, ARIZONA</div><h1>{guide.name}</h1><p className="rls-guide-summary">{guide.summary}</p><p>{guide.details}</p><div className="rls-guide-actions"><Link className="rls-button" href="/#materials">See live formats and prices <ArrowUpRight size={18}/></Link><Link className="rls-button rls-secondary" href={`/quote?product=${encodeURIComponent(guide.name)}`}>Request a job quote</Link></div></div>
          <img src={guide.image} alt={`${guide.name} for landscape projects`} loading="eager"/>
        </div>
      </section>
      <section className="rls-section rls-guide-content"><div className="rls-eyebrow">PLANNING YOUR PROJECT</div><h2>Where it fits on the job</h2><ul>{guide.uses.map((use) => <li key={use}>{use}</li>)}</ul><p>Application rates and coverage vary with the material and site conditions. Confirm the recommended quantity and current availability before you schedule the crew.</p></section>
      <section className="rls-section rls-guide-pickup"><MapPin aria-hidden="true"/><div><h2>Phoenix pickup and Arizona delivery</h2><p>Pickup is fulfilled through Organic Soil Wholesale at 1634 N 19th Ave, Phoenix, AZ 85009. Jobsite delivery depends on the material, load size, destination, truck access, and schedule.</p><Link href="/#materials">Browse all landscape materials <ArrowLeft size={18}/></Link></div></section>
    </main>
    <footer className="rls-footer"><div className="rls-brand"><RlsBrandMark size={32}/><span>REGENERATIVE<small>LANDSCAPER SUPPLY</small></span></div><p>A Soil Seed &amp; Water brand.<br/>Ordering and fulfillment through Organic Soil Wholesale.</p><a href="tel:+16232633386">(623) 263-3386</a><Link href="/">Back to Regenerative Landscaper Supply</Link></footer>
  </div>;
}
