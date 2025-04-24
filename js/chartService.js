class ChartService {
  constructor(containerId) {
    this.containerId = containerId;
    this.chart = null;
    this.candleData = [];
    this.patternAnnotations = [];
    this.defaultOptions = {
      series: [{
        data: []
      }],
      chart: {
        type: 'candlestick',
        height: 500,
        id: 'crypto-candles',
        toolbar: {
          autoSelected: 'zoom',
          show: true,
          tools: {
            download: true,
            selection: true,
            zoom: true,
            zoomin: true,
            zoomout: true,
            pan: true,
            reset: true
          }
        },
        background: 'var(--chart-bg)',
        fontFamily: 'Segoe UI, sans-serif',
      },
      title: {
        text: 'Crypto Candlestick Chart',
        align: 'left',
        style: {
          color: 'var(--text-color)',
          fontSize: '18px',
          fontWeight: 600,
          fontFamily: 'Segoe UI, sans-serif'
        }
      },
      tooltip: {
        enabled: true,
        theme: 'dark',
        x: {
          format: 'yyyy-MM-dd HH:mm'
        },
        style: {
          fontSize: '12px',
          fontFamily: 'Segoe UI, sans-serif'
        }
      },
      xaxis: {
        type: 'datetime',
        labels: {
          style: {
            colors: 'var(--text-color)',
            fontFamily: 'Segoe UI, sans-serif'
          },
          datetimeUTC: false
        },
        axisBorder: {
          show: false
        },
        axisTicks: {
          show: false
        }
      },
      yaxis: {
        tooltip: {
          enabled: true
        },
        labels: {
          style: {
            colors: 'var(--text-color)',
            fontFamily: 'Segoe UI, sans-serif'
          },
          formatter: function(value) {
            return '$' + value.toFixed(2);
          }
        }
      },
      grid: {
        borderColor: 'var(--border-color)',
        strokeDashArray: 4,
        xaxis: {
          lines: {
            show: true
          }
        },
        yaxis: {
          lines: {
            show: true
          }
        },
        padding: {
          top: 0,
          right: 10,
          bottom: 0,
          left: 10
        }
      },
      plotOptions: {
        candlestick: {
          colors: {
            upward: '#00b16a',
            downward: '#ff5252'
          },
          wick: {
            useFillColor: true
          }
        }
      },
      annotations: {
        points: []
      },
      responsive: [
        {
          breakpoint: 768,
          options: {
            chart: {
              height: 400
            }
          }
        }
      ]
    };
  }
  
  initChart() {
    const options = {
      ...this.defaultOptions,
      chart: {
        ...this.defaultOptions.chart,
        animations: {
          enabled: false
        },
        zoom: {
          enabled: true,
          type: 'x',
          autoScaleYaxis: true,
          zoomedArea: {
            fill: {
              color: '#90CAF9',
              opacity: 0.4
            },
            stroke: {
              color: '#0D47A1',
              opacity: 0.4,
              width: 1
            }
          }
        }
      }
    };
    
    this.chart = new ApexCharts(
      document.querySelector(this.containerId), 
      options
    );
    this.chart.render();
  }
  
  updateChartData(candleData, title) {
    this.candleData = candleData;
    
    const formattedData = candleData.map(candle => ({
      x: new Date(candle.time),
      y: [candle.open, candle.high, candle.low, candle.close]
    }));
    
    // Save current zoom/pan state if chart exists
    let currentXaxis = null;
    if (this.chart) {
      try {
        // Fix: ApexCharts doesn't have getChartInstance() method
        // Access the chart's w property directly to get axis information
        if (this.chart.w && this.chart.w.globals) {
          currentXaxis = {
            min: this.chart.w.globals.minX,
            max: this.chart.w.globals.maxX
          };
        }
      } catch (e) {
        console.log("Could not get chart state:", e);
      }
    }
    
    const options = {
      series: [{
        data: formattedData
      }],
      title: {
        text: title
      }
    };
    
    // Preserve the current x-axis range if available
    if (currentXaxis && currentXaxis.min && currentXaxis.max) {
      options.xaxis = {
        min: currentXaxis.min,
        max: currentXaxis.max
      };
    }
    
    if (this.chart) {
      // Use updateSeries instead of updateOptions for better performance
      // when only data changes
      this.chart.updateSeries([{
        data: formattedData
      }], false);
      
      // Update the title separately to avoid redrawing the whole chart
      this.chart.updateOptions({
        title: {
          text: title
        }
      }, false, false);
      
      // Force tooltip refresh if it's currently active
      try {
        // Fix: Access chart global properties directly
        if (this.chart && this.chart.w && this.chart.w.globals.lastHoverTime) {
          // Check if tooltip was recently active (within the last 5 seconds)
          const isTooltipActive = (Date.now() - this.chart.w.globals.lastHoverTime) < 5000;
          
          if (isTooltipActive && this.chart.w.globals.seriesX && this.chart.w.globals.seriesX.length) {
            // Find the current visible point closest to cursor position
            const lastHoverX = this.chart.w.globals.lastHoveredX;
            const lastHoverY = this.chart.w.globals.lastHoveredY;
            
            if (lastHoverX && lastHoverY) {
              // Small delay to ensure chart has updated with new data
              setTimeout(() => {
                // Trigger tooltip refresh by simulating mousemove event
                this.chart.ctx.updateHelpers.moveTooltip(
                  lastHoverX, 
                  lastHoverY
                );
              }, 50);
            }
          }
        }
      } catch (e) {
        console.log("Could not refresh tooltip:", e);
      }
    }
  }
  
  clearPatternAnnotations() {
    this.patternAnnotations = [];
    
    const options = {
      annotations: {
        points: []
      }
    };
    
    if (this.chart) {
      this.chart.updateOptions(options, false, true);
    }
  }

  formatPatternName(name) {
    return name
      .replace(/([A-Z])/g, ' $1')
      .replace(/^./, str => str.toUpperCase());
  }

  addPatternAnnotations(detectedPatterns) {
    if (!detectedPatterns || detectedPatterns.length === 0) {
      return this.clearPatternAnnotations();
    }
    
    // Store reference to this for use in callbacks
    const self = this;
    
    // Remove debug mode logging
    
    // Group patterns by candle time to handle congestion
    const patternsByTime = {};
    
    detectedPatterns.forEach(pattern => {
      const timeKey = pattern.time.toString();
      if (!patternsByTime[timeKey]) {
        patternsByTime[timeKey] = {
          index: pattern.index,
          time: pattern.time,
          patterns: {}
        };
      }
      
      // Merge patterns for the same candle
      Object.assign(patternsByTime[timeKey].patterns, pattern.patterns);
    });
    
    // Convert back to array
    const consolidatedPatterns = Object.values(patternsByTime);
    
    // Now create annotations from consolidated patterns
    this.patternAnnotations = consolidatedPatterns.map(pattern => {
      const candle = this.candleData[pattern.index];
      const patternNames = Object.keys(pattern.patterns);
      
      // Group patterns by category and sentiment for better organization
      const groupedPatterns = {
        common: {
          bullish: [],
          bearish: [],
          neutral: []
        },
        advanced: {
          bullish: [],
          bearish: [],
          neutral: []
        }
      };
      
      patternNames.forEach(name => {
        const patternInfo = pattern.patterns[name];
        const category = patternInfo.category || 'common'; // Default to common if not specified
        const sentiment = patternInfo.sentiment;
        
        groupedPatterns[category][sentiment].push({
          name: name,
          info: patternInfo
        });
      });
      
      const markers = [];
      
      // Process common patterns
      ['common', 'advanced'].forEach(category => {
        Object.entries(groupedPatterns[category]).forEach(([sentiment, patterns], groupIndex) => {
          if (patterns.length === 0) return;
          
          let y, color, linePath;
          const offset = 0.003 + (groupIndex * 0.002); // Stagger different sentiment groups
          
          if (sentiment === 'bullish') {
            color = '#00b16a';
            y = candle.high + (candle.high * offset);
            linePath = {
              type: 'line',
              strokeWidth: 2,
              stroke: color,
              strokeDashArray: 0
            };
          } else if (sentiment === 'bearish') {
            color = '#ff5252';
            y = candle.low - (candle.low * offset);
            linePath = {
              type: 'line',
              strokeWidth: 2,
              stroke: color,
              strokeDashArray: 0
            };
          } else {
            color = '#9c9c9c';
            y = candle.high + (candle.high * (offset + 0.002));
            linePath = {
              type: 'line',
              strokeWidth: 2,
              stroke: color,
              strokeDashArray: 2
            };
          }
          
          // Generate tooltip text with all patterns in this group
          const tooltipText = patterns.map(p => 
            `${self.formatPatternName(p.name)} (${sentiment}, ${category})`
          ).join('<br>');
          
          markers.push({
            x: new Date(candle.time).getTime(),
            y: y,
            category: category, // Store category for use in vertical line positioning
            marker: {
              size: 6,
              fillColor: color,
              strokeColor: '#fff',
              strokeWidth: 2,
              radius: 3,
              shape: 'circle'
            },
            label: {
              borderColor: 'transparent',
              textAnchor: 'middle',
              style: {
                color: 'transparent',
                background: 'transparent',
                fontSize: '0px'
              },
              text: '',
              mouseEnter: function() {
                // This is just a placeholder, the actual tooltip is shown using ApexCharts' tooltip
              }
            },
            tooltip: {
              enabled: true,
              text: tooltipText,
              category: category, // Store category for lookup
              customHTML: function() {
                return `<div class="pattern-tooltip ${sentiment}">
                          <div class="pattern-tooltip-header">${patterns.length} ${sentiment} ${category} pattern${patterns.length > 1 ? 's' : ''}</div>
                          <div class="pattern-tooltip-content">${tooltipText}</div>
                        </div>`;
              }
            }
          });
        });
      });
      
      return markers;
    }).flat();
    
    // Create marker annotations
    const markerAnnotations = this.patternAnnotations;
    
    // Create fixed-position annotations for the vertical lines
    const xAxisAnnotations = [];
    
    // First process common patterns
    const commonPatterns = markerAnnotations.filter(marker => marker.category === 'common');
    const advancedPatterns = markerAnnotations.filter(marker => marker.category === 'advanced');
    
    // Process each category with different offsets
    [
      { patterns: commonPatterns, offsetX: -5 },
      { patterns: advancedPatterns, offsetX: 5 }
    ].forEach(({ patterns, offsetX }) => {
      patterns.forEach(marker => {
        xAxisAnnotations.push({
          x: marker.x,
          borderColor: marker.marker.fillColor,
          strokeDashArray: 0,
          offsetX: offsetX,  // Apply the offset
          label: {
            text: ''
          }
        });
      });
    });
    
    const options = {
      annotations: {
        points: markerAnnotations,
        yaxis: [],
        xaxis: xAxisAnnotations
      },
      tooltip: {
        custom: function({ series, seriesIndex, dataPointIndex, w }) {
          // Find if there's a pattern annotation at this x position
          const dataPoint = w.config.series[seriesIndex].data[dataPointIndex];
          const xTime = new Date(dataPoint.x).getTime();
          
          const annotation = markerAnnotations.find(marker => marker.x === xTime);
          
          // Get full candlestick data
          const o = dataPoint.y[0].toFixed(2);
          const h = dataPoint.y[1].toFixed(2);
          const l = dataPoint.y[2].toFixed(2);
          const c = dataPoint.y[3].toFixed(2);
          
          // Calculate percent change and color it accordingly
          const change = ((c - o) / o * 100).toFixed(2);
          const changeColor = change >= 0 ? '#00b16a' : '#ff5252';
          
          // Create candlestick tooltip content
          let tooltipContent = `
            <div class="apexcharts-tooltip-candlestick">
              <div>Date: <span>${new Date(xTime).toLocaleString()}</span></div>
              <div>Open: <span>$${o}</span></div>
              <div>High: <span>$${h}</span></div>
              <div>Low: <span>$${l}</span></div>
              <div>Close: <span>$${c}</span></div>
              <div>Change: <span style="color:${changeColor}">${change}%</span></div>
            </div>
          `;
          
          // If there's a pattern annotation, append it to the tooltip
          if (annotation && annotation.tooltip && annotation.tooltip.customHTML) {
            tooltipContent += annotation.tooltip.customHTML();
          }
          
          return tooltipContent;
        }
      }
    };
    
    if (this.chart) {
      this.chart.updateOptions(options, false, true);
    }
  }

  // Helper method to find a candle by timestamp
  findCandleByTime(timestamp) {
    return this.candleData.find(candle => new Date(candle.time).getTime() === timestamp);
  }
  
  updateTheme(isDarkMode) {
    // Theme updates happen automatically through CSS variables
  }
  
  destroy() {
    if (this.chart) {
      this.chart.destroy();
      this.chart = null;
    }
  }
}
