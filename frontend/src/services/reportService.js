import axios from 'axios';

const BASE_URL = 'http://localhost:8080/api/reports';

const reportService = {
    fetchReport: async (reportType, timePeriod = 'sofar', startDate = null, endDate = null) => {
        try {
            const params = { timePeriod };
            if (startDate && endDate) {
                params.startDate = startDate;
                params.endDate = endDate;
            }
            const response = await axios.get(`${BASE_URL}/${reportType}`, { params });
            return response.data;
        } catch (error) {
            console.error(`Error fetching ${reportType} report:`, error);
            throw error;
        }
    },

    exportReportToPDF: async (reportType, timePeriod = 'sofar', startDate = null, endDate = null) => {
        try {
            const params = { timePeriod };
            if (startDate && endDate) {
                params.startDate = startDate;
                params.endDate = endDate;
            }
            const response = await axios.get(`${BASE_URL}/${reportType}/export-pdf`, {
                params,
                responseType: 'blob',
            });
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.download = `${reportType}_report.pdf`;
            link.click();
            window.URL.revokeObjectURL(url);
        } catch (error) {
            console.error(`Error exporting ${reportType} report to PDF:`, error);
            throw error;
        }
    },
};

export default reportService;