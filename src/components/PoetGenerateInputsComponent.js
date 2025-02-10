import { React } from 'react';
import { useState, useEffect } from 'react';
import Utils from '../utils/Utils';
import { JSONRepresentationComponent } from './JSONRepresentationComponent';

export const PoetGenerateInputsComponent = ({selectedTemplate, isLockedField, selectedPlaceholders, responseInputsChecked, setResponseInputsChecked}) => {

    const [n, setN] = useState(5);

    const [mode, setMode] = useState('random');

    const [expectedAnswer, setExpectedAnswer] = useState(selectedTemplate.expected_result);

    const [generatedInputs, setGeneratedInputs] = useState([]);

    const fetchGeneratedInputs = async () => {
        if (!selectedTemplate) return;

        const templateJSON = {
            base: selectedTemplate.base,
            description: selectedTemplate.description,
            expected_result: expectedAnswer,
            placeholders: selectedPlaceholders.map(({ name, description, values }) => ({name, description, values}))
        };

        const nAux = Math.max(n, 0)
        setN(nAux);

        const fetchUrl = '/poet/api/v1/input/generateWithTemplate?n=NPARAM&mode=MODE'.replace('NPARAM', nAux).replace('MODE', mode);
        console.log('templateJSON', templateJSON);
        const POETgenerated = await Utils.fetchData(fetchUrl, templateJSON, 'POST');

        setGeneratedInputs(POETgenerated);
        setResponseInputsChecked(POETgenerated);
    };

    const handleResponseQueriesChecks = (event) => {
        const query = event.target.value;
        const isChecked = responseInputsChecked.some(input => input.query === query);

        setResponseInputsChecked(prev =>
            isChecked ? prev.filter(input => input.query !== query) : [...prev, generatedInputs.find(input => input.query === query)]
        );
    };

    const calculateMaxGeneratedInputs = () => {
        return selectedPlaceholders.reduce((max, { values }) => max * values.length, 1);
    };

    useEffect(() => {
        setN(5);
        setMode('random');
        setExpectedAnswer(selectedTemplate.expected_result);
        setGeneratedInputs([]);
        setResponseInputsChecked([]);
    }, [selectedTemplate, setResponseInputsChecked]);

    useEffect(() => {
        setResponseInputsChecked(generatedInputs);
    }, [generatedInputs, setResponseInputsChecked]);

    return (
        <div className="my-6 p-6">

            <div className="flex justify-center mb-10">
                <div className="flex flex-col mx-12">
                    <label htmlFor="mode-select" className="font-semibold">Mode:</label>
                    <select id="mode-select" value={mode} onChange={(event) => setMode(event.target.value)} className="p-2 border border-gray-300 rounded-md" >
                        <option value="random">Random</option>
                        <option value="exhaustive">Exhaustive</option>
                    </select>
                </div>

                <div className="flex flex-col mx-12">
                    <label htmlFor="expected-answer-input" className="font-semibold">Expected answer: </label>
                    <input id="expected-answer-input" value={expectedAnswer} onChange={(event) => setExpectedAnswer(event.target.value)} className="p-2 border border-gray-300 rounded-md" />
                </div>

                <div className="flex mx-12">
                    <div className="flex flex-col mx-1">
                        <label htmlFor="n-input" className="font-semibold">Number of generated inputs:</label>
                        <input id="n-input" type="number" value={n} onChange={(event) => setN(event.target.value)} min="1" className="p-2 border border-gray-300 rounded-md" />
                    </div>
                    <div className="m-1 pt-6">
                        <button id="n-input-max" onClick={() => setN(calculateMaxGeneratedInputs())} className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600">Max value</button>
                    </div>
                </div>
            </div>

            <div className="flex justify-end mx-16 my-2">
                <button id="poet-generateWithTemplate-button" onClick={fetchGeneratedInputs} disabled={isLockedField || !expectedAnswer} className={`px-3 py-2 my-2 text-white rounded-md ${isLockedField || !expectedAnswer ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-500 hover:bg-blue-600'}`}>
                    Generate Inputs
                </button>
            </div>

            {
                generatedInputs.length > 0 && (
                    <div className="m-12 p-4 bg-blue-100 rounded-md max-h-96 overflow-y-auto">
                        {
                            generatedInputs.map((input, index) => (
                                <label key={index} className="block">
                                    <input id={index} type="checkbox" value={input.query} checked={responseInputsChecked.some(checked => checked.query === input.query)} onChange={handleResponseQueriesChecks} className="mr-2" />
                                    {input.query}
                                </label>
                            ))
                        }
                    </div>
                )
            }

            {
                responseInputsChecked.length > 0 && (
                    <div className="mt-4">
                        <p className="font-semibold mb-2">{"Selected " + responseInputsChecked.length + "/" + generatedInputs.length + " queries:"}</p>
                        <JSONRepresentationComponent jsonDataArray={responseInputsChecked} />
                    </div>
                )
            }
        </div>
    )
}
