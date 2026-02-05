import { useCurrency } from "@/Components/Layout/CurrencyProvider";
import { useAuthorizationApi } from "./useAuthorizationApi";

type UseCurrencyReturn = {
  formatAndConvert: (amount: number, originalCurrencyId: number) => string;
  isLoading?: boolean;           
  error?: string | null;         
};

export function useFormatedCurrency(): UseCurrencyReturn {

    const { currencyId } = useCurrency();
    const { getAllData } = useAuthorizationApi();


    return{
        formatAndConvert: (amt, currId) => `${amt} ${currId}`,
        isLoading: false,
        error: null,
    }
}