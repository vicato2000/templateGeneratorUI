import React, { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import Utils from '../utils/Utils';

export const JSONRepresentationComponent = ({jsonDataArray, maxQueries = 0, showExportButtons = true}) => {

    const models = Array.isArray(jsonDataArray) ? [...new Set(jsonDataArray.filter(item => item && item.model).map(item => item.model))] : [];

    const [activeTab, setActiveTab] = useState(models[0] || null);

    const [paginatedData, setPaginatedData] = useState([]);

    const [totalPages, setTotalPages] = useState(1);

    const [currentPage, setCurrentPage] = useState(1);

    const itemsPerPage = 100;

    const JSONToString = (data, tab_index = 1) =>
        Object.entries(data).reduce((str, [key, value]) => {
            const tab = ' '.repeat(tab_index);

            if (key.includes('generated_result')) {
                value = value.replace(/\n/g, '');
            }

            return str + (typeof value === 'object' && value !== null
                ? JSONToString(value, tab_index + 1) + '\n'
                : isNaN(Number(key)) ? (tab + key + ': ' + value + '\n') : '');
        }, '');

    const getQueryCountForAllModels = () => {
        return jsonDataArray
            .map(modelAux => modelAux.response_by_query.length)
            .reduce((sum, modelResponsesLength) => sum + modelResponsesLength);
    };

    const getQueryCountForModel = (model) => {
        return jsonDataArray
            .filter(item => item.model === model)
            .map(item => item.response_by_query.length);
    };

    const changePage = (page) => {
        setCurrentPage(Math.min(Math.max(page, 1), totalPages));
    };

    const JSONString = (data) => `\`\`\`json\n${JSONToString(data)}\`\`\``;

    useEffect(() => {
        let paginatedDataAux;
        let totalPagesAux;

        if (activeTab) {
            const displayDataAux = jsonDataArray.find(item => item.model === activeTab);
            const responsesByModel = displayDataAux.response_by_query;

            paginatedDataAux = responsesByModel.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
            totalPagesAux = Math.ceil(responsesByModel.length / itemsPerPage);
        } else {
            paginatedDataAux = Array.isArray(jsonDataArray) 
                ? jsonDataArray.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
                : [jsonDataArray];
            totalPagesAux = Array.isArray(jsonDataArray) 
                ? Math.ceil(jsonDataArray.length / itemsPerPage)
                : 1;
        }

        setTotalPages(totalPagesAux);
        setPaginatedData(paginatedDataAux);

    }, [jsonDataArray, currentPage, activeTab]); 

    return (
        <div className="w-full max-w-7xl mx-auto px-2 py-4 rounded-lg border-y-2 border-blue-100">
            {
                models.length > 0 && (
                    <div className="flex border-b mb-4">
                        {
                            models.map((model) => (
                                <div key={model} onClick={() => { setActiveTab(model); setCurrentPage(1); }}
                                    className={`cursor-pointer p-3 pt-2 ${activeTab === model ? "border-b-2 border-blue-500 font-bold" : ""}`}>
                                    {model + " " + getQueryCountForModel(model) + "/" + maxQueries}
                                </div>
                            ))
                        }
                    </div>
                )
            }

            <div className="max-h-96 overflow-y-auto bg-blue-100 p-4 rounded-lg text-left">
                <ReactMarkdown>{JSONString(paginatedData)}</ReactMarkdown>
            </div>

            {
                totalPages > 1 && (
                    <div className="flex justify-center my-4">
                        <button onClick={() => changePage(currentPage - 1)} disabled={currentPage === 1}
                            className="px-2 mx-2 border rounded-md bg-gray-200 hover:bg-gray-300 disabled:opacity-30">
                            {"<"}
                        </button>
                        <span className="mx-3">{currentPage}/{totalPages}</span>
                        <button onClick={() => changePage(currentPage + 1)} disabled={currentPage === totalPages}
                            className="px-2 mx-2 border rounded-md bg-gray-200 hover:bg-gray-300 disabled:opacity-30">
                            {">"}
                        </button>
                    </div>
                )
            }

            {
                ( showExportButtons && (!activeTab || getQueryCountForAllModels() === (models.length * maxQueries)) ) && (
                    <div className="mt-6 mb-4 flex justify-center">
                        <button onClick={() => Utils.exportToJSON(jsonDataArray)}
                            className="px-4 py-2 mx-2 border rounded-md bg-purple-500 text-white hover:bg-purple-600">
                            Export to JSON
                        </button>
                        {
                            !activeTab && (
                                <button onClick={() => Utils.exportToCSV(jsonDataArray)}
                                    className="px-5 py-2 mx-2 border rounded-md bg-purple-500 text-white hover:bg-purple-600">
                                    Export to CSV
                                </button>
                            )
                        }
                    </div>
                )
            }
        </div>
    );
};
