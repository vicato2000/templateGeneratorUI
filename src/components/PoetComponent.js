import { React } from 'react';
import { useState, useEffect } from 'react';
import Utils from '../utils/Utils';
import { JSONRepresentationComponent } from './JSONRepresentationComponent';
import { HtmlPlaceholdersSelectionField } from '../utils/HtmlPlaceholdersSelectionField';
import { PoetGenerateInputsComponent } from 'components/PoetGenerateInputsComponent';

export const PoetComponent = ({ responseInputsChecked, setResponseInputsChecked }) => {
    const [templates, setTemplates] = useState([]);
    const [filteredTemplates, setFilteredTemplates] = useState([]);
    const [selectedTemplate, setSelectedTemplate] = useState('');
    const [selectedPlaceholders, setSelectedPlaceholders] = useState([]);
    const [templateFilters, setTemplateFilters] = useState({
        typeOfTest: {}, // yn/ex/mc
        propertyToBeTested: {}, // Tipo de sesgo
        numberOfGroups: {}, // Número de grupos (1, 2)
    });

    useEffect(() => {
        const fetchTemplates = async () => {
            const data = await Utils.fetchData('/poet/api/v1/templates', '', 'GET');
            setTemplates(data);
            setFilteredTemplates(data);

            // Extraer valores únicos para los filtros
            const filters = data.reduce(
                (acc, { id }) => {
                    if (!id.includes('_')) return acc;

                    const parts = id.split('_');

                    // Verificar que el ID tenga al menos 4 partes y manejar nombres de sesgos con una o dos palabras
                    if (parts.length < 4) return acc;

                    const prefix = parts[0];
                    const typeOfTest = parts[parts.length - 1]; // Última parte (yn, ex, mc)
                    const numberOfGroups = parts[parts.length - 2].replace('group', ''); // Penúltima parte (1group, 2groups)
                    const propertyToBeTested = parts.slice(1, parts.length - 2).join('_'); // Partes intermedias como sesgo

                    acc.typeOfTest[typeOfTest] = false;
                    acc.propertyToBeTested[propertyToBeTested] = false;
                    acc.numberOfGroups[numberOfGroups] = false;

                    return acc;
                },
                { typeOfTest: {}, propertyToBeTested: {}, numberOfGroups: {} }
            );

            setTemplateFilters(filters);
        };

        fetchTemplates();
    }, []);

    const handleFilterChange = (filterCategory, filterValue) => {
        const updatedFilters = {
            ...templateFilters,
            [filterCategory]: {
                ...templateFilters[filterCategory],
                [filterValue]: !templateFilters[filterCategory][filterValue],
            },
        };

        setTemplateFilters(updatedFilters);

        // Determinar filtros activos
        const activeFilters = Object.entries(updatedFilters).reduce(
            (acc, [category, values]) => ({
                ...acc,
                [category]: Object.keys(values).filter((key) => values[key]),
            }),
            { typeOfTest: [], propertyToBeTested: [], numberOfGroups: [] }
        );

        // Filtrar plantillas según los filtros activos
        const filtered = templates.filter(({ id }) => {
            const parts = id.split('_');

            // Verificar que el ID tenga al menos 4 partes
            if (parts.length < 4) return false;

            const typeOfTest = parts[parts.length - 1]; // Última parte (yn, ex, mc)
            const numberOfGroups = parts[parts.length - 2].replace('group', ''); // Penúltima parte
            const propertyToBeTested = parts.slice(1, parts.length - 2).join('_'); // Partes intermedias

            return (
                (activeFilters.typeOfTest.length === 0 || activeFilters.typeOfTest.includes(typeOfTest)) &&
                (activeFilters.propertyToBeTested.length === 0 || activeFilters.propertyToBeTested.includes(propertyToBeTested)) &&
                (activeFilters.numberOfGroups.length === 0 || activeFilters.numberOfGroups.includes(numberOfGroups))
            );
        });

        setFilteredTemplates(filtered.length > 0 ? filtered : templates); // Mostrar todas las plantillas si no hay coincidencias
    };

    const handleTemplateChange = (event) => {
        const template = JSON.parse(event.target.value);
        setSelectedTemplate(template);
    };

    useEffect(() => {
        setSelectedPlaceholders(selectedTemplate?.placeholders || []);
    }, [selectedTemplate]);

    return (
        <div className="w-full max-w-7xl mb-6 p-6 bg-white shadow-lg rounded-lg text-left">
            {/* Filtros de plantillas */}
            <div className="mb-6 p-4 bg-gray-100 rounded-md">
                <h2 className="font-semibold mb-4">Filter Templates</h2>
                {/* Renderizar dinámicamente los checkboxes de los filtros */}
                {Object.entries(templateFilters).map(([filterCategory, filterValues]) => (
                    <div key={filterCategory} className="mb-4">
                        <p className="font-bold">
                            {filterCategory === 'typeOfTest' ? 'Oracle Type' :
                                filterCategory === 'propertyToBeTested' ? 'Bias Type' :
                                    'Number of Groups'}
                        </p>
                        <div className="flex flex-wrap">
                            {Object.entries(filterValues).map(([filterValue, isSelected]) => (
                                <label key={filterValue} className="flex items-center mr-4 mb-2">
                                    <input
                                        type="checkbox"
                                        className="mr-2"
                                        checked={isSelected}
                                        onChange={() => handleFilterChange(filterCategory, filterValue)}
                                    />
                                    {filterValue}
                                </label>
                            ))}
                        </div>
                    </div>
                ))}
            </div>

            {/* Selector de plantillas */}
            <div className="flex m-4 p-4">
                <label htmlFor="templates" className="m-2 font-semibold whitespace-nowrap">
                    Choose a template:
                </label>
                <select
                    id="templates"
                    onChange={handleTemplateChange}
                    className="mx-4 border border-gray-300 rounded-md px-3 w-full"
                >
                    <option value={null} hidden>
                        Not selected
                    </option>
                    {Array.isArray(filteredTemplates) &&
                        filteredTemplates.map(({ id, description, base, expected_result, placeholders }) => {
                            const parts = id.split('_');
                            const typeOfTest = parts[parts.length - 1];
                            const numberOfGroups = parts[parts.length - 2].replace('group', '');
                            const propertyToBeTested = parts.slice(1, parts.length - 2).join('_');
                            return (
                                <option key={id} value={JSON.stringify({ id, description, base, expected_result, placeholders })}>
                                    {`${propertyToBeTested} (${numberOfGroups} groups, ${typeOfTest})`}
                                </option>
                            );
                        })}
                </select>
            </div>

            {/* Vista previa de la plantilla seleccionada */}
            {selectedTemplate && (
                <div className="mx-6 mt-6 mb-14 p-1">
                    <JSONRepresentationComponent
                        jsonDataArray={[
                            {
                                base_query: selectedTemplate.base,
                                description: selectedTemplate.description,
                                expected_result: selectedTemplate.expected_result,
                            },
                        ]}
                        showExportButtons={false}
                    />
                </div>
            )}

            {/* Placeholders seleccionados */}
            {selectedTemplate?.placeholders && (
                <div>
                    <label htmlFor="placeholders" className="m-2 pl-7 font-semibold">
                        Select the placeholders:
                    </label>
                    <div className="flex justify-center mt-6 mb-10 p-2">
                        {selectedTemplate.placeholders.map((placeholder, index) => (
                            <div key={index} className="mx-8">
                                {HtmlPlaceholdersSelectionField(
                                    placeholder,
                                    selectedTemplate,
                                    !selectedTemplate,
                                    selectedPlaceholders,
                                    setSelectedPlaceholders
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Generación de entradas */}
            {selectedPlaceholders && (
                <PoetGenerateInputsComponent
                    selectedTemplate={selectedTemplate}
                    isLockedField={!selectedTemplate}
                    selectedPlaceholders={selectedPlaceholders}
                    responseInputsChecked={responseInputsChecked}
                    setResponseInputsChecked={setResponseInputsChecked}
                />
            )}
        </div>
    );
};

