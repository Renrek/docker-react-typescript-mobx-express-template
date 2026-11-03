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