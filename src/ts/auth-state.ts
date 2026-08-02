import { reactive } from 'vue';
import { isAuthenticated } from './auth';

export const authState = reactive({ loggedIn: isAuthenticated() });
