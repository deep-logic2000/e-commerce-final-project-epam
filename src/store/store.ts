import {
  configureStore,
  combineReducers,
  ThunkAction,
  Action,
} from '@reduxjs/toolkit';
import { createWrapper } from 'next-redux-wrapper';
import { Persistor, persistReducer, persistStore } from 'redux-persist';
import { ToolkitStore } from '@reduxjs/toolkit/dist/configureStore';
import authReducer, { ESlices } from './reducers/AuthSlice';
import storage from './helpers/storage';

const rootReducer = combineReducers({
  [ESlices.auth]: authReducer,
});

export interface IPersistorStore {
  __persistor?: Persistor;
}

const setupStore = (): ToolkitStore =>
  configureStore({
    reducer: rootReducer,
    devTools: true,
  });

export const makeStore = (): ToolkitStore & IPersistorStore => {
  const isServer = typeof window === 'undefined';
  if (isServer) {
    return setupStore();
  } else {
    const persistConfig = {
      key: 'nextjs',
      whitelist: ['auth'], // make sure it does not clash with server keys
      storage,
    };
    const persistedReducer = persistReducer(persistConfig, rootReducer);
    const store: ToolkitStore = configureStore({
      reducer: persistedReducer,
      devTools: process.env.NODE_ENV !== 'production',
    });

    (store as ToolkitStore & IPersistorStore).__persistor = persistStore(store); // Nasty hack

    return store as ToolkitStore & IPersistorStore;
  }
};

export type RootState = ReturnType<typeof rootReducer>;
export type AppStore = ReturnType<typeof makeStore>;
export type AppState = ReturnType<AppStore['getState']>;
export type ClientStore = ReturnType<typeof setupStore>;
export type AppDispatch = ClientStore['dispatch'];
export type AppThunk<ReturnType = void> = ThunkAction<
  ReturnType,
  AppState,
  unknown,
  Action
>;

export const wrapper = createWrapper<AppStore>(makeStore);
