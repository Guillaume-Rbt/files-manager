import { useEffect, useState } from "preact/hooks";

export function useFetch<T>(
    url: string,
    options?: RequestInit,
    skip?: boolean,
) {
    const [data, setData] = useState<T | null>(null);
    const [loading, setLoading] = useState(!skip);
    const [error, setError] = useState<Error | null>(null);
    const [ok, setOk] = useState(false);

    async function request(requestOptions?: RequestInit) {
        setLoading(true);
        setError(null);
        setOk(false);

        try {
            const response = await fetch(url, {
                ...options,
                ...requestOptions,
            });
            const responseData = (await response.json()) as T;

            setData(responseData);
            setOk(response.ok);

            return { data: responseData, ok: response.ok };
        } catch (requestError) {
            const normalizedError =
                requestError instanceof Error
                    ? requestError
                    : new Error(String(requestError));
            setError(normalizedError);
            return { data: null, ok: false };
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        if (skip) {
            setLoading(false);
            return;
        }

        const controller = new AbortController();

        setLoading(true);
        setError(null);
        // Clear stale data from a previous url so consumers don't briefly show it.
        setData(null);
        setOk(false);

        fetch(url, {
            signal: controller.signal,
            ...options,
        })
            .then((response) => {
                return response.json() as Promise<T>;
            })
            .then((data) => {
                setData(data);
                setOk(true);
            })
            .catch((error) => {
                if (error.name !== "AbortError") {
                    setError(error);
                }
            })
            .finally(() => {
                if (!controller.signal.aborted) {
                    setLoading(false);
                }
            });

        return () => {
            controller.abort();
        };
    }, [url, skip]);

    return {
        data,
        loading,
        error,
        ok,
        request,
    };
}
