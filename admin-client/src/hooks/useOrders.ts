import { useQuery } from "@tanstack/react-query"
import { useApi } from "./useApi"
import { OrdersApi } from "../config/api"
import { useState } from "react"



export const useOrders = () => {


    const [page, setPage] = useState<number>(0);
    const [pageSize, setPageSize] = useState<number>(10);
    const api = useApi(OrdersApi)
    const query = useQuery({
        queryKey: ["orders", page, pageSize], // cache kulcs
        queryFn: () => api.ordersGet(page, pageSize).then(res => res.data),
    })
    return {
        ...query,
        setPage,
        page,
        pageSize,
        setPageSize,
    }
}