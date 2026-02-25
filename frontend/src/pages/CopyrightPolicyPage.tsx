import React from 'react';
import { Link } from '@tanstack/react-router';
import { Shield, FileText, AlertTriangle, Mail, ChevronRight } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { getTranslation } from '../i18n/translations';

export default function CopyrightPolicyPage() {
  const { currentLanguage } = useLanguage();
  const t = (key: string) => getTranslation(currentLanguage, key);

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1.5 text-sm text-muted-foreground mb-8">
        <Link to="/" className="hover:text-foreground transition-colors">
          {t('home')}
        </Link>
        <ChevronRight className="w-3.5 h-3.5" />
        <span className="text-foreground font-medium">{t('copyrightPolicy')}</span>
      </nav>

      {/* Hero */}
      <div className="flex items-start gap-4 mb-10">
        <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
          <Shield className="w-6 h-6 text-primary" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">{t('copyrightPolicy')}</h1>
          <p className="text-muted-foreground">
            Last updated: February 25, 2026
          </p>
        </div>
      </div>

      {/* Intro */}
      <div className="prose prose-sm max-w-none text-foreground mb-10">
        <p className="text-base text-muted-foreground leading-relaxed">
          Mediatube respects the intellectual property rights of others and expects its users to do the same.
          In accordance with the Digital Millennium Copyright Act (DMCA) and other applicable copyright laws,
          we will respond to notices of alleged copyright infringement that comply with applicable law and are
          properly provided to us.
        </p>
      </div>

      {/* Sections */}
      <div className="space-y-10">
        {/* Section 1 */}
        <section>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <FileText className="w-4 h-4 text-primary" />
            </div>
            <h2 className="text-xl font-semibold text-foreground">1. Content Ownership</h2>
          </div>
          <div className="pl-11 space-y-3 text-muted-foreground leading-relaxed">
            <p>
              When you upload content to Mediatube, you retain all ownership rights to your original content.
              By uploading, you grant Mediatube a worldwide, non-exclusive, royalty-free license to host,
              store, and display your content solely for the purpose of operating the platform.
            </p>
            <p>
              You represent and warrant that:
            </p>
            <ul className="list-disc pl-5 space-y-1.5">
              <li>You own or have the necessary rights to the content you upload.</li>
              <li>Your content does not infringe any third-party intellectual property rights.</li>
              <li>You have obtained all necessary permissions, licenses, and consents for any third-party material included in your content.</li>
              <li>Your content complies with all applicable laws and regulations.</li>
            </ul>
          </div>
        </section>

        {/* Section 2 */}
        <section>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <AlertTriangle className="w-4 h-4 text-primary" />
            </div>
            <h2 className="text-xl font-semibold text-foreground">2. DMCA Takedown Process</h2>
          </div>
          <div className="pl-11 space-y-3 text-muted-foreground leading-relaxed">
            <p>
              If you believe that content on Mediatube infringes your copyright, you may submit a DMCA
              takedown notice. To be effective, your notice must include:
            </p>
            <ol className="list-decimal pl-5 space-y-1.5">
              <li>A physical or electronic signature of the copyright owner or authorized agent.</li>
              <li>Identification of the copyrighted work claimed to have been infringed.</li>
              <li>Identification of the material that is claimed to be infringing, with sufficient detail to locate it on the platform.</li>
              <li>Your contact information (name, address, telephone number, and email address).</li>
              <li>A statement that you have a good faith belief that the use is not authorized by the copyright owner, its agent, or the law.</li>
              <li>A statement, under penalty of perjury, that the information in the notice is accurate and that you are the copyright owner or authorized to act on their behalf.</li>
            </ol>
          </div>
        </section>

        {/* Section 3 */}
        <section>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <Mail className="w-4 h-4 text-primary" />
            </div>
            <h2 className="text-xl font-semibold text-foreground">3. Reporting Infringement</h2>
          </div>
          <div className="pl-11 space-y-3 text-muted-foreground leading-relaxed">
            <p>
              To report copyright infringement, please send your DMCA notice to our designated copyright agent:
            </p>
            <div className="bg-muted/50 rounded-xl p-4 border border-border">
              <p className="font-medium text-foreground">Mediatube Copyright Agent</p>
              <p>Email: <span className="text-primary">copyright@mediatube.app</span></p>
              <p className="text-sm mt-1">Please include "DMCA Notice" in the subject line.</p>
            </div>
            <p>
              Upon receiving a valid DMCA notice, we will promptly remove or disable access to the allegedly
              infringing content and notify the uploader. The uploader may submit a counter-notice if they
              believe the content was removed in error.
            </p>
          </div>
        </section>

        {/* Section 4 */}
        <section>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <Shield className="w-4 h-4 text-primary" />
            </div>
            <h2 className="text-xl font-semibold text-foreground">4. Fair Use</h2>
          </div>
          <div className="pl-11 space-y-3 text-muted-foreground leading-relaxed">
            <p>
              Mediatube recognizes that certain uses of copyrighted material may qualify as fair use under
              applicable law. Fair use considerations include:
            </p>
            <ul className="list-disc pl-5 space-y-1.5">
              <li>The purpose and character of the use (commercial vs. educational/non-profit).</li>
              <li>The nature of the copyrighted work.</li>
              <li>The amount and substantiality of the portion used.</li>
              <li>The effect of the use on the potential market for the original work.</li>
            </ul>
            <p>
              If you believe your content qualifies as fair use, you may include this information in your
              counter-notice. However, Mediatube does not make legal determinations about fair use claims.
            </p>
          </div>
        </section>

        {/* Section 5 */}
        <section>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <AlertTriangle className="w-4 h-4 text-primary" />
            </div>
            <h2 className="text-xl font-semibold text-foreground">5. Repeat Infringers</h2>
          </div>
          <div className="pl-11 space-y-3 text-muted-foreground leading-relaxed">
            <p>
              Mediatube has a policy of terminating, in appropriate circumstances, the accounts of users who
              are repeat infringers of intellectual property rights. We reserve the right to remove content
              and terminate accounts at our sole discretion.
            </p>
          </div>
        </section>

        {/* Section 6 */}
        <section>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <FileText className="w-4 h-4 text-primary" />
            </div>
            <h2 className="text-xl font-semibold text-foreground">6. Counter-Notice Procedure</h2>
          </div>
          <div className="pl-11 space-y-3 text-muted-foreground leading-relaxed">
            <p>
              If you believe your content was removed due to a mistake or misidentification, you may submit
              a counter-notice. A valid counter-notice must include:
            </p>
            <ol className="list-decimal pl-5 space-y-1.5">
              <li>Your physical or electronic signature.</li>
              <li>Identification of the removed content and its location before removal.</li>
              <li>A statement under penalty of perjury that you have a good faith belief the content was removed by mistake or misidentification.</li>
              <li>Your name, address, and telephone number.</li>
              <li>A statement that you consent to the jurisdiction of the federal court in your district.</li>
            </ol>
          </div>
        </section>
      </div>

      {/* Footer note */}
      <div className="mt-12 p-6 bg-muted/30 rounded-xl border border-border">
        <p className="text-sm text-muted-foreground text-center">
          This Copyright Policy is subject to change. We encourage you to review it periodically.
          For questions, contact us at{' '}
          <span className="text-primary">legal@mediatube.app</span>.
        </p>
      </div>
    </div>
  );
}
