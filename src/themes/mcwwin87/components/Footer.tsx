'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useTenant } from '../../../core/tenant/TenantProvider';
import FooterAppInstall from '../../../components/shared/FooterAppInstall';
import { useI18n } from '../../../core/i18n/LanguageProvider';

export default function Footer() {
  const year = new Date().getFullYear();
  const { tenant } = useTenant();
  const { t } = useI18n();
  const [aboutOpen, setAboutOpen] = useState(false);
  const social = tenant.social ?? {};
  const SOCIAL = [
    { key: 'facebook', icon: 'facebook.svg', label: 'Facebook' },
    { key: 'telegram', icon: 'telegram-channel.svg', label: 'Telegram' },
    { key: 'instagram', icon: 'instagram.svg', label: 'Instagram' },
    { key: 'youtube', icon: 'youtube.svg', label: 'YouTube' },
  ];
  const socialItems = SOCIAL.map((x) => ({ ...x, url: (social[x.key] ?? '').trim() })).filter((x) => x.url);

  // Owner-set payment logos (from public config) take priority; otherwise fall
  // back to the bundled static set so the footer is never empty.
  const ownerLogos = (tenant.paymentMethodLogos ?? []).filter((p) => p?.imageUrl);
  const STATIC_PAYMENTS = [
    'pay16', 'pay22', 'pay33', 'pay34', 'pay45', 'pay48', 'pay59', 'pay60', 'pay61',
  ];

  return (
    <>
      <FooterAppInstall />
      <footer className="footer">
      <div className="container">

        {/* About block */}
        <div className="footer__about-block">
          <div className="footer__about-logo">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img className="brand-logo" src="/assets/images/logo/logo.webp" alt="Logo" style={{ height: '36px' }} />
          </div>
          <h3 className="footer__about-title">{t('footer.aboutTitle')}</h3>
          <div className={`footer__about-text ${aboutOpen ? 'expanded' : ''}`} id="footerAbout">
            <p>{t('footer.about1')}</p>
            <p>{t('footer.about2')}</p>
            <p>{t('footer.about3')}</p>
            <p>{t('footer.about4')}</p>
            <p>{t('footer.about5')}</p>
          </div>
          <button className="btn btn--secondary footer__readmore" type="button" onClick={() => setAboutOpen((o) => !o)}>
            {aboutOpen ? t('footer.readLess') : t('footer.readMore')} <span className="footer__readmore-arrow" style={{ transform: aboutOpen ? 'rotate(180deg)' : 'none' }}>&#9662;</span>
          </button>
        </div>

        {/* Footer top cols */}
        <div className="footer__cols footer__cols--top">
          <div className="footer__col footer__col--partners">
            <h4>{t('footer.partners')}</h4>
            <div className="footer__orgs">
              <div className="footer__org">
                <span className="footer__org-logo">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src="/assets/images/partners/atletico-de-madrid.png" alt="Atlético de Madrid" />
                </span>
                <div><strong>Atlético de Madrid</strong><small>Official Regional Partner</small></div>
              </div>
              <div className="footer__org">
                <span className="footer__org-logo">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src="/assets/images/partners/bundesliga.png" alt="Bundesliga" />
                </span>
                <div><strong>Bundesliga</strong><small>Regional Betting Partner - Asia</small></div>
              </div>
            </div>
          </div>
          <div className="footer__col">
            <h4>{t('footer.brandAmbassadors')}</h4>
            <div className="footer__org">
              <span className="footer__org-logo">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/assets/images/brand-ambassadors/anrich-nortje.png" alt="Anrich Nortje" />
              </span>
              <div><strong>Anrich Nortje</strong><small>South African Cricketer</small></div>
            </div>
          </div>
        </div>

        {/* Footer bottom cols */}
        <div className="footer__cols footer__cols--bottom">
          <div className="footer__col">
            <h4>{t('footer.gamingLicense')}</h4>
            <div className="footer__badges">
              <span className="footer__badge">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/assets/images/gamin-license/license1.png" alt="Gaming Curacao" />
              </span>
              <span className="footer__badge">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/assets/images/gamin-license/anjouan-egaming.png" alt="Anjouan eGaming" />
              </span>
            </div>
          </div>
          <div className="footer__col">
            <h4>{t('footer.officialBrandPartner')}</h4>
            <div className="footer__badges">
              <span className="footer__badge">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/assets/images/offricial-brand-partner/new-city-vip.png" alt="New City VIP" />
              </span>
            </div>
          </div>
          <div className="footer__col">
            <h4>{t('footer.appDownload')}</h4>
            <div className="footer__badges">
              <span className="footer__badge">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/assets/images/app-download/android-download.svg" alt="Android Download" />
              </span>
            </div>
          </div>
          {socialItems.length > 0 && (
          <div className="footer__col">
            <h4>{t('footer.communityWebsites')}</h4>
            <div className="footer__social">
              {socialItems.map((s) => (
                <a key={s.key} href={s.url} target="_blank" rel="noopener noreferrer" aria-label={s.label}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={`/assets/images/social-icons/${s.icon}`} alt={s.label} />
                </a>
              ))}
            </div>
          </div>
          )}
        </div>

        {/* Payment methods */}
        <div className="footer__payments">
          <h4>{t('footer.paymentMethods')}</h4>
          <div className="footer__pay-list">
            {ownerLogos.length > 0
              ? ownerLogos.map((p, i) => {
                  const img = (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={p.imageUrl} alt={p.name || 'Payment method'} />
                  );
                  return (
                    <span key={`${p.imageUrl}-${i}`} className="pay">
                      {p.link ? (
                        <a href={p.link} target="_blank" rel="noopener noreferrer">{img}</a>
                      ) : img}
                    </span>
                  );
                })
              : STATIC_PAYMENTS.map((p) => (
                  <span key={p} className="pay">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={`/assets/images/payment-methods/${p}.png`} alt={p} />
                  </span>
                ))}
          </div>
        </div>

        {/* Legal links */}
        <div className="footer__legal">
          <Link href="/pages/about-us">{t('footer.aboutUs')}</Link><span>|</span>
          <Link href="/pages/privacy-policy">{t('footer.privacyPolicy')}</Link><span>|</span>
          <Link href="/pages/terms">{t('footer.terms')}</Link><span>|</span>
          <Link href="/pages/security">{t('footer.security')}</Link><span>|</span>
          <Link href="/pages/responsible-gaming">{t('footer.responsibleGaming')}</Link><span>|</span>
          <Link href="/pages/for-age-18-and-above-only">18+ Only</Link><span>|</span>
          <Link href="/pages/faq">{t('footer.faq')}</Link>
        </div>
      </div>

      {/* Copyright bar */}
      <div className="footer__bottom">
        <div className="container footer__bottom-inner">
          <span>&copy; {year} NCW Copyrights. All Rights Reserved</span>
          <div className="footer__cert">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/assets/images/footer-logos/gamcare.svg" alt="GamCare" className="footer__cert-icon" />
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/assets/images/footer-logos/age-limit.svg" alt="18+" className="footer__cert-icon" />
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/assets/images/footer-logos/regulations.svg" alt="Regulations" className="footer__cert-icon" />
          </div>
        </div>
      </div>
    </footer>
    </>
  );
}
