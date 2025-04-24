/**
 * Test utility for pattern detection
 * This script helps verify if patterns are correctly identified and displayed
 */

// Function to test hammer pattern detection
function testHammerPattern() {
  console.group('🔨 Hammer Pattern Test');

  // Define test candles
  const testCandles = [
    // Clear hammer pattern
    {
      name: "Clear Hammer",
      open: 100,
      high: 101,
      low: 90,
      close: 101,
      expected: true
    },
    // Not a hammer - bearish
    {
      name: "Bearish Candle",
      open: 101,
      high: 101,
      low: 90,
      close: 100,
      expected: false
    },
    // Not a hammer - long upper shadow
    {
      name: "Long Upper Shadow",
      open: 100,
      high: 110,
      low: 95,
      close: 102,
      expected: false
    },
    // Not a hammer - small lower shadow
    {
      name: "Small Lower Shadow",
      open: 100,
      high: 102,
      low: 98,
      close: 101,
      expected: false
    }
  ];

  // Test each candle
  testCandles.forEach(test => {
    const candle = {
      time: Date.now(),
      open: test.open,
      high: test.high,
      low: test.low,
      close: test.close
    };

    const isHammer = patternDetector.hammer(candle);
    const bodySize = patternDetector.getBodySize(candle);
    const lowerShadow = patternDetector.getLowerShadow(candle);
    const upperShadow = patternDetector.getUpperShadow(candle);

    console.log(`Testing: ${test.name}`);
    console.log(`Result: ${isHammer ? '✅ Hammer detected' : '❌ Not a hammer'}`);
    console.log(`Expected: ${test.expected ? 'Hammer' : 'Not a hammer'}`);
    console.log(`Match: ${isHammer === test.expected ? '✓' : '✗'}`);
    console.log(`Candle: O=${test.open}, H=${test.high}, L=${test.low}, C=${test.close}`);
    console.log(`Body Size: ${bodySize.toFixed(2)}`);
    console.log(`Lower Shadow: ${lowerShadow.toFixed(2)}`);
    console.log(`Upper Shadow: ${upperShadow.toFixed(2)}`);
    console.log(`Bullish: ${patternDetector.isBullish(candle)}`);
    console.log(`Condition 1: Lower Shadow > Body Size * 2 = ${lowerShadow > bodySize * 2}`);
    console.log(`Condition 2: Upper Shadow < Body Size * 0.5 = ${upperShadow < bodySize * 0.5}`);
    console.log('---');
  });

  console.groupEnd();
  
  console.log("To verify real hammer patterns in your chart:");
  console.log("1. Enable debug mode by adding a debug button or setting window.DEBUG_PATTERNS = true");
  console.log("2. Check BTCUSDT with 1d interval for good examples of hammer patterns");
  
  return "Test complete. See console for results.";
}

// Test all patterns with sample data
function testAllPatterns() {
  console.group('Pattern Detection Test');
  
  // Create sample candle data
  const createSampleCandles = () => {
    const candles = [];
    let price = 100;
    const now = Date.now();
    const dayMs = 24 * 60 * 60 * 1000;
    
    for (let i = 0; i < 20; i++) {
      // Create some volatility
      const range = price * 0.05; // 5% volatility
      const changePercent = (Math.random() - 0.5) * 0.03; // -1.5% to 1.5% change
      
      const open = price;
      const close = price * (1 + changePercent);
      const high = Math.max(open, close) + (Math.random() * range);
      const low = Math.min(open, close) - (Math.random() * range);
      
      candles.push({
        time: now - ((20 - i) * dayMs),
        open: open,
        high: high,
        low: low,
        close: close,
        volume: Math.random() * 1000000
      });
      
      price = close; // Next candle starts at previous close
    }
    
    return candles;
  };
  
  // Generate test data
  const candles = createSampleCandles();
  
  // Add specific patterns for testing
  // Add a hammer
  candles[10] = {
    time: candles[10].time,
    open: 100,
    high: 101,
    low: 90,
    close: 101,
    volume: candles[10].volume
  };
  
  // Add bullish engulfing
  candles[12] = {
    time: candles[12].time,
    open: 101,
    high: 101,
    low: 97,
    close: 98,
    volume: candles[12].volume
  };
  candles[13] = {
    time: candles[13].time,
    open: 97.5,
    high: 102,
    low: 97,
    close: 101.5,
    volume: candles[13].volume
  };
  
  // Test detection
  const patterns = patternDetector.detectPatterns(candles);
  
  console.log(`Candles analyzed: ${candles.length}`);
  console.log(`Patterns detected: ${patterns.length}`);
  
  // Log detected patterns
  patterns.forEach(pattern => {
    console.log(`Pattern at index ${pattern.index} (${new Date(pattern.time).toLocaleDateString()})`);
    console.log("Patterns found:", Object.keys(pattern.patterns).join(", "));
    console.log("Candle data:", candles[pattern.index]);
    console.log("---");
  });
  
  console.groupEnd();
  
  return "Pattern test complete. See console for results.";
}

// Add test functions to window for console access
window.testHammerPattern = testHammerPattern;
window.testAllPatterns = testAllPatterns;
