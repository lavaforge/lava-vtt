import { createApp } from 'vue';
import './style.css';
import App from './App.vue';
import { ServiceContainer } from 'ioc-service-container';

const apiUrl = window.location.origin.replace(window.location.port, '3000');
ServiceContainer.set('apiUrl', () => apiUrl);

createApp(App).mount('#root');
