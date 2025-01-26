import axios from "axios";

export const callUserApi = async (username) => {
    const apiUrl = "http://localhost:8000/api/users";
    const payload = { username };
    try {
        const response = await axios.post(apiUrl, payload);
        console.log("API response:", response.data);
        return response.data; // Return data if successful
    } catch (error) {
        console.error("Error calling user API:", error.message);
    }
};

