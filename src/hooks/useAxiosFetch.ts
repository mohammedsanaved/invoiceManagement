import { useState, useEffect, useCallback } from 'react';
import axios, { AxiosError } from 'axios';

export type TApiResponse<T> = {
  data: T | null;
  loading: boolean;
  error: string | null;
  refetch: () => void; // Add refetch to the return type
};

const useAxiosFetch = <T>(url: string): TApiResponse<T> => {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch function
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const response = await axios.get<T & { message?: string }>(url);
      setData(response.data);
    } catch (err) {
      const axiosError = err as AxiosError<{ message?: string }>;
      setError(
        axiosError.response?.data?.message ||
          axiosError.message ||
          'An error occurred'
      );
    } finally {
      setLoading(false);
    }
  }, [url]);

  // Initial data fetch on component mount
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Return the data, loading, error, and refetch function
  return { data, loading, error, refetch: fetchData };
};

export default useAxiosFetch;
