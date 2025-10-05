import axios from "axios";
import { Badge } from "primereact/badge";
import { ProgressSpinner } from "primereact/progressspinner";
import { useCallback, useEffect, useState } from "react"


const HEALTH_CHECK_URL = 'http://localhost:8000/ping';
const INTERVAL_MS = 60000

export const EmbeddingServiceChecker = () => {


    const [isAlive, setIsAlive] = useState<boolean>(false);

    const [isLoading, setIsLoading] = useState(false);

    const performHealthCheck = useCallback(async () => {
        setIsLoading(true);
        try {
            const response = await axios.get(HEALTH_CHECK_URL);

            if (response.status === 200) {
                setIsAlive(true)
            } else {
                setIsAlive(false)
            }
        } catch (error) {
            console.error('Health check failed:', error);
            setIsAlive(false)
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        performHealthCheck();

        const intervalId = setInterval(performHealthCheck, INTERVAL_MS);

        return () => clearInterval(intervalId);
    }, [performHealthCheck]);



    return <div id="embedding-service-health-check" className="flex items-center gap-2">
        <h2 className="text-xl font-semibold">Embedding API</h2>
        {isLoading ? <ProgressSpinner className="w-[32px] h-[32px]"/> :
        <Badge
            id="embedding-service-health-marker"
            value={!isAlive ? "Available" : "Not available"}
            severity={!isAlive ? "success" : "danger"}
        ></Badge>}
    </div>
}