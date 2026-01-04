const Charts = {
    
    pieChart: null,
    barChart: null,
    
    // Инициализация

init() {
    this.createPieChart();
    this.createBarChart();
    this.setupPeriodSelector();
    this.renderTopCategories(); // ← ДОБАВЬ ЭТУ СТРОКУ
},
    
    // ===== КРУГОВАЯ ДИАГРАММА (расходы по категориям) =====
    createPieChart() {
        const ctx = document.getElementById('pie-chart');
        if (!ctx) return;
        
        const data = this.getPieChartData();
        
        if (this.pieChart) {
            this.pieChart.destroy();
        }
        
        this.pieChart = new Chart(ctx, {
            type: 'pie',
            data: {
                labels: data.labels,
                datasets: [{
                    data: data.values,
                    backgroundColor: [
                        '#FF6384',
                        '#36A2EB',
                        '#FFCE56',
                        '#4BC0C0',
                        '#9966FF',
                        '#FF9F40',
                        '#FF6384',
                        '#C9CBCF',
                        '#4BC0C0',
                        '#FF9F40'
                    ]
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                plugins: {
                    legend: {
                        position: 'bottom'
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                const label = context.label || '';
                                const value = context.parsed || 0;
                                const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                const percentage = ((value / total) * 100).toFixed(1);
                                return `${label}: ${value.toFixed(2)} ₽ (${percentage}%)`;
                            }
                        }
                    }
                }
            }
        });
    },
    
    getPieChartData() {
        const grouped = Transactions.groupByCategory('expense');
        
        if (grouped.length === 0) {
            return {
                labels: ['Нет данных'],
                values: [1]
            };
        }
        
        // Топ-10 категорий
        const top = grouped.slice(0, 10);
        
        return {
            labels: top.map(item => item.category),
            values: top.map(item => item.amount)
        };
    },
    
    // ===== СТОЛБЧАТАЯ ДИАГРАММА (доходы/расходы по месяцам) =====
    createBarChart() {
        const ctx = document.getElementById('bar-chart');
        if (!ctx) return;
        
        const period = document.getElementById('stats-period')?.value || 'month';
        const monthsCount = this.getMonthsCount(period);
        const data = this.getBarChartData(monthsCount);
        
        if (this.barChart) {
            this.barChart.destroy();
        }
        
        this.barChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: data.labels,
                datasets: [
                    {
                        label: 'Доходы',
                        data: data.income,
                        backgroundColor: 'rgba(76, 175, 80, 0.7)',
                        borderColor: 'rgba(76, 175, 80, 1)',
                        borderWidth: 1
                    },
                    {
                        label: 'Расходы',
                        data: data.expense,
                        backgroundColor: 'rgba(244, 67, 54, 0.7)',
                        borderColor: 'rgba(244, 67, 54, 1)',
                        borderWidth: 1
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                plugins: {
                    legend: {
                        position: 'bottom'
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                return `${context.dataset.label}: ${context.parsed.y.toFixed(2)} ₽`;
                            }
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            callback: function(value) {
                                return value.toFixed(0) + ' ₽';
                            }
                        }
                    }
                }
            }
        });
    },
    
    getBarChartData(months) {
        const stats = Transactions.getMonthlyStats(months);
        
        return {
            labels: stats.map(s => s.month),
            income: stats.map(s => s.income),
            expense: stats.map(s => s.expense)
        };
    },
    
    getMonthsCount(period) {
        switch (period) {
            case 'month': return 1;
            case '3months': return 3;
            case '6months': return 6;
            case 'year': return 12;
            default: return 6;
        }
    },
    
    // ===== СЕЛЕКТОР ПЕРИОДА =====
    setupPeriodSelector() {
        const selector = document.getElementById('stats-period');
        if (selector) {
            selector.addEventListener('change', () => {
                this.updateAll();
            });
        }
    },
    
    // ===== ТОП-5 КАТЕГОРИЙ =====
    renderTopCategories() {
        const container = document.getElementById('top-categories-list');
        if (!container) return;
        
        const grouped = Transactions.groupByCategory('expense');
        
        if (grouped.length === 0) {
            container.innerHTML = '<div class="empty-state"><p>Нет данных</p></div>';
            return;
        }
        
        const top5 = grouped.slice(0, 5);
        const total = grouped.reduce((sum, item) => sum + item.amount, 0);
        const currency = Storage.getData().settings.currency;
        
        container.innerHTML = top5.map(item => {
            const percentage = ((item.amount / total) * 100).toFixed(1);
            return `
                <div class="category-item">
                    <div class="category-info">
                        <strong>${item.category}</strong>
                        <span>${item.amount.toFixed(2)} ${currency} (${percentage}%)</span>
                    </div>
                    <div class="category-bar">
                        <div class="category-bar-fill" style="width: ${percentage}%"></div>
                    </div>
                </div>
            `;
        }).join('');
    },
    
    // ===== ОБНОВИТЬ ВСЁ =====
    updateAll() {
        this.createPieChart();
        this.createBarChart();
        this.renderTopCategories();
    }
};