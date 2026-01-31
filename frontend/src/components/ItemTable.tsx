import { FlipData, Quality, QualityLabels, QualityColors } from '../types/FlipData';
import {
  getItemImageUrl,
  extractTierFromItemId,
  extractEnchantmentFromItemId,
  getTierColor,
  formatPrice,
  getRelativeTime
} from '../utils/helpers';

interface ItemTableProps {
  data: FlipData[];
  onSort: (field: keyof FlipData) => void;
  sortField: keyof FlipData;
  sortDirection: 'asc' | 'desc';
}

const ItemTable = ({ data, onSort, sortField, sortDirection }: ItemTableProps) => {
  const getSortIcon = (field: keyof FlipData) => {
    if (sortField !== field) return '⇅';
    return sortDirection === 'asc' ? '↑' : '↓';
  };

  return (
    <div className="overflow-x-auto bg-gray-800 rounded-lg shadow-xl">
      <table className="min-w-full divide-y divide-gray-700">
        <thead className="bg-gray-900">
          <tr>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
              Imagem
            </th>
            <th
              className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider cursor-pointer hover:text-white"
              onClick={() => onSort('item_name')}
            >
              Item {getSortIcon('item_name')}
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
              Qualidade
            </th>
            <th
              className="px-4 py-3 text-right text-xs font-medium text-gray-300 uppercase tracking-wider cursor-pointer hover:text-white"
              onClick={() => onSort('buy_price')}
            >
              Preço Compra {getSortIcon('buy_price')}
            </th>
            <th
              className="px-4 py-3 text-right text-xs font-medium text-gray-300 uppercase tracking-wider cursor-pointer hover:text-white"
              onClick={() => onSort('sell_price')}
            >
              Preço Venda {getSortIcon('sell_price')}
            </th>
            <th
              className="px-4 py-3 text-right text-xs font-medium text-gray-300 uppercase tracking-wider cursor-pointer hover:text-white"
              onClick={() => onSort('profit')}
            >
              Lucro {getSortIcon('profit')}
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
              Atualizado
            </th>
          </tr>
        </thead>
        <tbody className="bg-gray-800 divide-y divide-gray-700">
          {data.map((item: FlipData, index: number) => {
            const tier = extractTierFromItemId(item.item_id);
            const enchantment = extractEnchantmentFromItemId(item.item_id);
            const tierColor = tier ? getTierColor(tier) : 'text-gray-400';

            return (
              <tr key={index} className="hover:bg-gray-750 transition-colors">
                <td className="px-4 py-3 whitespace-nowrap">
                  <div className="relative">
                    <img
                      src={getItemImageUrl(item.item_id, item.buy_quality)}
                      alt={item.item_name}
                      className="w-12 h-12 object-contain"
                      onError={(e) => {s
                        const target = e.target as HTMLImageElement;
                        target.src = `https://render.albiononline.com/v1/item/${item.item_id}.png?quality=1&size=217`;
                      }}
                    />
                    {enchantment !== '0' && (
                      <span className="absolute -bottom-1 -right-1 bg-purple-600 text-white text-xs px-1 rounded">
                        .{enchantment}
                      </span>
                    )}
                  </div>
                </td>
                <td className="px-4 py-3">
                  <div className="flex flex-col">
                    <span className={`font-medium ${tierColor}`}>{item.item_name}</span>
                    <span className="text-xs text-gray-400">{item.item_id}</span>
                    {tier && (
                      <span className={`text-xs ${tierColor} font-semibold`}>
                        Tier {tier}
                        {enchantment !== '0' && ` @${enchantment}`}
                      </span>
                    )}
                  </div>
                </td>
                <td className="px-4 py-3">
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-400">Compra:</span>
                      <span className={`text-sm font-medium ${QualityColors[item.buy_quality as Quality]}`}>
                        {QualityLabels[item.buy_quality as Quality]}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-400">Venda:</span>
                      <span className={`text-sm font-medium ${QualityColors[item.sell_quality as Quality]}`}>
                        {QualityLabels[item.sell_quality as Quality]}
                      </span>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3 text-right">
                  <div className="flex flex-col">
                    <span className="text-yellow-400 font-medium">{formatPrice(item.buy_price)}</span>
                    <span className="text-xs text-gray-400">{item.city_buy}</span>
                  </div>
                </td>
                <td className="px-4 py-3 text-right">
                  <div className="flex flex-col">
                    <span className="text-yellow-400 font-medium">{formatPrice(item.sell_price)}</span>
                    <span className="text-xs text-gray-400">{item.city_sell}</span>
                  </div>
                </td>
                <td className="px-4 py-3 text-right">
                  <span
                    className={`font-bold text-lg ${
                      item.profit > 50000
                        ? 'text-green-400'
                        : item.profit > 10000
                        ? 'text-green-500'
                        : 'text-green-600'
                    }`}
                  >
                    {formatPrice(item.profit)}
                  </span>
                </td>
                <td className="px-4 py-3 whitespace-nowrap">
                  <div className="flex flex-col text-xs">
                    <span className="text-gray-300">{getRelativeTime(item.sell_date)}</span>
                    <span className="text-gray-500">venda</span>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      {data.length === 0 && (
        <div className="text-center py-12 text-gray-400">
          Nenhum item encontrado com os filtros aplicados
        </div>
      )}
    </div>
  );
};

export default ItemTable;
