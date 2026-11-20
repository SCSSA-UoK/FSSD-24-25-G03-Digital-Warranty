import React from 'react';
import { Link } from 'react-router-dom';
import {
  ShieldCheck,
  QrCode,
  FileText,
  Store,
  ArrowRight,
  LayoutDashboard,
  Star,
  Lock,
  Sparkles,
  RefreshCw,
  Smartphone,
  Award,
  CheckCircle2,
  Clock,
  Layers,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const Landing: React.FC = () => {
  const { user } = useAuth();

  const getDashboardRoute = () => {
    if (!user) return '/login';
    if (user.role === 'ADMIN') return '/admin';
    if (user.role === 'RETAILER') return '/retailer';
    return '/customer';
  };

  return (
    <div className="space-y-20 sm:space-y-28 py-6 sm:py-12">
      {/* 1. HERO SECTION */}
      <section className="text-center max-w-4xl mx-auto space-y-6 pt-2 sm:pt-6 px-3">
        {/* Eyebrow Badge */}
        <div className="inline-flex items-center gap-2.5 bg-[#C5D8C4] dark:bg-[#163C27] border border-[#AEC5AD] dark:border-[#245D3B] text-[#133A24] dark:text-[#86E4AE] px-4.5 py-1.5 rounded-full text-xs font-semibold tracking-wider uppercase shadow-xs">
          <Sparkles className="w-3.5 h-3.5 text-[#1E5234] dark:text-[#86E4AE] shrink-0" />
          <span>Botanical Digital Warranty Ecosystem</span>
        </div>

        {/* Editorial Serif Headline */}
        <h1 className="font-serif text-4xl sm:text-6xl lg:text-7xl font-normal text-[#0C2114] dark:text-[#F3F7F2] tracking-tight leading-[1.12]">
          Say goodbye to lost paper receipts &amp;{' '}
          <span className="italic font-light text-[#1F5437] dark:text-[#86E4AE]">
            fragile warranty cards.
          </span>
        </h1>

        {/* Subtitle */}
        <p className="text-base sm:text-lg lg:text-xl text-[#345741] dark:text-[#A7C8B4] max-w-2xl mx-auto font-sans leading-relaxed">
          WarranTrack centralizes warranties from participating retailers into one unified,
          tamper-evident vault. Verify coverage via cryptographic QR tokens, submit audited claims,
          and track repairs in real-time.
        </p>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-3.5 pt-4 w-full max-w-md sm:max-w-none mx-auto">
          {user ? (
            <Link
              to={getDashboardRoute()}
              className="w-full sm:w-auto px-8 py-3.5 bg-[#17432A] dark:bg-[#F5EFE6] text-[#F3F7F2] dark:text-[#0C2114] font-bold rounded-full hover:bg-[#113521] dark:hover:bg-[#EBE2D4] shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2.5 text-sm sm:text-base group"
            >
              <LayoutDashboard className="w-4 h-4 shrink-0 text-[#86E4AE] dark:text-[#17432A]" />
              <span>
                Go to {user.role === 'ADMIN' ? 'Platform' : user.role === 'RETAILER' ? 'Retailer' : 'My'}{' '}
                Dashboard
              </span>
              <ArrowRight className="w-4 h-4 shrink-0 group-hover:translate-x-1 transition-transform" />
            </Link>
          ) : (
            <>
              <Link
                to="/register"
                className="w-full sm:w-auto px-8 py-3.5 bg-[#17432A] dark:bg-[#F5EFE6] text-[#F3F7F2] dark:text-[#0C2114] font-bold rounded-full hover:bg-[#113521] dark:hover:bg-[#EBE2D4] shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2.5 text-sm sm:text-base group"
              >
                <span>Create Customer Account</span>
                <ArrowRight className="w-4 h-4 shrink-0 group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link
                to="/register/retailer"
                className="w-full sm:w-auto px-8 py-3.5 bg-[#DEE9DC] dark:bg-[#122E1F] text-[#0C2114] dark:text-[#EDF2EB] font-semibold rounded-full border border-[#BDD0BC] dark:border-[#215436] hover:bg-[#D4E3D3] dark:hover:bg-[#173A27] shadow-xs transition-all flex items-center justify-center gap-2 text-sm sm:text-base"
              >
                <Store className="w-4 h-4 text-[#1E5234] dark:text-[#86E4AE] shrink-0" />
                <span>Retailer Registration</span>
              </Link>
            </>
          )}
        </div>

        {/* Minimalist Trust Metric Strip */}
        <div className="pt-8 sm:pt-12 grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 border-t border-[#C0D1BF] dark:border-[#1A422B] max-w-3xl mx-auto">
          <div className="text-center space-y-1">
            <div className="font-serif text-2xl sm:text-3xl font-bold text-[#143D26] dark:text-[#86E4AE]">
              100%
            </div>
            <div className="text-xs text-[#476B53] dark:text-[#8EAE9A] font-medium tracking-wide">
              Tamper-Proof QR
            </div>
          </div>
          <div className="text-center space-y-1">
            <div className="font-serif text-2xl sm:text-3xl font-bold text-[#143D26] dark:text-[#86E4AE]">
              0 Sheets
            </div>
            <div className="text-xs text-[#476B53] dark:text-[#8EAE9A] font-medium tracking-wide">
              Paper Waste
            </div>
          </div>
          <div className="text-center space-y-1">
            <div className="font-serif text-2xl sm:text-3xl font-bold text-[#143D26] dark:text-[#86E4AE]">
              &lt; 2 min
            </div>
            <div className="text-xs text-[#476B53] dark:text-[#8EAE9A] font-medium tracking-wide">
              Claim Submissions
            </div>
          </div>
          <div className="text-center space-y-1">
            <div className="font-serif text-2xl sm:text-3xl font-bold text-[#143D26] dark:text-[#86E4AE]">
              1 Vault
            </div>
            <div className="text-xs text-[#476B53] dark:text-[#8EAE9A] font-medium tracking-wide">
              All Retailers
            </div>
          </div>
        </div>
      </section>

      {/* 2. ARCHED CATEGORY TILES (Inspired by the botanical capsule cards in reference) */}
      <section className="space-y-8">
        <div className="text-center max-w-xl mx-auto space-y-2">
          <div className="text-[11px] font-bold uppercase tracking-widest text-[#1E5234] dark:text-[#86E4AE]">
            Curated Capabilities
          </div>
          <h2 className="font-serif text-3xl sm:text-4xl text-[#0C2114] dark:text-[#F3F7F2]">
            Explore the Ecosystem
          </h2>
          <p className="text-sm text-[#476B53] dark:text-[#A7C8B4]">
            Harmonizing retailers, buyers, and service centers into a single digital ledger.
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3.5 sm:gap-4">
          {[
            {
              title: 'QR Token Vault',
              subtitle: 'Cryptographic Proof',
              icon: QrCode,
              desc: 'Instant verification without exposing private buyer data.',
            },
            {
              title: 'Multi-Store Wallet',
              subtitle: 'Unified Access',
              icon: Layers,
              desc: 'Consolidate electronics, appliances, and luxury goods.',
            },
            {
              title: 'Audited Claims',
              subtitle: 'Transparent Service',
              icon: FileText,
              desc: 'Track inspection, merchant review, and fulfillment live.',
            },
            {
              title: 'POS Terminal',
              subtitle: 'Merchant Direct',
              icon: Store,
              desc: 'Generate digital warranties instantly at checkout counters.',
            },
            {
              title: 'Expiry Alerts',
              subtitle: 'Proactive Reminders',
              icon: Clock,
              desc: 'Automatic notifications before policy terms lapse.',
            },
            {
              title: 'Fraud Shield',
              subtitle: 'Zero Duplication',
              icon: ShieldCheck,
              desc: 'Single-use claim locking prevents duplicate warranties.',
            },
          ].map((item, idx) => {
            const Icon = item.icon;
            return (
              <div
                key={idx}
                className="group relative bg-[#E1EDE0] dark:bg-[#122E1F] border border-[#BDD0BC] dark:border-[#1E4C32] rounded-t-[40px] rounded-b-2xl p-5 text-center flex flex-col items-center justify-between space-y-4 hover:border-[#17432A] dark:hover:border-[#86E4AE] hover:shadow-md transition-all duration-300"
              >
                <div className="w-12 h-12 rounded-full bg-[#C7D9C6] dark:bg-[#183D28] border border-[#B0C7AE] dark:border-[#255A3A] text-[#133A24] dark:text-[#86E4AE] flex items-center justify-center group-hover:scale-110 transition-transform shadow-xs">
                  <Icon className="w-5 h-5" />
                </div>
                <div className="space-y-1">
                  <div className="text-xs font-serif font-bold text-[#0C2114] dark:text-[#F3F7F2] tracking-tight">
                    {item.title}
                  </div>
                  <div className="text-[11px] text-[#1E5234] dark:text-[#86E4AE] font-semibold">
                    {item.subtitle}
                  </div>
                </div>
                <p className="text-[11px] text-[#476B53] dark:text-[#8EAE9A] leading-snug">
                  {item.desc}
                </p>
              </div>
            );
          })}
        </div>
      </section>

      {/* 3. SHOWCASE PILLARS */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
        <div className="bg-[#E1EDE0] dark:bg-[#122E1F] p-7 rounded-3xl border border-[#BDD0BC] dark:border-[#1E4C32] shadow-xs space-y-4 transition-all hover:border-[#17432A]/50 dark:hover:border-[#86E4AE]/50 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="bg-[#C7D9C6] dark:bg-[#183D28] text-[#133A24] dark:text-[#86E4AE] border border-[#B0C7AE] dark:border-[#255A3A] w-12 h-12 rounded-2xl flex items-center justify-center shadow-xs">
              <QrCode className="w-6 h-6" />
            </div>
            <div className="space-y-1.5">
              <span className="text-[11px] uppercase tracking-wider font-bold text-[#1E5234] dark:text-[#86E4AE]">
                Zero Privacy Leaks
              </span>
              <h3 className="font-serif text-xl sm:text-2xl font-bold text-[#0C2114] dark:text-[#F3F7F2]">
                Instant QR Verification
              </h3>
            </div>
            <p className="text-sm text-[#476B53] dark:text-[#A7C8B4] leading-relaxed">
              Every item receives a cryptographic verification token. Authorized service centers scan
              and validate warranty terms instantly without accessing private customer phone
              numbers or addresses.
            </p>
          </div>
          <div className="pt-2 text-xs font-semibold text-[#143D26] dark:text-[#86E4AE] flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-[#1E5234] dark:text-[#86E4AE]" />
            <span>Cryptographic proof of purchase</span>
          </div>
        </div>

        <div className="bg-[#E1EDE0] dark:bg-[#122E1F] p-7 rounded-3xl border border-[#BDD0BC] dark:border-[#1E4C32] shadow-xs space-y-4 transition-all hover:border-[#17432A]/50 dark:hover:border-[#86E4AE]/50 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="bg-[#C7D9C6] dark:bg-[#183D28] text-[#133A24] dark:text-[#86E4AE] border border-[#B0C7AE] dark:border-[#255A3A] w-12 h-12 rounded-2xl flex items-center justify-center shadow-xs">
              <Layers className="w-6 h-6" />
            </div>
            <div className="space-y-1.5">
              <span className="text-[11px] uppercase tracking-wider font-bold text-[#1E5234] dark:text-[#86E4AE]">
                One Sovereign Vault
              </span>
              <h3 className="font-serif text-xl sm:text-2xl font-bold text-[#0C2114] dark:text-[#F3F7F2]">
                Universal Customer Wallet
              </h3>
            </div>
            <p className="text-sm text-[#476B53] dark:text-[#A7C8B4] leading-relaxed">
              Never hunt through physical drawers or scattered email inboxes again. Purchases made at
              any certified merchant automatically link to your universal warranty account.
            </p>
          </div>
          <div className="pt-2 text-xs font-semibold text-[#143D26] dark:text-[#86E4AE] flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-[#1E5234] dark:text-[#86E4AE]" />
            <span>Cross-retailer purchase linking</span>
          </div>
        </div>

        <div className="bg-[#E1EDE0] dark:bg-[#122E1F] p-7 rounded-3xl border border-[#BDD0BC] dark:border-[#1E4C32] shadow-xs space-y-4 transition-all hover:border-[#17432A]/50 dark:hover:border-[#86E4AE]/50 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="bg-[#C7D9C6] dark:bg-[#183D28] text-[#133A24] dark:text-[#86E4AE] border border-[#B0C7AE] dark:border-[#255A3A] w-12 h-12 rounded-2xl flex items-center justify-center shadow-xs">
              <RefreshCw className="w-6 h-6" />
            </div>
            <div className="space-y-1.5">
              <span className="text-[11px] uppercase tracking-wider font-bold text-[#1E5234] dark:text-[#86E4AE]">
                Full Transparency
              </span>
              <h3 className="font-serif text-xl sm:text-2xl font-bold text-[#0C2114] dark:text-[#F3F7F2]">
                Audited Claim Lifecycle
              </h3>
            </div>
            <p className="text-sm text-[#476B53] dark:text-[#A7C8B4] leading-relaxed">
              Follow every step of repair, replacement, or warranty settlement. Complete chronological
              audit logs ensure both consumer and merchant share an undisputed record.
            </p>
          </div>
          <div className="pt-2 text-xs font-semibold text-[#143D26] dark:text-[#86E4AE] flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-[#1E5234] dark:text-[#86E4AE]" />
            <span>Immutable timestamped event trails</span>
          </div>
        </div>
      </section>

      {/* 4. TESTIMONIALS */}
      <section className="space-y-8 bg-[#D8E6D7] dark:bg-[#0F281B] p-6 sm:p-10 rounded-3xl border border-[#BDD0BC] dark:border-[#1A442C]">
        <div className="text-center max-w-xl mx-auto space-y-2">
          <div className="text-[11px] font-bold uppercase tracking-widest text-[#1E5234] dark:text-[#86E4AE]">
            Verified Community
          </div>
          <h2 className="font-serif text-3xl sm:text-4xl text-[#0C2114] dark:text-[#F3F7F2]">
            Trusted by Buyers &amp; Merchants
          </h2>
          <p className="text-sm text-[#476B53] dark:text-[#A7C8B4]">
            Hear how businesses and everyday consumers experience frictionless after-sales protection.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            {
              quote:
                'No more keeping stacks of paper bills in shoeboxes. When my coffee machine failed, the technician scanned the QR code in my phone and approved the warranty in under a minute.',
              author: 'Ayesha K.',
              role: 'Verified Customer',
              stars: 5,
            },
            {
              quote:
                'As an electronics retailer, our disputed warranty claims dropped by 85%. WarranTrack eliminated fraudulent claims and customer receipt loss completely.',
              author: 'Marcus Vance',
              role: 'Retail Store Owner',
              stars: 5,
            },
            {
              quote:
                'The transparent claim tracking is exceptional. I could see exactly when the retailer approved my replacement without endless support emails.',
              author: 'Sarah M.',
              role: 'Verified Consumer',
              stars: 5,
            },
          ].map((item, idx) => (
            <div
              key={idx}
              className="bg-[#E1EDE0] dark:bg-[#122E1F] p-6 rounded-2xl border border-[#BDD0BC] dark:border-[#1E4C32] space-y-3.5 shadow-xs flex flex-col justify-between"
            >
              <div className="flex items-center gap-1 text-[#227142] dark:text-[#86E4AE]">
                {[...Array(item.stars)].map((_, s) => (
                  <Star key={s} className="w-4 h-4 fill-current" />
                ))}
              </div>
              <p className="font-serif italic text-sm text-[#1F452E] dark:text-[#E2ECE5] leading-relaxed">
                "{item.quote}"
              </p>
              <div className="pt-2 border-t border-[#CCD9CB] dark:border-[#1A442C] flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold text-[#0C2114] dark:text-[#F3F7F2]">
                    {item.author}
                  </div>
                  <div className="text-[10px] text-[#476B53] dark:text-[#8EAE9A]">
                    {item.role}
                  </div>
                </div>
                <Award className="w-4 h-4 text-[#1E5234] dark:text-[#86E4AE]" />
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 5. MINIMALIST GUARANTEE STRIP */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 py-4 border-y border-[#BDD0BC] dark:border-[#1E4C32]">
        <div className="flex items-center gap-3 p-2">
          <Lock className="w-5 h-5 text-[#1E5234] dark:text-[#86E4AE] shrink-0" />
          <div>
            <div className="text-xs font-bold text-[#0C2114] dark:text-[#F3F7F2]">
              Cryptographic Tokens
            </div>
            <div className="text-[11px] text-[#476B53] dark:text-[#8EAE9A]">
              Tamper-evident verification
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3 p-2">
          <Smartphone className="w-5 h-5 text-[#1E5234] dark:text-[#86E4AE] shrink-0" />
          <div>
            <div className="text-xs font-bold text-[#0C2114] dark:text-[#F3F7F2]">
              Mobile-First Pass
            </div>
            <div className="text-[11px] text-[#476B53] dark:text-[#8EAE9A]">
              Instant QR scanning anywhere
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3 p-2">
          <CheckCircle2 className="w-5 h-5 text-[#1E5234] dark:text-[#86E4AE] shrink-0" />
          <div>
            <div className="text-xs font-bold text-[#0C2114] dark:text-[#F3F7F2]">
              Zero Paper Loss
            </div>
            <div className="text-[11px] text-[#476B53] dark:text-[#8EAE9A]">
              Permanent digital archive
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3 p-2">
          <Award className="w-5 h-5 text-[#1E5234] dark:text-[#86E4AE] shrink-0" />
          <div>
            <div className="text-xs font-bold text-[#0C2114] dark:text-[#F3F7F2]">
              Certified Retailers
            </div>
            <div className="text-[11px] text-[#476B53] dark:text-[#8EAE9A]">
              Direct warranty issuance
            </div>
          </div>
        </div>
      </section>

      {/* 6. CALL TO ACTION BANNER */}
      <section className="bg-[#17432A] dark:bg-[#11291B] text-[#F3F7F2] p-8 sm:p-12 rounded-3xl border border-[#235838] dark:border-[#1E4C32] shadow-lg flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="space-y-2 max-w-xl text-center md:text-left">
          <div className="text-[11px] font-bold uppercase tracking-widest text-[#86E4AE]">
            Ready to upgrade your warranties?
          </div>
          <h3 className="font-serif text-2xl sm:text-3xl text-white">
            Join the Next Generation of After-Sales Protection.
          </h3>
          <p className="text-xs sm:text-sm text-[#B2D6C0] leading-relaxed">
            Create an account in 60 seconds to link your first product or register as a partner
            retailer to issue digital warranty certificates.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto shrink-0">
          <Link
            to="/register"
            className="w-full sm:w-auto px-6 py-3 bg-[#F5EFE6] hover:bg-[#EBE2D4] text-[#0C2114] font-bold text-xs sm:text-sm rounded-full shadow-md transition text-center"
          >
            Start Free Today
          </Link>
          <Link
            to="/register/retailer"
            className="w-full sm:w-auto px-6 py-3 bg-transparent hover:bg-white/10 text-white border border-[#86E4AE]/50 font-semibold text-xs sm:text-sm rounded-full transition text-center"
          >
            Become a Partner Retailer
          </Link>
        </div>
      </section>
    </div>
  );
};
