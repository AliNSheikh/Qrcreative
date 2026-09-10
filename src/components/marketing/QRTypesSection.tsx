import React from 'react';
import { QRCodeType } from '../../types';
import {
  Globe,
  Wifi,
  Contact,
  FileText,
  Mail,
  Phone,
  MessageSquare,
  MessageCircle,
  Calendar,
  MapPin,
  Share2,
  Smartphone,
  FileUp,
  ArrowRight
} from 'lucide-react';

interface QRTypesSectionProps {
  onSelectType: (type: QRCodeType) => void;
}

export const QRTypesSection: React.FC<QRTypesSectionProps> = ({ onSelectType }) => {
  const types: Array<{ id: QRCodeType; name: string; desc: string; icon: any }> = [
    {
      id: 'url',
      name: 'URL QR Code',
      desc: 'Send scanners directly to any website, landing page, portfolio, or online store.',
      icon: Globe
    },
    {
      id: 'wifi',
      name: 'Wi-Fi QR Code',
      desc: 'Allow guests to join your Wi-Fi network instantly without typing passwords.',
      icon: Wifi
    },
    {
      id: 'vcard',
      name: 'vCard Contact',
      desc: 'Digital business card containing your name, phone, email, company, and links.',
      icon: Contact
    },
    {
      id: 'whatsapp',
      name: 'WhatsApp QR Code',
      desc: 'Open a pre-filled direct WhatsApp chat with your phone number.',
      icon: MessageCircle
    },
    {
      id: 'email',
      name: 'Email QR Code',
      desc: 'Launch email apps with pre-filled recipient, subject line, and message body.',
      icon: Mail
    },
    {
      id: 'phone',
      name: 'Phone QR Code',
      desc: 'Prompt scanners to instantly place a phone call to your business or support line.',
      icon: Phone
    },
    {
      id: 'sms',
      name: 'SMS QR Code',
      desc: 'Send a pre-formatted SMS message for RSVP, feedback, or verification.',
      icon: MessageSquare
    },
    {
      id: 'event',
      name: 'Event QR Code',
      desc: 'Add appointments, webinars, or parties directly to Google and Apple Calendars.',
      icon: Calendar
    },
    {
      id: 'location',
      name: 'Location QR Code',
      desc: 'Direct scanners to a pinpoint GPS coordinate or physical address in Google Maps.',
      icon: MapPin
    },
    {
      id: 'social',
      name: 'Social Links',
      desc: 'Connect visitors with your Instagram, YouTube, TikTok, or LinkedIn profiles.',
      icon: Share2
    },
    {
      id: 'applinks',
      name: 'App Store Links',
      desc: 'Direct mobile users to download your application on iOS or Android.',
      icon: Smartphone
    },
    {
      id: 'file',
      name: 'Document / File',
      desc: 'Link scanners to an online restaurant menu, PDF brochure, or uploaded document.',
      icon: FileUp
    }
  ];

  return (
    <section id="qr-types" className="py-16 md:py-24 bg-[#f8fafc]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <span className="text-xs font-bold uppercase tracking-wider text-[#13b8a6] bg-[#13b8a6]/10 px-3 py-1 rounded-full">
            Versatile Formats
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-[#111827] tracking-tight mt-3">
            Supported QR Code Types
          </h2>
          <p className="text-base text-[#64748b] mt-3 leading-relaxed">
            Choose from standard static formats or create dynamic editable QR codes tailored to your specific use case.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {types.map((t) => {
            const IconComponent = t.icon;
            return (
              <div
                key={t.id}
                className="p-6 rounded-2xl bg-white border border-[#e2e8f0] hover:border-[#6d5dfc]/40 hover:shadow-md transition flex flex-col justify-between"
              >
                <div>
                  <div className="w-10 h-10 rounded-xl bg-[#efedff] text-[#6d5dfc] flex items-center justify-center mb-4">
                    <IconComponent className="w-5 h-5" />
                  </div>
                  <h3 className="text-base font-bold text-[#111827]">
                    {t.name}
                  </h3>
                  <p className="text-xs text-[#64748b] mt-2 leading-relaxed">
                    {t.desc}
                  </p>
                </div>

                <button
                  onClick={() => onSelectType(t.id)}
                  className="mt-6 inline-flex items-center gap-1.5 text-xs font-bold text-[#6d5dfc] hover:text-[#5a49ef] group"
                >
                  <span>Create {t.name.split(' ')[0]} QR</span>
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition" />
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
