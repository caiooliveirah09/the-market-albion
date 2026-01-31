# Albion Market - Frontend

Interface web para visualização de oportunidades de flip no Albion Online.

## 🚀 Como Executar

### Instalação

```bash
cd frontend
npm install
```

### Desenvolvimento

```bash
npm run dev
```

A aplicação estará disponível em `http://localhost:5173`

### Build para Produção

```bash
npm run build
npm run preview
```

## 📋 Funcionalidades

### 🎯 Filtros Avançados

- **Busca por Nome**: Pesquise itens pelo nome ou ID
- **Filtro de Lucro**: Defina intervalos de lucro mínimo e máximo
- **Filtro de Preço**: Filtre por faixa de preço de compra
- **Filtro de Qualidade**: Selecione qualidades específicas (Normal, Bom, Excepcional, Excelente, Obra-prima)
- **Filtro de Tier**: Filtre por tier do item (T4-T8)
- **Filtro de Encantamento**: Selecione níveis de encantamento (.0 até .4)

### 📊 Tabela Interativa

- **Imagens dos Itens**: Renderizadas diretamente do Albion Online
- **Indicadores Visuais**: 
  - Cores por tier (T4 azul, T5 roxo, T6 laranja, T7 dourado, T8 rosa)
  - Cores por qualidade (Normal cinza, Bom verde, Excepcional azul, Excelente roxo, Obra-prima dourado)
  - Badge de encantamento nos itens
- **Ordenação**: Clique nos cabeçalhos das colunas para ordenar
- **Paginação**: Navegue pelos resultados com opções de 25, 50, 100 ou 200 itens por página

### 🎨 Interface

- Design escuro otimizado para visualização prolongada
- Responsivo para desktop e dispositivos móveis
- Cores personalizadas por tier e qualidade
- Timestamps com tempo relativo (ex: "2h atrás")
- Formatação de preços em português brasileiro

## 🏗️ Estrutura do Projeto

```
frontend/
├── src/
│   ├── components/
│   │   ├── ItemTable.tsx      # Componente da tabela de itens
│   │   └── FilterPanel.tsx    # Componente do painel de filtros
│   ├── types/
│   │   └── FlipData.ts        # Tipos TypeScript para dados
│   ├── utils/
│   │   └── helpers.ts         # Funções utilitárias
│   ├── App.tsx                # Componente principal
│   ├── main.tsx               # Entry point
│   └── index.css              # Estilos globais com Tailwind
├── public/
│   └── flip-data-1.json       # Dados de mercado
├── package.json
├── tsconfig.json
├── vite.config.ts
└── tailwind.config.js
```

## 🔧 Tecnologias

- **React 18** - Framework UI
- **TypeScript** - Type safety
- **Vite** - Build tool e dev server
- **Tailwind CSS** - Framework CSS
- **Albion Online Data Project** - API de imagens dos itens

## 📝 Notas

- Os dados são carregados do arquivo `public/flip-data-1.json`
- As imagens são carregadas diretamente da API do Albion Online
- Para atualizar os dados, execute `npm start` no diretório raiz do projeto e copie o novo `flip-data-1.json` para `frontend/public/`

## 🎮 Sobre os Dados

O aplicativo consome dados de arbitragem entre:
- **Cidade de Compra**: Caerleon
- **Cidade de Venda**: Black Market

Os lucros já consideram a taxa de 4% do Black Market.
