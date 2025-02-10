import { React } from 'react';
import { useState, useEffect } from 'react';
import { PoetComponent } from 'components/PoetComponent';
import { GenieComponent } from 'components/GenieComponent';
import { EvaComponent } from 'components/EvaComponent';

export const BaseComponent = () => {
    
    const [responseInputsChecked, setResponseInputsChecked] = useState([]);
    
    const [llmsResponses, setLlmsResponses] = useState([]);
    
    const [unlockGenieComponent, setUnlockGenieComponent] = useState(false);
    
    const [unlockEvaComponent, setUnlockEvaComponent] = useState(false);

	useEffect(() => {
		setUnlockGenieComponent(Array.isArray(responseInputsChecked) && responseInputsChecked.length > 0);
		setUnlockEvaComponent(false);
        setLlmsResponses([]);
    }, [responseInputsChecked]);

	useEffect(() => {
		setUnlockEvaComponent(Array.isArray(llmsResponses) && llmsResponses.length > 0 && llmsResponses.every(model => model.response_by_query && model.response_by_query.length === responseInputsChecked.length));
    }, [llmsResponses]);

    return (
        <div className="flex flex-col items-center p-6 min-h-screen text-lg">
			<PoetComponent responseInputsChecked={responseInputsChecked}
				setResponseInputsChecked={setResponseInputsChecked} />

            {
				unlockGenieComponent && (
					<GenieComponent responseInputsChecked={responseInputsChecked} 
						llmsResponses={llmsResponses} setLlmsResponses={setLlmsResponses} />
				)
			}

            {
				unlockEvaComponent && (
					<EvaComponent responseInputsChecked={responseInputsChecked} 
						llmsResponses={llmsResponses} key={JSON.stringify(llmsResponses)} />
				)
			}
        </div>
    )
}
