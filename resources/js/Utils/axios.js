import Axios from "axios";

const axios = Axios.create({
    baseURL: import.meta.env.VITE_REVERB_HOST,
    headers: {
        'X-Requested-With': 'XMLHttpRequest'
    },
    withCredentials: true,
    withXSRFToken: true,
})

export default axios