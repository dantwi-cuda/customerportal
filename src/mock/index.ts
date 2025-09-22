import { mock } from './MockAdapter'
import './fakeApi/authFakeApi'
import './fakeApi/commonFakeApi'
// import './fakeApi/customerFakeApi' // Disabled - using real API endpoints

mock.onAny().passThrough()
