import { Smartphone, Download, Star, Shield, Zap, Play, Apple, CheckCircle } from 'lucide-react';
import { SiAndroid } from 'react-icons/si';
import { Link } from '@tanstack/react-router';

const APP_FEATURES = [
  {
    icon: Zap,
    title: 'Lightning Fast',
    description: 'Stream and download videos at blazing speeds with our optimized mobile app.',
  },
  {
    icon: Shield,
    title: 'Secure & Private',
    description: 'Your data stays safe with end-to-end encryption and decentralized storage.',
  },
  {
    icon: Star,
    title: 'Offline Viewing',
    description: 'Download your favorite videos and watch them anywhere, even without internet.',
  },
  {
    icon: Play,
    title: 'Seamless Playback',
    description: 'Enjoy smooth, high-quality video playback with adaptive streaming technology.',
  },
];

const SCREENSHOTS = [
  { src: '/assets/App-1.jpeg', alt: 'App Screenshot 1' },
  { src: '/assets/App.jpeg', alt: 'App Screenshot 2' },
  {
    src: '/assets/Screenshot_2026-02-25-23-15-57-05_f9ee0578fe1cc94de7482bd41accb329-699f357501cf16.76761391.jpg',
    alt: 'App Screenshot 3',
  },
  {
    src: '/assets/Screenshot_2026-02-26-18-21-34-82_f9ee0578fe1cc94de7482bd41accb329.jpg',
    alt: 'App Screenshot 4',
  },
];

export default function DownloadAppPage() {
  return (
    <div className="min-h-screen bg-yt-bg text-white pb-20 lg:pb-8">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        {/* Banner Image */}
        <div className="w-full h-48 sm:h-64 md:h-80 overflow-hidden relative">
          <img
            src="/assets/generated/download-banner.dim_1200x400.png"
            alt="Download Mediatube and Photo App"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-yt-bg/40 to-yt-bg" />
        </div>

        {/* Hero Content */}
        <div className="max-w-4xl mx-auto px-4 -mt-16 relative z-10 text-center">
          <div className="flex items-center justify-center mb-4">
            <img
              src="/assets/generated/mediatube-logo.dim_512x512.png"
              alt="Mediatube and Photo"
              className="w-16 h-16 rounded-2xl shadow-lg shadow-mt-magenta/30"
            />
          </div>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-3 brand-gradient-text">
            Download the App
          </h1>
          <p className="text-yt-text-secondary text-base sm:text-lg max-w-xl mx-auto mb-8">
            Take Mediatube and Photo everywhere you go. Stream, upload, and connect with your
            favorite creators — right from your pocket.
          </p>

          {/* Download Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12">
            {/* Android Download */}
            <a
              href="#android-download"
              onClick={(e) => {
                e.preventDefault();
                const el = document.getElementById('android-download');
                el?.scrollIntoView({ behavior: 'smooth' });
              }}
              className="flex items-center gap-3 px-6 py-3.5 bg-mt-magenta hover:bg-mt-purple rounded-2xl transition-all duration-200 shadow-lg shadow-mt-magenta/30 hover:shadow-mt-purple/30 hover:scale-105 w-full sm:w-auto justify-center"
            >
              <SiAndroid className="w-6 h-6 text-white" />
              <div className="text-left">
                <div className="text-xs text-white/70 leading-none">Download for</div>
                <div className="text-base font-bold text-white leading-tight">Android</div>
              </div>
            </a>

            {/* iOS Download */}
            <a
              href="#ios-download"
              onClick={(e) => {
                e.preventDefault();
                const el = document.getElementById('ios-download');
                el?.scrollIntoView({ behavior: 'smooth' });
              }}
              className="flex items-center gap-3 px-6 py-3.5 bg-yt-chip hover:bg-yt-chip-hover border border-yt-border rounded-2xl transition-all duration-200 hover:scale-105 w-full sm:w-auto justify-center"
            >
              <Apple className="w-6 h-6 text-white" />
              <div className="text-left">
                <div className="text-xs text-yt-text-secondary leading-none">Download for</div>
                <div className="text-base font-bold text-white leading-tight">iOS</div>
              </div>
            </a>
          </div>
        </div>
      </section>

      {/* App Screenshots */}
      <section className="max-w-5xl mx-auto px-4 mb-16">
        <h2 className="text-sm font-bold text-center mb-6 text-yt-text-secondary uppercase tracking-widest">
          App Preview
        </h2>
        <div className="flex gap-3 overflow-x-auto pb-4 scrollbar-hide justify-start sm:justify-center">
          {SCREENSHOTS.map((shot, i) => (
            <div
              key={i}
              className="shrink-0 w-36 sm:w-44 rounded-2xl overflow-hidden border border-yt-border shadow-lg"
            >
              <img
                src={shot.src}
                alt={shot.alt}
                className="w-full h-64 sm:h-80 object-cover"
              />
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="max-w-4xl mx-auto px-4 mb-16">
        <h2 className="text-2xl font-bold text-center mb-8">
          Why You'll <span className="brand-gradient-text">Love It</span>
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {APP_FEATURES.map(({ icon: Icon, title, description }) => (
            <div
              key={title}
              className="flex gap-4 p-5 bg-yt-surface rounded-2xl border border-yt-border hover:border-mt-magenta/40 transition-colors"
            >
              <div className="shrink-0 w-10 h-10 rounded-xl bg-mt-magenta/15 flex items-center justify-center">
                <Icon className="w-5 h-5 text-mt-magenta" />
              </div>
              <div>
                <h3 className="font-semibold text-white mb-1">{title}</h3>
                <p className="text-sm text-yt-text-secondary leading-relaxed">{description}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Android Download Section */}
      <section id="android-download" className="max-w-4xl mx-auto px-4 mb-8">
        <div className="bg-yt-surface border border-yt-border rounded-3xl p-6 sm:p-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
            <div className="w-16 h-16 rounded-2xl bg-green-500/15 flex items-center justify-center shrink-0">
              <SiAndroid className="w-8 h-8 text-green-400" />
            </div>
            <div className="flex-1">
              <h3 className="text-xl font-bold text-white mb-1">Android App</h3>
              <p className="text-yt-text-secondary text-sm mb-4">
                Compatible with Android 8.0 and above. Download the APK directly or get it from
                the Play Store.
              </p>
              <div className="flex flex-col sm:flex-row gap-3">
                <a
                  href="#"
                  className="flex items-center gap-2 px-5 py-2.5 bg-mt-magenta hover:bg-mt-purple rounded-xl transition-colors text-sm font-semibold text-white"
                  onClick={(e) => e.preventDefault()}
                >
                  <Download className="w-4 h-4" />
                  Download APK
                </a>
                <a
                  href="#"
                  className="flex items-center gap-2 px-5 py-2.5 bg-yt-chip hover:bg-yt-chip-hover border border-yt-border rounded-xl transition-colors text-sm font-semibold text-white"
                  onClick={(e) => e.preventDefault()}
                >
                  <SiAndroid className="w-4 h-4" />
                  Google Play Store
                </a>
              </div>
            </div>
          </div>

          {/* Install Instructions */}
          <div className="mt-6 pt-6 border-t border-yt-border">
            <h4 className="text-sm font-semibold text-yt-text-secondary uppercase tracking-wider mb-3">
              How to install APK
            </h4>
            <ol className="space-y-2">
              {[
                'Tap "Download APK" above to download the file.',
                'Open your device Settings → Security → Enable "Unknown Sources".',
                'Open the downloaded APK file and tap Install.',
                'Launch Mediatube and Photo and sign in to get started!',
              ].map((step, i) => (
                <li key={i} className="flex items-start gap-3 text-sm text-yt-text-secondary">
                  <CheckCircle className="w-4 h-4 text-mt-magenta shrink-0 mt-0.5" />
                  <span>{step}</span>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </section>

      {/* iOS Download Section */}
      <section id="ios-download" className="max-w-4xl mx-auto px-4 mb-16">
        <div className="bg-yt-surface border border-yt-border rounded-3xl p-6 sm:p-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
            <div className="w-16 h-16 rounded-2xl bg-blue-500/15 flex items-center justify-center shrink-0">
              <Apple className="w-8 h-8 text-blue-400" />
            </div>
            <div className="flex-1">
              <h3 className="text-xl font-bold text-white mb-1">iOS App</h3>
              <p className="text-yt-text-secondary text-sm mb-4">
                Compatible with iPhone and iPad running iOS 15 and above. Available on the App
                Store.
              </p>
              <div className="flex flex-col sm:flex-row gap-3">
                <a
                  href="#"
                  className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 rounded-xl transition-colors text-sm font-semibold text-white"
                  onClick={(e) => e.preventDefault()}
                >
                  <Apple className="w-4 h-4" />
                  App Store
                </a>
                <a
                  href="#"
                  className="flex items-center gap-2 px-5 py-2.5 bg-yt-chip hover:bg-yt-chip-hover border border-yt-border rounded-xl transition-colors text-sm font-semibold text-white"
                  onClick={(e) => e.preventDefault()}
                >
                  <Smartphone className="w-4 h-4" />
                  TestFlight Beta
                </a>
              </div>
            </div>
          </div>

          {/* iOS Instructions */}
          <div className="mt-6 pt-6 border-t border-yt-border">
            <h4 className="text-sm font-semibold text-yt-text-secondary uppercase tracking-wider mb-3">
              How to install on iOS
            </h4>
            <ol className="space-y-2">
              {[
                'Tap "App Store" above to open the listing.',
                'Tap "Get" and authenticate with Face ID or Touch ID.',
                'Wait for the download to complete.',
                'Open Mediatube and Photo and sign in to get started!',
              ].map((step, i) => (
                <li key={i} className="flex items-start gap-3 text-sm text-yt-text-secondary">
                  <CheckCircle className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
                  <span>{step}</span>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-4xl mx-auto px-4 mb-8 text-center">
        <p className="text-yt-text-secondary text-sm">
          Prefer the web version?{' '}
          <Link to="/" className="text-mt-magenta hover:underline font-medium">
            Continue browsing here
          </Link>
        </p>
      </section>
    </div>
  );
}
