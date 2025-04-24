class ApiService {
  constructor() {
    this.baseUrl = 'https://api.binance.com/api/v3';
    this.cache = {};
    this.pendingRequests = {};
  }
  
  async fetchCandlestickData(symbol, interval, limit = 100) {
    const cacheKey = `${symbol}-${interval}-${limit}`;
    
    // Check if we have a pending request for this data to avoid duplicate requests
    if (this.pendingRequests[cacheKey]) {
      return this.pendingRequests[cacheKey];
    }
    
    // Return cached data if available and not older than 500ms
    // Use a shorter cache time since we're refreshing frequently
    if (this.cache[cacheKey] && 
        (Date.now() - this.cache[cacheKey].timestamp) < 500) {
      return this.cache[cacheKey].data;
    }
    
    const url = `${this.baseUrl}/klines?symbol=${symbol}&interval=${interval}&limit=${limit}`;
    
    try {
      // Store the promise to prevent duplicate requests
      this.pendingRequests[cacheKey] = new Promise(async (resolve, reject) => {
        try {
          const response = await fetch(url);
          
          if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
          }
          
          const data = await response.json();
          
          // Transform Binance data to our format
          const transformedData = data.map(candle => ({
            time: candle[0], // Open time
            open: parseFloat(candle[1]),
            high: parseFloat(candle[2]),
            low: parseFloat(candle[3]),
            close: parseFloat(candle[4]),
            volume: parseFloat(candle[5]),
            closeTime: candle[6],
            quoteAssetVolume: parseFloat(candle[7]),
            numberOfTrades: parseFloat(candle[8]),
            takerBuyBaseAssetVolume: parseFloat(candle[9]),
            takerBuyQuoteAssetVolume: parseFloat(candle[10]),
          }));
          
          // Cache the data
          this.cache[cacheKey] = {
            timestamp: Date.now(),
            data: transformedData
          };
          
          resolve(transformedData);
        } catch (error) {
          reject(error);
        } finally {
          // Remove from pending requests
          delete this.pendingRequests[cacheKey];
        }
      });
      
      return await this.pendingRequests[cacheKey];
    } catch (error) {
      console.error('Error fetching candlestick data:', error);
      throw error;
    }
  }
  
  async getExchangeInfo() {
    const url = `${this.baseUrl}/exchangeInfo`;
    
    try {
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error fetching exchange info:', error);
      throw error;
    }
  }
}

// Create a singleton instance
const apiService = new ApiService();
