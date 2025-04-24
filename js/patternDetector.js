class PatternDetector {
  constructor() {
    this.patterns = {
      common: {
        doji: this.doji,
        hammer: this.hammer,
        shootingStar: this.shootingStar,
        bullishEngulfing: this.bullishEngulfing,
        bearishEngulfing: this.bearishEngulfing,
        morningStar: this.morningStar,
        eveningStar: this.eveningStar
      },
      advanced: {
        threeWhiteSoldiers: this.threeWhiteSoldiers,
        threeBlackCrows: this.threeBlackCrows,
        bullishHarami: this.bullishHarami,
        bearishHarami: this.bearishHarami,
        tweezersTop: this.tweezersTop,
        tweezersBottom: this.tweezersBottom,
      }
    };
  }

  // Helper methods
  isBodySmall(candle, threshold = 0.1) {
    const bodySize = Math.abs(candle.close - candle.open);
    const candleRange = candle.high - candle.low;
    return bodySize / candleRange < threshold;
  }
  
  getBodySize(candle) {
    return Math.abs(candle.close - candle.open);
  }
  
  getLowerShadow(candle) {
    return candle.open > candle.close 
      ? candle.close - candle.low 
      : candle.open - candle.low;
  }
  
  getUpperShadow(candle) {
    return candle.open > candle.close 
      ? candle.high - candle.open 
      : candle.high - candle.close;
  }
  
  isBullish(candle) {
    return candle.close > candle.open;
  }
  
  isBearish(candle) {
    return candle.close < candle.open;
  }
  
  // Common Patterns
  doji(candle) {
    return this.isBodySmall(candle, 0.05);
  }
  
  hammer(candle) {
    if (!this.isBullish(candle)) return false;
    
    const bodySize = this.getBodySize(candle);
    const lowerShadow = this.getLowerShadow(candle);
    const upperShadow = this.getUpperShadow(candle);
    
    return lowerShadow > bodySize * 2 && upperShadow < bodySize * 0.5;
  }
  
  shootingStar(candle) {
    if (!this.isBearish(candle)) return false;
    
    const bodySize = this.getBodySize(candle);
    const lowerShadow = this.getLowerShadow(candle);
    const upperShadow = this.getUpperShadow(candle);
    
    return upperShadow > bodySize * 2 && lowerShadow < bodySize * 0.5;
  }
  
  bullishEngulfing(candles, index) {
    if (index < 1) return false;
    
    const current = candles[index];
    const previous = candles[index - 1];
    
    return this.isBearish(previous) && 
           this.isBullish(current) && 
           current.open < previous.close && 
           current.close > previous.open;
  }
  
  bearishEngulfing(candles, index) {
    if (index < 1) return false;
    
    const current = candles[index];
    const previous = candles[index - 1];
    
    return this.isBullish(previous) && 
           this.isBearish(current) && 
           current.open > previous.close && 
           current.close < previous.open;
  }
  
  morningStar(candles, index) {
    if (index < 2) return false;
    
    const first = candles[index - 2];
    const middle = candles[index - 1];
    const last = candles[index];
    
    return this.isBearish(first) && 
           this.isBodySmall(middle) && 
           this.isBullish(last) && 
           last.close > (first.open + first.close) / 2;
  }
  
  eveningStar(candles, index) {
    if (index < 2) return false;
    
    const first = candles[index - 2];
    const middle = candles[index - 1];
    const last = candles[index];
    
    return this.isBullish(first) && 
           this.isBodySmall(middle) && 
           this.isBearish(last) && 
           last.close < (first.open + first.close) / 2;
  }
  
  // Advanced Patterns
  threeWhiteSoldiers(candles, index) {
    if (index < 2) return false;
    
    for (let i = 0; i < 3; i++) {
      if (!this.isBullish(candles[index - i])) return false;
    }
    
    return candles[index].open > candles[index - 1].open && 
           candles[index - 1].open > candles[index - 2].open && 
           candles[index].close > candles[index - 1].close && 
           candles[index - 1].close > candles[index - 2].close;
  }
  
  threeBlackCrows(candles, index) {
    if (index < 2) return false;
    
    for (let i = 0; i < 3; i++) {
      if (!this.isBearish(candles[index - i])) return false;
    }
    
    return candles[index].open < candles[index - 1].open && 
           candles[index - 1].open < candles[index - 2].open && 
           candles[index].close < candles[index - 1].close && 
           candles[index - 1].close < candles[index - 2].close;
  }
  
  bullishHarami(candles, index) {
    if (index < 1) return false;
    
    const current = candles[index];
    const previous = candles[index - 1];
    
    return this.isBearish(previous) && 
           this.isBullish(current) && 
           current.open > previous.close && 
           current.close < previous.open;
  }
  
  bearishHarami(candles, index) {
    if (index < 1) return false;
    
    const current = candles[index];
    const previous = candles[index - 1];
    
    return this.isBullish(previous) && 
           this.isBearish(current) && 
           current.open < previous.close && 
           current.close > previous.open;
  }
  
  tweezersTop(candles, index) {
    if (index < 1) return false;
    
    const current = candles[index];
    const previous = candles[index - 1];
    
    const highDiff = Math.abs(current.high - previous.high);
    const avgHigh = (current.high + previous.high) / 2;
    
    return this.isBullish(previous) && 
           this.isBearish(current) && 
           highDiff / avgHigh < 0.001;
  }
  
  tweezersBottom(candles, index) {
    if (index < 1) return false;
    
    const current = candles[index];
    const previous = candles[index - 1];
    
    const lowDiff = Math.abs(current.low - previous.low);
    const avgLow = (current.low + previous.low) / 2;
    
    return this.isBearish(previous) && 
           this.isBullish(current) && 
           lowDiff / avgLow < 0.001;
  }
  
  detectPatterns(candles, options = { common: true, advanced: true }) {
    const detectedPatterns = [];
    
    candles.forEach((candle, index) => {
      const patterns = {};
      
      // Check common patterns
      if (options.common) {
        // Single candle patterns
        if (this.doji(candle)) {
          patterns.doji = { type: 'common', category: 'common', sentiment: 'neutral' };
        }
        
        if (this.hammer(candle)) {
          patterns.hammer = { type: 'common', category: 'common', sentiment: 'bullish' };
        }
        
        if (this.shootingStar(candle)) {
          patterns.shootingStar = { type: 'common', category: 'common', sentiment: 'bearish' };
        }
        
        // Multi-candle patterns
        if (this.bullishEngulfing(candles, index)) {
          patterns.bullishEngulfing = { type: 'common', category: 'common', sentiment: 'bullish' };
        }
        
        if (this.bearishEngulfing(candles, index)) {
          patterns.bearishEngulfing = { type: 'common', category: 'common', sentiment: 'bearish' };
        }
        
        if (this.morningStar(candles, index)) {
          patterns.morningStar = { type: 'common', category: 'common', sentiment: 'bullish' };
        }
        
        if (this.eveningStar(candles, index)) {
          patterns.eveningStar = { type: 'common', category: 'common', sentiment: 'bearish' };
        }
      }
      
      // Check advanced patterns
      if (options.advanced) {
        if (this.threeWhiteSoldiers(candles, index)) {
          patterns.threeWhiteSoldiers = { type: 'advanced', category: 'advanced', sentiment: 'bullish' };
        }
        
        if (this.threeBlackCrows(candles, index)) {
          patterns.threeBlackCrows = { type: 'advanced', category: 'advanced', sentiment: 'bearish' };
        }
        
        if (this.bullishHarami(candles, index)) {
          patterns.bullishHarami = { type: 'advanced', category: 'advanced', sentiment: 'bullish' };
        }
        
        if (this.bearishHarami(candles, index)) {
          patterns.bearishHarami = { type: 'advanced', category: 'advanced', sentiment: 'bearish' };
        }
        
        if (this.tweezersTop(candles, index)) {
          patterns.tweezersTop = { type: 'advanced', category: 'advanced', sentiment: 'bearish' };
        }
        
        if (this.tweezersBottom(candles, index)) {
          patterns.tweezersBottom = { type: 'advanced', category: 'advanced', sentiment: 'bullish' };
        }
      }
      
      if (Object.keys(patterns).length > 0) {
        detectedPatterns.push({
          index,
          time: candle.time,
          patterns
        });
      }
    });
    
    return detectedPatterns;
  }
}

// Create a singleton instance
const patternDetector = new PatternDetector();
