export const getItemImageUrl = (itemId: string, quality: number): string => {
  return `https://render.albiononline.com/v1/item/${itemId}.png?quality=${quality}&size=217`;
};

export const extractTierFromItemId = (itemId: string): string | null => {
  const match = itemId.match(/^T(\d)/);
  return match ? match[1] : null;
};

export const extractEnchantmentFromItemId = (itemId: string): string => {
  const match = itemId.match(/@(\d)$/);
  return match ? match[1] : '0';
};

export const getTierColor = (tier: string): string => {
  const tierColors: Record<string, string> = {
    '2': 'text-tier-2',
    '3': 'text-tier-3',
    '4': 'text-tier-4',
    '5': 'text-tier-5',
    '6': 'text-tier-6',
    '7': 'text-tier-7',
    '8': 'text-tier-8'
  };
  return tierColors[tier] || 'text-gray-500';
};

export const formatPrice = (price: number): string => {
  return price.toLocaleString('pt-BR');
};

export const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

export const getRelativeTime = (dateString: string): string => {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  
  if (diffMins < 60) {
    return `${diffMins}m atrás`;
  } else if (diffHours < 24) {
    return `${diffHours}h atrás`;
  } else {
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}d atrás`;
  }
};
