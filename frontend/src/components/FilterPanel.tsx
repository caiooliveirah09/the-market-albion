import { Filters, Quality, QualityLabels } from '../types/FlipData';

interface FilterPanelProps {
  filters: Filters;
  onFiltersChange: (filters: Filters) => void;
  totalItems: number;
  filteredItems: number;
}

const FilterPanel = ({
  filters,
  onFiltersChange,
  totalItems,
  filteredItems
}: FilterPanelProps) => {
  const handleFilterChange = (field: keyof Filters, value: any) => {
    onFiltersChange({
      ...filters,
      [field]: value
    });
  };

  const toggleArrayFilter = (field: 'quality' | 'tier' | 'enchantment', value: string | number) => {
    const currentArray = filters[field] as (string | number)[];
    const newArray = currentArray.includes(value)
      ? currentArray.filter(item => item !== value)
      : [...currentArray, value];
    
    handleFilterChange(field, newArray);
  };

  const resetFilters = () => {
    onFiltersChange({
      minProfit: 0,
      maxProfit: 1000000,
      quality: [],
      tier: [],
      enchantment: [],
      searchName: '',
      minPrice: 0,
      maxPrice: 10000000
    });
  };

  return (
    <div className="bg-gray-800 rounded-lg shadow-xl p-6 mb-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold text-white">Filtros</h2>
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-400">
            Mostrando <span className="text-white font-semibold">{filteredItems}</span> de{' '}
            <span className="text-white font-semibold">{totalItems}</span> itens
          </span>
          <button
            onClick={resetFilters}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-md transition-colors"
          >
            Limpar Filtros
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Search Name */}
        <div className="col-span-1 md:col-span-2">
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Buscar por Nome
          </label>
          <input
            type="text"
            value={filters.searchName}
            onChange={(e) => handleFilterChange('searchName', e.target.value)}
            placeholder="Digite o nome do item..."
            className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Profit Range */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Lucro Mínimo
          </label>
          <input
            type="number"
            value={filters.minProfit}
            onChange={(e) => handleFilterChange('minProfit', Number(e.target.value))}
            className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Lucro Máximo
          </label>
          <input
            type="number"
            value={filters.maxProfit}
            onChange={(e) => handleFilterChange('maxProfit', Number(e.target.value))}
            className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Price Range */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Preço Mínimo
          </label>
          <input
            type="number"
            value={filters.minPrice}
            onChange={(e) => handleFilterChange('minPrice', Number(e.target.value))}
            className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Preço Máximo
          </label>
          <input
            type="number"
            value={filters.maxPrice}
            onChange={(e) => handleFilterChange('maxPrice', Number(e.target.value))}
            className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Quality Filter */}
        <div className="col-span-1 md:col-span-2">
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Qualidade
          </label>
          <div className="flex flex-wrap gap-2">
            {[1, 2, 3, 4, 5].map((q) => (
              <button
                key={q}
                onClick={() => toggleArrayFilter('quality', q)}
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  filters.quality.includes(q)
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                {QualityLabels[q as Quality]}
              </button>
            ))}
          </div>
        </div>

        {/* Tier Filter */}
        <div className="col-span-1 md:col-span-2">
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Tier
          </label>
          <div className="flex flex-wrap gap-2">
            {['4', '5', '6', '7', '8'].map((t) => (
              <button
                key={t}
                onClick={() => toggleArrayFilter('tier', t)}
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  filters.tier.includes(t)
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                T{t}
              </button>
            ))}
          </div>
        </div>

        {/* Enchantment Filter */}
        <div className="col-span-1 md:col-span-2">
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Encantamento
          </label>
          <div className="flex flex-wrap gap-2">
            {['0', '1', '2', '3', '4'].map((e) => (
              <button
                key={e}
                onClick={() => toggleArrayFilter('enchantment', e)}
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  filters.enchantment.includes(e)
                    ? 'bg-purple-600 text-white'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                {e === '0' ? 'Sem Enc.' : `.${e}`}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default FilterPanel;
