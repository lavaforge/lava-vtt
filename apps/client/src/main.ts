import { createApp } from 'vue';
import './style.css';
import App from './App.vue';
import { ServiceContainer } from 'ioc-service-container';
import { FrontendConduit } from './logic/conduit';
import { createPinia } from 'pinia';

const apiUrl = window.location.origin.replace(window.location.port, '3000');
const conduit = new FrontendConduit(apiUrl);

ServiceContainer.set('apiUrl', () => apiUrl);
ServiceContainer.set('conduit', () => conduit);

const pinia = createPinia();
createApp(App).use(pinia).mount('#root');
