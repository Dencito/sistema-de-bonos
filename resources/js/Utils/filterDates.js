// Utils/filterDates.js

export function filterByToday(data) {
    const today = new Date().setHours(0, 0, 0, 0);
    return data.filter(item => {
        const itemDate = new Date(item.created_at).setHours(0, 0, 0, 0);
        return itemDate === today;
    });
}

export function filterByThisWeek(data) {
    const today = new Date();
    const startOfWeek = today.getDate() - today.getDay(); // Domingo
    const startDate = new Date(today.setDate(startOfWeek)).setHours(0, 0, 0, 0);
    const endDate = new Date(startDate).setDate(new Date(startDate).getDate() + 7); // Sábado

    return data.filter(item => {
        const itemDate = new Date(item.created_at).setHours(0, 0, 0, 0);
        return itemDate >= startDate && itemDate < endDate;
    });
}

export function filterByThisMonth(data) {
    const today = new Date();
    const startDate = new Date(today.getFullYear(), today.getMonth(), 1).setHours(0, 0, 0, 0);
    const endDate = new Date(today.getFullYear(), today.getMonth() + 1, 0).setHours(0, 0, 0, 0);

    return data.filter(item => {
        const itemDate = new Date(item.created_at).setHours(0, 0, 0, 0);
        return itemDate >= startDate && itemDate <= endDate;
    });
}
