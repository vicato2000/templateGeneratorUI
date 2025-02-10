import Utils from '../utils/Utils';

export const HtmlPlaceholdersSelectionField = (placeholder, selectedTemplate, isLockedField, selectedPlaceholders, setSelectedPlaceholders) => {

	const handlePlaceholderChange = (event) => {
		const values = Utils.selectMultipleSelectionValues(event.target.options);

		setSelectedPlaceholders(prevState => {
			const newPlaceholders = [...prevState];
			const index = newPlaceholders.findIndex(placeholderAux => placeholderAux.name === placeholder.name);

			if (index !== -1) {
				newPlaceholders[index] = {
					...newPlaceholders[index],
					values: values
				};
					
			} else {
				newPlaceholders.push({
					name: placeholder.name,
					description: placeholder.description,
					values: values
				});

			}

			return newPlaceholders;
		});
	};

	const selectedValues = selectedPlaceholders?.find(placeholderAux => placeholderAux.name === placeholder.name)?.values || [];

	return (
		<div>
			<div className="font-medium text-center mb-4">
				<label htmlFor={placeholder.name}>
					{placeholder.name + ": "}
				</label>
			</div>
			<div>
				<select id={placeholder.name} onChange={handlePlaceholderChange} multiple={true} disabled={isLockedField} value={selectedValues}
					className="border rounded-md">
					<option value={null} hidden>Not selected</option>
					{
						selectedTemplate.placeholders.map((placeholderType) => (
							placeholder.name === placeholderType.name && placeholderType.values.map((placeholderValue) => (
								<option key={placeholderValue} value={placeholderValue} className="px-2 py-1">
									{placeholderValue}
								</option>
							))
						))
					}
				</select>
			</div>
		</div>
	);
};
