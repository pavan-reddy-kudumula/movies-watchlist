import axios from "axios"

const API = axios.create({baseURL: import.meta.env.VITE_APP_API_URL})

API.interceptors.request.use((req)=>{
    const token = localStorage.getItem("token")
    if(token){
        req.headers.Authorization = token
    }
    return req
})

export default API