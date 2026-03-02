import React from 'react';
import { Link } from '@tanstack/react-router';
import {
  Globe,
  Info,
  Shield,
  Download,
  ChevronRight,
  Smartphone,
  Copyright,
  Tag,
} from 'lucide-react';
import { SiAndroid, SiApple } from 'react-icons/si';
import LanguageSelector from '../components/LanguageSelector';
import { useIsCallerAdmin } from '../hooks/useIsCallerAdmin';

const APP_VERSION = 'v1.0.0';

function SettingsSection({
  title,
  icon: Icon,
  children,
}: {
  title: string;
  icon: React.ElementType;
  children: React.ReactNode;
}) {
  return (
    <section className="bg-mt-charcoal-900 border border-mt-charcoal-800 rounded-xl overflow-hidden">
      <div className="flex items-center gap-2.5 px-5 py-3.5 border-b border-mt-charcoal-800 bg-mt-charcoal-800/50">
        <Icon className="w-4 h-4 text-mt-red-400 shrink-0" />
        <h2 className="text-sm font-semibold text-foreground uppercase tracking-wider">{title}</h2>
      </div>
      <div className="divide-y divide-mt-charcoal-800">{children}</div>
    </section>
  );
}

function SettingsRow({
  label,
  value,
  description,
  children,
}: {
  label: string;
  value?: string;
  description?: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between px-5 py-4 gap-4">
      <div className="min-w-0">
        <p className="text-sm font-medium text-foreground">{label}</p>
        {description && <p className="text-xs text-mt-charcoal-400 mt-0.5">{description}</p>}
      </div>
      <div className="shrink-0">
        {value ? (
          <span className="text-sm text-mt-charcoal-400 font-mono">{value}</span>
        ) : (
          children
        )}
      </div>
    </div>
  );
}

function SettingsLinkRow({
  label,
  description,
  to,
  icon,
}: {
  label: string;
  description?: string;
  to: string;
  icon?: React.ReactNode;
}) {
  return (
    <Link
      to={to}
      className="flex items-center justify-between px-5 py-4 gap-4 hover:bg-mt-charcoal-800/60 transition-colors cursor-pointer group"
    >
      <div className="flex items-center gap-3 min-w-0">
        {icon && <div className="shrink-0 text-mt-charcoal-400 group-hover:text-mt-red-400 transition-colors">{icon}</div>}
        <div className="min-w-0">
          <p className="text-sm font-medium text-foreground">{label}</p>
          {description && <p className="text-xs text-mt-charcoal-400 mt-0.5">{description}</p>}
        </div>
      </div>
      <ChevronRight className="w-4 h-4 text-mt-charcoal-500 group-hover:text-mt-red-400 transition-colors shrink-0" />
    </Link>
  );
}

export default function SettingsPage() {
  const { data: isAdmin } = useIsCallerAdmin();

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 pb-24 lg:pb-8">
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-display font-bold text-foreground">Settings</h1>
        <p className="text-sm text-mt-charcoal-400 mt-1">Manage your app preferences and account settings</p>
      </div>

      <div className="flex flex-col gap-5">
        {/* Language Section */}
        <SettingsSection title="Language" icon={Globe}>
          <SettingsRow
            label="App Language"
            description="Select your preferred display language"
          >
            <LanguageSelector />
          </SettingsRow>
        </SettingsSection>

        {/* Version Section */}
        <SettingsSection title="Version" icon={Tag}>
          <SettingsRow
            label="App Version"
            value={APP_VERSION}
            description="Current installed version of Mediatube"
          />
          <SettingsRow
            label="Build"
            value="stable"
            description="Release channel"
          />
        </SettingsSection>

        {/* Admin Section — only visible to admins */}
        {isAdmin && (
          <SettingsSection title="Admin" icon={Shield}>
            <SettingsLinkRow
              to="/admin"
              label="Admin Dashboard"
              description="Manage users, videos, and platform analytics"
              icon={<Shield className="w-4 h-4" />}
            />
          </SettingsSection>
        )}

        {/* About App Section */}
        <SettingsSection title="About App" icon={Info}>
          <div className="px-5 py-5 flex items-center gap-4 border-b border-mt-charcoal-800">
            <div className="w-12 h-12 bg-mt-red-500 rounded-xl flex items-center justify-center shadow-glow-red-sm shrink-0">
              <img src="/assets/generated/mediatube-logo-icon.dim_128x128.png" alt="Mediatube" className="w-8 h-8 object-contain" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
            </div>
            <div>
              <p className="text-base font-bold text-foreground">Mediatube</p>
              <p className="text-xs text-mt-charcoal-400 mt-0.5">A modern video sharing platform</p>
            </div>
          </div>
          <SettingsLinkRow
            to="/copyright-policy"
            label="Copyright Policy"
            description="Learn about our content ownership and DMCA process"
            icon={<Copyright className="w-4 h-4" />}
          />
          <div className="px-5 py-4 border-t border-mt-charcoal-800">
            <p className="text-xs text-mt-charcoal-500 leading-relaxed">
              © {new Date().getFullYear()} Mediatube. All rights reserved.
            </p>
            <p className="text-xs text-mt-charcoal-600 mt-1">
              For support, visit our{' '}
              <a
                href="https://caffeine.ai/?utm_source=Caffeine-footer&utm_medium=referral&utm_content=mediatube-settings"
                target="_blank"
                rel="noopener noreferrer"
                className="text-mt-red-400 hover:text-mt-red-300 transition-colors"
              >
                help center
              </a>
              .
            </p>
          </div>
        </SettingsSection>

        {/* Download App Section */}
        <SettingsSection title="Download App" icon={Download}>
          <SettingsLinkRow
            to="/download"
            label="Download Mediatube App"
            description="Get the app on Android & iOS"
            icon={
              <div className="flex items-center gap-1.5">
                <SiAndroid className="w-4 h-4 text-green-400" />
                <SiApple className="w-4 h-4 text-mt-charcoal-300" />
              </div>
            }
          />
          <div className="px-5 py-3 flex items-center gap-6">
            <div className="flex items-center gap-2 text-xs text-mt-charcoal-400">
              <SiAndroid className="w-3.5 h-3.5 text-green-400" />
              <span>Android 8.0+</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-mt-charcoal-400">
              <SiApple className="w-3.5 h-3.5 text-mt-charcoal-300" />
              <span>iOS 14.0+</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-mt-charcoal-400">
              <Smartphone className="w-3.5 h-3.5 text-mt-blue-400" />
              <span>Free Download</span>
            </div>
          </div>
        </SettingsSection>
      </div>
    </div>
  );
}
