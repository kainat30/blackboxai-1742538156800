// Chart Configuration Factory
const ChartFactory = {
    // Common chart options
    defaultOptions: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                position: 'top',
                labels: {
                    padding: 20,
                    font: {
                        family: "'Inter', sans-serif",
                        size: 12
                    }
                }
            },
            tooltip: {
                backgroundColor: 'rgba(255, 255, 255, 0.95)',
                titleColor: '#1F2937',
                bodyColor: '#4B5563',
                borderColor: '#E5E7EB',
                borderWidth: 1,
                padding: 12,
                boxPadding: 6,
                usePointStyle: true,
                callbacks: {
                    label: function(context) {
                        let label = context.dataset.label || '';
                        if (label) {
                            label += ': ';
                        }
                        label += CurrencyFormatter.format(context.raw);
                        return label;
                    }
                }
            }
        }
    },

    // Color schemes
    colors: {
        income: ['#10B981', '#059669', '#047857', '#065F46', '#064E3B'],
        expense: ['#EF4444', '#DC2626', '#B91C1C', '#991B1B', '#7F1D1D'],
        mixed: ['#3B82F6', '#2563EB', '#1D4ED8', '#1E40AF', '#1E3A8A'],
        categories: [
            '#4F46E5', '#7C3AED', '#EC4899', '#EF4444',
            '#F59E0B', '#10B981', '#3B82F6', '#6366F1'
        ]
    },

    // Create expense distribution chart
    createExpenseDistributionChart(ctx, data) {
        return new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: data.map(item => item.category),
                datasets: [{
                    data: data.map(item => item.amount),
                    backgroundColor: this.colors.expense,
                    borderWidth: 1,
                    borderColor: '#ffffff'
                }]
            },
            options: {
                ...this.defaultOptions,
                cutout: '70%',
                plugins: {
                    ...this.defaultOptions.plugins,
                    legend: {
                        ...this.defaultOptions.plugins.legend,
                        position: 'right'
                    }
                }
            }
        });
    },

    // Create monthly trends chart
    createMonthlyTrendsChart(ctx, data) {
        return new Chart(ctx, {
            type: 'bar',
            data: {
                labels: data.map(item => item.month),
                datasets: [
                    {
                        label: 'Income',
                        data: data.map(item => item.income),
                        backgroundColor: this.colors.income[0],
                        borderColor: this.colors.income[1],
                        borderWidth: 1
                    },
                    {
                        label: 'Expenses',
                        data: data.map(item => item.expense),
                        backgroundColor: this.colors.expense[0],
                        borderColor: this.colors.expense[1],
                        borderWidth: 1
                    },
                    {
                        label: 'Savings',
                        data: data.map(item => item.income - item.expense),
                        type: 'line',
                        borderColor: this.colors.mixed[0],
                        backgroundColor: 'transparent',
                        borderWidth: 2,
                        pointBackgroundColor: this.colors.mixed[0],
                        tension: 0.4
                    }
                ]
            },
            options: {
                ...this.defaultOptions,
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            callback: function(value) {
                                return CurrencyFormatter.format(value);
                            }
                        }
                    }
                }
            }
        });
    },

    // Create budget progress chart
    createBudgetProgressChart(ctx, data) {
        return new Chart(ctx, {
            type: 'bar',
            data: {
                labels: data.map(item => item.category),
                datasets: [
                    {
                        label: 'Spent',
                        data: data.map(item => item.spent),
                        backgroundColor: data.map(item => 
                            item.spent >= item.budget ? this.colors.expense[0] :
                            item.spent >= item.budget * 0.8 ? this.colors.mixed[2] :
                            this.colors.income[0]
                        ),
                        borderWidth: 1
                    },
                    {
                        label: 'Budget',
                        data: data.map(item => item.budget),
                        backgroundColor: 'rgba(0, 0, 0, 0.1)',
                        borderWidth: 1
                    }
                ]
            },
            options: {
                ...this.defaultOptions,
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            callback: function(value) {
                                return CurrencyFormatter.format(value);
                            }
                        }
                    }
                }
            }
        });
    },

    // Create savings trend chart
    createSavingsTrendChart(ctx, data) {
        return new Chart(ctx, {
            type: 'line',
            data: {
                labels: data.map(item => item.month),
                datasets: [{
                    label: 'Savings Rate',
                    data: data.map(item => item.savingsRate),
                    borderColor: this.colors.mixed[0],
                    backgroundColor: 'rgba(59, 130, 246, 0.1)',
                    borderWidth: 2,
                    fill: true,
                    tension: 0.4
                }]
            },
            options: {
                ...this.defaultOptions,
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            callback: function(value) {
                                return value + '%';
                            }
                        }
                    }
                }
            }
        });
    },

    // Create category comparison chart
    createCategoryComparisonChart(ctx, data) {
        const months = [...new Set(data.flatMap(item => item.months))];
        const datasets = data.map((category, index) => ({
            label: category.name,
            data: months.map(month => 
                category.months.find(m => m.month === month)?.amount || 0
            ),
            backgroundColor: this.colors.categories[index % this.colors.categories.length],
            borderWidth: 1
        }));

        return new Chart(ctx, {
            type: 'bar',
            data: {
                labels: months,
                datasets: datasets
            },
            options: {
                ...this.defaultOptions,
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            callback: function(value) {
                                return CurrencyFormatter.format(value);
                            }
                        }
                    }
                }
            }
        });
    }
};

// Chart Update Utilities
const ChartUpdater = {
    // Update chart data
    updateChartData(chart, newData, newLabels) {
        chart.data.labels = newLabels || chart.data.labels;
        chart.data.datasets.forEach((dataset, index) => {
            dataset.data = newData[index] || dataset.data;
        });
        chart.update();
    },

    // Update chart options
    updateChartOptions(chart, newOptions) {
        chart.options = {
            ...chart.options,
            ...newOptions
        };
        chart.update();
    },

    // Animate chart
    animateChart(chart, duration = 1000) {
        chart.options.animation = {
            duration: duration,
            easing: 'easeInOutQuart'
        };
        chart.update();
    }
};

// Chart Interaction Handlers
const ChartInteractions = {
    // Add click handler to chart
    addClickHandler(chart, callback) {
        chart.canvas.onclick = function(evt) {
            const points = chart.getElementsAtEventForMode(evt, 'nearest', { intersect: true }, true);
            if (points.length) {
                const firstPoint = points[0];
                callback(chart.data.labels[firstPoint.index], chart.data.datasets[firstPoint.datasetIndex].data[firstPoint.index]);
            }
        };
    },

    // Add hover effects
    addHoverEffects(chart) {
        chart.options.hover = {
            mode: 'nearest',
            intersect: true,
            onHover: function(evt, elements) {
                const point = elements[0];
                if (point) {
                    chart.canvas.style.cursor = 'pointer';
                } else {
                    chart.canvas.style.cursor = 'default';
                }
            }
        };
        chart.update();
    }
};

// Export chart utilities
window.ChartFactory = ChartFactory;
window.ChartUpdater = ChartUpdater;
window.ChartInteractions = ChartInteractions;