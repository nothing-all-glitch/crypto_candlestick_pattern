document.addEventListener('DOMContentLoaded', function() {
  // Initialize services
  const chartService = new ChartService('#chart-container');
  chartService.initChart();
  
  // DOM elements
  const symbolSelect = document.getElementById('symbol-select');
  const intervalSelect = document.getElementById('interval-select');
  const commonPatternsBtn = document.getElementById('common-patterns-btn');
  const advancedPatternsBtn = document.getElementById('advanced-patterns-btn');
  const themeToggleButton = document.getElementById('theme-toggle-btn');
  
  // Track button states (initially both active)
  let commonPatternsActive = true;
  let advancedPatternsActive = true;
  
  // Auto refresh interval ID
  let refreshIntervalId = null;
  
  // Theme toggle functionality
  let isDarkMode = false;

  themeToggleButton.addEventListener('click', function() {
    isDarkMode = !isDarkMode;
    document.body.classList.toggle('dark-mode', isDarkMode);
    
    const iconElement = themeToggleButton.querySelector('i');
    
    if (isDarkMode) {
      iconElement.className = 'bi bi-sun-fill';
    } else {
      iconElement.className = 'bi bi-moon-fill';
    }
    
    chartService.updateTheme(isDarkMode);
  });
  
  // Load data and update chart
  async function loadChartData() {
    const symbol = symbolSelect.value;
    const interval = intervalSelect.value;
    
    try {
      // Fetch candlestick data
      const candleData = await apiService.fetchCandlestickData(symbol, interval, 100);
      
      // Store current mouse position to help with tooltip refresh
      let chartElement = document.querySelector('#chart-container');
      if (chartElement && chartService.chart) {
        try {
          // Fix: ApexCharts doesn't have getChartInstance() method
          // Access chart globals directly
          if (chartService.chart.w && !chartService.chart.w.globals.chartHovered) {
            // If chart isn't being hovered, don't try to refresh tooltip
            chartService.chart.w.globals.lastHoverTime = 0;
          }
        } catch (e) {
          console.log("Could not access chart hover state:", e);
        }
      }
      
      // Update chart
      const title = `${symbol.replace('USDT', '/USDT')} - ${interval}`;
      chartService.updateChartData(candleData, title);
      
      // Always clear and update pattern annotations on each refresh to ensure
      // we're showing the latest patterns correctly
      chartService.clearPatternAnnotations();
      
      // Get pattern options from button states
      const patternOptions = {
        common: commonPatternsActive,
        advanced: advancedPatternsActive
      };
      
      // Only proceed with pattern detection if at least one option is active
      if (patternOptions.common || patternOptions.advanced) {
        // Detect only the selected pattern types
        const detectedPatterns = patternDetector.detectPatterns(candleData, patternOptions);
        
        // Add the detected patterns to the chart
        if (detectedPatterns.length > 0) {
          chartService.addPatternAnnotations(detectedPatterns);
        }
      }
    } catch (error) {
      console.error('Error loading chart data:', error);
    }
  }

  // Start continuous data refresh
  function startDataRefresh() {
    // Clear any existing interval
    if (refreshIntervalId) {
      clearInterval(refreshIntervalId);
    }
    
    // Set initial load
    loadChartData();
    
    // Set interval to refresh data - use a more reasonable interval (e.g., 5 seconds)
    // 1 second is too frequent and can cause performance issues
    refreshIntervalId = setInterval(loadChartData, 5000);
  }

  // Add event listeners to restart data refresh and update patterns when selections change
  symbolSelect.addEventListener('change', function() {
    chartService.clearPatternAnnotations();
    startDataRefresh();
  });
  
  intervalSelect.addEventListener('change', function() {
    chartService.clearPatternAnnotations();
    startDataRefresh();
  });
  
  // Pattern toggle buttons - update annotations immediately
  commonPatternsBtn.addEventListener('click', function() {
    commonPatternsActive = !commonPatternsActive;
    togglePatternButton(commonPatternsBtn, commonPatternsActive);
    chartService.clearPatternAnnotations();
    loadChartData(); // Update immediately
  });
  
  advancedPatternsBtn.addEventListener('click', function() {
    advancedPatternsActive = !advancedPatternsActive;
    togglePatternButton(advancedPatternsBtn, advancedPatternsActive);
    chartService.clearPatternAnnotations();
    loadChartData(); // Update immediately
  });
  
  // Initialize symbols and then start data loading
  async function initializeSymbols() {
    try {
      // Show loading state in select
      symbolSelect.disabled = true;
      const tempOption = document.createElement('option');
      tempOption.textContent = 'Loading symbols...';
      symbolSelect.appendChild(tempOption);
      
      // Fetch all available symbols
      await symbolService.fetchAllSymbols();
      
      // Populate the select element
      symbolService.populateSymbolSelect(symbolSelect);
      
      // Re-enable the select
      symbolSelect.disabled = false;
      
      // Start data refresh after symbols are loaded
      startDataRefresh();
    } catch (error) {
      console.error('Error initializing symbols:', error);
      symbolSelect.disabled = false;
      
      // Fall back to default symbols if there's an error
      const defaultSymbols = [
        { symbol: 'BTCUSDT', baseAsset: 'BTC' },
        { symbol: 'ETHUSDT', baseAsset: 'ETH' },
        { symbol: 'BNBUSDT', baseAsset: 'BNB' },
        { symbol: 'ADAUSDT', baseAsset: 'ADA' },
        { symbol: 'DOGEUSDT', baseAsset: 'DOGE' }
      ];
      
      symbolSelect.innerHTML = '';
      defaultSymbols.forEach(item => {
        const option = document.createElement('option');
        option.value = item.symbol;
        option.textContent = `${item.baseAsset}/USDT`;
        symbolSelect.appendChild(option);
      });
      
      startDataRefresh();
    }
  }
  
  // Toggle button states and styling
  function togglePatternButton(button, isActive) {
    if (isActive) {
      button.classList.add('active');
      button.querySelector('i').className = 'bi bi-check-circle-fill me-1';
    } else {
      button.classList.remove('active');
      button.querySelector('i').className = 'bi bi-circle me-1';
    }
  }
  
  // Initialize symbols and then start data loading
  initializeSymbols();
});
