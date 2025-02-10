import React, { useState } from 'react';
import { BaseComponent } from 'components/BaseComponent';
import Login from './components/Login';
function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const handleLogin = () => {
    setIsAuthenticated(true);
  };

  if (!isAuthenticated) {
    return <Login onLogin={handleLogin} />;
  }
  
  return (
    <div  className="text-center p-5 bg-gray-100">
      <h1 className="text-4xl p-10">
        Interface for the generation and validation of prompts<br/>
         for Trust4AI language models
      </h1>
      <BaseComponent />
    </div>
  );
}

export default App;
