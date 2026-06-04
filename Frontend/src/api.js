import axios from "axios"

const API = axios.create({
    baseURL: import.meta.env.VITE_APP_API_URL,
    withCredentials: true
})

export const getApiErrorMessage = (error, fallback = "Something went wrong.") => {
    const data = error?.response?.data

    return data?.error || data?.message || data?.msg || error?.message || fallback
}

export default API