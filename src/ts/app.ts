import { createApp } from 'vue';
import Framework7 from 'framework7/lite-bundle';
import Framework7Vue, { registerComponents } from 'framework7-vue/bundle';

import 'framework7/css/bundle';
import '../css/icons.css';
import '../css/app.scss';

import App from '../components/app.vue';
import { initAuth } from './auth';

Framework7.use(Framework7Vue);

// Resume token refresh schedule if user is already signed in
initAuth();

const app = createApp(App);
registerComponents(app);
app.mount('#app');
