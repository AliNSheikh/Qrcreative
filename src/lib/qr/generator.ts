import QRCode from 'qrcode';
import { QRCodeDesign, QRCodeMode, QRCodeType } from '../../types';

// Format raw payload based on type and mode
export function formatQRContent(
  type: QRCodeType,
  content: Record<string, any>,
  mode: QRCodeMode,
  slug?: string,
  siteUrl?: string
): string {
  // If editable mode, point to the redirect link
  if (mode === 'editable' && slug) {
    const base = siteUrl || (typeof window !== 'undefined' ? window.location.origin : 'https://qrcreative.app');
    return `${base.replace(/\/$/, '')}/r/${slug}`;
  }

  switch (type) {
    case 'url': {
      let url = (content.url || '').trim();
      if (!url) return 'https://qrcreative.app';
      if (!/^https?:\/\//i.test(url)) {
        url = 'https://' + url;
      }
      return url;
    }

    case 'text':
      return content.text || 'qrcreative - free QR code';

    case 'email': {
      const email = (content.email || '').trim();
      const subject = encodeURIComponent(content.subject || '');
      const body = encodeURIComponent(content.message || '');
      let mailto = `mailto:${email}`;
      const params: string[] = [];
      if (subject) params.push(`subject=${subject}`);
      if (body) params.push(`body=${body}`);
      if (params.length > 0) mailto += `?${params.join('&')}`;
      return mailto;
    }

    case 'phone':
      return `tel:${(content.phone || '').trim()}`;

    case 'sms': {
      const phone = (content.phone || '').trim();
      const msg = encodeURIComponent(content.message || '');
      return `smsto:${phone}${msg ? `:${msg}` : ''}`;
    }

    case 'whatsapp': {
      const cleanPhone = (content.phone || '').replace(/[^0-9]/g, '');
      const msg = encodeURIComponent(content.message || '');
      return `https://wa.me/${cleanPhone}${msg ? `?text=${msg}` : ''}`;
    }

    case 'wifi': {
      const ssid = content.ssid || '';
      const pass = content.password || '';
      const enc = content.encryption || 'WPA';
      const hidden = content.hidden ? 'true' : 'false';
      return `WIFI:T:${enc};S:${ssid};P:${pass};H:${hidden};;`;
    }

    case 'vcard': {
      const lines = [
        'BEGIN:VCARD',
        'VERSION:3.0',
        `N:${content.lastName || ''};${content.firstName || ''};;;`,
        `FN:${(content.firstName || '') + ' ' + (content.lastName || '')}`.trim(),
        content.company ? `ORG:${content.company}` : '',
        content.jobTitle ? `TITLE:${content.jobTitle}` : '',
        content.phone ? `TEL;TYPE=CELL:${content.phone}` : '',
        content.email ? `EMAIL;TYPE=INTERNET:${content.email}` : '',
        content.website ? `URL:${content.website}` : '',
        content.street || content.city || content.country
          ? `ADR;TYPE=HOME:;;${content.street || ''};${content.city || ''};${content.state || ''};${content.zip || ''};${content.country || ''}`
          : '',
        'END:VCARD'
      ].filter(Boolean);
      return lines.join('\n');
    }

    case 'location': {
      const lat = content.latitude || '0';
      const lng = content.longitude || '0';
      return `https://maps.google.com/?q=${lat},${lng}`;
    }

    case 'event': {
      const title = content.title || 'Event';
      const desc = content.description || '';
      const loc = content.location || '';
      const formatDT = (dStr: string) => {
        if (!dStr) return '';
        const d = new Date(dStr);
        return isNaN(d.getTime()) ? '' : d.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
      };
      const start = formatDT(content.startDate);
      const end = formatDT(content.endDate);
      const lines = [
        'BEGIN:VEVENT',
        `SUMMARY:${title}`,
        loc ? `LOCATION:${loc}` : '',
        desc ? `DESCRIPTION:${desc}` : '',
        start ? `DTSTART:${start}` : '',
        end ? `DTEND:${end}` : '',
        'END:VEVENT'
      ].filter(Boolean);
      return lines.join('\n');
    }

    case 'social': {
      const links = content.links as Array<{ platform: string; url: string }> || [];
      if (links.length === 1 && links[0].url) {
        return links[0].url;
      }
      return links.map(l => `${l.platform}: ${l.url}`).join('\n') || 'https://qrcreative.app';
    }

    case 'applinks':
      return content.fallbackUrl || content.iosUrl || content.androidUrl || 'https://qrcreative.app';

    case 'file':
      return content.fileUrl || 'https://qrcreative.app';

    default:
      return content.url || 'https://qrcreative.app';
  }
}

// Calculate color luminance & contrast ratio
export function checkContrastRatio(hex1: string, hex2: string): number {
  const getLuminance = (hex: string) => {
    const c = hex.replace('#', '');
    const r = parseInt(c.substring(0, 2) || '0', 16) / 255;
    const g = parseInt(c.substring(2, 4) || '0', 16) / 255;
    const b = parseInt(c.substring(4, 6) || '0', 16) / 255;
    const a = [r, g, b].map(v => (v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4)));
    return 0.2126 * a[0] + 0.7152 * a[1] + 0.0722 * a[2];
  };

  try {
    const l1 = getLuminance(hex1);
    const l2 = getLuminance(hex2);
    const brightest = Math.max(l1, l2);
    const darkest = Math.min(l1, l2);
    return (brightest + 0.05) / (darkest + 0.05);
  } catch {
    return 21; // fallback max
  }
}

// Check if a cell in the QR matrix belongs to one of the 3 corner finder patterns
function isFinderPattern(r: number, c: number, moduleCount: number): { isFinder: boolean; isOuter: boolean; isCenter: boolean } {
  const isInSquare = (row: number, col: number, startRow: number, startCol: number, size: number) => {
    return row >= startRow && row < startRow + size && col >= startCol && col < startCol + size;
  };

  // Top-Left (0,0), Top-Right (0, moduleCount-7), Bottom-Left (moduleCount-7, 0)
  const finderPositions = [
    { r: 0, c: 0 },
    { r: 0, c: moduleCount - 7 },
    { r: moduleCount - 7, c: 0 }
  ];

  for (const pos of finderPositions) {
    if (isInSquare(r, c, pos.r, pos.c, 7)) {
      // It's inside the 7x7 finder zone
      const relR = r - pos.r;
      const relC = c - pos.c;
      // Outer ring: relR is 0 or 6 OR relC is 0 or 6
      const isOuter = relR === 0 || relR === 6 || relC === 0 || relC === 6;
      // Center 3x3: relR in 2..4 and relC in 2..4
      const isCenter = relR >= 2 && relR <= 4 && relC >= 2 && relC <= 4;
      return { isFinder: true, isOuter, isCenter };
    }
  }

  return { isFinder: false, isOuter: false, isCenter: false };
}

// Render styled QR code to canvas
export async function renderQRToCanvas(
  canvas: HTMLCanvasElement,
  text: string,
  design: QRCodeDesign,
  size: number = 800
): Promise<void> {
  const qrData = QRCode.create(text, {
    errorCorrectionLevel: design.logo?.url ? 'H' : design.errorCorrectionLevel || 'M'
  });

  const moduleCount = qrData.modules.size;
  const margin = design.margin ?? 3;
  const totalCells = moduleCount + margin * 2;
  const cellSize = size / totalCells;

  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  // Background
  if (design.backgroundColor === 'transparent') {
    ctx.clearRect(0, 0, size, size);
  } else {
    ctx.fillStyle = design.backgroundColor || '#ffffff';
    ctx.fillRect(0, 0, size, size);
  }

  // Create primary fill style (solid or gradient)
  let fillStyle: string | CanvasGradient = design.foregroundColor || '#111827';
  if (design.gradient?.enabled) {
    if (design.gradient.type === 'radial') {
      const grad = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 1.4);
      grad.addColorStop(0, design.foregroundColor);
      grad.addColorStop(1, design.gradient.color2 || '#6d5dfc');
      fillStyle = grad;
    } else {
      const rad = ((design.gradient.angle || 45) * Math.PI) / 180;
      const x2 = size / 2 + (Math.cos(rad) * size) / 2;
      const y2 = size / 2 + (Math.sin(rad) * size) / 2;
      const x1 = size / 2 - (Math.cos(rad) * size) / 2;
      const y1 = size / 2 - (Math.sin(rad) * size) / 2;
      const grad = ctx.createLinearGradient(x1, y1, x2, y2);
      grad.addColorStop(0, design.foregroundColor);
      grad.addColorStop(1, design.gradient.color2 || '#6d5dfc');
      fillStyle = grad;
    }
  }

  // Determine logo cutout area in cell units
  let logoCutoutStart = -1;
  let logoCutoutEnd = -1;
  if (design.logo?.url) {
    const logoSizeFraction = (design.logo.size || 22) / 100;
    const cutoutCells = Math.ceil(moduleCount * logoSizeFraction);
    logoCutoutStart = Math.floor((moduleCount - cutoutCells) / 2);
    logoCutoutEnd = logoCutoutStart + cutoutCells;
  }

  // 1. Draw Body Modules (excluding finder patterns and logo cutout)
  ctx.fillStyle = fillStyle;

  for (let r = 0; r < moduleCount; r++) {
    for (let c = 0; c < moduleCount; c++) {
      const finderInfo = isFinderPattern(r, c, moduleCount);
      if (finderInfo.isFinder) continue; // Will be drawn in step 2

      // Skip logo area
      if (
        logoCutoutStart !== -1 &&
        r >= logoCutoutStart &&
        r < logoCutoutEnd &&
        c >= logoCutoutStart &&
        c < logoCutoutEnd
      ) {
        continue;
      }

      const isDark = qrData.modules.get(r, c);
      if (!isDark) continue;

      const x = (c + margin) * cellSize;
      const y = (r + margin) * cellSize;

      ctx.beginPath();
      switch (design.dotStyle) {
        case 'dots': {
          const radius = cellSize * 0.44;
          ctx.arc(x + cellSize / 2, y + cellSize / 2, radius, 0, Math.PI * 2);
          ctx.fill();
          break;
        }
        case 'rounded': {
          const rad = cellSize * 0.28;
          ctx.beginPath();
          if (ctx.roundRect) {
            ctx.roundRect(x, y, cellSize, cellSize, rad);
          } else {
            ctx.rect(x, y, cellSize, cellSize);
          }
          ctx.fill();
          break;
        }
        case 'extra-rounded': {
          const rad = cellSize * 0.48;
          ctx.beginPath();
          if (ctx.roundRect) {
            ctx.roundRect(x, y, cellSize, cellSize, rad);
          } else {
            ctx.rect(x, y, cellSize, cellSize);
          }
          ctx.fill();
          break;
        }
        case 'square':
        default:
          ctx.fillRect(x, y, cellSize, cellSize);
          break;
      }
    }
  }

  // 2. Draw the 3 Finder Patterns with custom corner styles
  const finderPositions = [
    { r: 0, c: 0 },
    { r: 0, c: moduleCount - 7 },
    { r: moduleCount - 7, c: 0 }
  ];

  for (const pos of finderPositions) {
    const px = (pos.c + margin) * cellSize;
    const py = (pos.r + margin) * cellSize;
    const finderSize = 7 * cellSize;

    // Clear background for finder box
    ctx.fillStyle = design.backgroundColor || '#ffffff';
    ctx.fillRect(px, py, finderSize, finderSize);

    // Draw Outer 7x7 Ring
    ctx.fillStyle = fillStyle;
    ctx.beginPath();
    const cornerOuterStyle = design.cornerSquareStyle || 'square';
    if (cornerOuterStyle === 'circle') {
      ctx.arc(px + finderSize / 2, py + finderSize / 2, finderSize / 2, 0, Math.PI * 2);
    } else if (cornerOuterStyle === 'extra-rounded' && ctx.roundRect) {
      ctx.roundRect(px, py, finderSize, finderSize, cellSize * 2.2);
    } else if (cornerOuterStyle === 'rounded' && ctx.roundRect) {
      ctx.roundRect(px, py, finderSize, finderSize, cellSize * 1.4);
    } else {
      ctx.rect(px, py, finderSize, finderSize);
    }
    ctx.fill();

    // Cutout Inner 5x5 White
    ctx.fillStyle = design.backgroundColor || '#ffffff';
    const innerX = px + cellSize;
    const innerY = py + cellSize;
    const innerSize = 5 * cellSize;
    ctx.beginPath();
    if (cornerOuterStyle === 'circle') {
      ctx.arc(innerX + innerSize / 2, innerY + innerSize / 2, innerSize / 2, 0, Math.PI * 2);
    } else if (cornerOuterStyle === 'extra-rounded' && ctx.roundRect) {
      ctx.roundRect(innerX, innerY, innerSize, innerSize, cellSize * 1.6);
    } else if (cornerOuterStyle === 'rounded' && ctx.roundRect) {
      ctx.roundRect(innerX, innerY, innerSize, innerSize, cellSize * 0.9);
    } else {
      ctx.rect(innerX, innerY, innerSize, innerSize);
    }
    ctx.fill();

    // Draw Center 3x3 Dot
    ctx.fillStyle = fillStyle;
    const dotX = px + 2 * cellSize;
    const dotY = py + 2 * cellSize;
    const dotSize = 3 * cellSize;
    ctx.beginPath();
    const cornerDotStyle = design.cornerDotStyle || 'square';
    if (cornerDotStyle === 'dot') {
      ctx.arc(dotX + dotSize / 2, dotY + dotSize / 2, dotSize / 2, 0, Math.PI * 2);
    } else if (cornerDotStyle === 'rounded' && ctx.roundRect) {
      ctx.roundRect(dotX, dotY, dotSize, dotSize, cellSize * 0.8);
    } else {
      ctx.rect(dotX, dotY, dotSize, dotSize);
    }
    ctx.fill();
  }

  // 3. Draw Center Logo (if present)
  if (design.logo?.url) {
    await new Promise<void>((resolve) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        const logoFrac = (design.logo.size || 22) / 100;
        const logoPixelSize = size * (logoFrac * 0.88);
        const padding = design.logo.padding ?? 8;
        const badgeSize = logoPixelSize + padding * 2;
        const bx = (size - badgeSize) / 2;
        const by = (size - badgeSize) / 2;

        ctx.save();
        // Badge shadow
        ctx.shadowColor = 'rgba(0, 0, 0, 0.12)';
        ctx.shadowBlur = 12;
        ctx.shadowOffsetY = 4;

        // Badge background
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        if (design.logo.shape === 'circle') {
          ctx.arc(bx + badgeSize / 2, by + badgeSize / 2, badgeSize / 2, 0, Math.PI * 2);
        } else if (ctx.roundRect) {
          ctx.roundRect(bx, by, badgeSize, badgeSize, 14);
        } else {
          ctx.rect(bx, by, badgeSize, badgeSize);
        }
        ctx.fill();

        // Reset shadow
        ctx.shadowColor = 'transparent';
        ctx.shadowBlur = 0;

        // Clip and draw image
        ctx.beginPath();
        const lx = bx + padding;
        const ly = by + padding;
        if (design.logo.shape === 'circle') {
          ctx.arc(lx + logoPixelSize / 2, ly + logoPixelSize / 2, logoPixelSize / 2, 0, Math.PI * 2);
        } else if (ctx.roundRect) {
          ctx.roundRect(lx, ly, logoPixelSize, logoPixelSize, 10);
        } else {
          ctx.rect(lx, ly, logoPixelSize, logoPixelSize);
        }
        ctx.clip();
        ctx.drawImage(img, lx, ly, logoPixelSize, logoPixelSize);
        ctx.restore();

        resolve();
      };
      img.onerror = () => {
        // Continue even if logo fails to load
        resolve();
      };
      img.src = design.logo.url!;
    });
  }
}

// Generate vector SVG string
export function generateQRSVG(
  text: string,
  design: QRCodeDesign,
  size: number = 800
): string {
  const qrData = QRCode.create(text, {
    errorCorrectionLevel: design.logo?.url ? 'H' : design.errorCorrectionLevel || 'M'
  });

  const moduleCount = qrData.modules.size;
  const margin = design.margin ?? 3;
  const totalCells = moduleCount + margin * 2;
  const cellSize = size / totalCells;

  let elements = '';

  // Background
  if (design.backgroundColor !== 'transparent') {
    elements += `<rect width="${size}" height="${size}" fill="${design.backgroundColor || '#ffffff'}" />`;
  }

  // Defs for gradient
  let defs = '';
  let fillAttr = design.foregroundColor || '#111827';
  if (design.gradient?.enabled) {
    const id = 'qr-gradient-' + Math.random().toString(36).substring(2, 8);
    defs = `
      <defs>
        <linearGradient id="${id}" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="${design.foregroundColor}" />
          <stop offset="100%" stop-color="${design.gradient.color2 || '#6d5dfc'}" />
        </linearGradient>
      </defs>
    `;
    fillAttr = `url(#${id})`;
  }

  // Logo cutout bounds
  let logoCutoutStart = -1;
  let logoCutoutEnd = -1;
  if (design.logo?.url) {
    const logoSizeFraction = (design.logo.size || 22) / 100;
    const cutoutCells = Math.ceil(moduleCount * logoSizeFraction);
    logoCutoutStart = Math.floor((moduleCount - cutoutCells) / 2);
    logoCutoutEnd = logoCutoutStart + cutoutCells;
  }

  // Modules
  for (let r = 0; r < moduleCount; r++) {
    for (let c = 0; c < moduleCount; c++) {
      const finderInfo = isFinderPattern(r, c, moduleCount);
      if (finderInfo.isFinder) continue;

      if (
        logoCutoutStart !== -1 &&
        r >= logoCutoutStart &&
        r < logoCutoutEnd &&
        c >= logoCutoutStart &&
        c < logoCutoutEnd
      ) {
        continue;
      }

      if (!qrData.modules.get(r, c)) continue;

      const x = (c + margin) * cellSize;
      const y = (r + margin) * cellSize;

      if (design.dotStyle === 'dots') {
        const radius = cellSize * 0.44;
        elements += `<circle cx="${x + cellSize / 2}" cy="${y + cellSize / 2}" r="${radius}" fill="${fillAttr}" />`;
      } else if (design.dotStyle === 'rounded') {
        elements += `<rect x="${x}" y="${y}" width="${cellSize}" height="${cellSize}" rx="${cellSize * 0.28}" fill="${fillAttr}" />`;
      } else if (design.dotStyle === 'extra-rounded') {
        elements += `<rect x="${x}" y="${y}" width="${cellSize}" height="${cellSize}" rx="${cellSize * 0.48}" fill="${fillAttr}" />`;
      } else {
        elements += `<rect x="${x}" y="${y}" width="${cellSize}" height="${cellSize}" fill="${fillAttr}" />`;
      }
    }
  }

  // Finder corners
  const finderPositions = [
    { r: 0, c: 0 },
    { r: 0, c: moduleCount - 7 },
    { r: moduleCount - 7, c: 0 }
  ];

  for (const pos of finderPositions) {
    const px = (pos.c + margin) * cellSize;
    const py = (pos.r + margin) * cellSize;
    const finderSize = 7 * cellSize;

    const cornerOuter = design.cornerSquareStyle || 'square';
    let rxOuter = 0;
    if (cornerOuter === 'rounded') rxOuter = cellSize * 1.4;
    else if (cornerOuter === 'extra-rounded') rxOuter = cellSize * 2.2;
    else if (cornerOuter === 'circle') rxOuter = finderSize / 2;

    const innerX = px + cellSize;
    const innerY = py + cellSize;
    const innerSize = 5 * cellSize;
    let rxInner = 0;
    if (cornerOuter === 'rounded') rxInner = cellSize * 0.9;
    else if (cornerOuter === 'extra-rounded') rxInner = cellSize * 1.6;
    else if (cornerOuter === 'circle') rxInner = innerSize / 2;

    const dotX = px + 2 * cellSize;
    const dotY = py + 2 * cellSize;
    const dotSize = 3 * cellSize;
    const cornerDot = design.cornerDotStyle || 'square';
    let rxDot = 0;
    if (cornerDot === 'rounded') rxDot = cellSize * 0.8;
    else if (cornerDot === 'dot') rxDot = dotSize / 2;

    elements += `
      <rect x="${px}" y="${py}" width="${finderSize}" height="${finderSize}" rx="${rxOuter}" fill="${fillAttr}" />
      <rect x="${innerX}" y="${innerY}" width="${innerSize}" height="${innerSize}" rx="${rxInner}" fill="${design.backgroundColor || '#ffffff'}" />
      <rect x="${dotX}" y="${dotY}" width="${dotSize}" height="${dotSize}" rx="${rxDot}" fill="${fillAttr}" />
    `;
  }

  return `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}" width="${size}" height="${size}">
      ${defs}
      ${elements}
    </svg>
  `.trim();
}

// Preset template configurations
export const DESIGN_TEMPLATES: Record<string, Partial<QRCodeDesign>> = {
  minimal: {
    template: 'minimal',
    dotStyle: 'square',
    cornerSquareStyle: 'square',
    cornerDotStyle: 'square',
    foregroundColor: '#111827',
    backgroundColor: '#ffffff',
    gradient: { enabled: false, type: 'linear', color2: '#6d5dfc', angle: 45 },
    margin: 3
  },
  bold: {
    template: 'bold',
    dotStyle: 'square',
    cornerSquareStyle: 'rounded',
    cornerDotStyle: 'square',
    foregroundColor: '#0f172a',
    backgroundColor: '#f8fafc',
    gradient: { enabled: true, type: 'linear', color2: '#334155', angle: 90 },
    margin: 3
  },
  soft: {
    template: 'soft',
    dotStyle: 'rounded',
    cornerSquareStyle: 'rounded',
    cornerDotStyle: 'rounded',
    foregroundColor: '#4f46e5',
    backgroundColor: '#ffffff',
    gradient: { enabled: true, type: 'linear', color2: '#7c3aed', angle: 135 },
    margin: 3
  },
  tech: {
    template: 'tech',
    dotStyle: 'extra-rounded',
    cornerSquareStyle: 'circle',
    cornerDotStyle: 'dot',
    foregroundColor: '#0284c7',
    backgroundColor: '#ffffff',
    gradient: { enabled: true, type: 'linear', color2: '#0f766e', angle: 45 },
    margin: 3
  },
  mono: {
    template: 'mono',
    dotStyle: 'square',
    cornerSquareStyle: 'square',
    cornerDotStyle: 'square',
    foregroundColor: '#000000',
    backgroundColor: '#ffffff',
    gradient: { enabled: false, type: 'linear', color2: '#000000', angle: 0 },
    margin: 2
  },
  gradient: {
    template: 'gradient',
    dotStyle: 'rounded',
    cornerSquareStyle: 'rounded',
    cornerDotStyle: 'rounded',
    foregroundColor: '#6d5dfc',
    backgroundColor: '#ffffff',
    gradient: { enabled: true, type: 'linear', color2: '#ec4899', angle: 45 },
    margin: 3
  },
  business: {
    template: 'business',
    dotStyle: 'square',
    cornerSquareStyle: 'rounded',
    cornerDotStyle: 'rounded',
    foregroundColor: '#1e293b',
    backgroundColor: '#ffffff',
    gradient: { enabled: false, type: 'linear', color2: '#0284c7', angle: 0 },
    margin: 3
  },
  creative: {
    template: 'creative',
    dotStyle: 'dots',
    cornerSquareStyle: 'extra-rounded',
    cornerDotStyle: 'dot',
    foregroundColor: '#7c3aed',
    backgroundColor: '#ffffff',
    gradient: { enabled: true, type: 'linear', color2: '#14b8a6', angle: 60 },
    margin: 4
  }
};
