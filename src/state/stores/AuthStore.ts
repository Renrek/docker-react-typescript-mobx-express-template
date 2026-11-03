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