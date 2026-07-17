export type AvatarGender = 'Male' | 'Female' | 'Other';

export function generateAvatarSVG(
  name: string,
  gender: AvatarGender,
  size: number = 40
): string {
  const initial = name?.charAt(0)?.toUpperCase() || '?';

  // Color schemes by gender
  const schemes = {
    Male: {
      bg: '#EDE9FE',
      accent: '#7C3AED',
      hair: '#4B3B1F',
      skin: '#FDBCB4',
      shirt: '#7C3AED',
    },
    Female: {
      bg: '#FCE7F3',
      accent: '#DB2777',
      hair: '#2D1B00',
      skin: '#FDBCB4',
      shirt: '#DB2777',
    },
    Other: {
      bg: '#F0FDF4',
      accent: '#059669',
      hair: '#374151',
      skin: '#FDBCB4',
      shirt: '#059669',
    },
  };

  const s = schemes[gender] || schemes.Other;
  const r = size / 2;

  if (gender === 'Female') {
    return `
<svg width="${size}" height="${size}"
  viewBox="0 0 ${size} ${size}"
  xmlns="http://www.w3.org/2000/svg">
  <!-- Background circle -->
  <circle cx="${r}" cy="${r}" r="${r}"
    fill="${s.bg}"/>
  <!-- Hair (long) -->
  <ellipse cx="${r}" cy="${r * 0.55}"
    rx="${r * 0.52}" ry="${r * 0.38}"
    fill="${s.hair}"/>
  <!-- Long hair sides -->
  <rect x="${r * 0.28}" y="${r * 0.55}"
    width="${r * 0.18}" height="${r * 0.55}"
    rx="${r * 0.09}" fill="${s.hair}"/>
  <rect x="${r * 1.54}" y="${r * 0.55}"
    width="${r * 0.18}" height="${r * 0.55}"
    rx="${r * 0.09}" fill="${s.hair}"/>
  <!-- Face -->
  <circle cx="${r}" cy="${r * 0.82}"
    r="${r * 0.30}"
    fill="${s.skin}"/>
  <ellipse cx="${r}" cy="${r * 0.82}"
    rx="${r * 0.32}" ry="${r * 0.28}"
    fill="${s.skin}"/>
  <!-- Eyes -->
  <circle cx="${r * 0.87}" cy="${r * 0.78}"
    r="${r * 0.05}" fill="#1F2937"/>
  <circle cx="${r * 1.13}" cy="${r * 0.78}"
    r="${r * 0.05}" fill="#1F2937"/>
  <!-- Smile -->
  <path d="M ${r * 0.87} ${r * 0.89}
    Q ${r} ${r * 0.96}
    ${r * 1.13} ${r * 0.89}"
    stroke="#1F2937" stroke-width="1.2"
    fill="none" stroke-linecap="round"/>
  <!-- Shirt -->
  <ellipse cx="${r}" cy="${r * 1.72}"
    rx="${r * 0.55}" ry="${r * 0.35}"
    fill="${s.shirt}"/>
  <!-- Clip to circle -->
  <circle cx="${r}" cy="${r}" r="${r}"
    fill="none"/>
</svg>`;
  }

  if (gender === 'Male') {
    return `
<svg width="${size}" height="${size}"
  viewBox="0 0 ${size} ${size}"
  xmlns="http://www.w3.org/2000/svg">
  <!-- Background -->
  <circle cx="${r}" cy="${r}" r="${r}"
    fill="${s.bg}"/>
  <!-- Short hair -->
  <ellipse cx="${r}" cy="${r * 0.52}"
    rx="${r * 0.38}" ry="${r * 0.28}"
    fill="${s.hair}"/>
  <!-- Face -->
  <ellipse cx="${r}" cy="${r * 0.82}"
    rx="${r * 0.30}" ry="${r * 0.27}"
    fill="${s.skin}"/>
  <!-- Eyes -->
  <circle cx="${r * 0.88}" cy="${r * 0.78}"
    r="${r * 0.05}" fill="#1F2937"/>
  <circle cx="${r * 1.12}" cy="${r * 0.78}"
    r="${r * 0.05}" fill="#1F2937"/>
  <!-- Smile -->
  <path d="M ${r * 0.88} ${r * 0.89}
    Q ${r} ${r * 0.95}
    ${r * 1.12} ${r * 0.89}"
    stroke="#1F2937" stroke-width="1.2"
    fill="none" stroke-linecap="round"/>
  <!-- Shirt collar -->
  <ellipse cx="${r}" cy="${r * 1.72}"
    rx="${r * 0.52}" ry="${r * 0.32}"
    fill="${s.shirt}"/>
  <!-- Tie hint -->
  <rect x="${r * 0.94}" y="${r * 1.42}"
    width="${r * 0.12}" height="${r * 0.22}"
    rx="${r * 0.04}" fill="white"
    opacity="0.4"/>
</svg>`;
  }

  // Other / fallback — initial letter
  return `
<svg width="${size}" height="${size}"
  viewBox="0 0 ${size} ${size}"
  xmlns="http://www.w3.org/2000/svg">
  <circle cx="${r}" cy="${r}" r="${r}"
    fill="${s.bg}"/>
  <text x="50%" y="54%"
    dominant-baseline="middle"
    text-anchor="middle"
    font-size="${r * 0.85}"
    font-weight="700"
    font-family="system-ui,sans-serif"
    fill="${s.accent}">
    ${initial}
  </text>
</svg>`;
}

// Convert SVG to data URL for img src
export function svgToDataUrl(svg: string): string {
  const encoded = encodeURIComponent(svg
    .replace(/\n/g, ' ')
    .replace(/\s+/g, ' '));
  return `data:image/svg+xml,${encoded}`;
}

// Get avatar data URL from profile
export function getAvatarUrl(
  userProfile: any,
  size: number = 40
): string {
  // Priority 1: user uploaded photo
  if (userProfile?.profilePhotoUrl) {
    return userProfile.profilePhotoUrl;
  }
  // Priority 2: gender-based SVG avatar
  const gender = userProfile?.gender || 'Other';
  const name = userProfile?.name || '?';
  const svg = generateAvatarSVG(
    name, gender as AvatarGender, size
  );
  return svgToDataUrl(svg);
}
