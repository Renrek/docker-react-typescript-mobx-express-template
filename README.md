# react-typescript-mobx-express-template

## How to start:
coming soon

## Recipe used to create this repo:

#### Create app and install dependencies
```shell 
npx create-react-app name-of-app --template typescript
```

```shell
cd name-of-app && npm install react-router-dom mobx mobx-react
```
```shell 
code .
```

<!-- **tsconfig.json**
```json
// Add to compilerOptions
"experimentalDecorators": true,
"useDefineForClassFields": true,
``` -->

#### Create app directories and core files
```shell
mkdir src/app src/theme src/components src/hooks src/state src/state/store src/components/Home
```

```shell
mv ./src/App* ./src/app
```
```shell
touch src/theme/theme.ts src/components/Home/Home.tsx src/components/Home/Home.test.tsx src/state/store/AuthStore.ts src/state/context.ts
```
```shell
rm src/index.css src/app/App.css

#Placeholders
echo "export {}" >> src/components/Home/Home.test.tsx
echo "export {}" >> src/theme/theme.tsx
```


#### Alter files

**File: src/index.js**
```tsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './app/App';
import reportWebVitals from './reportWebVitals';
import { BrowserRouter  as Router } from 'react-router-dom';


const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);

root.render(
  <React.StrictMode>
    <Router>
      <App />
    </Router>
  </React.StrictMode>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
```

**File: src/app/App.tsx**
```tsx
import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Home from '../components/Home/Home';



const App : React.FC = () => {
  return (<>
      <Routes>
        <Route path="/" element={<Home />}/>
      </Routes>
      </>
  );
}

export default App;
```

**File: src/components/Home/Home.tsx**
```tsx
import React, { useContext } from 'react';
import { observer } from 'mobx-react';
import { StoreContext, IStoreContext } from '../../state/context';

const Home: React.FC = () => {
    const { authStore }  = useContext<IStoreContext>(StoreContext);
    const authenticated = authStore.isAuthenticated();
  
    const handleClick = () => {
        authStore.toggleAuthentication();
    }
    
    return <div style={{marginBottom:"20px"}}>
            { authenticated && <div>Logged in</div>}
            <button
                onClick={handleClick}
            >{authenticated ? "Log Out": "Login"}</button>
        </div>;
};

export default observer(Home);
```

**File src/state/context.ts**
```ts
import React from "react";
import { AuthStore } from "./stores/AuthStore";

export interface IStoreContext {
  authStore: AuthStore;
}

const authStore = new AuthStore();

export const StoreContext = React.createContext<IStoreContext>({
  authStore,
})
```

**File src/state/store/AuthStore.ts**
```ts
import { makeAutoObservable } from 'mobx';


export class AuthStore {
    private authenticated : boolean = false;

    constructor(){
        makeAutoObservable(this);
    }

    isAuthenticated(){
        return this.authenticated;
    }

    toggleAuthentication(){
        this.authenticated = !this.authenticated;
    }
}
```

#### Install Express
```shell
npm install express dotenv axios
```
```shell
npm install nodemon --save-dev
```

#### Create Server file structure
```shell
mkdir server server/modules server/routes server/constants
touch server/server.js
```
##### Add Boiler plate server code server/server.js
```js
/** ---------- SYSTEM ---------- **/
require('dotenv').config();
const express = require('express');
const app = express();
const SITE_URL = process.env.SITE_URL || ' http://localhost';
const PORT = process.env.PORT || 5000;

/** ---------- MIDDLEWARE ---------- **/
app.use(express.json());
app.use(express.urlencoded({extended: true}));
app.use(express.static('build'));

/** ---------- EXPRESS ROUTES ---------- **/

/** ---------- START SERVER ---------- **/
app.listen(PORT, () => {
    console.log(`Server is Active - ${SITE_URL}:${PORT}`);
});

```

##### Add to package.json
```json
"proxy": "http://localhost:8081",
"scripts": {
    "start": "node server/server.js",
    "build": "react-scripts build",
    "client": "react-scripts start",
    "server": "nodemon  --watch server server/server.js",
    "test": "react-scripts test --env=jsdom",
    "eject": "react-scripts eject"
  },
```
