import { useState, useEffect, useMemo } from 'react';
import ItemTable from './components/ItemTable';
import FilterPanel from './components/FilterPanel';
import { FlipData, Filters } from './types/FlipData';
import { extractTierFromItemId, extractEnchantmentFromItemId } from './utils/helpers';

function App() {
  const [data, setData] = useState<FlipData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sortField, setSortField] = useState<keyof FlipData>('profit');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(50);

  const [filters, setFilters] = useState<Filters>({
    minProfit: 0,
    maxProfit: 1000000,
    quality: [],
    tier: [],
    enchantment: [],
    searchName: '',
    minPrice: 0,
    maxPrice: 10000000
  });

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const response = await fetch('/flip-data-1.json');
        if (!response.ok) {
          throw new Error('Falha ao carregar dados');
        }
        const jsonData: FlipData[] = await response.json();
        setData(jsonData);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erro desconhecido');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const filteredData = useMemo(() => {
    return data.filter((item) => {
      // Profit filter
      if (item.profit < filters.minProfit || item.profit > filters.maxProfit) {
        return false;
      }

      // Price filter
      if (item.buy_price < filters.minPrice || item.buy_price > filters.maxPrice) {
        return false;
      }

      // Quality filter
      if (filters.quality.length > 0) {
        if (!filters.quality.includes(item.buy_quality) && !filters.quality.includes(item.sell_quality)) {
          return false;
        }
      }

      // Tier filter
      if (filters.tier.length > 0) {
        const tier = extractTierFromItemId(item.item_id);
        if (!tier || !filters.tier.includes(tier)) {
          return false;
        }
      }

      // Enchantment filter
      if (filters.enchantment.length > 0) {
        const enchantment = extractEnchantmentFromItemId(item.item_id);
        if (!filters.enchantment.includes(enchantment)) {
          return false;
        }
      }

      // Name search filter
      if (filters.searchName) {
        const searchLower = filters.searchName.toLowerCase();
        if (
          !item.item_name.toLowerCase().includes(searchLower) &&
          !item.item_id.toLowerCase().includes(searchLower)
        ) {
          return false;
        }
      }

      return true;
    });
  }, [data, filters]);

  const sortedData = useMemo(() => {
    const sorted = [...filteredData].sort((a, b) => {
      const aValue = a[sortField];
      const bValue = b[sortField];

      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return sortDirection === 'asc'
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue);
      }

      if (typeof aValue === 'number' && typeof bValue === 'number') {
        return sortDirection === 'asc' ? aValue - bValue : bValue - aValue;
      }

      return 0;
    });

    return sorted;
  }, [filteredData, sortField, sortDirection]);

  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return sortedData.slice(startIndex, endIndex);
  }, [sortedData, currentPage, itemsPerPage]);

  const totalPages = Math.ceil(sortedData.length / itemsPerPage);

  const handleSort = (field: keyof FlipData) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
    setCurrentPage(1);
  };

  const handleFiltersChange = (newFilters: Filters) => {
    setFilters(newFilters);
    setCurrentPage(1);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-blue-500 border-solid mx-auto mb-4"></div>
          <p className="text-white text-xl">Carregando dados do mercado...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="bg-red-900 border border-red-700 text-white px-6 py-4 rounded-lg">
          <h2 className="text-xl font-bold mb-2">Erro ao carregar dados</h2>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold text-white mb-2">
            🔄 Albion Market - Oportunidades de Flip
          </h1>
          <p className="text-gray-400">
            Arbitragem entre Lymhurst e Black Market
          </p>
        </div>

        {/* Filter Panel */}
        <FilterPanel
          filters={filters}
          onFiltersChange={handleFiltersChange}
          totalItems={data.length}
          filteredItems={sortedData.length}
        />

        {/* Pagination Controls - Top */}
        {sortedData.length > 0 && (
          <div className="mb-4 flex justify-between items-center bg-gray-800 px-6 py-4 rounded-lg">
            <div className="flex items-center gap-4">
              <label className="text-gray-300 text-sm">
                Itens por página:
              </label>
              <select
                value={itemsPerPage}
                onChange={(e) => {
                  setItemsPerPage(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="px-4 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value={25}>25</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
                <option value={200}>200</option>
              </select>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage(1)}
                disabled={currentPage === 1}
                className="px-3 py-2 bg-gray-700 text-white rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-600"
              >
                ««
              </button>
              <button
                onClick={() => setCurrentPage(currentPage - 1)}
                disabled={currentPage === 1}
                className="px-3 py-2 bg-gray-700 text-white rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-600"
              >
                «
              </button>
              <span className="text-white px-4">
                Página {currentPage} de {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="px-3 py-2 bg-gray-700 text-white rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-600"
              >
                »
              </button>
              <button
                onClick={() => setCurrentPage(totalPages)}
                disabled={currentPage === totalPages}
                className="px-3 py-2 bg-gray-700 text-white rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-600"
              >
                »»
              </button>
            </div>
          </div>
        )}

        {/* Item Table */}
        <ItemTable
          data={paginatedData}
          onSort={handleSort}
          sortField={sortField}
          sortDirection={sortDirection}
        />

        {/* Pagination Controls - Bottom */}
        {sortedData.length > 0 && (
          <div className="mt-4 flex justify-center">
            <div className="flex items-center gap-2 bg-gray-800 px-6 py-4 rounded-lg">
              <button
                onClick={() => setCurrentPage(1)}
                disabled={currentPage === 1}
                className="px-3 py-2 bg-gray-700 text-white rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-600"
              >
                ««
              </button>
              <button
                onClick={() => setCurrentPage(currentPage - 1)}
                disabled={currentPage === 1}
                className="px-3 py-2 bg-gray-700 text-white rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-600"
              >
                «
              </button>
              <span className="text-white px-4">
                Página {currentPage} de {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="px-3 py-2 bg-gray-700 text-white rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-600"
              >
                »
              </button>
              <button
                onClick={() => setCurrentPage(totalPages)}
                disabled={currentPage === totalPages}
                className="px-3 py-2 bg-gray-700 text-white rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-600"
              >
                »»
              </button>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="mt-8 text-center text-gray-500 text-sm">
          <p>Dados atualizados em tempo real do Albion Online Data Project</p>
        </div>
      </div>
    </div>
  );
}

export default App;
