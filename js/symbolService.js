class SymbolService {
  constructor() {
    this.symbols = [];
    this.popularSymbols = [
      'BTCUSDT', 'ETHUSDT', 'BNBUSDT', 'ADAUSDT', 'DOGEUSDT', 
      'XRPUSDT', 'SOLUSDT', 'DOTUSDT', 'LTCUSDT', 'LINKUSDT'
    ];
  }
  
  async fetchAllSymbols() {
    try {
      // Fetch exchange info from Binance
      const exchangeInfo = await apiService.getExchangeInfo();
      
      if (!exchangeInfo || !exchangeInfo.symbols) {
        console.error('Invalid exchange info format');
        return [];
      }
      
      // Filter for USDT pairs only
      const usdtSymbols = exchangeInfo.symbols
        .filter(symbol => 
          symbol.status === 'TRADING' && 
          symbol.quoteAsset === 'USDT' &&
          !symbol.symbol.includes('_')  // Exclude special markets
        )
        .map(symbol => ({
          symbol: symbol.symbol,
          baseAsset: symbol.baseAsset,
          isPopular: this.popularSymbols.includes(symbol.symbol)
        }))
        .sort((a, b) => {
          // Sort popular symbols first, then alphabetically
          if (a.isPopular && !b.isPopular) return -1;
          if (!a.isPopular && b.isPopular) return 1;
          return a.symbol.localeCompare(b.symbol);
        });
      
      this.symbols = usdtSymbols;
      return usdtSymbols;
    } catch (error) {
      console.error('Error fetching symbols:', error);
      return [];
    }
  }
  
  populateSymbolSelect(selectElement) {
    if (!selectElement) return;
    
    // Clear existing options
    selectElement.innerHTML = '';
    
    // Create option groups
    const popularGroup = document.createElement('optgroup');
    popularGroup.label = 'Popular';
    
    const othersGroup = document.createElement('optgroup');
    othersGroup.label = 'All Cryptocurrencies';
    
    // Add symbols to appropriate groups
    this.symbols.forEach(item => {
      const option = document.createElement('option');
      option.value = item.symbol;
      option.textContent = `${item.baseAsset}/USDT`;
      
      if (item.isPopular) {
        popularGroup.appendChild(option);
      } else {
        othersGroup.appendChild(option);
      }
    });
    
    // Add groups to select element
    if (popularGroup.children.length > 0) {
      selectElement.appendChild(popularGroup);
    }
    
    if (othersGroup.children.length > 0) {
      selectElement.appendChild(othersGroup);
    }
  }
}

// Create a singleton instance
const symbolService = new SymbolService();
