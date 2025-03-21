// Data Export/Import Handler
const DataHandler = {
    // Export data to CSV
    async exportToCSV(data, filename) {
        const csvContent = this.convertToCSV(data);
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        
        if (window.navigator.msSaveOrOpenBlob) {
            // IE11
            window.navigator.msSaveBlob(blob, filename);
        } else {
            const link = document.createElement('a');
            if (link.download !== undefined) {
                const url = URL.createObjectURL(blob);
                link.setAttribute('href', url);
                link.setAttribute('download', filename);
                link.style.visibility = 'hidden';
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                URL.revokeObjectURL(url);
            }
        }
    },

    // Convert data to CSV format
    convertToCSV(data) {
        if (!data || !data.length) return '';

        const headers = Object.keys(data[0]);
        const csvRows = [];

        // Add headers
        csvRows.push(headers.join(','));

        // Add data rows
        for (const row of data) {
            const values = headers.map(header => {
                const value = row[header];
                // Handle special characters and commas
                return `"${String(value).replace(/"/g, '""')}"`;
            });
            csvRows.push(values.join(','));
        }

        return csvRows.join('\n');
    },

    // Export data to JSON
    exportToJSON(data, filename) {
        const jsonContent = JSON.stringify(data, null, 2);
        const blob = new Blob([jsonContent], { type: 'application/json' });
        
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', filename);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    },

    // Export data to PDF
    async exportToPDF(element, filename, options = {}) {
        try {
            const { jsPDF } = window.jspdf;
            const pdf = new jsPDF(options);

            // Add content to PDF
            await pdf.html(element, {
                callback: function(pdf) {
                    pdf.save(filename);
                },
                margin: options.margin || [10, 10, 10, 10],
                autoPaging: 'text',
                x: options.x || 0,
                y: options.y || 0,
                width: options.width || 190,
                windowWidth: options.windowWidth || 675
            });
        } catch (error) {
            console.error('PDF Export Error:', error);
            NotificationSystem.error('Failed to export PDF. Please try again.');
        }
    },

    // Import data from CSV
    async importFromCSV(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            
            reader.onload = (event) => {
                try {
                    const csvData = event.target.result;
                    const lines = csvData.split('\n');
                    const headers = lines[0].split(',').map(header => 
                        header.trim().replace(/^"(.*)"$/, '$1')
                    );
                    
                    const data = [];
                    for (let i = 1; i < lines.length; i++) {
                        if (!lines[i].trim()) continue;
                        
                        const values = lines[i].split(',').map(value => 
                            value.trim().replace(/^"(.*)"$/, '$1')
                        );
                        
                        const row = {};
                        headers.forEach((header, index) => {
                            row[header] = values[index];
                        });
                        
                        data.push(row);
                    }
                    
                    resolve(data);
                } catch (error) {
                    reject(new Error('Invalid CSV format'));
                }
            };
            
            reader.onerror = () => {
                reject(new Error('Error reading file'));
            };
            
            reader.readAsText(file);
        });
    },

    // Import data from JSON
    async importFromJSON(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            
            reader.onload = (event) => {
                try {
                    const data = JSON.parse(event.target.result);
                    resolve(data);
                } catch (error) {
                    reject(new Error('Invalid JSON format'));
                }
            };
            
            reader.onerror = () => {
                reject(new Error('Error reading file'));
            };
            
            reader.readAsText(file);
        });
    },

    // Validate imported data
    validateImportedData(data, schema) {
        const errors = [];
        
        data.forEach((item, index) => {
            Object.entries(schema).forEach(([field, rules]) => {
                if (rules.required && !item[field]) {
                    errors.push(`Row ${index + 1}: Missing required field "${field}"`);
                }
                
                if (item[field] && rules.type) {
                    switch (rules.type) {
                        case 'number':
                            if (isNaN(item[field])) {
                                errors.push(`Row ${index + 1}: "${field}" must be a number`);
                            }
                            break;
                        case 'date':
                            if (isNaN(new Date(item[field]).getTime())) {
                                errors.push(`Row ${index + 1}: "${field}" must be a valid date`);
                            }
                            break;
                        case 'enum':
                            if (!rules.values.includes(item[field])) {
                                errors.push(`Row ${index + 1}: "${field}" must be one of: ${rules.values.join(', ')}`);
                            }
                            break;
                    }
                }
            });
        });
        
        return errors;
    }
};

// Export/Import UI Handler
const ExportImportUI = {
    // Initialize export/import functionality
    init() {
        this.setupExportButtons();
        this.setupImportForm();
    },

    // Setup export buttons
    setupExportButtons() {
        document.querySelectorAll('[data-export]').forEach(button => {
            button.addEventListener('click', async () => {
                const format = button.dataset.export;
                const endpoint = button.dataset.endpoint;
                
                try {
                    const response = await fetch(endpoint);
                    const data = await response.json();
                    
                    switch (format) {
                        case 'csv':
                            await DataHandler.exportToCSV(data, 'export.csv');
                            break;
                        case 'json':
                            DataHandler.exportToJSON(data, 'export.json');
                            break;
                        case 'pdf':
                            const element = document.getElementById(button.dataset.target);
                            await DataHandler.exportToPDF(element, 'export.pdf');
                            break;
                    }
                    
                    NotificationSystem.success('Export completed successfully');
                } catch (error) {
                    console.error('Export Error:', error);
                    NotificationSystem.error('Failed to export data. Please try again.');
                }
            });
        });
    },

    // Setup import form
    setupImportForm() {
        const importForm = document.getElementById('importForm');
        if (!importForm) return;

        importForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const fileInput = importForm.querySelector('input[type="file"]');
            const file = fileInput.files[0];
            if (!file) return;

            try {
                let data;
                if (file.name.endsWith('.csv')) {
                    data = await DataHandler.importFromCSV(file);
                } else if (file.name.endsWith('.json')) {
                    data = await DataHandler.importFromJSON(file);
                } else {
                    throw new Error('Unsupported file format');
                }

                // Validate imported data
                const schema = JSON.parse(importForm.dataset.schema || '{}');
                const errors = DataHandler.validateImportedData(data, schema);
                
                if (errors.length > 0) {
                    NotificationSystem.error('Invalid data format: ' + errors[0]);
                    return;
                }

                // Submit data to server
                const response = await fetch(importForm.action, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(data)
                });

                if (!response.ok) {
                    throw new Error('Import failed');
                }

                NotificationSystem.success('Import completed successfully');
                importForm.reset();
                
                // Refresh page if needed
                if (importForm.dataset.refresh === 'true') {
                    window.location.reload();
                }
            } catch (error) {
                console.error('Import Error:', error);
                NotificationSystem.error('Failed to import data. Please check the file format and try again.');
            }
        });
    }
};

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    ExportImportUI.init();
});

// Export utilities
window.DataHandler = DataHandler;
window.ExportImportUI = ExportImportUI;