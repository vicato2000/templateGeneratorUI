import { React } from 'react';
import { useState, useEffect, useRef } from 'react';
import Utils from '../utils/Utils';
import { JSONRepresentationComponent } from './JSONRepresentationComponent';
import pLimit from 'p-limit';

export const GenieComponent = ({responseInputsChecked, llmsResponses, setLlmsResponses}) => {

    const [genieModels, setGenieModels] = useState([]);

    const [selectedLLMs, setSelectedLLMs] = useState([]);

    const [lockedFetchLLMsButton, setLockedFetchLLMsButton] = useState(true);

    const [lockedAbortFetchButton, setLockedAbortFetchButton] = useState(true);

    const abortControllerRef = useRef(null);

    const limit = pLimit(20);

	// useEffect(() => {
    //     const fetchModels = async () => {
    //         const [ollamaData, genieData] = await Promise.all([
    //             Utils.fetchData('/genie/api/v1/models/ollama', '', 'GET'),
    //             Utils.fetchData('/genie/api/v1/models', '', 'GET')
    //         ]);
    //
    //         const normalizeModelName = (name) => name.replaceAll(':', '-');
    //
    //         const newModels = ollamaData.filter(ollamaModel =>
    //             !genieData.some(genieModel => normalizeModelName(genieModel) === normalizeModelName(ollamaModel.model))
    //         );
    //
    //         console.log('ollamaData', ollamaData);
    //         console.log('genieData', genieData);
    //         console.log('newModels', newModels);
    //
    //         if (newModels.length >0){
    //
    //             for (const model of newModels) {
    //                 await Utils.fetchData('/genie/api/v1/models', {
    //                     id: templateToGeniePostJSONFormat(model.model),
    //                     name: model.model,
    //                     base_url: 'http://127.0.0.1',
    //                     port: 11434,
    //                     category: 'ollama',
    //                 }, 'POST');
    //             }
    //
    //         }
    //
    //
    //         for (const model of genieData) {
    //             if (!ollamaData.some(ollamaModel => ollamaModel.model === model)) {
    //                 await Utils.fetchData(`/genie/api/v1/models/${model}`, '', 'DELETE');
    //             }
    //         }
    //
    //
    //
    //         const updatedGenieModels = await Utils.fetchData('/genie/api/v1/models', '', 'GET');
    //         setGenieModels(updatedGenieModels);
    //     };
    //
    //     fetchModels();
    // }, []);

    useEffect(() => {
        const fetchModels = async () => {
            const [ollamaData, genieData] = await Promise.all([
                Utils.fetchData('/genie/api/v1/models/ollama', '', 'GET'),
                Utils.fetchData('/genie/api/v1/models', '', 'GET')
            ]);

            const normalizeModelName = (name) => name.replaceAll(':', '-');

            // Verifica modelos que están en Ollama pero no en Genie
            const newModels = ollamaData.filter(ollamaModel =>
                !genieData.some(genieModel => normalizeModelName(genieModel) === normalizeModelName(ollamaModel.model))
            );

            if (newModels.length > 0) {
                for (const model of newModels) {
                    await Utils.fetchData('/genie/api/v1/models', {
                        id: templateToGeniePostJSONFormat(model.model),
                        name: model.model,
                        base_url: 'http://127.0.0.1',
                        port: 11434,
                        category: 'ollama',
                    }, 'POST');
                }
            }

            // Solo eliminar modelos si hay una diferencia real
            const modelsToDelete = genieData.filter(genieModel =>
                !ollamaData.some(ollamaModel => normalizeModelName(ollamaModel.model) === normalizeModelName(genieModel))
            );

            if (modelsToDelete.length > 0) {
                for (const model of modelsToDelete) {
                    await Utils.fetchData(`/genie/api/v1/models/${model}`, '', 'DELETE');
                }
            }

            // Actualizar el estado con los modelos finales
            const updatedGenieModels = await Utils.fetchData('/genie/api/v1/models', '', 'GET');
            setGenieModels(updatedGenieModels);
        };

        fetchModels();
    }, []);

    const abortFetch = () => {
        if (abortControllerRef.current) {
            setLockedAbortFetchButton(true);
            abortControllerRef.current.abort();
        }
        setLlmsResponses([]);
    };

    useEffect(() => {
        abortFetch();
    }, [responseInputsChecked]);

    useEffect(() => {
        setLockedFetchLLMsButton(selectedLLMs.length === 0);
        abortFetch();
    }, [selectedLLMs]);

    const templateToGeniePostJSONFormat = (model) => {
        return model.replaceAll(':', '-');
    };

    const handleSelectedLLMsChange = (event) => {
		const values = Utils.selectMultipleSelectionValues(event.target.options);
        setSelectedLLMs(values);
    };

    const fetchAllLLMsResponses = async () => {
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
        }

        const newAbortController = new AbortController();
        abortControllerRef.current = newAbortController;
        setLockedAbortFetchButton(false);
        setLlmsResponses([]);

        const responsePromises = selectedLLMs.flatMap(selectedModel =>
            responseInputsChecked.map(async (responseInput) => {

                if (abortControllerRef.current.signal.aborted) {
                    return;
                };

                await limit(async () => {
                    const genieResponse = await Utils.fetchData('/genie/api/v1/models/execute', bodyRequestOptions(selectedModel, responseInput), 'POST', abortControllerRef.current.signal);
                    const newResponse = newIndividualLLmResponse(selectedModel, responseInput, genieResponse);

                    if (!abortControllerRef.current.signal.aborted) {
                        setLlmsResponses(prevLLMsResponses => {
                            const modelExists = prevLLMsResponses.find(response => response.model === selectedModel);

                            if (modelExists) {
                                return prevLLMsResponses.map(response => response.model === selectedModel ? addNewIndividualLLmResponse(response, newResponse) : response);

                            } else {
                                return [...prevLLMsResponses, newResponse];

                            }
                        });
                    }
                });
            })
        );

        await Promise.all(responsePromises);
        setLockedAbortFetchButton(true);
    };

    const bodyRequestOptions = (selectedModel, responseInput) => {
        return {
            model_name: selectedModel,
            user_prompt: responseInput.query,
        };
    };

    const newIndividualLLmResponse = (selectedModel, responseInput, genieResponse) => {
        return {
            model: selectedModel,
            response_by_query: [{
                query: responseInput.query,
                generated_result: genieResponse.response.split("\n").map((line) => line.trim()).filter((line) => line).join(" "),
                expected_result: responseInput.expected_result,
            }]
        };
    };

    const addNewIndividualLLmResponse = (response, newResponse) => {
        return {
            ...response,
            response_by_query: [...response.response_by_query, ...newResponse.response_by_query]
        } ;
    };

    return (
        <div className="w-full max-w-7xl mb-6 p-4 bg-white shadow-lg rounded-lg">
            <div className="flex flex-col p-2 items-center mx-auto">
                <label htmlFor="llms-selector" className="block w-64 font-semibold my-4 text-left">Choose LLMs:</label>
                <select id="llms-selector" onChange={handleSelectedLLMsChange} multiple disabled={genieModels.length === 0}
                    value={selectedLLMs} className="w-64 p-2 border border-gray-300 rounded-md mb-4">
                    <option value={null} hidden>Not selected</option>
                    {
                        genieModels.map((modelOption, index) => (
                            <option key={modelOption.id} value={modelOption.id}>
                                {modelOption}
                            </option>
                        ))
                    }
                </select>
            </div>

            <div className="flex justify-end mx-16 my-7">
                {
                    !lockedAbortFetchButton && (
                        <button id="genie-abort-button" onClick={abortFetch} className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600">
                            Abort fetch
                        </button>
                    )
                }
                <button id="genie-execute-button" onClick={fetchAllLLMsResponses} disabled={lockedFetchLLMsButton} className={`px-4 py-2 ml-2 rounded-md text-white ${lockedFetchLLMsButton ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-500 hover:bg-blue-600'}`}>
                    Fetch LLMs responses
                </button>
            </div>

            {
                llmsResponses.length > 0 && (
                    <div className="my-2">
                        <JSONRepresentationComponent jsonDataArray={llmsResponses} maxQueries={responseInputsChecked.length} /><br/>
                    </div>
                )
            }
        </div>
    );
};
