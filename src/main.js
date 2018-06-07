import Vue from 'vue';
import VueAxios from 'vue-axios';
import axios from 'axios';
import VueGoodTable from 'vue-good-table';
import swal from 'sweetalert2';
import App from './App';
import router from './router';

import 'vue-good-table/dist/vue-good-table.css';

Vue.use(VueAxios, axios);
Vue.use(VueGoodTable);

Vue.config.productionTip = false;

/* eslint-disable no-new */
new Vue({
  el: '#app',
  router,
  render: h => h(App)
})
