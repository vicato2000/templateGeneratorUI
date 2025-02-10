class Utils {

    static async fetchData(url, requestOptions = null, method = 'GET', signal = null) {
        try {
            const options = method === 'POST' ? {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(requestOptions),
                signal
            } : { method, signal };

            console.log('fetchData', url, options);

            const response = await fetch(url, options);

            console.log('response', response);

            return response.json();

        } catch (error) {
            console.error(error.message);
            return {};

        }
    }

    static selectMultipleSelectionValues(options) {
        return Array.from(options).filter(option => option.selected).map(option => option.value);
    }

    static exportToJSON(dataResponse) {
        this.downloadFile(JSON.stringify(dataResponse, null, 2), 'data_response.json', 'application/json');
    }

    static exportToCSV (dataResponse) {

        if (!dataResponse || dataResponse.length === 0) {
            alert('No data available for export.');
            return;
        }

        const keys = Object.keys(dataResponse[0]);
        const csvContent = [
            keys.join(','),
            ...dataResponse.map((input) => keys.map((key) => input[key]).join(',')),
        ].join('\n');

        this.downloadFile(csvContent, 'data_response.csv', 'text/csv');
    }

    static downloadFile(content, fileName, mimeType) {
        const blob = new Blob([content], { type: mimeType });
        const link = document.createElement('a');

        link.href = URL.createObjectURL(blob);
        link.download = fileName;
        link.click();

        URL.revokeObjectURL(link.href);
    }

}

export default Utils;
