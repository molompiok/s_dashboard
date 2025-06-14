// components/StockMatrix/StockMatrix.tsx

import React, { useState, useEffect, useMemo } from 'react';
import { ProductInterface, ValueInterface } from '../../api/Interfaces/Interfaces';
import { getAllCombinations } from '../Utils/functions';

type Combination = ReturnType<typeof getAllCombinations>[0];

interface StockMatrixProps {
  product: ProductInterface;
  onStockChange: (updates: { combinationHash: string; stock: number | null }[]) => void;
  // Note: onPriceChange pourrait être ajouté ici si nécessaire
}

export const StockMatrix: React.FC<StockMatrixProps> = ({ product, onStockChange }) => {
  const combinations = useMemo(() => getAllCombinations(product), [product]);
  
  // État local pour les inputs, pour une meilleure réactivité
  const [localStocks, setLocalStocks] = useState<Record<string, string>>({});

  useEffect(() => {
    const initialStocks: Record<string, string> = {};
    combinations.forEach(c => {
      initialStocks[c.bind_hash] = c.stock === null ? '' : String(c.stock);
    });
    setLocalStocks(initialStocks);
  }, [combinations]);

  const handleStockInput = (combinationHash: string, stockValue: string) => {
    setLocalStocks(prev => ({ ...prev, [combinationHash]: stockValue }));
    const stockAsNumber = stockValue === '' ? null : parseInt(stockValue, 10);
    if (!isNaN(stockAsNumber as any)) {
      onStockChange([{ combinationHash, stock: stockAsNumber }]);
    }
  };

  const totalProductStock = product.stock;
  const totalAllocatedStock = combinations.reduce((acc, comb) => acc + (comb.stock ?? 0), 0);
  const stockIsMismatched = totalProductStock !== null && totalAllocatedStock !== totalProductStock;
  const stockIsOverallocated = totalProductStock !== null && totalAllocatedStock > (totalProductStock||0);

  return (
    <div className="stock-matrix">
      <div className={`flex justify-between items-center mb-4 p-3 rounded-lg border transition-colors ${
          stockIsMismatched ? 'bg-red-500/10 border-red-500/20 text-red-700 dark:text-red-300' 
          : 'bg-green-500/10 border-green-500/20 text-green-700 dark:text-green-300'
      }`}>
        <h4 className="font-semibold">Bilan des Stocks</h4>
        <div className="text-sm font-mono text-right">
          <div>Stock Total Défini : <span className="font-bold">{totalProductStock ?? '∞'}</span></div>
          <div>Total Alloué : <span className="font-bold">{totalAllocatedStock}</span></div>
          {stockIsMismatched && <div className="text-xs font-bold">{stockIsOverallocated ? 'SUR-ALLOCATION !' : 'DÉSÉQUILIBRE'}</div>}
        </div>
      </div>
      
      <div className="overflow-x-auto relative shadow-md sm:rounded-lg">
        <table className="w-full text-sm text-left text-gray-500 dark:text-gray-400">
          <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
            <tr>
              <th scope="col" className="px-6 py-3">Combinaison</th>
              <th scope="col" className="px-6 py-3">Prix Final</th>
              <th scope="col" className="px-6 py-3 text-center">Stock</th>
            </tr>
          </thead>
          <tbody>
            {combinations.map(comb => (
              <tr key={comb.bind_hash} className="bg-white dark:bg-gray-800 border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600">
                <td className="px-6 py-4 font-medium text-gray-900 dark:text-white whitespace-nowrap">
                  {Object.values(comb.bindNames).map((v: any) => v.text || v).join(' / ')}
                </td>
                <td className="px-6 py-4">
                  {(product.price + comb.additional_price).toLocaleString()} {product.currency}
                </td>
                <td className="px-6 py-4 text-center">
                  <input
                    type="number"
                    placeholder="∞"
                    className="w-24 p-1.5 rounded-md bg-gray-100 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 text-center font-mono focus:ring-teal-500 focus:border-teal-500"
                    value={localStocks[comb.bind_hash] ?? ''}
                    onChange={(e) => handleStockInput(comb.bind_hash, e.target.value)}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};