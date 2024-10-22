import { useState, useEffect } from 'react';

const useCompanySelection = () => {
    const [companySelect, setCompanySelect] = useState(null);
    const [loading, setLoading] = useState(true);

    const handleSelectCompany = async (companyName) => {
        try {
            await axios.post('/select-company', { company: companyName });
            window.localStorage.setItem('companySelect', companyName);
            window.location.reload();
        } catch (error) {
            console.error('Error al seleccionar la empresa:', error);
        }
    };

    const changeCompany = (company) => {
        window.localStorage.setItem('companySelect', company);
        handleSelectCompany(company);
    };

    const getSelectedCompany = async () => {
        try {
            const response = await axios.get('/selected-company');
            const selectedCompany = response.data.company;
            window.localStorage.setItem('companySelect', selectedCompany);
            setCompanySelect(selectedCompany);
            setLoading(false);
            return selectedCompany;
        } catch (error) {
            console.error('Error al obtener la empresa seleccionada:', error);
            setLoading(false);
            return null;
        }
    };

    useEffect(() => {
        getSelectedCompany();
    }, []);

    return { companySelect, loading, changeCompany };
};

export default useCompanySelection;
