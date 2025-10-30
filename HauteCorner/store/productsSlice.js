import {createSlice} from '@reduxjs/toolkit';

const initialState = {
  products: [],
  selectedProduct: null,
};

export const productsSlice = createSlice({
  name: 'products',
  initialState,
  reducers: {
    setSelectedProduct: (state, action) => {
      const productId = action.payload;
      state.selectedProduct = state.products.find(
        product => product.id === productId,
      );
    },
  },
});
