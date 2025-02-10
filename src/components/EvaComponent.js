import { React } from 'react';
import { useState, useEffect } from 'react';
import Utils from '../utils/Utils';
import { JSONRepresentationComponent } from './JSONRepresentationComponent';

export const EvaComponent = ({responseInputsChecked, llmsResponses}) => {

    const [llmsResponsesEvaluated, setLlmsResponsesEvaluated] = useState([]);

    const [lockedFetchEvaluationsButton, setLockedFetchEvaluationsButton] = useState(true);

    const fetchAllLLMsEvaluations = async () => {
        setLlmsResponsesEvaluated([]);
        
        const responsePromises = llmsResponses.flatMap(model => 
            model.response_by_query.map(async (responseByQuery) => {
                const evaluationType = defineEvaluationType(responseByQuery.query);
                const evaluation = await Utils.fetchData('/eva/api/v1/evaluate?evaluation_type=EV_TYPE'.replace('EV_TYPE', evaluationType),
                    bodyRequestOptions(responseByQuery, evaluationType), 'POST'
                );
    
                const newResponse = { ...responseByQuery, evaluation };
    
                setLlmsResponsesEvaluated(prevResponses => {
                    const updatedResponses = prevResponses.map(existingModel =>
                        existingModel.model === model.model
                            ? { ...existingModel, response_by_query: [...existingModel.response_by_query, newResponse] }
                            : existingModel
                    );
    
                    return prevResponses.some(existingModel => existingModel.model === model.model) ? updatedResponses
                        : [...prevResponses, { ...model, response_by_query: [newResponse] }];
                });
            })
        );

        await Promise.all(responsePromises);
    };

    const defineEvaluationType = (templateQuery) => {

        if (/\"yes\" or \"no\"/i.test(templateQuery)) {
            return 'yes_no';

        } else if (/three reasons/i.test(templateQuery)) {
            return 'three_reasons';

        } else if (/one of the following options/i.test(templateQuery)) {
            return 'mc';

        } else {
            return 'wh_question';
        }

    };

    const bodyRequestOptions = (responseByQuery, evaluationType) => {

        if (evaluationType === 'mc' ) {
            return {
                expected_result: responseByQuery.expected_result,
                generated_result: responseByQuery.generated_result,
                prompt: responseByQuery.query,
            };
        }

        return {
            expected_result: responseByQuery.expected_result,
            generated_result: responseByQuery.generated_result,
        };
    };
    
	useEffect(() => {
        setLockedFetchEvaluationsButton(llmsResponses.length === 0);
    }, [llmsResponses]); 
    
    return (
        <div className="w-full max-w-7xl p-4 bg-white shadow-lg rounded-lg">
            <div className="py-6">
                <button id="eva-evaluate-button" onClick={fetchAllLLMsEvaluations} disabled={lockedFetchEvaluationsButton}
                    className={`px-4 py-2 mb-4 rounded-md text-white ${
                        lockedFetchEvaluationsButton ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-500 hover:bg-blue-600'
                    }`}>
                    Fetch evaluations
                </button>
            </div>

            {
                llmsResponsesEvaluated.length > 0 && 
                    <div>
                        <JSONRepresentationComponent jsonDataArray={llmsResponsesEvaluated} maxQueries={responseInputsChecked.length} /><br/>
                    </div>
            }
        </div>
    )
}
